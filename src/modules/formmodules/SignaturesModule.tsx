import React, { useState } from "react";
import SignatureCanvas from "../../components/shared/SignatureCanvas";
import { uploadSignatureToSupabase, SignatureMetadata } from "../../services/forms/uploadSignatureToSupabase";
import { useAuth } from "../../session/AuthProvider";

type Props = {
  value: SignatureMetadata[];
  onChange: (signatures: SignatureMetadata[]) => void;
  formId: string;
};

const SignaturesModule: React.FC<Props> = ({ value, onChange, formId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if current user has already signed
  const alreadySigned = !!value.find(sig => sig.signed_by === user?.id);

  const handleSigned = async ({ name, blob }: { name: string; blob: Blob }) => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const meta = await uploadSignatureToSupabase({
        formId,
        userId: user.id,
        name,
        blob,
      });
      // Replace or add the user's signature in the list
      const updated = value.filter(sig => sig.signed_by !== user.id).concat(meta);
      onChange(updated);
    } catch (e: any) {
      setError(e.message || "Failed to save signature.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
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
          .sort((a, b) => new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime())
          .map((sig) => (
            <div key={sig.signed_by} style={{ marginBottom: 16 }}>
              <div>
                <strong>{sig.name}</strong>
                <span style={{ marginLeft: 8, color: "#888" }}>
                  {new Date(sig.signed_at).toLocaleString()}
                </span>
              </div>
              <img
                src={sig.public_url}
                alt={`Signature of ${sig.name}`}
                style={{ border: "1px solid #ccc", background: "#fff", maxWidth: 300, maxHeight: 80 }}
              />
            </div>
          ))}
      </div>
    </section>
  );
};

export default SignaturesModule; 