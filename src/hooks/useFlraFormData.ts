import { useEffect, useState, useRef } from "react";
import { supabase } from "../db/supabaseClient";
import { FlraFormState } from "../types/formTypes";

export function useFlraFormData(formId: string | null) {
  const [formState, setFormState] = useState<FlraFormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const isFirstLoad = useRef(true);

  // Fetch form data when formId changes
  useEffect(() => {
    if (!formId) {
      setFormState(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    supabase
      .from("forms")
      .select("*")
      .eq("id", formId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setFormState(null);
          setError("Could not load form data.");
        } else {
          setFormState(data as FlraFormState);
          setError(null);
        }
        setLoading(false);
        isFirstLoad.current = false;
      });
  }, [formId]);

  // Auto-save on formState change (but not on first load)
  useEffect(() => {
    if (!formId || !formState || isFirstLoad.current) return;
    setSaveStatus("saving");
    supabase
      .from("forms")
      .update(formState)
      .eq("id", formId)
      .then(({ error }) => {
        if (error) {
          setSaveStatus("error");
        } else {
          setSaveStatus("saved");
        }
      });
  }, [formState, formId]);

  return { formState, setFormState, loading, error, saveStatus };
} 