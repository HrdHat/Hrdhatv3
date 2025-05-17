import { supabase } from "../../db/supabaseClient";

export interface PhotoMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  timestamp: number;
}

export interface UploadPhotoOptions {
  formId: string;
  moduleId?: string;
  file: File;
  metadata: PhotoMetadata;
  uploadedBy: string;
  tag?: string;
  source?: string;
  description?: string;
  sortOrder?: number;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface UploadedPhotoResult {
  signedUrl: string;
  storagePath: string;
  previewUrl: string;
  metadata: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    uploadedBy: string;
    tag?: string;
    description?: string;
    formId: string;
    moduleId?: string;
    sortOrder?: number;
  };
}

// Allowed MIME types for validation
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Add more as needed
];

export async function uploadPhotoToSupabase({
  formId,
  moduleId,
  file,
  metadata,
  uploadedBy,
  tag,
  source,
  description,
  sortOrder,
  isDeleted = false,
  deletedAt,
}: UploadPhotoOptions): Promise<UploadedPhotoResult> {
  const extension = file.name.split(".").pop();
  const storagePath = `photos/${formId}/${metadata.id}.${extension}`;

  // Create a local preview URL for instant thumbnail display
  const previewUrl = URL.createObjectURL(file);

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload photo: ${uploadError.message}`);
  }

  // Get signed URL (1 hour expiry)
  const { data: signedData, error: signedUrlError } = await supabase.storage
    .from("photos")
    .createSignedUrl(storagePath, 3600);

  if (signedUrlError || !signedData || !signedData.signedUrl) {
    throw new Error("Failed to get signed URL for photo");
  }

  // Save to form_asset_photos table with all required metadata fields
  const { error: dbError } = await supabase.from("form_asset_photos").insert({
    form_id: formId,
    form_module_id: moduleId,
    uploaded_by: uploadedBy,
    storage_path: storagePath,
    public_url: signedData.signedUrl,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    description: description || null,
    sort_order: sortOrder || null,
    tag: tag || null,
    source: source || null,
    uploaded_at: new Date(metadata.timestamp).toISOString(),
    updated_at: new Date().toISOString(),
    is_deleted: isDeleted,
    deleted_at: deletedAt || null,
  });

  if (dbError) {
    throw new Error(`Failed to save photo metadata: ${dbError.message}`);
  }

  return {
    signedUrl: signedData.signedUrl,
    storagePath,
    previewUrl,
    metadata: {
      id: metadata.id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(metadata.timestamp).toISOString(),
      uploadedBy,
      tag,
      description,
      formId,
      moduleId,
      sortOrder,
    },
  };
}

/**
 * Upload multiple photos concurrently (with a concurrency limit).
 * Validates file types before upload.
 * @param uploads Array of UploadPhotoOptions
 * @param concurrency Maximum number of concurrent uploads (default: 3)
 * @returns Array of signed URLs
 * @note For memory management, call URL.revokeObjectURL(previewUrl) when the preview is no longer needed.
 */
export async function uploadMultiplePhotos(
  uploads: UploadPhotoOptions[],
  concurrency = 3
): Promise<string[]> {
  const results: string[] = [];
  let index = 0;

  async function worker() {
    while (index < uploads.length) {
      const current = index++;
      const { file } = uploads[current];
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}`);
      }
      const urlResult = await uploadPhotoToSupabase(uploads[current]);
      results[current] = urlResult.signedUrl;
    }
  }

  // Start workers
  const workers = Array.from({ length: Math.min(concurrency, uploads.length) }, worker);
  await Promise.all(workers);
  return results;
}
