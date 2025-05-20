import { createForm, FlraForm, SupabaseError as FormError } from "./createForm";
import {
  createFormModule,
  FormModule,
  SupabaseError as ModuleError,
} from "./createFormModule";
import { createFormModuleField } from "./createFormModuleField";
import { fetchModuleFields, FetchModuleFieldsError } from "./fetchModuleFields";
import { cloneFieldsFromModule } from "./cloneFieldsFromModule";
import { supabase } from "../../db/supabaseClient";
import { FORM_INSTANCE_FIELDS } from "../../constants/database";

export interface CreateFormWithModulesInput {
  userId: string;
  companyId?: string;
  projectId?: string;
  title: string;
  description?: string;
  moduleIds: string[];
}

export interface FormCreationWarning {
  moduleId: string;
  fieldName?: string;
  message: string;
  code: "FIELD_CREATION_ERROR" | "MODULE_FIELDS_FETCH_ERROR";
}

export interface CreateFormWithModulesResult {
  form: FlraForm | null;
  modules: FormModule[];
  error: string | null;
  warnings: FormCreationWarning[];
}

export async function createFormWithModules({
  userId,
  companyId,
  projectId,
  title,
  description,
  moduleIds,
}: CreateFormWithModulesInput): Promise<CreateFormWithModulesResult> {
  const warnings: FormCreationWarning[] = [];

  // Fallback for title
  const safeTitle = title && title.trim() !== "" ? title : "New Form";

  // Required input check for moduleIds
  if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
    return {
      form: null,
      modules: [],
      error: "Missing input: moduleIds must be a non-empty array",
      warnings: [],
    };
  }

  // 1. Create the form
  const { form, error: formError } = await createForm({
    userId,
    companyId,
    projectId,
    title: safeTitle,
    description,
  });
  if (formError || !form) {
    return {
      form: null,
      modules: [],
      error: formError?.message || "Failed to create form",
      warnings: [],
    };
  }

  if (import.meta.env.DEV) {
    console.log(`[createFormWithModules] Successfully created form:`, form);
  }

  // 2. Create all modules in order
  const modules: FormModule[] = [];
  for (let i = 0; i < moduleIds.length; i++) {
    const moduleId = moduleIds[i];

    // Create the module
    const { formModule, error: moduleError } = await createFormModule({
      formId: form.id,
      moduleId,
      moduleOrder: i + 1,
    });

    if (moduleError || !formModule) {
      return {
        form,
        modules,
        error: `Failed to add module ${moduleId}: ${
          moduleError?.message || "Unknown error"
        }`,
        warnings,
      };
    }
    modules.push(formModule);

    // Fetch module metadata to check uses_fields and renderer_key
    const { data: moduleMeta, error: moduleMetaError } = await supabase
      .from("template_modules")
      .select("id, name, label, renderer_key, uses_fields")
      .eq("id", moduleId)
      .single();

    if (moduleMetaError) {
      warnings.push({
        moduleId,
        message: `Failed to fetch module metadata: ${moduleMetaError.message}`,
        code: "MODULE_FIELDS_FETCH_ERROR",
      });
      continue; // skip to next module
    }

    const usesFields = moduleMeta?.uses_fields ?? true;
    const rendererKey = moduleMeta?.renderer_key;

    if (usesFields) {
      try {
        const count = await cloneFieldsFromModule({
          moduleId,
          formId: form.id,
          formModuleId: formModule.id,
        });
        if (import.meta.env.DEV) {
          console.info(
            `[formModule] ${count ?? "unknown"} fields cloned into ${
              formModule.id
            }`
          );
        }
      } catch (err: any) {
        warnings.push({
          moduleId,
          message: err.message || "Failed to clone fields",
          code: "FIELD_CREATION_ERROR",
        });
      }
    } else {
      // Non-field modules are handled by their specialized renderers
      if (import.meta.env.DEV) {
        console.info(
          `[formModule] Using specialized renderer for module ${moduleId}`
        );
      }
    }
  }

  return {
    form,
    modules,
    error: null,
    warnings,
  };
}

// Helper function to ensure type-safe default values
function getTypedDefaultValue(
  value: string,
  type: string
): string | boolean | number | null {
  try {
    switch (type) {
      case "boolean":
        return value.toLowerCase() === "true";
      case "number":
        return Number(value);
      case "text":
      case "select":
      case "multiselect":
      case "date":
        return value;
      default:
        return null;
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(
        `[getTypedDefaultValue] Failed to parse default value for type ${type}:`,
        err
      );
    }
    return null;
  }
}
