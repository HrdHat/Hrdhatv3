import { supabase } from "../../db/supabaseClient";

export interface PhotoMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  timestamp: number;
}

export async function uploadPhotoToSupabase({
  formId,
  moduleId,
  file,
  metadata,
}: {
  formId: string;
  moduleId?: string;
  file: File;
  metadata: PhotoMetadata;
}): Promise<string> {
  const storagePath = `photos/${formId}/${metadata.id}.${file.name
    .split(".")
    .pop()}`;

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

  // Save to photos table with metadata
  const { error: dbError } = await supabase.from("form_data_photos").insert({
    form_id: formId,
    form_module_id: moduleId,
    photo_url: storagePath,
    uploaded_at: new Date(metadata.timestamp).toISOString(),
    metadata: {
      ...metadata,
      public_url: signedData.signedUrl,
    },
  });

  if (dbError) {
    throw new Error(`Failed to save photo metadata: ${dbError.message}`);
  }

  return signedData.signedUrl;
}
