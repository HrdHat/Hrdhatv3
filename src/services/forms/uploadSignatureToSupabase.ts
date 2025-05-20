import { supabase } from "../../db/supabaseClient";

export interface SignatureMetadata {
  id: string;
  name: string;
  role: string;
  timestamp: number;
  hash: string;
  formId: string;
  form_module_id: string;
}

export async function generateSignatureHash(
  data: ArrayBuffer
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function uploadSignatureToSupabase({
  formId,
  metadata,
  blob,
}: {
  formId: string;
  metadata: Omit<SignatureMetadata, "hash">;
  blob: Blob;
}): Promise<SignatureMetadata> {
  // Generate hash from blob
  const arrayBuffer = await blob.arrayBuffer();
  const hash = await generateSignatureHash(arrayBuffer);

  const storagePath = `signatures/${formId}/${metadata.id}.png`;

  // Upload PNG to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("signatures")
    .upload(storagePath, blob, {
      cacheControl: "3600",
      contentType: "image/png",
      upsert: true,
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

  // Save to form_instance_signatures table with metadata
  const { data, error: dbError } = await supabase
    .from("form_instance_signatures")
    .insert({
      form_id: formId,
      form_module_id: metadata.form_module_id,
      worker_name: metadata.name,
      signature_url: storagePath,
      signed_at: new Date(metadata.timestamp).toISOString(),
      signature_hash: hash,
      role: metadata.role,
      metadata: {
        ...metadata,
        public_url: signedData.signedUrl,
      },
    })
    .select()
    .single();

  if (dbError) {
    throw new Error(`Failed to save signature metadata: ${dbError.message}`);
  }

  return {
    ...metadata,
    hash,
  };
}
