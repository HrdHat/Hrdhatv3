import { supabase } from "../../db/supabaseClient";
import { STORAGE_BUCKETS } from "../../constants/storage";
import { TABLES, FORM_INSTANCE_SIGNATURES } from "../../constants/database";

// Helper to get storage path for a signature
function getSignatureStoragePath(formId: string, signatureId: string) {
  return `signatures/${formId}/${signatureId}.png`;
}

interface GetSignatureUrlResult {
  success: boolean;
  url?: string;
  error?: {
    message: string;
    details?: string;
  };
}

/**
 * Gets a signed URL for a signature image, but only if the signature exists
 * and is valid in the form_instance_signatures table.
 */
export async function getSignatureUrl(
  formId: string,
  signatureId: string,
  expiresIn: number = 3600
): Promise<GetSignatureUrlResult> {
  try {
    // 1. First verify the signature exists and is valid
    const { data: signature, error: dbError } = await supabase
      .from(TABLES.formInstanceSignatures)
      .select("id, signature_hash")
      .eq(FORM_INSTANCE_SIGNATURES.formId, formId)
      .eq("id", signatureId)
      .is(FORM_INSTANCE_SIGNATURES.deletedAt, null)
      .single();

    if (dbError) {
      return {
        success: false,
        error: {
          message: "Failed to verify signature",
          details: dbError.message,
        },
      };
    }

    if (!signature) {
      return {
        success: false,
        error: {
          message: "Signature not found or has been deleted",
        },
      };
    }

    // 2. Generate signed URL for the image
    const storagePath = getSignatureStoragePath(formId, signatureId);
    const { data, error: storageError } = await supabase.storage
      .from(STORAGE_BUCKETS.signatures)
      .createSignedUrl(storagePath, expiresIn);

    if (storageError) {
      return {
        success: false,
        error: {
          message: "Failed to generate signed URL",
          details: storageError.message,
        },
      };
    }

    if (!data?.signedUrl) {
      return {
        success: false,
        error: {
          message: "No signed URL returned",
        },
      };
    }

    return {
      success: true,
      url: data.signedUrl,
    };
  } catch (error) {
    console.error("Error getting signature URL:", error);
    return {
      success: false,
      error: {
        message: "Unexpected error getting signature URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
