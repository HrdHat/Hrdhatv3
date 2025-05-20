import React, { useState, useEffect } from "react";
import SignatureCanvas from "../../components/shared/SignatureCanvas";
import {
  uploadSignatureToSupabase,
  SignatureMetadata,
} from "../../services/forms/uploadSignatureToSupabase";
import { useAuth } from "../../session/AuthProvider";
import { supabase } from "../../db/supabaseClient";

// Helper to get storage path for a signature
function getSignatureStoragePath(formId: string, signatureId: string) {
  return `signatures/${formId}/${signatureId}.png`;
}

type Props = {
  value: SignatureMetadata[];
  onChange: (signatures: SignatureMetadata[]) => void;
  formId: string;
  formModuleId: string;
  layoutStyle?: "tight" | "loose" | "default";
};

const SignaturesModule: React.FC<Props> = ({
  value,
  onChange,
  formId,
  formModuleId,
  layoutStyle = "default",
}) => {
  if (!value) return null;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Check if current user has already signed (id is user id)
  const alreadySigned = !!value.find((sig) => sig.id === user?.id);

  // Fetch signed URLs for all signatures
  useEffect(() => {
    let isMounted = true;
    async function fetchUrls() {
      const urlMap: Record<string, string> = {};
      for (const sig of value) {
        const storagePath = getSignatureStoragePath(formId, sig.id);
        const { data, error } = await supabase.storage
          .from("signatures")
          .createSignedUrl(storagePath, 3600);
        if (data?.signedUrl && isMounted) {
          urlMap[sig.id] = data.signedUrl;
        }
      }
      if (isMounted) setSignedUrls(urlMap);
    }
    fetchUrls();
    return () => {
      isMounted = false;
    };
  }, [value, formId]);

  const handleSigned = async ({ name, blob }: { name: string; blob: Blob }) => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const meta = await uploadSignatureToSupabase({
        formId,
        metadata: {
          id: user.id,
          name,
          role: user.user_metadata?.role || "",
          timestamp: Date.now(),
          formId,
          form_module_id: formModuleId,
        },
        blob,
      });
      // Replace or add the user's signature in the list
      const updated = value.filter((sig) => sig.id !== user.id).concat(meta);
      onChange(updated);
    } catch (e: any) {
      setError(e.message || "Failed to save signature.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`module-wrapper layout-${layoutStyle}`}>
      <h2>Signatures</h2>
      {!alreadySigned && (
        <SignatureCanvas
          formId={formId}
          userId={user?.id || ""}
          userName={user?.user_metadata?.full_name || ""}
          onSigned={handleSigned}
        />
      )}
      {loading && <p>Saving signature...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div>
        {value.length === 0 && <p>No signatures yet.</p>}
        {value
          .slice() // avoid mutating the original array
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((sig) => (
            <div key={sig.id} style={{ marginBottom: 16 }}>
              <div>
                <strong>{sig.name}</strong>
                <span style={{ marginLeft: 8, color: "#888" }}>
                  {new Date(sig.timestamp).toLocaleString()}
                </span>
              </div>
              {signedUrls[sig.id] ? (
                <img
                  src={signedUrls[sig.id]}
                  alt={`Signature of ${sig.name}`}
                  style={{
                    border: "1px solid #ccc",
                    background: "#fff",
                    maxWidth: 300,
                    maxHeight: 80,
                  }}
                />
              ) : (
                <span>Loading image...</span>
              )}
            </div>
          ))}
      </div>
    </section>
  );
};

export default SignaturesModule;
