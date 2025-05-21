// @cursor-ai
// Custom-rendered form instance module. Fields are hardcoded.
// Do not auto-insert or bind dynamic field logic here.
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../db/supabaseClient";
import { FormInstance } from "../../types/formTypes";
import { useDebouncedSave } from "../../hooks/useDebouncedSave";
import {
  generateFormNumber,
  isUserFormIdTaken,
} from "../../utils/formNumberGenerator";
import { TABLES } from "../../constants/database";
import toast from "react-hot-toast";
import { PostgrestError } from "@supabase/supabase-js";

// Utility function to validate ISO date strings
const isValidISODate = (str: string): boolean => {
  if (!str) return false;
  const date = new Date(str);
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === str;
};

interface FormInstanceModuleProps {
  formId: string;
  formModuleId: string;
  onHeaderChange?: (instance: FormInstance) => void;
  layoutStyle?: "tight" | "loose" | "default";
}

interface FormInstanceModule {
  id: string;
  form_id: string;
  // ... other fields
}

const FormInstanceModule: React.FC<FormInstanceModuleProps> = ({
  formId,
  formModuleId,
  onHeaderChange,
  layoutStyle = "default",
}) => {
  const [instance, setInstance] = useState<FormInstance>({
    form_number: null, // Initialize as null to match database schema
    user_form_id: null,
    title: null,
    form_date: new Date().toISOString().slice(0, 10), // Default to today
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Save instance data with useCallback to prevent debounce issues
  const saveInstanceData = useCallback(
    async (updatedInstance: FormInstance) => {
      setIsSaving(true);
      try {
        // First get the form_id from the junction table
        const { data: formModule, error: moduleError } = await supabase
          .from("form_instance_modules")
          .select("form_id")
          .eq("id", formModuleId)
          .single();

        if (moduleError) throw moduleError;

        // Then upsert using the correct form_id
        const { error } = await supabase.from("form_instances").upsert({
          id: formModule.form_id, // Critical for updates
          form_number: updatedInstance.form_number,
          user_form_id: updatedInstance.user_form_id,
          title: updatedInstance.title,
          form_date: updatedInstance.form_date,
        });

        if (error) throw error;
        toast.success("Saved successfully!");
      } catch (err) {
        console.error("Save error:", err);
        toast.error("Save failed");
      } finally {
        setIsSaving(false);
      }
    },
    [formModuleId]
  );

  // Initialize debounced save with memoized callback
  const debouncedSave = useDebouncedSave(saveInstanceData);

  // Combined initialization effect
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        // Replace old query with relational fetch
        const { data: formModule, error: moduleError } = await supabase
          .from("form_instance_modules")
          .select("*")
          .eq("id", formModuleId)
          .single();

        if (moduleError) throw moduleError;

        const { data: formInstance, error: formError } = await supabase
          .from("form_instances")
          .select("*")
          .eq("id", formModule.form_id) // Correct column
          .single();

        if (formError) throw formError;

        if (formInstance) {
          setInstance({
            form_number: formInstance.form_number,
            user_form_id: formInstance.user_form_id,
            title: formInstance.title,
            form_date: formInstance.form_date,
          });
        } else if ((formError as PostgrestError)?.code === "PGRST116") {
          setIsGeneratingNumber(true);
          const formNumber = await generateFormNumber();
          const newInstance = {
            form_number: formNumber,
            user_form_id: null,
            title: null,
            form_date: new Date().toISOString().slice(0, 10),
          };
          await saveInstanceData(newInstance);
        } else {
          throw formError;
        }
      } catch (err) {
        console.error("Initialization error:", err);
        toast.error("Failed to load form data");
      } finally {
        setIsLoading(false);
        setIsGeneratingNumber(false);
      }
    };

    init();
  }, [formModuleId, saveInstanceData]);

  // Check for user form ID conflicts
  const handleUserFormIdChange = async (value: string) => {
    const updatedInstance = { ...instance, user_form_id: value };

    // Save the change
    await debouncedSave(updatedInstance);

    // Check if ID is taken if there's a value
    if (value) {
      const isTaken = await isUserFormIdTaken(value, formModuleId);
      if (isTaken) {
        toast("Another form already uses this ID. You can still save it.", {
          icon: "⚠️",
          duration: 4000,
        });
      }
    }
  };

  if (isLoading) {
    return <div>Loading form instance data...</div>;
  }

  return (
    <section className={`module-wrapper layout-${layoutStyle}`}>
      <h2>Form Instance</h2>
      <div className="header-fields">
        <div className="field-group">
          <label>
            System Form Number:
            <input
              type="text"
              value={
                isGeneratingNumber
                  ? "Generating..."
                  : instance.form_number ?? ""
              }
              readOnly
              className="readonly"
              disabled={isGeneratingNumber || isSaving}
            />
          </label>
        </div>

        <div className="field-group">
          <label>
            Your Stock/Form Number:
            <input
              type="text"
              value={instance.user_form_id || ""}
              onChange={(e) => handleUserFormIdChange(e.target.value)}
              placeholder="Optional reference number"
              disabled={isGeneratingNumber || isSaving}
            />
          </label>
        </div>

        <div className="field-group">
          <label>
            Form Name:
            <input
              type="text"
              value={String(instance.title ?? "")}
              onChange={(e) =>
                debouncedSave({ ...instance, title: e.target.value })
              }
              required
              disabled={isGeneratingNumber || isSaving}
            />
          </label>
        </div>

        <div className="field-group">
          <label>
            Form Date:
            <input
              type="date"
              value={instance.form_date || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (isValidISODate(val)) {
                  debouncedSave({ ...instance, form_date: val });
                } else {
                  toast.error("Invalid date format");
                }
              }}
              required
              disabled={isGeneratingNumber || isSaving}
            />
          </label>
        </div>
        {isSaving && <div className="saving-indicator">Saving changes...</div>}
      </div>
    </section>
  );
};

export default FormInstanceModule;
