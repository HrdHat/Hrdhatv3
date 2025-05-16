// @cursor-ai
// Custom-rendered header module. Fields are hardcoded.
// Do not auto-insert or bind dynamic field logic here.
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../db/supabaseClient";
import { FlraHeader } from "../../types/formTypes";
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

interface FlraHeaderModuleProps {
  formId: string;
  formModuleId: string;
  onHeaderChange?: (header: FlraHeader) => void;
}

const FlraHeaderModule: React.FC<FlraHeaderModuleProps> = ({
  formId,
  formModuleId,
  onHeaderChange,
}) => {
  const [header, setHeader] = useState<FlraHeader>({
    form_number: "", // Will be set during initialization
    user_form_id: null,
    form_name: null,
    form_date: new Date().toISOString().slice(0, 10), // Default to today
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Save header data with useCallback to prevent debounce issues
  const saveHeaderData = useCallback(
    async (updatedHeader: FlraHeader) => {
      setIsSaving(true);
      try {
        // Optimistic update
        setHeader(updatedHeader);

        const { error } = await supabase.from("flra_header").upsert({
          form_module_id: formModuleId,
          form_number: updatedHeader.form_number,
          user_form_id: updatedHeader.user_form_id,
          form_name: updatedHeader.form_name,
          form_date: updatedHeader.form_date,
        });

        if (error) throw error;

        onHeaderChange?.(updatedHeader);
        toast.success("Changes saved");
      } catch (err) {
        console.error("Error saving header data:", err);
        toast.error("Failed to save header data");
        // Revert optimistic update
        setHeader(header);
      } finally {
        setIsSaving(false);
      }
    },
    [formModuleId, onHeaderChange, header]
  );

  // Initialize debounced save with memoized callback
  const debouncedSave = useDebouncedSave(saveHeaderData);

  // Combined initialization effect
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("flra_header")
          .select("*")
          .eq("form_module_id", formModuleId)
          .single();

        if (data) {
          setHeader({
            form_number: data.form_number,
            user_form_id: data.user_form_id,
            form_name: data.form_name,
            form_date: data.form_date,
          });
        } else if (error?.code === "PGRST116") {
          setIsGeneratingNumber(true);
          const formNumber = await generateFormNumber();
          const newHeader = {
            form_number: formNumber,
            user_form_id: null,
            form_name: null,
            form_date: new Date().toISOString().slice(0, 10),
          };
          await saveHeaderData(newHeader);
        } else {
          throw error;
        }
      } catch (err) {
        console.error("Error initializing header:", err);
        toast.error("Failed to initialize form header");
      } finally {
        setIsLoading(false);
        setIsGeneratingNumber(false);
      }
    };

    init();
  }, [formModuleId, saveHeaderData]);

  // Check for user form ID conflicts
  const handleUserFormIdChange = async (value: string) => {
    const updatedHeader = { ...header, user_form_id: value };

    // Save the change
    await debouncedSave(updatedHeader);

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
    return <div>Loading header data...</div>;
  }

  return (
    <section className="flra-header-module">
      <h2>FLRA Header</h2>
      <div className="header-fields">
        <div className="field-group">
          <label>
            System FLRA Number:
            <input
              type="text"
              value={isGeneratingNumber ? "Generating..." : header.form_number}
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
              value={header.user_form_id || ""}
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
              value={header.form_name || ""}
              onChange={(e) =>
                debouncedSave({ ...header, form_name: e.target.value })
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
              value={header.form_date || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (isValidISODate(val)) {
                  debouncedSave({ ...header, form_date: val });
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

export default FlraHeaderModule;
