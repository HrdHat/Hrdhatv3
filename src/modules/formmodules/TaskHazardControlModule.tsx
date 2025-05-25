import React, { useEffect, useState } from "react";
import { TaskHazardControl } from "../../types/formTypes";

type Props = {
  value: TaskHazardControl[];
  onChange: (rows: TaskHazardControl[]) => void;
  layoutStyle?: "tight" | "loose" | "default";
};

const TaskHazardControlModule: React.FC<Props> = ({
  value = [],
  onChange,
  layoutStyle = "default",
}) => {
  const [taskHazards, setTaskHazards] = useState<TaskHazardControl[]>(
    value && value.length > 0
      ? value
      : [
          {
            id: crypto.randomUUID(),
            form_id: "",
            form_module_id: null,
            task: "",
            hazard: "",
            risk_level_before: null,
            control: "",
            risk_level_after: null,
            created_at: new Date().toISOString(),
          },
        ]
  );

  useEffect(() => {
    setTaskHazards(
      value && value.length > 0
        ? value
        : [
            {
              id: crypto.randomUUID(),
              form_id: "",
              form_module_id: null,
              task: "",
              hazard: "",
              risk_level_before: null,
              control: "",
              risk_level_after: null,
              created_at: new Date().toISOString(),
            },
          ]
    );
  }, [value]);

  useEffect(() => {
    if (!value || value.length === 0) {
      onChange([
        {
          id: crypto.randomUUID(),
          form_id: "",
          form_module_id: null,
          task: "",
          hazard: "",
          risk_level_before: null,
          control: "",
          risk_level_after: null,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  }, []); // Only run once on mount

  const updateField = (
    idx: number,
    field: keyof TaskHazardControl,
    val: any
  ) => {
    const updatedHazards = taskHazards.map((row, i) => {
      if (i !== idx) return row;

      if (field === "risk_level_before" || field === "risk_level_after") {
        return { ...row, [field]: val === "" ? null : Number(val) };
      }
      return { ...row, [field]: val };
    });

    setTaskHazards(updatedHazards);
    onChange(updatedHazards);
  };

  const addTaskHazard = () => {
    const newHazards = [
      ...taskHazards,
      {
        id: crypto.randomUUID(),
        form_id: "",
        form_module_id: null,
        task: "",
        hazard: "",
        risk_level_before: null,
        control: "",
        risk_level_after: null,
        created_at: new Date().toISOString(),
      },
    ];
    setTaskHazards(newHazards);
    onChange(newHazards);
  };

  const removeRow = (idx: number) => {
    if (taskHazards.length <= 1) return;
    const newHazards = taskHazards.filter((_, i) => i !== idx);
    setTaskHazards(newHazards);
    onChange(newHazards);
  };

  return (
    <section className={`module-wrapper layout-${layoutStyle}`}>
      <h2>Task Hazard Control Module</h2>
      <div>
        {taskHazards.map((row, idx) => (
          <div key={idx}>
            <label>
              Task:
              <input
                type="text"
                value={row.task}
                onChange={(e) => updateField(idx, "task", e.target.value)}
              />
            </label>
            <label>
              Hazard:
              <input
                type="text"
                value={row.hazard}
                onChange={(e) => updateField(idx, "hazard", e.target.value)}
              />
            </label>
            <label>
              Risk Level Before:
              <input
                type="number"
                value={row.risk_level_before ?? ""}
                onChange={(e) =>
                  updateField(idx, "risk_level_before", e.target.value)
                }
              />
            </label>
            <label>
              Control:
              <input
                type="text"
                value={row.control}
                onChange={(e) => updateField(idx, "control", e.target.value)}
              />
            </label>
            <label>
              Risk Level After:
              <input
                type="number"
                value={row.risk_level_after ?? ""}
                onChange={(e) =>
                  updateField(idx, "risk_level_after", e.target.value)
                }
              />
            </label>
            <button
              type="button"
              onClick={() => removeRow(idx)}
              disabled={taskHazards.length <= 1}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addTaskHazard}>
          Add Row
        </button>
      </div>
    </section>
  );
};

export default TaskHazardControlModule;
