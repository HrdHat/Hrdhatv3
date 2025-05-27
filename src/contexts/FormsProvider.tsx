import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { supabase } from "../db/supabaseClient";
import toast from "react-hot-toast";

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

interface FormsContextValue {
  forms: ActiveForm[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createForm: (
    title: string,
    description?: string
  ) => Promise<{ success: boolean; form?: ActiveForm; error?: string }>;
  deleteForm: (formId: string) => Promise<{ success: boolean; error?: string }>;
  currentFormId: string | null;
  setCurrentFormId: (formId: string | null) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

const FormsContext = createContext<FormsContextValue | undefined>(undefined);

export function useFormsContext(): FormsContextValue {
  const context = useContext(FormsContext);
  if (context === undefined) {
    throw new Error("useFormsContext must be used within a FormsProvider");
  }
  return context;
}

interface FormsProviderProps {
  children: React.ReactNode;
}

export function FormsProvider({
  children,
}: FormsProviderProps): React.ReactElement {
  const [forms, setForms] = useState<ActiveForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Use ref to track active requests and prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchForms = useCallback(async () => {
    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsLoading(true);
      setError(null);

      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        if (mountedRef.current) {
          setError("Not authenticated");
          setForms([]);
        }
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

      // Check if request was aborted or component unmounted
      if (signal.aborted || !mountedRef.current) {
        return;
      }

      if (functionError) {
        console.error("Error calling listActiveForms:", functionError);
        setError(functionError.message || "Failed to fetch forms");
        return;
      }

      if (!data.success) {
        setError(data.error || "Failed to fetch forms");
        return;
      }

      // Only update state if the new data is actually different
      const newForms = data.forms || [];
      setForms((prevForms) => {
        // Simple comparison - in production you might want deep comparison
        if (JSON.stringify(prevForms) !== JSON.stringify(newForms)) {
          return newForms;
        }
        return prevForms;
      });
    } catch (err) {
      if (!mountedRef.current) return;

      // Don't show error for aborted requests
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      console.error("Error in fetchForms:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
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

        // Refresh the forms list after successful creation
        await fetchForms();

        // Set the new form as current and clear unsaved changes
        if (data.form?.id) {
          setCurrentFormId(data.form.id);
          setHasUnsavedChanges(false);
        }

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

        // Clear current form if it was the one deleted
        if (currentFormId === formId) {
          setCurrentFormId(null);
          setHasUnsavedChanges(false);
        }

        // Refresh the forms list after successful deletion
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
    [fetchForms, currentFormId]
  );

  // Fetch forms on mount
  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const contextValue: FormsContextValue = {
    forms,
    isLoading,
    error,
    refresh,
    createForm,
    deleteForm,
    currentFormId,
    setCurrentFormId,
    hasUnsavedChanges,
    setHasUnsavedChanges,
  };

  return (
    <FormsContext.Provider value={contextValue}>
      {children}
    </FormsContext.Provider>
  );
}
