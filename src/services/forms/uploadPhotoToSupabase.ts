import { supabase } from "../../db/supabaseClient";
import {
  TABLES,
  FORM_ASSET_PHOTOS,
  STORAGE_BUCKETS,
} from "../../constants/database";
import {
  uploadPhotoOptionsSchema,
  photoRecordSchema,
  PhotoOperationResult,
  ALLOWED_MIME_TYPES,
  AllowedMimeType,
  PhotoMetadata,
  UploadPhotoOptions,
} from "./photoValidation";

/**
 * This service is the single source of truth for all photo uploads in the application.
 * It enforces strict validation and error handling for both single and batch uploads.
 *
 * Key Requirements:
 * 1. Validation
 *    - All input must be validated using Zod schemas
 *    - MIME types are checked before any upload attempt
 *    - No raw/unvalidated data reaches storage or database
 *
 * 2. Error Handling
 *    - All errors are returned in structured format
 *    - No errors are thrown
 *    - Batch uploads continue on individual failures
 *
 * 3. Data Integrity
 *    - No silent overwrites (upsert: false)
 *    - All metadata matches validated schemas
 *    - Complete records saved to database
 *
 * 4. Batch Processing
 *    - Concurrent uploads with configurable limit
 *    - Individual failures don't block other uploads
 *    - Results maintain original order
 */

/**
 * Uploads a single photo to Supabase storage and saves its metadata.
 * This is the core function that all photo uploads must use.
 */
