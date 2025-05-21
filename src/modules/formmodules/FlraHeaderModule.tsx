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
import toast from "react-hot-toast";

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

const FormInstanceModule: React.FC<FormInstanceModuleProps> = ({
  formId,
  formModuleId,
  onHeaderChange,
  layoutStyle = "default",
}) => {
  const [instance, setInstance] = useState<FormInstance>({
    form_number: "", // Will be set during initialization
    user_form_id: "", // Changed from null
    form_name: "", // Changed from null
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
        // Don't update state optimistically - wait for successful save
        const { error } = await supabase.from("form_instances").upsert({
          id: formId, // Add form ID to ensure we update the correct row
          form_number: updatedInstance.form_number,
          user_form_id: updatedInstance.user_form_id,
          form_name: updatedInstance.form_name,
          form_date: updatedInstance.form_date,
        });

        if (error) throw error;

        // Only update state after successful save
        setInstance(updatedInstance);
        onHeaderChange?.(updatedInstance);
        toast.success("Changes saved");
      } catch (err) {
        console.error("Error saving form instance data:", err);
        toast.error("Failed to save form instance data");
        // Don't revert state on error - let user retry
      } finally {
        setIsSaving(false);
      }
    },
    [onHeaderChange, formId] // Add formId to dependencies
  );

  // Initialize debounced save with memoized callback
  const debouncedSave = useDebouncedSave(saveInstanceData);

  // Combined initialization effect
  useEffect(() => {
    const init = async () => {
      if (!formId) return; // Early return if no formId

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("form_instances")
          .select("*")
          .eq("id", formId)
          .single();

        if (data) {
          setInstance({
            form_number: data.form_number ?? "",
            user_form_id: data.user_form_id ?? "",
            form_name: data.form_name ?? "",
            form_date: data.form_date ?? "",
          });
        } else if (error?.code === "PGRST116") {
          setIsGeneratingNumber(true);
          const formNumber = await generateFormNumber();
          const newInstance = {
            form_number: formNumber,
            user_form_id: "",
            form_name: "",
            form_date: new Date().toISOString().slice(0, 10),
          };
          await saveInstanceData(newInstance);
        } else {
          throw error;
        }
      } catch (err) {
        console.error("Error initializing form instance:", err);
        toast.error("Failed to initialize form instance");
      } finally {
        setIsLoading(false);
        setIsGeneratingNumber(false);
      }
    };

    init();
  }, [formId, saveInstanceData]); // Only depend on stable values

  // Check for user form ID conflicts
  const handleUserFormIdChange = async (value: string) => {
    const trimmedValue = value.trim();
    // Check if ID is taken before saving
    if (trimmedValue) {
      const isTaken = await isUserFormIdTaken(trimmedValue, formModuleId);
      if (isTaken) {
        toast("Another form already uses this ID. You can still save it.", {
          icon: "⚠️",
          duration: 4000,
        });
      }
    }

    // Save the change after checking
    const updatedInstance = { ...instance, user_form_id: trimmedValue };
    await debouncedSave(updatedInstance);
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
              value={instance.user_form_id ?? ""}
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
              value={instance.form_name ?? ""}
              onChange={(e) =>
                debouncedSave({ ...instance, form_name: e.target.value.trim() })
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
              value={instance.form_date ?? ""}
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
