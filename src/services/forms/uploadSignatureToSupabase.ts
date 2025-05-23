import { supabase } from "../../db/supabaseClient";
import {
  TABLES,
  FORM_INSTANCE_SIGNATURES,
  STORAGE_BUCKETS,
} from "../../constants/database";
import { z } from "zod";

/**
 * SIGNATURE HANDLING SERVICE
 *
 * This is the single source of truth for all signature operations in the application.
 * No other service or component should directly interact with signature storage or database.
 *
 * Key Requirements:
 * 1. Validation
 *    - All signature metadata MUST be validated using Zod schemas
 *    - No raw/unvalidated data can reach storage or database
 *    - Validation errors are returned in a structured format
 *
 * 2. Create-Only Policy
 *    - Signatures cannot be edited after creation
 *    - To replace a signature:
 *      a. Set shouldReplace=true
 *      b. Old signature is soft-deleted
 *      c. New signature is created
 *    - Silent overwrites are never allowed
 *
 * 3. Error Handling
 *    - All errors are returned in a structured SignatureUploadResult
 *    - No errors are swallowed or just logged
 *    - Validation errors include detailed Zod error information
 *
 * 4. Form Association
 *    - Every signature must be associated with a form
 *    - formId is required and validated
 *    - No direct module-only signatures allowed
 *
 * 5. Security
 *    - Cryptographic hash generation for verification
 *    - Secure storage in dedicated bucket
 *    - Signed URLs with expiry
 *    - Role-based metadata
 *
 * Usage Example:
 * ```typescript
 * const result = await uploadSignatureToSupabase({
 *   formId: "uuid",
 *   metadata: {
 *     id: "uuid",
 *     name: "John Doe",
 *     role: "supervisor",
 *     timestamp: Date.now()
 *   },
 *   blob: signatureBlob,
 *   shouldReplace: false
 * });
 *
 * if (!result.success) {
 *   // Handle error with result.error
 *   return;
 * }
 *
 * // Use result.data for the new signature
 * ```
 */

// Base schema for signature metadata validation
const signatureMetadataBaseSchema = z.object({
  id: z.string().uuid("Invalid signature ID format"),
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  timestamp: z.number().int().positive("Timestamp must be positive"),
  formId: z.string().uuid("Invalid form ID format"),
  // Note: form_module_id is removed as per requirements
});

// Complete schema including the hash field
const signatureMetadataSchema = signatureMetadataBaseSchema.extend({
  hash: z.string().min(1, "Hash is required"),
});

export type SignatureMetadata = z.infer<typeof signatureMetadataSchema>;
export type SignatureMetadataInput = z.infer<
  typeof signatureMetadataBaseSchema
>;

export interface SignatureUploadResult {
  success: boolean;
  data?: SignatureMetadata;
  error?: {
    message: string;
    details?: string;
    validationErrors?: z.ZodError;
  };
}

/**
 * Generates a cryptographic hash for signature verification
 */
export async function generateSignatureHash(
  data: ArrayBuffer
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Checks if a signature already exists for the given form and role
 */
async function checkExistingSignature(
  formId: string,
  role: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from(TABLES.formInstanceSignatures)
    .select("id")
    .eq(FORM_INSTANCE_SIGNATURES.formId, formId)
    .eq(FORM_INSTANCE_SIGNATURES.role, role)
    .is(FORM_INSTANCE_SIGNATURES.deletedAt, null)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned"
    throw new Error(`Failed to check existing signature: ${error.message}`);
  }

  return !!data;
}

/**
 * Soft deletes an existing signature
 */
async function softDeleteSignature(
  formId: string,
  role: string
): Promise<void> {
  const { error } = await supabase
    .from(TABLES.formInstanceSignatures)
    .update({ deletedAt: new Date().toISOString() })
    .eq(FORM_INSTANCE_SIGNATURES.formId, formId)
    .eq(FORM_INSTANCE_SIGNATURES.role, role)
    .is(FORM_INSTANCE_SIGNATURES.deletedAt, null);

  if (error) {
    throw new Error(`Failed to soft delete signature: ${error.message}`);
  }
}

export async function uploadSignatureToSupabase({
  formId,
  metadata,
  blob,
  shouldReplace = false,
}: {
  formId: string;
  metadata: SignatureMetadataInput;
  blob: Blob;
  shouldReplace?: boolean;
}): Promise<SignatureUploadResult> {
  try {
    // 1. Validate metadata
    const validationResult = signatureMetadataBaseSchema.safeParse({
      ...metadata,
      formId, // Ensure formId matches the one passed in
    });

    if (!validationResult.success) {
      return {
        success: false,
        error: {
          message: "Invalid signature metadata",
          validationErrors: validationResult.error,
        },
      };
    }

    // 2. Check for existing signature
    const hasExistingSignature = await checkExistingSignature(
      formId,
      metadata.role
    );

    if (hasExistingSignature) {
      if (!shouldReplace) {
        return {
          success: false,
          error: {
            message:
              "A signature already exists for this role. Use shouldReplace=true to replace it.",
          },
        };
      }
      // Soft delete existing signature
      await softDeleteSignature(formId, metadata.role);
    }

    // 3. Generate hash from blob
    const arrayBuffer = await blob.arrayBuffer();
    const hash = await generateSignatureHash(arrayBuffer);

    const storagePath = `signatures/${formId}/${metadata.id}.png`;

    // 4. Upload PNG to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.signatures)
      .upload(storagePath, blob, {
        cacheControl: "3600",
        contentType: "image/png",
        upsert: false, // Never overwrite existing signatures
      });

    if (uploadError) {
      return {
        success: false,
        error: {
          message: "Failed to upload signature",
          details: uploadError.message,
        },
      };
    }

    // 5. Get signed URL (1 hour expiry)
    const { data: signedData, error: signedUrlError } = await supabase.storage
      .from(STORAGE_BUCKETS.signatures)
      .createSignedUrl(storagePath, 3600);

    if (signedUrlError || !signedData || !signedData.signedUrl) {
      return {
        success: false,
        error: {
          message: "Failed to get signed URL for signature",
          details: signedUrlError?.message,
        },
      };
    }

    // 6. Save to form_instance_signatures table with metadata
    const { data, error: dbError } = await supabase
      .from(TABLES.formInstanceSignatures)
      .insert({
        [FORM_INSTANCE_SIGNATURES.formId]: formId,
        [FORM_INSTANCE_SIGNATURES.workerName]: metadata.name,
        [FORM_INSTANCE_SIGNATURES.signatureUrl]: storagePath,
        [FORM_INSTANCE_SIGNATURES.signedAt]: new Date(
          metadata.timestamp
        ).toISOString(),
        [FORM_INSTANCE_SIGNATURES.signatureHash]: hash,
        [FORM_INSTANCE_SIGNATURES.role]: metadata.role,
        [FORM_INSTANCE_SIGNATURES.metadata]: {
          ...metadata,
          public_url: signedData.signedUrl,
        },
      })
      .select()
      .single();

    if (dbError) {
      return {
        success: false,
        error: {
          message: "Failed to save signature metadata",
          details: dbError.message,
        },
      };
    }

    return {
      success: true,
      data: {
        ...metadata,
        hash,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: "Unexpected error during signature upload",
        details: error.message,
      },
    };
  }
}
