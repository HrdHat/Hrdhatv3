import React from "react";
import { FlraHeader } from "../../types/formTypes";

type Props = {
  value: FlraHeader;
  onChange: (header: FlraHeader) => void;
};

const FlraHeaderModule: React.FC<Props> = ({ value, onChange }) => {
  // console.log("FlraHeaderModule value:", value);
  return (
    <section>
      <h2>FLRA Header</h2>
      <div>
        <label>
          Form Number:
          <input
            type="text"
            value={value.form_number || ""}
            onChange={e => onChange({ ...value, form_number: e.target.value })}
          />
        </label>
        <label>
          Form Name:
          <input
            type="text"
            value={value.form_name || ""}
            onChange={e => onChange({ ...value, form_name: e.target.value })}
          />
        </label>
        <label>
          Form Date:
          <input
            type="date"
            value={value.form_date || ""}
            onChange={e => onChange({ ...value, form_date: e.target.value })}
          />
        </label>
      </div>
    </section>
  );
};

export default FlraHeaderModule; 