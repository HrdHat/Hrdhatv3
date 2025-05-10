import { useState, useEffect } from "react";
import { supabase } from "../db/supabaseClient";

interface FormField {
  id: string;
  form_module_id: string;
  label: string;
  type: string;
  required: boolean;
  value?: any;
}

interface FormModule {
  id: string;
  form_id: string;
  label: string;
  module_order: number;
}

interface FormData {
  id: string;
  title: string;
  description: string;
  modules: Array<FormModule & { fields: FormField[] }>;
}

export const useFlraFormData = (formId: string | null) => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormData = async () => {
      if (!formId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch form details
        const { data: form, error: formError } = await supabase
          .from("forms")
          .select("*")
          .eq("id", formId)
          .single();

        if (formError) throw formError;

        // Fetch modules
        const { data: modules, error: modulesError } = await supabase
          .from("form_modules")
          .select("*")
          .eq("form_id", formId)
          .order("module_order");

        if (modulesError) throw modulesError;

        // Fetch fields for each module
        const modulesWithFields = await Promise.all(
          (modules as FormModule[]).map(async (module) => {
            const { data: fields, error: fieldsError } = await supabase
              .from("form_module_fields")
              .select("*")
              .eq("form_module_id", module.id)
              .order("order");

            if (fieldsError) throw fieldsError;

            return {
              ...module,
              fields: fields || [],
            };
          })
        );

        setFormData({
          ...form,
          modules: modulesWithFields,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [formId]);

  return {
    formData,
    loading,
    error,
  };
};
