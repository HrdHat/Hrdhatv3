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

export async function saveFormModuleData({
  formId,
  moduleKey,
  data,
  moduleId,
  version,
  updated_at,
}: SaveFormModuleDataParams): Promise<{ success: boolean; error?: string }> {
  const table = tableMap[moduleKey] || TABLES.formDataEntries;
  let payload: Record<string, any>;
  const now = new Date().toISOString();

  // Handle generic module fallback
  if (!tableMap[moduleKey]) {
    if (!moduleId) {
      return { success: false, error: "moduleId required for generic module" };
    }
    payload = {
      [FORM_DATA_ENTRIES.formId]: formId,
      [FORM_DATA_ENTRIES.moduleId]: moduleId,
      [FORM_DATA_ENTRIES.data]: data,
      created_at: now,
      updated_at: now,
    };
    const { error } = await supabase.from(table).upsert(payload, {
      onConflict: `${FORM_DATA_ENTRIES.formId},${FORM_DATA_ENTRIES.moduleId}`,
    });
    if (import.meta.env.DEV) {
      if (error) {
        console.error(
          `[saveFormModuleData] Error in upsert to ${table}:`,
          error.message
        );
      }
      console.debug(`[saveFormModuleData] Saved to ${table}`, {
        formId,
        moduleKey,
        payload,
      });
    }
    return { success: !error, error: error?.message };
  }

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
