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
        // Optimistic update
        setInstance(updatedInstance);

        console.log("Supabase Query:", {
          table: TABLES.formInstances,
          operation: "upsert",
          data: {
            form_module_id: formModuleId,
            form_number: updatedInstance.form_number,
            user_form_id: updatedInstance.user_form_id,
            title: updatedInstance.title,
            form_date: updatedInstance.form_date,
          },
          fullQuery: {
            from: TABLES.formInstances,
            upsert: {
              form_module_id: formModuleId,
              form_number: updatedInstance.form_number,
              user_form_id: updatedInstance.user_form_id,
              title: updatedInstance.title,
              form_date: updatedInstance.form_date,
            },
          },
        });

        const { error } = await supabase.from(TABLES.formInstances).upsert({
          form_module_id: formModuleId,
          form_number: updatedInstance.form_number,
          user_form_id: updatedInstance.user_form_id,
          title: updatedInstance.title,
          form_date: updatedInstance.form_date,
        });

        if (error) throw error;

        onHeaderChange?.(updatedInstance);
        toast.success("Changes saved");
      } catch (err) {
        console.error("Error saving form instance data:", err);
        toast.error("Failed to save form instance data");
        // Revert optimistic update
        setInstance(instance);
      } finally {
        setIsSaving(false);
      }
    },
    [formModuleId, onHeaderChange, instance]
  );

  // Initialize debounced save with memoized callback
  const debouncedSave = useDebouncedSave(saveInstanceData);

  // Combined initialization effect
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        console.log("Supabase Query:", {
          table: TABLES.formInstances,
          operation: "select",
          filters: { form_module_id: formModuleId },
          fullQuery: {
            from: TABLES.formInstances,
            select: "*",
            eq: { form_module_id: formModuleId },
            single: true,
          },
        });

        const { data, error } = await supabase
          .from(TABLES.formInstances)
          .select("*")
          .eq("form_module_id", formModuleId)
          .single();

        if (data) {
          setInstance({
            form_number: data.form_number,
            user_form_id: data.user_form_id,
            title: data.title,
            form_date: data.form_date,
          });
        } else if (error?.code === "PGRST116") {
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
