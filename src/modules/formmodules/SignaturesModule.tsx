import React from "react";
import { Signature } from "../../types/formTypes";

type Props = {
  value: Signature[];
  onChange: (signatures: Signature[]) => void;
};

const SignaturesModule: React.FC<Props> = ({ value, onChange }) => {
  // console.log("SignaturesModule value:", value);
  const handleChange = (idx: number, field: keyof Signature, val: string) => {
    onChange(value.map((sig, i) => i === idx ? { ...sig, [field]: val } : sig));
  };

  const addSignature = () => {
    onChange([...value, { worker_name: "", signature_url: "", signed_at: "" }]);
  };

  const removeSignature = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <section>
      <h2>Signatures</h2>
      <div>
        {value.map((sig, idx) => (
          <div key={idx}>
            <label>
              Worker Name:
              <input type="text" value={sig.worker_name} onChange={e => handleChange(idx, "worker_name", e.target.value)} />
            </label>
            <label>
              Signature URL:
              <input type="text" value={sig.signature_url} onChange={e => handleChange(idx, "signature_url", e.target.value)} />
            </label>
            <label>
              Signed At:
              <input type="datetime-local" value={sig.signed_at} onChange={e => handleChange(idx, "signed_at", e.target.value)} />
            </label>
            <button type="button" onClick={() => removeSignature(idx)} disabled={value.length === 1}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addSignature}>Add Signature</button>
      </div>
    </section>
  );
};

export default SignaturesModule; 