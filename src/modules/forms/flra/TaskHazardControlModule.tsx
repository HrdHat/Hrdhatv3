import React from "react";
import { TaskHazardControl } from "../../../types/formTypes";

type Props = {
  value: TaskHazardControl[];
  onChange: (rows: TaskHazardControl[]) => void;
};

const TaskHazardControlModule: React.FC<Props> = ({ value, onChange }) => {
  // console.log("TaskHazardControlModule value:", value);
  const handleChange = (idx: number, field: keyof TaskHazardControl, val: string) => {
    if (field === "risk_level_before" || field === "risk_level_after") {
      onChange(value.map((row, i) =>
        i === idx ? { ...row, [field]: val === "" ? undefined : Number(val) } : row
      ));
    } else {
      onChange(value.map((row, i) => i === idx ? { ...row, [field]: val } : row));
    }
  };

  const addRow = () => {
    onChange([...value, { task: "", hazard: "", risk_level_before: undefined, control: "", risk_level_after: undefined }]);
  };

  const removeRow = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <section>
      <h2>Task Hazard Control Module</h2>
      <div>
        {value.map((row, idx) => (
          <div key={idx}>
            <label>
              Task:
              <input type="text" value={row.task} onChange={e => handleChange(idx, "task", e.target.value)} />
            </label>
            <label>
              Hazard:
              <input type="text" value={row.hazard} onChange={e => handleChange(idx, "hazard", e.target.value)} />
            </label>
            <label>
              Risk Level Before:
              <input type="number" value={row.risk_level_before ?? ""} onChange={e => handleChange(idx, "risk_level_before", e.target.value)} />
            </label>
            <label>
              Control:
              <input type="text" value={row.control} onChange={e => handleChange(idx, "control", e.target.value)} />
            </label>
            <label>
              Risk Level After:
              <input type="number" value={row.risk_level_after ?? ""} onChange={e => handleChange(idx, "risk_level_after", e.target.value)} />
            </label>
            <button type="button" onClick={() => removeRow(idx)} disabled={value.length === 1}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addRow}>Add Row</button>
      </div>
    </section>
  );
};

export default TaskHazardControlModule; 