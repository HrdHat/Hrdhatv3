import React, { useState, useEffect } from "react";
import { GeneralInfo } from "../types/formSchemas";
import { supabase } from "../db/supabaseClient";
import useDebouncedValue from "../hooks/useDebouncedValue";

// ✅ UPDATED: Remove formId prop
type Props = {
  formModuleId: string;
  initialData: Partial<GeneralInfo> | null;
};

const GeneralInfoForm: React.FC<Props> = ({ formModuleId, initialData }) => {
  // Local state - initialize with defaults for all fields
  const [values, setValues] = useState<Partial<GeneralInfo>>({
    project_name: "",
    project_address: "",
    location: "",
    supervisor_name: "",
    supervisor_contact: "",
    form_date: "",
    crew_members_count: 0,
    work_description: "",
    start_time: "",
    end_time: "",
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
      // ✅ UPDATED: Remove formId, only send moduleKey, data, moduleId
      const payload = {
        moduleKey: "general",
        data: debounced,
        moduleId: formModuleId,
      };

      console.log("Sending payload:", payload); // Debug log

      const { data: responseData, error } = await supabase.functions.invoke(
        "saveFormModuleData",
        {
          body: payload,
        }
      );

      if (error) {
        console.error("Save failed:", error);
        console.error("Full error details:", JSON.stringify(error, null, 2));
        console.error("Response data:", responseData);
        setStatus("error");
        setErrorMessage(error.message || "Save failed");
      } else {
        console.log("Save successful:", responseData); // Debug log
        setStatus("success");
        // Clear success status after 2 seconds
        setTimeout(() => setStatus("idle"), 2000);
      }
    })();
  }, [debounced, formModuleId, initialData]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const finalValue = type === "number" ? parseInt(value) || 0 : value;
    setValues((prev) => ({ ...prev, [name]: finalValue }));
    setStatus("idle");
  };

  return (
    <div className="general-info-form">
      <h2>General Information</h2>

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

      <form className="general-info-form-fields">
        <div className="form-group">
          <label htmlFor="project_name">Project Name</label>
          <input
            id="project_name"
            name="project_name"
            type="text"
            value={values.project_name || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="project_address">Project Address</label>
          <input
            id="project_address"
            name="project_address"
            type="text"
            value={values.project_address || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Task Location</label>
          <input
            id="location"
            name="location"
            type="text"
            value={values.location || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="supervisor_name">Supervisor Name</label>
          <input
            id="supervisor_name"
            name="supervisor_name"
            type="text"
            value={values.supervisor_name || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="supervisor_contact">Supervisor Contact</label>
          <input
            id="supervisor_contact"
            name="supervisor_contact"
            type="text"
            value={values.supervisor_contact || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="form_date">Date</label>
          <input
            id="form_date"
            name="form_date"
            type="date"
            value={values.form_date || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="crew_members_count">Crew Members Count</label>
          <input
            id="crew_members_count"
            name="crew_members_count"
            type="number"
            value={values.crew_members_count || 0}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="work_description">Task Description</label>
          <textarea
            id="work_description"
            name="work_description"
            value={values.work_description || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="start_time">Start Time</label>
          <input
            id="start_time"
            name="start_time"
            type="time"
            value={values.start_time || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="end_time">End Time</label>
          <input
            id="end_time"
            name="end_time"
            type="time"
            value={values.end_time || ""}
            onChange={handleChange}
          />
        </div>
      </form>
    </div>
  );
};

export default GeneralInfoForm;
