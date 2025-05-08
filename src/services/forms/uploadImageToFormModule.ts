import { supabase } from "../../db/supabaseClient";

// Types for the upload function
type UploadOptions = {
  formId: string;
  formModuleId: string;
  file: File;
  uploadedBy: string;
  tag?: string;
  description?: string;
  source?: "mobile" | "web" | "imported";
};

// Type matching our database schema
export type FormPhoto = {
  id: string;
  form_id: string;
  form_module_id: string;
  storage_path: string;
  public_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  description?: string;
  tag?: string;
  source: "mobile" | "web" | "imported";
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at?: string;
};

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
] as const;

// Helper function for getting image URLs (supports both public and signed URLs)
export async function getImageUrl(path: string): Promise<string> {
  try {
    // First try public URL
    const { data: publicData } = supabase.storage
      .from("form_uploads")
      .getPublicUrl(path);

    if (publicData?.publicUrl) {
      return publicData.publicUrl;
    }

    // Fallback to signed URL if public URL fails
    const { data: signedData } = await supabase.storage
      .from("form_uploads")
      .createSignedUrl(path, 3600); // 1 hour expiry

    return signedData?.signedUrl ?? "";
  } catch (error) {
    console.error("Error getting image URL:", error);
    throw new Error("Failed to get image URL");
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
}: UploadOptions): Promise<FormPhoto> {
  // 1. Validate file
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    throw new Error(
      `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large. Max allowed: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  if (file.size <= 0) {
    throw new Error("File size must be greater than 0");
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
    .from("form_uploads")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  // 4. Get image URL (using helper function)
  const imageUrl = await getImageUrl(storagePath);
  if (!imageUrl) {
    throw new Error("Failed to get image URL");
  }

  // 5. Insert metadata
  const { error: insertError, data } = await supabase
    .from("form_data_photos")
    .insert([
      {
        form_id: formId,
        form_module_id: formModuleId,
        storage_path: storagePath,
        public_url: imageUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        description,
        tag,
        source,
        uploaded_by: uploadedBy,
      },
    ])
    .select()
    .single();

  if (insertError) {
    // Cleanup: Delete the uploaded file if metadata insert fails
    await supabase.storage
      .from("form_uploads")
      .remove([storagePath])
      .catch(console.error);

    console.error("Metadata insert error:", insertError);
    throw new Error(`Failed to save image metadata: ${insertError.message}`);
  }

  // 6. Log success in development
  if (process.env.NODE_ENV === "development") {
    console.log("[✅ Upload Success]", {
      id: data.id,
      fileName: data.file_name,
      size: `${(data.file_size / 1024).toFixed(2)}KB`,
      url: data.public_url,
    });
  }

  return data;
}
