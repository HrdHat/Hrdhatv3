import { createForm, FlraForm, SupabaseError as FormError } from "./createForm";
import {
  createFormModule,
  FormModule,
  SupabaseError as ModuleError,
} from "./createFormModule";
import { createFormModuleField } from "./createFormModuleField";
import { fetchModuleFields, FetchModuleFieldsError } from "./fetchModuleFields";

export interface CreateFormWithModulesInput {
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
    company_id: companyId,
    project_id: projectId,
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

    // Fetch and create fields for this module
    const { fields, error: fieldsError } = await fetchModuleFields(moduleId);
    if (fieldsError) {
      if (import.meta.env.DEV) {
        console.error(
          `[createFormWithModules] Error fetching fields for module ${moduleId}:`,
          fieldsError
        );
      }
      warnings.push({
        moduleId,
        message: fieldsError.message,
        code: "MODULE_FIELDS_FETCH_ERROR",
      });
      continue;
    }

    // Validate field count for critical modules
    const criticalModules = ["general_info", "hazards", "controls"];
    if (
      criticalModules.includes(moduleId) &&
      (!fields || fields.length === 0)
    ) {
      warnings.push({
        moduleId,
        message: `Critical module ${moduleId} has no fields defined`,
        code: "MODULE_FIELDS_FETCH_ERROR",
      });
      if (import.meta.env.DEV) {
        console.warn(
          `[createFormWithModules] Critical module ${moduleId} has no fields`
        );
      }
    }

    // Create each field
    for (const field of fields) {
      // Type guard for defaultValue based on field type
      const defaultValue =
        field.default_value !== undefined
          ? getTypedDefaultValue(field.default_value, field.type)
          : undefined;

      const { error: fieldError } = await createFormModuleField({
        formId: form.id,
        formModuleId: formModule.id,
        moduleFieldId: field.id,
        name: field.name,
        label: field.label,
        type: field.type,
        fieldOrder: field.field_order,
        required: field.required,
        defaultValue: defaultValue?.toString(),
        version: field.version,
      });

      if (fieldError) {
        if (import.meta.env.DEV) {
          console.error(
            `[createFormWithModules] Error creating field ${field.name} for module ${moduleId}:`,
            fieldError
          );
        }
        warnings.push({
          moduleId,
          fieldName: field.name,
          message: fieldError.message,
          code: "FIELD_CREATION_ERROR",
        });
        continue;
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
