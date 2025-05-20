import { supabase } from "../../db/supabaseClient";
import {
  FormInstance,
  GeneralInformation,
  PreJobTaskChecklist,
  TaskHazardControl,
  FormAssetPhoto,
  Signature,
  PpeEquipmentChecklist,
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

interface SaveFormModuleDataParams {
  formId: string;
  moduleKey: ModuleKey;
  data: ModuleData;
  moduleId?: string;
}

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
}: SaveFormModuleDataParams): Promise<{ success: boolean; error?: string }> {
  const table = tableMap[moduleKey] || TABLES.formDataEntries;
  let payload: any;

  // Handle generic module fallback
  if (!tableMap[moduleKey]) {
    if (!moduleId) {
      return { success: false, error: "moduleId required for generic module" };
    }
    payload = {
      [FORM_DATA_ENTRIES.formId]: formId,
      [FORM_DATA_ENTRIES.moduleId]: moduleId,
      [FORM_DATA_ENTRIES.data]: data,
    };
    const { error } = await supabase.from(table).upsert(payload);
    if (import.meta.env.DEV) {
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
    const { error } = await supabase
      .from(table)
      .upsert(
        data.map((row) => ({ ...row, [FORM_DATA_ENTRIES.formId]: formId }))
      );
    if (import.meta.env.DEV) {
      console.debug(`[saveFormModuleData] Bulk upsert to ${table}`, {
        formId,
        moduleKey,
        data,
      });
    }
    return { success: !error, error: error?.message };
  }

  // Handle single object upsert
  const { error } = await supabase
    .from(table)
    .upsert({ ...data, [FORM_DATA_ENTRIES.formId]: formId });
  if (import.meta.env.DEV) {
    console.debug(`[saveFormModuleData] Single upsert to ${table}`, {
      formId,
      moduleKey,
      data,
    });
  }
  return { success: !error, error: error?.message };
}
