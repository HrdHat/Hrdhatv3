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
  module_id: string;
  module_order: number;
  is_required: boolean;
  completion_state: string;
  template_modules: {
    name: string;
    label: string;
    renderer_key: string;
    uses_fields: boolean;
    version: number;
  };
  fields: FormField[];
}

interface FormData {
  id: string;
  title: string;
  description: string;
  version: number;
  modules: FormModule[];
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

        // Fetch form details (include version)
        const { data: form, error: formError } = await supabase
          .from("form_instances")
          .select("id, title, description, version")
          .eq("id", formId)
          .single();

        if (formError) throw formError;

        // Fetch modules with template_modules join (include version)
        const { data: modules, error: modulesError } = await supabase
          .from("form_instance_modules")
          .select(`*, template_modules (name, label, renderer_key, uses_fields, version)`)
          .eq("form_id", formId)
          .order("module_order");

        if (modulesError) throw modulesError;

        // Fetch fields for each module
        const modulesWithFields = await Promise.all(
          (modules as any[]).map(async (module) => {
            const { data: fields, error: fieldsError } = await supabase
              .from("form_instance_module_fields")
              .select("*")
              .eq("form_module_id", module.id)
              .order("field_order");

            if (fieldsError) throw fieldsError;

            // Always include modules, even if fields is empty
            return {
              ...module,
              fields: fields || [],
            };
          })
        );

        // Debug: log all loaded modules and their renderer_key, name, and version
        console.log(
          "Loaded modules:",
          modulesWithFields.map((m) => ({
            id: m.id,
            name: m.template_modules?.name,
            renderer: m.template_modules?.renderer_key,
            version: m.template_modules?.version,
            fields: m.fields?.length ?? 0,
          }))
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
