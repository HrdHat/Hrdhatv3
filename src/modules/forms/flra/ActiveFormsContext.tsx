import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "../../../db/supabaseClient";

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

export interface ActiveFormsContextValue {
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

const ActiveFormsContext = createContext<ActiveFormsContextValue | undefined>(undefined);

export const ActiveFormsProvider = ({ children }: { children: ReactNode }) => {
  const [forms, setForms] = useState<ActiveForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError("Not authenticated");
        setForms([]);
        return;
      }
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
        setError(functionError.message || "Failed to fetch forms");
        return;
      }
      if (!data.success) {
        setError(data.error || "Failed to fetch forms");
        return;
      }
      setForms(data.forms || []);
    } catch (err) {
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
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          return { success: false, error: "Not authenticated" };
        }
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
        await fetchForms();
        return { success: true, form: data.form };
      } catch (err) {
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
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          return { success: false, error: "Not authenticated" };
        }
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
        await fetchForms();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error occurred",
        };
      }
    },
    [fetchForms]
  );

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  return (
    <ActiveFormsContext.Provider
      value={{ forms, isLoading, error, refresh, createForm, deleteForm }}
    >
      {children}
    </ActiveFormsContext.Provider>
  );
};

export function useActiveFormsContext() {
  const ctx = useContext(ActiveFormsContext);
  if (!ctx) throw new Error("useActiveFormsContext must be used within ActiveFormsProvider");
  return ctx;
} 