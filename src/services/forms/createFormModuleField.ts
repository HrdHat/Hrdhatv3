import { supabase } from "../../db/supabaseClient";
import { TABLES, FORM_INSTANCE_MODULE_FIELDS } from "../../constants/database";
import { formModuleFieldSchema } from "../../types/formValidationSchemas";
import { formatZodErrors, ValidationError } from "../../utils/validation";

// TODO: Move to src/types/forms.ts if not present
export interface CreateFormModuleFieldInput {
  formId: string;
  formModuleId: string;
  moduleFieldId: string;
  name: string;
  label: string;
  type:
    | "text"
    | "boolean"
    | "number"
    | "date"
    | "select"
    | "multiselect"
    | "file"
    | "signature";
  fieldOrder: number;
  required?: boolean;
  defaultValue?: any;
  version?: number;
}

export interface FormModuleField {
  id: string;
  form_id: string;
  form_module_id: string;
  module_field_id?: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  field_order: number;
  default_value?: string;
  version: number;
}

export interface SupabaseError {
  message: string;
  details?: string;
}

export interface FormModuleFieldResult {
  field: any | null;
  error?: {
    message: string;
    details?: string;
  };
  validationErrors?: ValidationError[];
}

const allowedTypes = [
  "text",
  "boolean",
  "number",
  "date",
  "select",
  "multiselect",
  "file",
  "signature",
];

export async function createFormModuleField({
  formId,
  formModuleId,
  moduleFieldId,
  name,
  label,
  type,
  fieldOrder,
  required = false,
  defaultValue,
  version = 1,
}: CreateFormModuleFieldInput): Promise<FormModuleFieldResult> {
  try {
    // Validate input using Zod schema
    const validationResult = formModuleFieldSchema.safeParse({
      formId,
      formModuleId,
      moduleFieldId,
      name,
      label,
      type,
      required,
      fieldOrder,
      defaultValue,
      version,
    });

    if (!validationResult.success) {
      return {
        field: null,
        error: { message: "Invalid field data" },
        validationErrors: formatZodErrors(validationResult.error),
      };
    }

    // Check for uniqueness (form_module_id, name)
    const { data: existing, error: existingError } = await supabase
      .from(TABLES.formInstanceModuleFields)
      .select("id")
      .eq(FORM_INSTANCE_MODULE_FIELDS.formModuleId, formModuleId)
      .eq(FORM_INSTANCE_MODULE_FIELDS.name, name)
      .maybeSingle();

    if (existingError) {
      return {
        field: null,
        error: {
          message: existingError.message,
          details: existingError.details,
        },
      };
    }

    if (existing) {
      return {
        field: null,
        error: { message: "Field name already exists in this module." },
      };
    }

    // Insert new form module field
    const { data, error } = await supabase
      .from(TABLES.formInstanceModuleFields)
      .insert([
        {
          [FORM_INSTANCE_MODULE_FIELDS.formId]: formId,
          [FORM_INSTANCE_MODULE_FIELDS.formModuleId]: formModuleId,
          [FORM_INSTANCE_MODULE_FIELDS.moduleFieldId]: moduleFieldId,
          [FORM_INSTANCE_MODULE_FIELDS.name]: name,
          [FORM_INSTANCE_MODULE_FIELDS.label]: label,
          [FORM_INSTANCE_MODULE_FIELDS.type]: type,
          [FORM_INSTANCE_MODULE_FIELDS.required]: required,
          [FORM_INSTANCE_MODULE_FIELDS.fieldOrder]: fieldOrder,
          [FORM_INSTANCE_MODULE_FIELDS.defaultValue]: defaultValue,
          [FORM_INSTANCE_MODULE_FIELDS.version]: version,
        },
      ])
      .select()
      .single();

    if (error) {
      return {
        field: null,
        error: { message: error.message, details: error.details },
      };
    }

    return { field: data };
  } catch (error: any) {
    console.error("Create form module field error:", error);
    return {
      field: null,
      error: {
        message: "Failed to create form module field",
        details: error.message,
      },
    };
  }
}
