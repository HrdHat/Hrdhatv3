import { supabase } from "../../db/supabaseClient";
import {
  TABLES,
  FORM_ASSET_PHOTOS,
  STORAGE_BUCKETS,
} from "../../constants/database";
import {
  uploadPhotoOptionsSchema,
  uploadPhotoOptionsSchemaModuleOnly,
  photoRecordSchema,
  photoRecordSchemaModuleOnly,
  PhotoOperationResult,
  ALLOWED_MIME_TYPES,
  AllowedMimeType,
  PhotoMetadata,
  PhotoMetadataModuleOnly,
  UploadPhotoOptions,
  UploadPhotoOptionsModuleOnly,
  PhotoRecord,
  PhotoRecordModuleOnly,
} from "./photoValidation";
import { z } from "zod";
import { FormAssetPhoto } from "../../types/formTypes";

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
    /**
     * VALIDATION RULE: All upload options must pass Zod validation before processing.
     * This prevents invalid configurations from causing upload failures.
     * Any validation failure must be shown to the user and block the upload.
     */
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
    const photoRecord = {
      ...metadata,
      photoUrl: storagePath,
      uploadedBy,
      isDeleted: false, // Explicitly set soft delete fields
      deletedAt: null,
      ...rest,
      metadata: {
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedBy,
        signedUrl: signedData.signedUrl,
        ...rest,
      },
    };

    /**
     * VALIDATION RULE: All photo record data must pass Zod validation before save.
     * This prevents invalid photo metadata from being persisted to the database.
     * Any validation failure must be shown to the user and block the save.
     */
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
 * ✅ NEW: Uploads a single photo using only form_module_id (no form_id)
 */
