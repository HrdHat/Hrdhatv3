import React, { useState, useRef } from "react";
import { Signature } from "../types/formSchemas";
import { supabase } from "../db/supabaseClient";

// Props: formId + data loaded by your useFlraFormData hook
type Props = {
  formId: string;
  formModuleId: string;
  initialData: Signature[] | null;
};

const SignaturesForm: React.FC<Props> = ({
  formId,
  formModuleId,
  initialData,
}) => {
  // Local state - initialize with existing data or empty array
  const [signatures, setSignatures] = useState<Partial<Signature>[]>(
    initialData || []
  );

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [signingIndex, setSigningIndex] = useState<number | null>(null);

  // Add a new signature entry
  const addSignature = () => {
    const newSignature: Partial<Signature> = {
      worker_name: "",
      role: "",
      signature_url: "",
    };
    setSignatures((prev) => [...prev, newSignature]);
  };

  // Remove a signature entry
  const removeSignature = (index: number) => {
    setSignatures((prev) => prev.filter((_, i) => i !== index));
  };

  // Update signature field
  const updateSignature = (
    index: number,
    field: keyof Signature,
    value: string
  ) => {
    setSignatures((prev) =>
      prev.map((signature, i) =>
        i === index ? { ...signature, [field]: value } : signature
      )
    );
  };

  // Handle signature capture (placeholder for actual signature canvas)
  const handleSignatureCapture = async (index: number) => {
    const signature = signatures[index];

    if (!signature.worker_name) {
      setStatus("error");
      setErrorMessage("Please enter worker name before signing");
      return;
    }

    setSigningIndex(index);
    setStatus("saving");
    setErrorMessage("");

    try {
      // This is a placeholder - in a real implementation, you would:
      // 1. Open a signature canvas modal
      // 2. Capture the signature as an image
      // 3. Upload to Supabase Storage
      // 4. Get the public URL

      // For now, we'll simulate with a placeholder signature URL
      const signatureUrl = `https://via.placeholder.com/300x150/cccccc/666666?text=Signature+${
        index + 1
      }`;

      // Update local state
      setSignatures((prev) =>
        prev.map((sig, i) =>
          i === index
            ? {
                ...sig,
                signature_url: signatureUrl,
                signed_at: new Date().toISOString(),
              }
            : sig
        )
      );

      // Save to database
      const payload = {
        formId,
        moduleKey: "signatures" as const,
        data: {
          ...signature,
          signature_url: signatureUrl,
          form_id: formId,
          form_module_id: formModuleId,
          signed_at: new Date().toISOString(),
        },
        moduleId: formModuleId,
      };

      const { error } = await supabase.functions.invoke("saveFormModuleData", {
        body: payload,
      });

      if (error) {
        throw error;
      }

      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error("Signature error:", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Signature failed");
    } finally {
      setSigningIndex(null);
    }
  };

  // Save signature details
  const saveSignatureDetails = async (index: number) => {
    const signature = signatures[index];

    if (!signature.worker_name) {
      return; // Don't save without worker name
    }

    setStatus("saving");
    setErrorMessage("");

    try {
      const payload = {
        formId,
        moduleKey: "signatures" as const,
        data: {
          ...signature,
          form_id: formId,
          form_module_id: formModuleId,
          signed_at: signature.signed_at || new Date().toISOString(),
        },
        moduleId: formModuleId,
      };

      const { error } = await supabase.functions.invoke("saveFormModuleData", {
        body: payload,
      });

      if (error) {
        throw error;
      }

      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error("Save error:", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <div className="signatures-form">
      <h2>Signatures</h2>

      {/* Status indicator */}
      <div className="save-status">
        {status === "saving" && <div className="status saving">💾 Saving…</div>}
        {status === "success" && <div className="status success">✅ Saved</div>}
        {status === "error" && (
          <div className="status error">
            ❌ {errorMessage || "Error occurred"}
          </div>
        )}
      </div>

      <div className="signatures-list">
        {signatures.map((signature, index) => (
          <div key={index} className="signature-entry">
            <div className="signature-header">
              <h3>Signature {index + 1}</h3>
              <button
                type="button"
                onClick={() => removeSignature(index)}
                className="remove-button"
                aria-label="Remove signature"
              >
                ✕
              </button>
            </div>

            <div className="signature-content">
              {/* Worker details */}
              <div className="signature-details">
                <div className="field-group">
                  <label htmlFor={`worker-name-${index}`}>
                    Worker Name *
                    <input
                      id={`worker-name-${index}`}
                      type="text"
                      value={signature.worker_name || ""}
                      onChange={(e) =>
                        updateSignature(index, "worker_name", e.target.value)
                      }
                      onBlur={() => saveSignatureDetails(index)}
                      placeholder="Enter worker name"
                      required
                    />
                  </label>
                </div>

                <div className="field-group">
                  <label htmlFor={`role-${index}`}>
                    Role
                    <select
                      id={`role-${index}`}
                      value={signature.role || ""}
                      onChange={(e) =>
                        updateSignature(index, "role", e.target.value)
                      }
                      onBlur={() => saveSignatureDetails(index)}
                    >
                      <option value="">Select role</option>
                      <option value="worker">Worker</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="safety_officer">Safety Officer</option>
                      <option value="foreman">Foreman</option>
                      <option value="inspector">Inspector</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Signature area */}
              <div className="signature-area">
                {signature.signature_url ? (
                  <div className="signature-preview">
                    <img
                      src={signature.signature_url}
                      alt={`Signature of ${signature.worker_name}`}
                      className="signature-image"
                    />
                    <div className="signature-info">
                      <small>
                        Signed:{" "}
                        {signature.signed_at
                          ? new Date(signature.signed_at).toLocaleString()
                          : "Unknown"}
                      </small>
                    </div>
                  </div>
                ) : (
                  <div className="signature-placeholder">
                    <button
                      type="button"
                      onClick={() => handleSignatureCapture(index)}
                      className="sign-button"
                      disabled={
                        signingIndex === index || !signature.worker_name
                      }
                    >
                      {signingIndex === index ? "Signing..." : "Click to Sign"}
                    </button>
                    {!signature.worker_name && (
                      <small className="sign-note">
                        Enter worker name first
                      </small>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={addSignature} className="add-button">
          + Add Signature
        </button>
      </div>

      <div className="signature-note">
        <p>
          <strong>Note:</strong> This is a simplified signature implementation.
          In production, you would integrate a proper signature canvas component
          for capturing actual signatures.
        </p>
      </div>
    </div>
  );
};

export default SignaturesForm;
