import { supabase } from '../../db/supabaseClient';
import {
  FlraHeader,
  GeneralInformation,
  PreJobTaskChecklist,
  TaskHazardControl,
  FlraPhoto,
  Signature,
  PpeEquipmentChecklist,
} from '../../types/formTypes';

const tableMap: Record<string, string> = {
  header: 'flra_header',
  general: 'general_information',
  preJobChecklist: 'pre_job_task_checklist',
  ppeChecklist: 'ppe_platform_inspection',
  taskHazards: 'task_hazard_control',
  photos: 'flra_photos',
  signatures: 'signatures',
};

// Supported module keys for typed tables
export type ModuleKey =
  | 'header'
  | 'general'
  | 'preJobChecklist'
  | 'ppeChecklist'
  | 'taskHazards'
  | 'photos'
  | 'signatures';

// Data type mapping for each module
export type ModuleData =
  | FlraHeader
  | GeneralInformation
  | PreJobTaskChecklist
  | PpeEquipmentChecklist
  | TaskHazardControl[]
  | FlraPhoto[]
  | Signature[]
  | Record<string, any>; // fallback for generic

interface SaveFormModuleDataParams {
  formId: string;
  moduleKey: ModuleKey | string;
  data: ModuleData;
  moduleId?: string; // required for generic modules
}

export async function saveFormModuleData({
  formId,
  moduleKey,
  data,
  moduleId,
}: SaveFormModuleDataParams): Promise<{ success: boolean; error?: string }> {
  const table = tableMap[moduleKey] || 'form_data_generic';
  let payload: any;

  // Handle generic module fallback
  if (!tableMap[moduleKey]) {
    if (!moduleId) {
      return { success: false, error: 'moduleId required for generic module' };
    }
    payload = {
      form_id: formId,
      module_id: moduleId,
      data,
    };
    const { error } = await supabase.from(table).upsert(payload);
    if (import.meta.env.DEV) {
      console.debug(`[saveFormModuleData] Saved to ${table}`, { formId, moduleKey, payload });
    }
    return { success: !error, error: error?.message };
  }

  // Handle array (bulk) upserts
  if (Array.isArray(data)) {
    const { error } = await supabase.from(table).upsert(
      data.map(row => ({ ...row, form_id: formId }))
    );
    if (import.meta.env.DEV) {
      console.debug(`[saveFormModuleData] Bulk upsert to ${table}`, { formId, moduleKey, data });
    }
    return { success: !error, error: error?.message };
  }

  // Handle single-object upserts
  payload = { ...data, form_id: formId };
  const { error } = await supabase.from(table).upsert(payload);
  if (import.meta.env.DEV) {
    console.debug(`[saveFormModuleData] Saved to ${table}`, { formId, moduleKey, payload });
  }
  return { success: !error, error: error?.message };
} 