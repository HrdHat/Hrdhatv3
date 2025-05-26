import React, { useState, useEffect } from "react";
import { TaskHazardControl } from "../types/formSchemas";
import { supabase } from "../db/supabaseClient";
import useDebouncedValue from "../hooks/useDebouncedValue";

// Props: formId + data loaded by your useFlraFormData hook
type Props = {
  formId: string;
  formModuleId: string;
  initialData: TaskHazardControl[] | null;
};

const TaskHazardsForm: React.FC<Props> = ({
  formId,
  formModuleId,
  initialData,
}) => {
  // Local state - initialize with existing data or empty array
  const [hazards, setHazards] = useState<Partial<TaskHazardControl>[]>(
    initialData || []
  );

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Add a new hazard entry
  const addHazard = () => {
    const newHazard: Partial<TaskHazardControl> = {
      task: "",
      hazard: "",
      risk_level_before: 1,
      control: "",
      risk_level_after: 1,
    };
    setHazards((prev) => [...prev, newHazard]);
  };

  // Remove a hazard entry
  const removeHazard = (index: number) => {
    setHazards((prev) => prev.filter((_, i) => i !== index));
  };

  // Update a specific hazard field
  const updateHazard = (
    index: number,
    field: keyof TaskHazardControl,
    value: string | number
  ) => {
    setHazards((prev) =>
      prev.map((hazard, i) =>
        i === index ? { ...hazard, [field]: value } : hazard
      )
    );
  };

  // Save all hazards (array modules need to save the entire array)
  const saveAllHazards = async () => {
    // Filter out incomplete hazards
    const completeHazards = hazards.filter(
      (hazard) => hazard.task && hazard.hazard && hazard.control
    );

    if (completeHazards.length === 0) {
      return; // Don't save if no complete entries
    }

    setStatus("saving");
    setErrorMessage("");

    try {
      const payload = {
        formId,
        moduleKey: "taskHazards",
        data: completeHazards.map((hazard) => ({
          ...hazard,
          form_module_id: formModuleId,
        })),
      };

      const { error } = await supabase.functions.invoke("saveFormModuleData", {
        body: payload,
      });

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
  };

  // Handle input changes
  const handleChange = (
    index: number,
    field: keyof TaskHazardControl,
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { value } = e.target;
    const processedValue = field.includes("risk_level")
      ? parseInt(value, 10)
      : value;
    updateHazard(index, field, processedValue);
    setStatus("idle");
  };

  // Debounce saving all hazards
  const debouncedHazards = useDebouncedValue(hazards, 1000); // 1 second delay for arrays

  useEffect(() => {
    if (debouncedHazards.length > 0) {
      saveAllHazards();
    }
  }, [debouncedHazards]);

  // Handle blur (trigger save)
  const handleBlur = () => {
    saveAllHazards();
  };

  return (
    <div className="task-hazards-form">
      <h2>Task Hazard Control</h2>

      {/* Status indicator */}
      <div className="save-status">
        {status === "saving" && <div className="status saving">💾 Saving…</div>}
        {status === "success" && <div className="status success">✅ Saved</div>}
        {status === "error" && (
          <div className="status error">
            ❌ Save failed{errorMessage && `: ${errorMessage}`}
          </div>
        )}
      </div>

      <div className="hazards-list">
        {hazards.map((hazard, index) => (
          <div key={index} className="hazard-entry">
            <div className="hazard-header">
              <h3>Hazard {index + 1}</h3>
              <button
                type="button"
                onClick={() => removeHazard(index)}
                className="remove-button"
                aria-label="Remove hazard"
              >
                ✕
              </button>
            </div>

            <div className="hazard-form">
              <div className="field-group">
                <label htmlFor={`task-${index}`}>
                  Task *
                  <input
                    id={`task-${index}`}
                    type="text"
                    value={hazard.task || ""}
                    onChange={(e) => handleChange(index, "task", e)}
                    onBlur={handleBlur}
                    placeholder="Describe the task"
                    required
                  />
                </label>
              </div>

              <div className="field-group">
                <label htmlFor={`hazard-${index}`}>
                  Hazard *
                  <input
                    id={`hazard-${index}`}
                    type="text"
                    value={hazard.hazard || ""}
                    onChange={(e) => handleChange(index, "hazard", e)}
                    onBlur={handleBlur}
                    placeholder="Identify the hazard"
                    required
                  />
                </label>
              </div>

              <div className="field-group">
                <label htmlFor={`risk-before-${index}`}>
                  Risk Level Before Control (1-5)
                  <select
                    id={`risk-before-${index}`}
                    value={hazard.risk_level_before || 1}
                    onChange={(e) =>
                      handleChange(index, "risk_level_before", e)
                    }
                    onBlur={handleBlur}
                  >
                    <option value={1}>1 - Very Low</option>
                    <option value={2}>2 - Low</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - High</option>
                    <option value={5}>5 - Very High</option>
                  </select>
                </label>
              </div>

              <div className="field-group">
                <label htmlFor={`control-${index}`}>
                  Control Measure *
                  <textarea
                    id={`control-${index}`}
                    value={hazard.control || ""}
                    onChange={(e) => handleChange(index, "control", e)}
                    onBlur={handleBlur}
                    placeholder="Describe the control measure"
                    rows={3}
                    required
                  />
                </label>
              </div>

              <div className="field-group">
                <label htmlFor={`risk-after-${index}`}>
                  Risk Level After Control (1-5)
                  <select
                    id={`risk-after-${index}`}
                    value={hazard.risk_level_after || 1}
                    onChange={(e) => handleChange(index, "risk_level_after", e)}
                    onBlur={handleBlur}
                  >
                    <option value={1}>1 - Very Low</option>
                    <option value={2}>2 - Low</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - High</option>
                    <option value={5}>5 - Very High</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={addHazard} className="add-button">
          + Add Hazard
        </button>
      </div>
    </div>
  );
};

export default TaskHazardsForm;
