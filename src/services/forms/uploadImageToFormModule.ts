import { supabase } from "../../db/supabaseClient";
import {
  TABLES,
  FORM_ASSET_PHOTOS,
  STORAGE_BUCKETS,
} from "../../constants/database";
import {
  FormAssetPhoto,
  FormAssetPhotoResult,
  FormAssetPhotoListResult,
} from "../../types/formTypes";
import {
  uploadPhotoToSupabase,
  uploadMultiplePhotos,
  getPhotosForModule,
} from "./uploadPhotoToSupabase";
import {
  PhotoMetadata,
  PhotoRecord,
  PhotoOperationResult,
} from "./photoValidation";

/**
 * This service bypasses saveFormModuleData because it handles specialized file operations:
 * 1. File validation (type, size, etc.)
 * 2. File storage in Supabase Storage
 * 3. Public URL generation
 * 4. Metadata storage
 *
 * While it does write to the form_asset_photos table, it's part of a larger file upload
 * workflow that requires its own validation and error handling. The metadata insert is
 * just one step in this process.
 */

interface UploadOptions {
  formId: string;
  formModuleId: string;
  file: File;
  uploadedBy: string;
  tag?: string;
  photo_description?: string;
  source?: "mobile" | "web" | "imported";
}

/**
 * Uploads a single photo to a form module using the validated uploadPhotoToSupabase service.
 * This is a strict wrapper that ensures all uploads go through the Zod-validated service.
 */
export async function uploadImageToFormModule({
  formId,
  formModuleId,
  file,
  uploadedBy,
  tag,
  photo_description,
  source = "web",
}: UploadOptions): Promise<FormAssetPhotoResult> {
  // Use uploadPhotoToSupabase for proper validation and upload
  const result = await uploadPhotoToSupabase({
    file,
    formId,
    moduleId: formModuleId,
    uploadedBy,
    metadata: {
      id: crypto.randomUUID(),
      formId,
      moduleId: formModuleId,
      type: file.type,
      name: file.name,
      size: file.size,
      timestamp: Date.now(),
    },
  });

  if (!result.success || !result.data) {
    return {
      data: null,
      error: new Error(result.error?.message || "Unknown error"),
    };
  }

  // Ensure we have a single photo record, not an array
  const photoRecord = Array.isArray(result.data) ? result.data[0] : result.data;

  if (!photoRecord) {
    return {
      data: null,
      error: new Error("No photo data returned"),
    };
  }

  // Map the result to FormAssetPhoto type (snake_case for database)
  const photoData: FormAssetPhoto = {
    id: photoRecord.id,
    form_id: photoRecord.formId,
    form_module_id: photoRecord.moduleId || null,
    photo_url: photoRecord.photoUrl,
    uploaded_at: photoRecord.uploadedAt,
    photo_description: photo_description || null,
  };

  return {
    data: photoData,
    error: null,
  };
}

/**
 * Uploads multiple photos to a form module using the validated uploadMultiplePhotos service.
 * This is a strict wrapper that ensures all batch uploads go through the Zod-validated service.
 */
export async function uploadMultipleImagesToFormModule(
  uploads: UploadOptions[]
): Promise<FormAssetPhotoListResult> {
  const result = await uploadMultiplePhotos(
    uploads.map((upload) => ({
      file: upload.file,
      formId: upload.formId,
      moduleId: upload.formModuleId,
      uploadedBy: upload.uploadedBy,
      metadata: {
        id: crypto.randomUUID(),
        formId: upload.formId,
        moduleId: upload.formModuleId,
        type: upload.file.type,
        name: upload.file.name,
        size: upload.file.size,
        timestamp: Date.now(),
      },
    }))
  );

  // Map successful results to FormAssetPhoto type (snake_case for database)
  const photos = result.results
    .filter((r) => r.result.success && r.result.data)
    .map((r) => {
      const photo = r.result.data as PhotoRecord;
      return {
        id: photo.id,
        form_id: photo.formId,
        form_module_id: photo.moduleId,
        photo_url: photo.photoUrl,
        uploaded_at: photo.uploadedAt,
        photo_description: uploads[r.index].photo_description || null,
      };
    });

  return {
    data: photos,
    error: result.errors?.length
      ? new Error(result.errors[0].error.message)
      : null,
  };
}

/**
 * Fetches photos for a form module using the validated service.
 * This is a strict wrapper that ensures all queries go through the validated service.
 */
export async function getFormModulePhotos(
  formId: string,
  formModuleId: string
): Promise<FormAssetPhotoListResult> {
  const result = await getPhotosForModule(formId, formModuleId);

  if (!result.success || !result.data) {
    return {
      data: [],
      error: new Error(result.error?.message || "Failed to fetch photos"),
    };
  }

  // Map the result to FormAssetPhoto type (snake_case for database)
  const photos: FormAssetPhoto[] = Array.isArray(result.data)
    ? result.data.map((photo) => ({
        id: photo.id,
        form_id: photo.formId,
        form_module_id: photo.moduleId,
        photo_url: photo.photoUrl,
        uploaded_at: photo.uploadedAt,
        photo_description: null, // Description is not part of the core photo data
      }))
    : [
        {
          id: result.data.id,
          form_id: result.data.formId,
          form_module_id: result.data.moduleId,
          photo_url: result.data.photoUrl,
          uploaded_at: result.data.uploadedAt,
          photo_description: null, // Description is not part of the core photo data
        },
      ];

  return {
    data: photos,
    error: null,
  };
}
