import { supabase } from "../../db/supabaseClient";

export type SignatureMetadata = {
  form_id: string;
  signed_by: string;
  signed_at: string;
  storage_path: string;
  public_url: string;
  name: string;
};

export async function uploadSignatureToSupabase({
  formId,
  userId,
  name,
  blob,
}: {
  formId: string;
  userId: string;
  name: string;
  blob: Blob;
}): Promise<SignatureMetadata> {
  const storagePath = `signatures/${formId}/signatures/${userId}.png`;

  // Upload PNG to Supabase Storage (overwrite allowed)
  const { error: uploadError } = await supabase.storage
    .from("signatures")
    .upload(storagePath, blob, {
      cacheControl: "3600",
      // Some Supabase versions may require 'content-type' instead of 'contentType'.
      // If uploads fail, try 'content-type': "image/png"
      contentType: "image/png",
    });
  if (uploadError) {
    throw new Error(`Failed to upload signature: ${uploadError.message}`);
  }

  // Get signed URL (1 hour expiry)
  const { data: signedData, error: signedUrlError } = await supabase.storage
    .from("signatures")
    .createSignedUrl(storagePath, 3600);
  if (signedUrlError || !signedData || !signedData.signedUrl) {
    throw new Error("Failed to get signed URL for signature");
  }

  // Insert or upsert metadata in form_signatures
  const now = new Date().toISOString();
  const { data, error: upsertError } = await supabase
    .from("form_signatures")
    .upsert([
      {
        form_id: formId,
        signed_by: userId,
        signed_at: now,
        storage_path: storagePath,
        public_url: signedData.signedUrl,
        name,
      },
    ], { onConflict: "form_id,signed_by" })
    .select()
    .single();
  if (upsertError) {
    throw new Error(`Failed to save signature metadata: ${upsertError.message}`);
  }

  return data;
} 