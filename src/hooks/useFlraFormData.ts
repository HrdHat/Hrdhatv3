import { useState, useEffect } from "react";
import { supabase } from "../db/supabaseClient";
import {
  TABLES,
  FORM_INSTANCE_FIELDS,
  FORM_INSTANCE_MODULES,
  FORM_INSTANCE_MODULE_FIELDS,
  TEMPLATE_MODULES,
} from "../constants/database";

interface FormField {
  id: string;
  [FORM_INSTANCE_MODULE_FIELDS.formModuleId]: string;
  [FORM_INSTANCE_MODULE_FIELDS.label]: string;
  [FORM_INSTANCE_MODULE_FIELDS.type]: string;
  [FORM_INSTANCE_MODULE_FIELDS.required]: boolean;
  value?: any;
}

interface FormModule {
  id: string;
  [FORM_INSTANCE_MODULES.formId]: string;
  [FORM_INSTANCE_MODULES.moduleId]: string;
  [FORM_INSTANCE_MODULES.moduleOrder]: number;
  [FORM_INSTANCE_MODULES.isRequired]: boolean;
  [FORM_INSTANCE_MODULES.completionState]: string;
  template_modules: {
    [TEMPLATE_MODULES.name]: string;
    [TEMPLATE_MODULES.label]: string;
    [TEMPLATE_MODULES.rendererKey]: string;
    [TEMPLATE_MODULES.usesFields]: boolean;
    [TEMPLATE_MODULES.version]: number;
  };
  fields: FormField[];
}

interface FormData {
  id: string;
  [FORM_INSTANCE_FIELDS.title]: string;
  [FORM_INSTANCE_FIELDS.description]: string;
  [FORM_INSTANCE_FIELDS.version]: number;
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
          .from(TABLES.formInstances)
          .select(
            `${FORM_INSTANCE_FIELDS.id}, ${FORM_INSTANCE_FIELDS.title}, ${FORM_INSTANCE_FIELDS.description}, ${FORM_INSTANCE_FIELDS.version}`
          )
          .eq(FORM_INSTANCE_FIELDS.id, formId)
          .single();

        if (formError) throw formError;

        // Fetch modules with template_modules join (include version)
        const { data: modules, error: modulesError } = await supabase
          .from(TABLES.formInstanceModules)
          .select(
            `*, template_modules (${TEMPLATE_MODULES.name}, ${TEMPLATE_MODULES.label}, ${TEMPLATE_MODULES.rendererKey}, ${TEMPLATE_MODULES.usesFields}, ${TEMPLATE_MODULES.version})`
          )
          .eq(FORM_INSTANCE_MODULES.formId, formId)
          .order(FORM_INSTANCE_MODULES.moduleOrder);

        if (modulesError) throw modulesError;

        // Fetch fields for each module
        const modulesWithFields = await Promise.all(
          (modules as any[]).map(async (module) => {
            const { data: fields, error: fieldsError } = await supabase
              .from(TABLES.formInstanceModuleFields)
              .select("*")
              .eq(FORM_INSTANCE_MODULE_FIELDS.formModuleId, module.id)
              .order(FORM_INSTANCE_MODULE_FIELDS.fieldOrder);

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
            name: m.template_modules?.[TEMPLATE_MODULES.name],
            renderer: m.template_modules?.[TEMPLATE_MODULES.rendererKey],
            version: m.template_modules?.[TEMPLATE_MODULES.version],
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