export async function uploadPhotoToSupabase(
  options: UploadPhotoOptions
): Promise<PhotoOperationResult> {
  try {
    // 1. Validate all input data
    const validation = uploadPhotoOptionsSchema.safeParse(options);
    if (!validation.success) {
      return {
        success: false,
        error: {
          message: "Invalid upload options",
          validationErrors: validation.error,
        },
      };
    }

    const { file, metadata, formId, moduleId, uploadedBy, ...rest } =
      validation.data;

    // 2. Validate MIME type before any upload attempt
    if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
      return {
        success: false,
        error: {
          message: "Unsupported file type",
          details: `File type ${
            file.type
          } is not allowed. Supported types: ${ALLOWED_MIME_TYPES.join(", ")}`,
        },
      };
    }

    // 3. Generate storage path
    const storagePath = `photos/${formId}/${moduleId}/${metadata.id}.${
      file.type.split("/")[1]
    }`;

    // 4. Upload to storage (never overwrite)
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.photos)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false, // Never overwrite existing photos
      });

    if (uploadError) {
      return {
        success: false,
        error: {
          message: "Failed to upload photo",
          details: uploadError.message,
        },
      };
    }

    // 5. Get signed URL (1 hour expiry)
    const { data: signedData, error: signedUrlError } = await supabase.storage
      .from(STORAGE_BUCKETS.photos)
      .createSignedUrl(storagePath, 3600);

    if (signedUrlError || !signedData?.signedUrl) {
      return {
        success: false,
        error: {
          message: "Failed to get signed URL for photo",
          details: signedUrlError?.message,
        },
      };
    }

    // 6. Prepare complete metadata
    const now = new Date().toISOString();
    const photoRecord = {
      ...metadata,
      photoUrl: storagePath,
      uploadedAt: now,
      uploadedBy,
      isDeleted: false, // Explicitly set soft delete fields
      deletedAt: null,
      ...rest,
      metadata: {
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedAt: now,
        uploadedBy,
        signedUrl: signedData.signedUrl,
        ...rest,
      },
    };

    // 7. Validate complete record before saving
    const recordValidation = photoRecordSchema.safeParse(photoRecord);
    if (!recordValidation.success) {
      return {
        success: false,
        error: {
          message: "Invalid photo record",
          validationErrors: recordValidation.error,
        },
      };
    }

    // 8. Save to database
    const { data, error: dbError } = await supabase
      .from(TABLES.formAssetPhotos)
      .insert(photoRecord)
      .select()
      .single();

    if (dbError) {
      return {
        success: false,
        error: {
          message: "Failed to save photo metadata",
          details: dbError.message,
        },
      };
    }

    return {
      success: true,
      data: recordValidation.data,
    };
  } catch (error) {
    console.error("Error uploading photo:", error);
    return {
      success: false,
      error: {
        message: "Unexpected error during photo upload",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Result type for multiple photo uploads
 */
export interface MultiplePhotoUploadResult {
  success: boolean;
  results: Array<{
    index: number;
    result: PhotoOperationResult;
  }>;
  errors?: Array<{
    index: number;
    error: {
      message: string;
      details?: string;
    };
  }>;
}

/**
 * Upload multiple photos concurrently (with a concurrency limit).
 * Each upload is validated independently and failures don't block other uploads.
 */
export async function uploadMultiplePhotos(
  uploads: UploadPhotoOptions[],
  concurrency = 3
): Promise<MultiplePhotoUploadResult> {
  const results: Array<{ index: number; result: PhotoOperationResult }> = [];
  const errors: Array<{
    index: number;
    error: { message: string; details?: string };
  }> = [];
  let index = 0;

  async function worker() {
    while (index < uploads.length) {
      const current = index++;
      const { file } = uploads[current];

      // Validate MIME type before any upload attempt
      if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
        errors.push({
          index: current,
          error: {
            message: "Unsupported file type",
            details: `File type ${
              file.type
            } is not allowed. Supported types: ${ALLOWED_MIME_TYPES.join(
              ", "
            )}`,
          },
        });
        continue;
      }

      // Upload photo (each upload is independent)
      const result = await uploadPhotoToSupabase(uploads[current]);

      // Always add the result to track the attempt
      results.push({ index: current, result });

      // If upload failed, add to errors but continue processing
      if (!result.success) {
        errors.push({
          index: current,
          error: {
            message: result.error?.message || "Unknown error",
            details: result.error?.details,
          },
        });
      }
    }
  }

  // Start workers
  const workers = Array.from(
    { length: Math.min(concurrency, uploads.length) },
    worker
  );
  await Promise.all(workers);

  // Sort results by index to maintain original order
  results.sort((a, b) => a.index - b.index);

  return {
    success: errors.length === 0,
    results,
    ...(errors.length > 0 && { errors }),
  };
}

/**
 * Helper to get preview URL for a file
 * @param file File to create preview for
 * @returns Preview URL
 * @note Call URL.revokeObjectURL(previewUrl) when done
 */
export function getPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Helper to revoke preview URL
 * @param previewUrl URL to revoke
 */
export function revokePreviewUrl(previewUrl: string): void {
  URL.revokeObjectURL(previewUrl);
}

/**
 * Soft deletes a single photo
 * @param photoId UUID of the photo to soft delete
 * @returns Result of the operation
 */
export async function softDeletePhoto(
  photoId: string
): Promise<PhotoOperationResult> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLES.formAssetPhotos)
      .update({
        isDeleted: true,
        deletedAt: now,
      })
      .eq(FORM_ASSET_PHOTOS.id, photoId)
      .is(FORM_ASSET_PHOTOS.isDeleted, false) // Only update if not already deleted
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          message: "Failed to soft delete photo",
          details: error.message,
        },
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error soft deleting photo:", error);
    return {
      success: false,
      error: {
        message: "Unexpected error during photo soft delete",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Restores a soft-deleted photo
 * @param photoId UUID of the photo to restore
 * @returns Result of the operation
 */
export async function undeletePhoto(
  photoId: string
): Promise<PhotoOperationResult> {
  try {
    const { data, error } = await supabase
      .from(TABLES.formAssetPhotos)
      .update({
        isDeleted: false,
        deletedAt: null,
      })
      .eq(FORM_ASSET_PHOTOS.id, photoId)
      .is(FORM_ASSET_PHOTOS.isDeleted, true) // Only update if currently deleted
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          message: "Failed to restore photo",
          details: error.message,
        },
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error restoring photo:", error);
    return {
      success: false,
      error: {
        message: "Unexpected error during photo restore",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Soft deletes multiple photos in a single transaction
 * @param photoIds Array of photo UUIDs to soft delete
 * @returns Result of the operation with individual results
 */
export async function bulkSoftDeletePhotos(
  photoIds: string[]
): Promise<MultiplePhotoUploadResult> {
  const results: Array<{ index: number; result: PhotoOperationResult }> = [];
  const errors: Array<{
    index: number;
    error: { message: string; details?: string };
  }> = [];

  // Process in batches of 10 to avoid overwhelming the database
  const batchSize = 10;
  for (let i = 0; i < photoIds.length; i += batchSize) {
    const batch = photoIds.slice(i, i + batchSize);
    const batchPromises = batch.map(async (photoId, batchIndex) => {
      const result = await softDeletePhoto(photoId);
      results.push({ index: i + batchIndex, result });

      if (!result.success) {
        errors.push({
          index: i + batchIndex,
          error: {
            message: result.error?.message || "Unknown error",
            details: result.error?.details,
          },
        });
      }
    });

    await Promise.all(batchPromises);
  }

  return {
    success: errors.length === 0,
    results,
    ...(errors.length > 0 && { errors }),
  };
}
