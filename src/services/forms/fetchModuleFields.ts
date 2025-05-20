import { supabase } from "../../db/supabaseClient";
import { TABLES, TEMPLATE_MODULE_FIELDS } from "../../constants/database";

export interface ModuleField {
  id: string;
  module_id: string;
  name: string;
  label: string;
  type: string;
  field_order: number;
  required: boolean;
  default_value?: string;
  version: number;
  created_at: string;
}

export interface FetchModuleFieldsError {
  message: string;
  code: "FETCH_ERROR" | "NO_FIELDS" | "UNKNOWN_ERROR";
  details?: unknown;
}

export interface FetchModuleFieldsResult {
  fields: ModuleField[];
  error: FetchModuleFieldsError | null;
}

export async function fetchModuleFields(
  moduleId: string
): Promise<FetchModuleFieldsResult> {
  try {
    if (import.meta.env.DEV) {
      console.log(`[fetchModuleFields] Fetching fields for module ${moduleId}`);
    }

    const { data, error } = await supabase
      .from(TABLES.templateModuleFields)
      .select("*")
      .eq(TEMPLATE_MODULE_FIELDS.moduleId, moduleId)
      .order(TEMPLATE_MODULE_FIELDS.fieldOrder, { ascending: true });

    if (error) {
      if (import.meta.env.DEV) {
        console.error(`[fetchModuleFields] Error fetching fields:`, error);
      }
      return {
        fields: [],
        error: {
          message: error.message,
          code: "FETCH_ERROR",
          details: error,
        },
      };
    }

    if (!data) {
      if (import.meta.env.DEV) {
        console.warn(
          `[fetchModuleFields] No fields found for module ${moduleId}`
        );
      }
      return {
        fields: [],
        error: {
          message: `No fields found for module ${moduleId}`,
          code: "NO_FIELDS",
        },
      };
    }

    if (import.meta.env.DEV) {
      console.log(
        `[fetchModuleFields] Successfully fetched ${data.length} fields for module ${moduleId}`
      );
    }

    return {
      fields: data as ModuleField[],
      error: null,
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`[fetchModuleFields] Exception occurred:`, err);
    }
    return {
      fields: [],
      error: {
        message: err instanceof Error ? err.message : "Unknown error occurred",
        code: "UNKNOWN_ERROR",
        details: err,
      },
    };
  }
}
