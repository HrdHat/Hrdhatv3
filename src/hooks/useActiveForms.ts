import { useState, useEffect, useCallback } from "react";
import { supabase } from "../db/supabaseClient";

export interface ActiveForm {
  id: string;
  form_number: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  form_date?: string;
}

export interface UseActiveFormsResult {
  forms: ActiveForm[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createForm: (
    title: string,
    description?: string
  ) => Promise<{ success: boolean; form?: ActiveForm; error?: string }>;
  deleteForm: (formId: string) => Promise<{ success: boolean; error?: string }>;
}

export function useActiveForms(): UseActiveFormsResult {
  const [forms, setForms] = useState<ActiveForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError("Not authenticated");
        setForms([]);
        return;
      }

      // Call the listActiveForms Edge Function
      const { data, error: functionError } = await supabase.functions.invoke(
        "listActiveForms",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (functionError) {
        console.error("Error calling listActiveForms:", functionError);
        setError(functionError.message || "Failed to fetch forms");
        return;
      }

      if (!data.success) {
        setError(data.error || "Failed to fetch forms");
        return;
      }

      setForms(data.forms || []);
    } catch (err) {
      console.error("Error in fetchForms:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchForms();
  }, [fetchForms]);

  const createForm = useCallback(
    async (title: string, description?: string) => {
      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          return { success: false, error: "Not authenticated" };
        }

        // Call the formInstanceCRUD Edge Function (POST)
        const { data, error: functionError } = await supabase.functions.invoke(
          "formInstanceCRUD",
          {
            body: { title, description },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (functionError) {
          console.error(
            "Error calling formInstanceCRUD (create):",
            functionError
          );
          return {
            success: false,
            error: functionError.message || "Failed to create form",
          };
        }

        if (!data.success) {
          return {
            success: false,
            error: data.error || "Failed to create form",
          };
        }

        // Refresh the forms list
        await fetchForms();

        return { success: true, form: data.form };
      } catch (err) {
        console.error("Error in createForm:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error occurred",
        };
      }
    },
    [fetchForms]
  );

  const deleteForm = useCallback(
    async (formId: string) => {
      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          return { success: false, error: "Not authenticated" };
        }

        // Call the formInstanceCRUD Edge Function (DELETE)
        const { data, error: functionError } = await supabase.functions.invoke(
          "formInstanceCRUD",
          {
            method: "DELETE",
            body: { formId },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (functionError) {
          console.error(
            "Error calling formInstanceCRUD (delete):",
            functionError
          );
          return {
            success: false,
            error: functionError.message || "Failed to delete form",
          };
        }

        if (!data.success) {
          return {
            success: false,
            error: data.error || "Failed to delete form",
          };
        }

        // Refresh the forms list
        await fetchForms();

        return { success: true };
      } catch (err) {
        console.error("Error in deleteForm:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error occurred",
        };
      }
    },
    [fetchForms]
  );

  // Fetch forms on mount
  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  return {
    forms,
    isLoading,
    error,
    refresh,
    createForm,
    deleteForm,
  };
}
