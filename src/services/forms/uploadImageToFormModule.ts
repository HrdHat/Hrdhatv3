import { supabase } from "../../db/supabaseClient";
import {
  TABLES,
  FORM_ASSET_PHOTOS,
  STORAGE_BUCKETS,
} from "../../constants/database";
import { FormAssetPhoto, FormAssetPhotoResult } from "../../types/formTypes";

// Allowed file types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface UploadOptions {
  formId: string;
  formModuleId: string;
  file: File;
  uploadedBy: string;
  tag?: string;
  description?: string;
  source?: "mobile" | "web" | "imported";
}

/**
 * Validates that a field exists in the FormAssetPhoto type
 */
function validatePhotoField(field: string): void {
  const photoFields = Object.keys(FORM_ASSET_PHOTOS);
  if (!photoFields.includes(field)) {
    throw new Error(
      `Invalid photo field: ${field}. Valid fields are: ${photoFields.join(
        ", "
      )}`
    );
  }
}

export async function uploadImageToFormModule({
  formId,
  formModuleId,
  file,
  uploadedBy,
  tag,
  description,
  source = "web",
}: UploadOptions): Promise<FormAssetPhotoResult> {
  // Validate all fields before database operations
  validatePhotoField(FORM_ASSET_PHOTOS.formId);
  validatePhotoField(FORM_ASSET_PHOTOS.formModuleId);
  validatePhotoField(FORM_ASSET_PHOTOS.photoUrl);
  validatePhotoField(FORM_ASSET_PHOTOS.description);
  validatePhotoField(FORM_ASSET_PHOTOS.uploadedAt);
  validatePhotoField(FORM_ASSET_PHOTOS.uploadedBy);
  validatePhotoField(FORM_ASSET_PHOTOS.isDeleted);
  validatePhotoField(FORM_ASSET_PHOTOS.tag);
  validatePhotoField(FORM_ASSET_PHOTOS.source);

  // 1. Validate file
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return {
      data: null,
      error: new Error(
        `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`
      ),
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      data: null,
      error: new Error(
        `File too large. Max allowed: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      ),
    };
  }

  if (file.size <= 0) {
    return {
      data: null,
      error: new Error("File size must be greater than 0"),
    };
  }

  // 2. Generate safe storage path
  const timestamp = Date.now();
  const safeFileName = `${timestamp}_${file.name.replace(
    /[^a-zA-Z0-9.-]/g,
    "_"
  )}`;
  const storagePath = `${formId}/photos/${safeFileName}`;

  // 3. Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.formUploads)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return {
      data: null,
      error: new Error(`Failed to upload image: ${uploadError.message}`),
    };
  }

  // 4. Get image URL
  const { data: urlData } = await supabase.storage
    .from(STORAGE_BUCKETS.formUploads)
    .getPublicUrl(storagePath);

  if (!urlData?.publicUrl) {
    return {
      data: null,
      error: new Error("Failed to get image URL"),
    };
  }

  // 5. Insert metadata
  const { data, error: insertError } = await supabase
    .from(TABLES.formAssetPhotos)
    .insert([
      {
        [FORM_ASSET_PHOTOS.formId]: formId,
        [FORM_ASSET_PHOTOS.formModuleId]: formModuleId,
        [FORM_ASSET_PHOTOS.photoUrl]: urlData.publicUrl,
        [FORM_ASSET_PHOTOS.description]: description,
        [FORM_ASSET_PHOTOS.uploadedAt]: new Date().toISOString(),
        [FORM_ASSET_PHOTOS.uploadedBy]: uploadedBy,
        [FORM_ASSET_PHOTOS.isDeleted]: false,
        [FORM_ASSET_PHOTOS.tag]: tag,
        [FORM_ASSET_PHOTOS.source]: source,
      },
    ])
    .select()
    .single();

  if (insertError) {
    return {
      data: null,
      error: new Error(`Failed to save photo metadata: ${insertError.message}`),
    };
  }

  return {
    data: data as FormAssetPhoto,
    error: null,
  };
}
