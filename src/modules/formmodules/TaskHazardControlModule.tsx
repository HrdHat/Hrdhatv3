import React, { useEffect, useState } from "react";
import { TaskHazardControl } from "../../types/formTypes";
import { supabase } from "../../db/supabaseClient";
import useDebouncedValue from "../../hooks/useDebouncedValue";

type Props = {
  value: TaskHazardControl[];
  onChange: (rows: TaskHazardControl[]) => void;
  layoutStyle?: "tight" | "loose" | "default";
  formModuleId?: string;
};

const TaskHazardControlModule: React.FC<Props> = ({
  value = [],
  onChange,
  layoutStyle = "default",
  formModuleId = "",
}) => {
  const [taskHazards, setTaskHazards] = useState<TaskHazardControl[]>(
    value && value.length > 0
      ? value
      : [
          {
            id: crypto.randomUUID(),
            form_module_id: formModuleId,
            task: "",
            hazard: "",
            risk_level_before: null,
            control: "",
            risk_level_after: null,
            created_at: new Date().toISOString(),
          },
        ]
  );

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  // ✅ NEW: Debounce the task hazards array by 500ms
  const debounced = useDebouncedValue(taskHazards, 500);

  // ✅ NEW: Save to edge function when debounced data changes
  useEffect(() => {
    // Skip if no formModuleId or if data hasn't actually changed
    if (!formModuleId || JSON.stringify(debounced) === JSON.stringify(value)) {
      return;
    }

    // Skip if all rows are empty (initial state)
    const hasData = debounced.some(
      (row) => row.task || row.hazard || row.control
    );
    if (!hasData) return;

    setStatus("saving");
    setErrorMessage("");

    (async () => {
      try {
        const payload = {
          moduleKey: "taskHazards",
          data: debounced,
          moduleId: formModuleId,
        };

        const { error } = await supabase.functions.invoke(
          "saveFormModuleData",
          {
            body: payload,
          }
        );

        if (error) {
          console.error("Save failed:", error);
          setStatus("error");
          setErrorMessage(error.message || "Save failed");
        } else {
          setStatus("success");
          // Clear success status after 2 seconds
          setTimeout(() => setStatus("idle"), 2000);
        }
      } catch (err) {
        console.error("Save error:", err);
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Unknown error");
      }
    })();
  }, [debounced, formModuleId, value]);

  useEffect(() => {
    setTaskHazards(
      value && value.length > 0
        ? value
        : [
            {
              id: crypto.randomUUID(),
              form_module_id: formModuleId,
              task: "",
              hazard: "",
              risk_level_before: null,
              control: "",
              risk_level_after: null,
              created_at: new Date().toISOString(),
            },
          ]
    );
  }, [value, formModuleId]);

  useEffect(() => {
    if (!value || value.length === 0) {
      const initialRow = {
        id: crypto.randomUUID(),
        form_module_id: formModuleId,
        task: "",
        hazard: "",
        risk_level_before: null,
        control: "",
        risk_level_after: null,
        created_at: new Date().toISOString(),
      };
      setTaskHazards([initialRow]);
      onChange([initialRow]);
    }
  }, [formModuleId]);

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
    setStatus("idle"); // Reset status when user makes changes
  };

  const addTaskHazard = () => {
    const newHazards = [
      ...taskHazards,
      {
        id: crypto.randomUUID(),
        form_module_id: formModuleId,
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

      {/* ✅ NEW: Status indicator */}
      <div className="save-status">
        {status === "saving" && <div className="status saving">💾 Saving…</div>}
        {status === "success" && <div className="status success">✅ Saved</div>}
        {status === "error" && (
          <div className="status error">
            ❌ Save failed{errorMessage && `: ${errorMessage}`}
          </div>
        )}
      </div>

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
