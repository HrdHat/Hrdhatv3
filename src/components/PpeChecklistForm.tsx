import React, { useState, useEffect } from "react";
import { PpeChecklist } from "../types";
import { supabase } from "../db/supabaseClient";
import useDebouncedValue from "../hooks/useDebouncedValue";

// ✅ UPDATED: Remove formId prop
type Props = {
  formModuleId: string;
  initialData: Partial<PpeChecklist> | null;
};

const PpeChecklistForm: React.FC<Props> = ({ formModuleId, initialData }) => {
  // Local state - initialize with defaults for all fields
  const [values, setValues] = useState<Partial<PpeChecklist>>({
    ppe_hardhat: false,
    ppe_safety_vest: false,
    ppe_safety_glasses: false,
    ppe_fall_protection: false,
    ppe_coveralls: false,
    ppe_gloves: false,
    ppe_mask: false,
    ppe_respirator: false,
    platform_ladder: false,
    platform_step_bench: false,
    platform_sawhorses: false,
    platform_baker_scaffold: false,
    platform_scaffold: false,
    platform_scissor_lift: false,
    platform_boom_lift: false,
    platform_swing_stage: false,
    platform_hydro_lift: false,
    ...initialData, // Override with any existing data
  });

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Debounce the whole object by 500ms
  const debounced = useDebouncedValue(values, 500);

  // Whenever debounced changes (i.e. user paused typing), save it
  useEffect(() => {
    // If nothing actually changed from initial data, skip
    if (JSON.stringify(debounced) === JSON.stringify(initialData)) return;

    setStatus("saving");
    setErrorMessage("");

    (async () => {
      try {
        // ✅ UPDATED: Remove formId, only send moduleKey, data, moduleId
        const payload = {
          moduleKey: "ppeChecklist",
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
  }, [debounced, formModuleId, initialData]);

  // Handle checkbox changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setValues((prev) => ({ ...prev, [name]: checked }));
    setStatus("idle");
  };

  // PPE items with labels
  const ppeItems = [
    { key: "ppe_hardhat", label: "Hard Hat" },
    { key: "ppe_safety_vest", label: "Safety Vest" },
    { key: "ppe_safety_glasses", label: "Safety Glasses" },
    { key: "ppe_fall_protection", label: "Fall Protection" },
    { key: "ppe_coveralls", label: "Coveralls" },
    { key: "ppe_gloves", label: "Gloves" },
    { key: "ppe_mask", label: "Mask" },
    { key: "ppe_respirator", label: "Respirator" },
  ];

  // Platform items with labels
  const platformItems = [
    { key: "platform_ladder", label: "Ladder" },
    { key: "platform_step_bench", label: "Step Bench" },
    { key: "platform_sawhorses", label: "Sawhorses" },
    { key: "platform_baker_scaffold", label: "Baker Scaffold" },
    { key: "platform_scaffold", label: "Scaffold" },
    { key: "platform_scissor_lift", label: "Scissor Lift" },
    { key: "platform_boom_lift", label: "Boom Lift" },
    { key: "platform_swing_stage", label: "Swing Stage" },
    { key: "platform_hydro_lift", label: "Hydro Lift" },
  ];

  return (
    <div className="ppe-checklist-form">
      <h2>PPE and Platform Inspection</h2>

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

      <form className="checklist-form">
        <div className="section">
          <h3>Personal Protective Equipment (PPE)</h3>
          {ppeItems.map((item) => (
            <div key={item.key} className="checkbox-group">
              <label htmlFor={item.key}>
                <input
                  id={item.key}
                  name={item.key}
                  type="checkbox"
                  checked={
                    (values[item.key as keyof PpeChecklist] as boolean) || false
                  }
                  onChange={handleChange}
                />
                <span className="checkbox-label">{item.label}</span>
              </label>
            </div>
          ))}
        </div>

        <div className="section">
          <h3>Platform Inspection</h3>
          {platformItems.map((item) => (
            <div key={item.key} className="checkbox-group">
              <label htmlFor={item.key}>
                <input
                  id={item.key}
                  name={item.key}
                  type="checkbox"
                  checked={
                    (values[item.key as keyof PpeChecklist] as boolean) || false
                  }
                  onChange={handleChange}
                />
                <span className="checkbox-label">{item.label}</span>
              </label>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
};

export default PpeChecklistForm;
