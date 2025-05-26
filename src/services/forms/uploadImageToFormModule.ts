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
  uploadPhotoToSupabaseModuleOnly,
  getPhotosForModuleOnly,
} from "./uploadPhotoToSupabase";
import {
  PhotoMetadataModuleOnly,
  PhotoRecordModuleOnly,
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
  formModuleId: string;
  file: File;
  uploadedBy: string;
  tag?: string;
  photo_description?: string;
  source?: "mobile" | "web" | "imported";
}

/**
 * Uploads a single photo to a form module using the validated uploadPhotoToSupabaseModuleOnly service.
 * This is a strict wrapper that ensures all uploads go through the Zod-validated service.
 */
export async function uploadImageToFormModule({
  formModuleId,
  file,
  uploadedBy,
  tag,
  photo_description,
  source = "web",
}: UploadOptions): Promise<FormAssetPhotoResult> {
  // Use uploadPhotoToSupabaseModuleOnly for proper validation and upload
  const result = await uploadPhotoToSupabaseModuleOnly({
    file,
    moduleId: formModuleId,
    uploadedBy,
    metadata: {
      id: crypto.randomUUID(),
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
  const photoRecord = Array.isArray(result.data)
    ? result.data[0]
    : (result.data as PhotoRecordModuleOnly);

  if (!photoRecord) {
    return {
      data: null,
      error: new Error("No photo data returned"),
    };
  }

  // Map the result to FormAssetPhoto type (snake_case for database)
  const photoData: FormAssetPhoto = {
    id: photoRecord.id,
    form_module_id: photoRecord.moduleId,
    photo_url: photoRecord.photoUrl,
    uploaded_at: photoRecord.uploadedAt,
    photo_description: photo_description || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    data: photoData,
    error: null,
  };
}

/**
 * ✅ UPDATED: Fetches photos for a form module using only formModuleId
 */
export async function getFormModulePhotos(
  formModuleId: string
): Promise<FormAssetPhotoListResult> {
  const result = await getPhotosForModuleOnly(formModuleId);

  if (!result.success || !result.data) {
    return {
      data: [],
      error: new Error(result.error?.message || "Failed to fetch photos"),
    };
  }

  // Map the result to FormAssetPhoto type (snake_case for database)
  const photos: FormAssetPhoto[] = Array.isArray(result.data)
    ? result.data.map((photo: any) => ({
        id: photo.id,
        form_module_id: photo.moduleId,
        photo_url: photo.photoUrl,
        uploaded_at: photo.uploadedAt,
        photo_description: null, // Description is not part of the core photo data
        created_at: photo.uploadedAt, // Use uploadedAt as fallback for created_at
        updated_at: photo.uploadedAt, // Use uploadedAt as fallback for updated_at
      }))
    : [
        {
          id: (result.data as any).id,
          form_module_id: (result.data as any).moduleId,
          photo_url: (result.data as any).photoUrl,
          uploaded_at: (result.data as any).uploadedAt,
          photo_description: null, // Description is not part of the core photo data
          created_at: (result.data as any).uploadedAt, // Use uploadedAt as fallback for created_at
          updated_at: (result.data as any).uploadedAt, // Use uploadedAt as fallback for updated_at
        },
      ];

  return {
    data: photos,
    error: null,
  };
}
