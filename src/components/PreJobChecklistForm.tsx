import React, { useState, useEffect } from "react";
import { PreJobChecklist } from "../types";
import { supabase } from "../db/supabaseClient";
import useDebouncedValue from "../hooks/useDebouncedValue";

// ✅ UPDATED: Remove formId prop
type Props = {
  formModuleId: string;
  initialData: Partial<PreJobChecklist> | null;
};

const PreJobChecklistForm: React.FC<Props> = ({
  formModuleId,
  initialData,
}) => {
  // Local state - initialize with defaults for all fields
  const [values, setValues] = useState<Partial<PreJobChecklist>>({
    is_fit_for_duty: false,
    reviewed_work_area_for_hazards: false,
    required_ppe_for_today: false,
    equipment_inspection_up_to_date: false,
    completed_flra_hazard_assessment: false,
    safety_signage_installed_and_checked: false,
    working_alone_today: false,
    required_permits_for_tasks: false,
    barricades_signage_barriers_installed_good: false,
    clear_access_to_emergency_exits: false,
    trained_and_competent_for_tasks: false,
    inspected_tools_and_equipment: false,
    reviewed_control_measures_needed: false,
    reviewed_emergency_procedures: false,
    all_required_permits_in_place: false,
    communicated_with_crew_about_plan: false,
    need_for_spotters_barricades_special_controls: false,
    weather_suitable_for_work: false,
    know_designated_first_aid_attendant: false,
    aware_of_site_notices_or_bulletins: false,
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
          moduleKey: "preJobChecklist",
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

  // Checklist items with labels
  const checklistItems = [
    { key: "is_fit_for_duty", label: "I am fit for duty today" },
    {
      key: "reviewed_work_area_for_hazards",
      label: "I have reviewed the work area for hazards",
    },
    {
      key: "required_ppe_for_today",
      label: "I have the required PPE for today's work",
    },
    {
      key: "equipment_inspection_up_to_date",
      label: "Equipment inspection is up to date",
    },
    {
      key: "completed_flra_hazard_assessment",
      label: "I have completed the FLRA hazard assessment",
    },
    {
      key: "safety_signage_installed_and_checked",
      label: "Safety signage is installed and checked",
    },
    { key: "working_alone_today", label: "I am working alone today" },
    {
      key: "required_permits_for_tasks",
      label: "I have the required permits for today's tasks",
    },
    {
      key: "barricades_signage_barriers_installed_good",
      label:
        "Barricades, signage, and barriers are installed and in good condition",
    },
    {
      key: "clear_access_to_emergency_exits",
      label: "There is clear access to emergency exits",
    },
    {
      key: "trained_and_competent_for_tasks",
      label: "I am trained and competent for today's tasks",
    },
    {
      key: "inspected_tools_and_equipment",
      label: "I have inspected tools and equipment",
    },
    {
      key: "reviewed_control_measures_needed",
      label: "I have reviewed control measures needed",
    },
    {
      key: "reviewed_emergency_procedures",
      label: "I have reviewed emergency procedures",
    },
    {
      key: "all_required_permits_in_place",
      label: "All required permits are in place",
    },
    {
      key: "communicated_with_crew_about_plan",
      label: "I have communicated with crew about the plan",
    },
    {
      key: "need_for_spotters_barricades_special_controls",
      label:
        "I understand the need for spotters, barricades, and special controls",
    },
    { key: "weather_suitable_for_work", label: "Weather is suitable for work" },
    {
      key: "know_designated_first_aid_attendant",
      label: "I know the designated first aid attendant",
    },
    {
      key: "aware_of_site_notices_or_bulletins",
      label: "I am aware of site notices or bulletins",
    },
  ];

  return (
    <div className="pre-job-checklist-form">
      <h2>Pre-Job Checklist</h2>

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
        {checklistItems.map((item) => (
          <div key={item.key} className="checkbox-group">
            <label htmlFor={item.key}>
              <input
                id={item.key}
                name={item.key}
                type="checkbox"
                checked={
                  (values[item.key as keyof PreJobChecklist] as boolean) ||
                  false
                }
                onChange={handleChange}
              />
              <span className="checkbox-label">{item.label}</span>
            </label>
          </div>
        ))}
      </form>
    </div>
  );
};

export default PreJobChecklistForm;
