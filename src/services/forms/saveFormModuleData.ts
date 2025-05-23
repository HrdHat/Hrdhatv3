import { supabase } from "../../db/supabaseClient";
import {
  FormInstance,
  GeneralInformation,
  PreJobTaskChecklist,
  TaskHazardControl,
  FormAssetPhoto,
  Signature,
  PpeEquipmentChecklist,
  SaveFormModuleDataParams,
} from "../../types/formTypes";
import { TABLES, FORM_DATA_ENTRIES } from "../../constants/database";
import {
  schemaMap,
  saveFormModuleDataParamsSchema,
} from "../../types/formValidationSchemas";
import { z } from "zod";
import { formatZodErrors, ValidationError } from "../../utils/validation";

// Supported module keys for typed tables
export type ModuleKey =
  | "header"
  | "general"
  | "preJobChecklist"
  | "ppeChecklist"
  | "taskHazards"
  | "photos"
  | "signatures";

// Data type mapping for each module
export type ModuleData =
  | FormInstance
  | GeneralInformation
  | PreJobTaskChecklist
  | PpeEquipmentChecklist
  | TaskHazardControl[]
  | FormAssetPhoto[]
  | Signature[];

// Map module keys to their corresponding tables
const tableMap: Record<ModuleKey, string> = {
  header: TABLES.formInstances,
  general: TABLES.formInstanceGeneralInfo,
  preJobChecklist: TABLES.formInstancePreJobChecklist,
  ppeChecklist: TABLES.formInstancePpePlatform,
  taskHazards: TABLES.formInstanceHazards,
  photos: TABLES.formAssetPhotos,
  signatures: TABLES.formInstanceSignatures,
};

export interface SaveFormModuleDataResult {
  success: boolean;
  error?: string;
  validationErrors?: ValidationError[];
}

export async function saveFormModuleData({
  formId,
  moduleKey,
  data,
  moduleId,
  version,
  updated_at,
}: SaveFormModuleDataParams): Promise<SaveFormModuleDataResult> {
  // First validate the save parameters
  const paramsResult = saveFormModuleDataParamsSchema.safeParse({
    formId,
    moduleKey,
    data,
    moduleId,
    version,
    updated_at,
  });

  if (!paramsResult.success) {
    return {
      success: false,
      error: "Invalid save parameters",
      validationErrors: formatZodErrors(paramsResult.error),
    };
  }

  // Then validate the module data against its specific schema
  const schema = schemaMap[moduleKey];
  if (!schema) {
    return {
      success: false,
      error: `No validation schema found for module key: ${moduleKey}`,
    };
  }

  const dataResult = schema.safeParse(data);
  if (!dataResult.success) {
    return {
      success: false,
      error: "Invalid module data",
      validationErrors: formatZodErrors(dataResult.error),
    };
  }

  const table = tableMap[moduleKey];
  if (!table) {
    return {
      success: false,
      error: `Invalid module key: ${moduleKey}. No table mapping found.`,
    };
  }

  let payload: Record<string, any>;
  const now = new Date().toISOString();

  // Handle array (bulk) upserts
  if (Array.isArray(data)) {
    const { error } = await supabase.from(table).upsert(
      data.map((row) => ({
        ...row,
        [FORM_DATA_ENTRIES.formId]: formId,
        created_at: now,
        updated_at: now,
      })),
      { onConflict: "id" } // Array modules use id as primary key
    );
    if (import.meta.env.DEV) {
      if (error) {
        console.error(
          `[saveFormModuleData] Error in bulk upsert to ${table}:`,
          error.message
        );
      }
      console.debug(`[saveFormModuleData] Bulk upsert to ${table}`, {
        formId,
        moduleKey,
        data,
      });
    }
    return { success: !error, error: error?.message };
  }

  // Handle single object upsert
  const { error } = await supabase.from(table).upsert(
    {
      ...data,
      [FORM_DATA_ENTRIES.formId]: formId,
      created_at: now,
      updated_at: now,
    },
    { onConflict: "form_module_id" } // Single-row modules use form_module_id
  );
  if (import.meta.env.DEV) {
    if (error) {
      console.error(
        `[saveFormModuleData] Error in single upsert to ${table}:`,
        error.message
      );
    }
    console.debug(`[saveFormModuleData] Single upsert to ${table}`, {
      formId,
      moduleKey,
      data,
    });
  }
  return { success: !error, error: error?.message };
}