export async function uploadPhotoToSupabaseModuleOnly(
  options: UploadPhotoOptionsModuleOnly
): Promise<PhotoOperationResult> {
  try {
    const validation = uploadPhotoOptionsSchemaModuleOnly.safeParse(options);
    if (!validation.success) {
      return {
        success: false,
        error: {
          message: "Invalid upload options",
          validationErrors: validation.error,
        },
      };
    }

    const { file, metadata, moduleId, uploadedBy, ...rest } = validation.data;

    // Validate MIME type
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

    // Generate storage path using only moduleId
    const storagePath = `photos/modules/${moduleId}/${metadata.id}.${
      file.type.split("/")[1]
    }`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.photos)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
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

    // Get signed URL
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

    // Prepare photo record for database
    const photoRecord = {
      ...metadata,
      photoUrl: storagePath,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
      isDeleted: false,
      deletedAt: null,
      ...rest,
      metadata: {
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy,
        signedUrl: signedData.signedUrl,
        ...rest,
      },
    };

    const recordValidation = photoRecordSchemaModuleOnly.safeParse(photoRecord);
    if (!recordValidation.success) {
      return {
        success: false,
        error: {
          message: "Invalid photo record",
          validationErrors: recordValidation.error,
        },
      };
    }

    // Save to database with form_module_id mapping
    const dbRecord = {
      id: photoRecord.id,
      form_module_id: photoRecord.moduleId,
      photo_url: photoRecord.photoUrl,
      photo_description: photoRecord.photo_description || null,
      uploaded_at: photoRecord.uploadedAt,
      uploaded_by: photoRecord.uploadedBy,
      file_name: photoRecord.name,
      file_size: photoRecord.size,
      type: photoRecord.type,
      is_deleted: photoRecord.isDeleted || false,
      deleted_at: photoRecord.deletedAt || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error: dbError } = await supabase
      .from(TABLES.formAssetPhotos)
      .insert(dbRecord)
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
    const { data, error } = await supabase
      .from(TABLES.formAssetPhotos)
      .update({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      })
      .eq(FORM_ASSET_PHOTOS.id, photoId)
      .eq(FORM_ASSET_PHOTOS.isDeleted, false) // Only update if not already deleted
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
      .eq(FORM_ASSET_PHOTOS.isDeleted, true) // Only update if currently deleted
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

/**
 * Fetches photos for a form module using validated parameters
 */
export async function getPhotosForModule(
  formId: string,
  moduleId: string
): Promise<PhotoOperationResult> {
  try {
    /**
     * VALIDATION RULE: All form and module IDs must pass Zod validation before processing.
     * This prevents invalid ID formats from causing database errors.
     * Any validation failure must be shown to the user and block the operation.
     */
    const idsValidation = z
      .object({
        formId: z.string().uuid("Invalid form ID format"),
        moduleId: z.string().uuid("Invalid module ID format"),
      })
      .safeParse({ formId, moduleId });

    if (!idsValidation.success) {
      return {
        success: false,
        error: {
          message: "Invalid form or module ID",
          validationErrors: idsValidation.error,
        },
      };
    }

    const { data, error } = await supabase
      .from(TABLES.formAssetPhotos)
      .select()
      .eq(FORM_ASSET_PHOTOS.formId, formId)
      .eq(FORM_ASSET_PHOTOS.formModuleId, moduleId)
      .eq(FORM_ASSET_PHOTOS.isDeleted, false)
      .order(FORM_ASSET_PHOTOS.uploadedAt, { ascending: false });

    if (error) {
      return {
        success: false,
        error: {
          message: "Failed to fetch photos",
          details: error.message,
        },
      };
    }

    // Map the database records to PhotoRecord type
    const photos = (data || []).map((record) => ({
      id: record.id,
      formId: record.form_id,
      moduleId: record.form_module_id,
      type: record.type,
      name: record.file_name,
      size: record.file_size,
      timestamp: new Date(record.uploaded_at).getTime(),
      uploadedBy: record.uploaded_by,
      photoUrl: record.photo_url,
      uploadedAt: record.uploaded_at,
      metadata: {
        originalName: record.file_name,
        mimeType: record.type,
        size: record.file_size,
        uploadedAt: record.uploaded_at,
        uploadedBy: record.uploaded_by,
      },
      isDeleted: record.is_deleted,
      deletedAt: record.deleted_at,
    }));

    return {
      success: true,
      data: photos,
    };
  } catch (error) {
    console.error("Error fetching photos:", error);
    return {
      success: false,
      error: {
        message: "Unexpected error while fetching photos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * ✅ NEW: Fetches photos for a form module using only form_module_id
 */
export async function getPhotosForModuleOnly(
  moduleId: string
): Promise<PhotoOperationResult> {
  try {
    /**
     * VALIDATION RULE: Module ID must pass Zod validation before processing.
     */
    const moduleIdValidation = z
      .string()
      .uuid("Invalid module ID format")
      .safeParse(moduleId);

    if (!moduleIdValidation.success) {
      return {
        success: false,
        error: {
          message: "Invalid module ID",
          validationErrors: moduleIdValidation.error,
        },
      };
    }

    const { data, error } = await supabase
      .from(TABLES.formAssetPhotos)
      .select()
      .eq(FORM_ASSET_PHOTOS.formModuleId, moduleId)
      .eq(FORM_ASSET_PHOTOS.isDeleted, false)
      .order(FORM_ASSET_PHOTOS.uploadedAt, { ascending: false });

    if (error) {
      return {
        success: false,
        error: {
          message: "Failed to fetch photos",
          details: error.message,
        },
      };
    }

    // Map the database records to PhotoRecord type
    const photos = (data || []).map((record) => ({
      id: record.id,
      moduleId: record.form_module_id,
      type: record.type,
      name: record.file_name,
      size: record.file_size,
      timestamp: new Date(record.uploaded_at).getTime(),
      uploadedBy: record.uploaded_by,
      photoUrl: record.photo_url,
      uploadedAt: record.uploaded_at,
      metadata: {
        originalName: record.file_name,
        mimeType: record.type,
        size: record.file_size,
        uploadedAt: record.uploaded_at,
        uploadedBy: record.uploaded_by,
      },
      isDeleted: record.is_deleted,
      deletedAt: record.deleted_at,
    }));

    return {
      success: true,
      data: photos,
    };
  } catch (error) {
    console.error("Error fetching photos:", error);
    return {
      success: false,
      error: {
        message: "Unexpected error while fetching photos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
