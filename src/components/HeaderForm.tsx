import React, { useState, useEffect } from "react";
import { FormInstance } from "../types";
import { supabase } from "../db/supabaseClient";
import useDebouncedValue from "../hooks/useDebouncedValue";

// Props: formId + data loaded by your useFlraFormData hook
type Props = {
  formId: string;
  initialData: Partial<FormInstance> | null;
};

const HeaderForm: React.FC<Props> = ({ formId, initialData }) => {
  // Local state - initialize with defaults for all fields
  const [values, setValues] = useState<Partial<FormInstance>>({
    title: "",
    description: "",
    form_number: "",
    status: "draft",
    form_date: "",
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

    // Skip if all values are empty/default (no point saving empty form)
    const hasContent = Object.values(debounced).some(
      (value) => value !== "" && value !== null && value !== undefined
    );
    if (!hasContent) return;

    setStatus("saving");
    setErrorMessage("");

    (async () => {
      try {
        const payload = {
          formId,
          moduleKey: "header",
          data: {
            ...debounced,
            id: formId, // Header uses formId as its ID
            last_modified: new Date().toISOString(),
            version: (initialData?.version || 0) + 1,
          },
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
  }, [debounced, formId, initialData]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setStatus("idle");
  };

  return (
    <div className="header-form">
      <h2>Form Header</h2>

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

      <form className="form-grid">
        <div className="field-group">
          <label htmlFor="title">
            Form Title *
            <input
              id="title"
              name="title"
              type="text"
              value={values.title || ""}
              onChange={handleChange}
              placeholder="Enter form title"
              required
            />
          </label>
        </div>

        <div className="field-group">
          <label htmlFor="form_number">
            Form Number
            <input
              id="form_number"
              name="form_number"
              type="text"
              value={values.form_number || ""}
              onChange={handleChange}
              placeholder="Auto-generated if empty"
            />
          </label>
        </div>

        <div className="field-group">
          <label htmlFor="form_date">
            Form Date
            <input
              id="form_date"
              name="form_date"
              type="date"
              value={values.form_date || ""}
              onChange={handleChange}
            />
          </label>
        </div>

        <div className="field-group">
          <label htmlFor="status">
            Status
            <select
              id="status"
              name="status"
              value={values.status || "draft"}
              onChange={handleChange}
            >
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="submitted">Submitted</option>
            </select>
          </label>
        </div>

        <div className="field-group full-width">
          <label htmlFor="description">
            Description
            <textarea
              id="description"
              name="description"
              value={values.description || ""}
              onChange={handleChange}
              placeholder="Enter form description"
              rows={3}
            />
          </label>
        </div>
      </form>
    </div>
  );
};

export default HeaderForm;
