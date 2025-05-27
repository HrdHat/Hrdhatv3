import { z } from "zod";

// Shared FLRA form types for use in centralized state management

// Form status constants
export const FORM_STATUSES = ["draft", "submitted", "archived"] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

export type FormInstance = {
  id: string; // uuid, required
  form_number?: string | null; // text, nullable
  user_form_id?: string | null; // text, nullable
  created_by?: string | null; // uuid, nullable
  status?: string | null; // text, nullable
  last_modified?: string | null; // timestamp with time zone, nullable
  created_at?: string; // timestamp with time zone, optional (handled by DB trigger)
  auto_archived?: boolean | null; // boolean, nullable
  data?: Record<string, unknown> | null; // jsonb, nullable
  company_id?: string | null; // uuid, nullable
  project_id?: string | null; // uuid, nullable
  title?: string | null; // text, nullable
  description?: string | null; // text, nullable
  version: number; // integer, required
  submitted_at?: string | null; // timestamp with time zone, nullable
  user_id?: string | null; // uuid, nullable
  form_date?: string | null; // date, nullable, will be converted to date in DB
};

export type GeneralInformation = {
  id: string;
  form_module_id: string; // ✅ REQUIRED, not nullable
  project_name?: string | null;
  project_address?: string | null;
  location?: string | null;
  supervisor_name?: string | null;
  supervisor_contact?: string | null;
  form_date?: string | null;
  crew_members_count?: number | null;
  work_description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  created_at: string;
  updated_at?: string;
};

export type PreJobTaskChecklist = {
  id: string;
  form_module_id: string; // ✅ REQUIRED, not nullable
  is_fit_for_duty?: boolean | null;
  reviewed_work_area_for_hazards?: boolean | null;
  required_ppe_for_today?: boolean | null;
  equipment_inspection_up_to_date?: boolean | null;
  completed_flra_hazard_assessment?: boolean | null;
  safety_signage_installed_and_checked?: boolean | null;
  working_alone_today?: boolean | null;
  required_permits_for_tasks?: boolean | null;
  barricades_signage_barriers_installed_good?: boolean | null;
  clear_access_to_emergency_exits?: boolean | null;
  trained_and_competent_for_tasks?: boolean | null;
  inspected_tools_and_equipment?: boolean | null;
  reviewed_control_measures_needed?: boolean | null;
  reviewed_emergency_procedures?: boolean | null;
  all_required_permits_in_place?: boolean | null;
  communicated_with_crew_about_plan?: boolean | null;
  need_for_spotters_barricades_special_controls?: boolean | null;
  weather_suitable_for_work?: boolean | null;
  know_designated_first_aid_attendant?: boolean | null;
  aware_of_site_notices_or_bulletins?: boolean | null;
  created_at: string;
  updated_at?: string;
};

export type TaskHazardControl = {
  id: string;
  form_module_id: string; // ✅ REQUIRED, not nullable
  task: string;
  hazard: string;
  risk_level_before?: number | null;
  control: string;
  risk_level_after?: number | null;
  created_at: string;
  updated_at?: string;
};

/**
 * FormAssetPhoto Type
 *
 * NOTE: This type is intentionally minimal as it represents the core fields needed for UI rendering.
 * The full database schema (including soft-delete fields) is handled by:
 * 1. Database constants in database.ts
 * 2. Validation schemas in formValidationSchemas.ts
 * 3. Query filters in getPhotosForModule (isDeleted: false)
 *
 * This separation ensures:
 * - UI components only receive necessary fields
 * - Database operations maintain full schema compliance
 * - Soft-delete filtering happens at the query level
 */
export type FormAssetPhoto = {
  id: string;
  form_module_id: string; // ✅ REQUIRED, not nullable
  photo_url: string;
  photo_description?: string | null;
  uploaded_at: string;
  created_at: string;
  updated_at?: string;
};

export type Signature = {
  id: string;
  form_module_id: string; // ✅ REQUIRED, not nullable
  signer_name: string;
  signature_url: string;
  signed_at: string;
  signature_hash?: string | null;
  role?: string | null;
  metadata?: Record<string, unknown> | null;
  signed_by?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string;
};

export type PpeEquipmentChecklist = {
  id: string;
  form_module_id: string; // ✅ REQUIRED, not nullable
  ppe_hardhat?: boolean | null;
  ppe_safety_vest?: boolean | null;
  ppe_safety_glasses?: boolean | null;
  ppe_fall_protection?: boolean | null;
  ppe_coveralls?: boolean | null;
  ppe_gloves?: boolean | null;
  ppe_mask?: boolean | null;
  ppe_respirator?: boolean | null;
  platform_ladder?: boolean | null;
  platform_step_bench?: boolean | null;
  platform_sawhorses?: boolean | null;
  platform_baker_scaffold?: boolean | null;
  platform_scaffold?: boolean | null;
  platform_scissor_lift?: boolean | null;
  platform_boom_lift?: boolean | null;
  platform_swing_stage?: boolean | null;
  platform_hydro_lift?: boolean | null;
  created_at: string;
  updated_at?: string;
};

export type FlraFormState = {
  header: FormInstance;
  general: GeneralInformation;
  preJobChecklist: PreJobTaskChecklist;
  ppeChecklist: PpeEquipmentChecklist;
  taskHazards: TaskHazardControl[];
  photos: FormAssetPhoto[];
  signatures: Signature[];
  status?: FormStatus;

  // TEMPORARY: Bridge solution until full form saving is implemented
  // These IDs ensure photos stay organized during form creation
  // They will be replaced by proper database IDs when saving is implemented
  formId?: string; // Stable ID for the current form session
  photosModuleId?: string; // Stable ID for the photos module instance
};

export type FormInstanceModule = {
  id: string; // uuid, required
  form_id: string; // uuid, required
  module_id: string; // uuid, required
  module_order: number; // integer, required
  is_required: boolean; // boolean, required
  created_at: string; // timestamp with time zone, required
  completion_state: string; // text, required
};

// Database operation result types
export type DatabaseResult<T> = {
  data: T | null;
  error: Error | null;
};

export type FormAssetPhotoResult = DatabaseResult<FormAssetPhoto>;
export type FormAssetPhotoListResult = DatabaseResult<FormAssetPhoto[]>;

export interface SaveFormModuleDataParams<T extends ModuleKey = ModuleKey> {
  formId: string;
  moduleKey: T;
  data: ModuleData[T];
  moduleId?: string;
  version?: number;
  updated_at?: string;
}

// Module Key Types
export const MODULE_KEYS = [
  "header",
  "general",
  "preJobChecklist",
  "ppeChecklist",
  "taskHazards",
  "photos",
  "signatures",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

// Runtime type guard for module keys
export function isModuleKey(key: string): key is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(key);
}

// Type-safe Module Data Types
export interface ModuleData {
  header: FormInstance;
  general: GeneralInformation;
  preJobChecklist: PreJobTaskChecklist;
  ppeChecklist: PpeEquipmentChecklist;
  taskHazards: TaskHazardControl[];
  photos: FormAssetPhoto[];
  signatures: Signature[];
}

// Module Key Mapping
export const MODULE_KEY_MAP = {
  Header: "header",
  "General Information": "general",
  "Pre-Job Checklist": "preJobChecklist",
  "PPE and Platform Inspection": "ppeChecklist",
  "Task Hazards": "taskHazards",
  Photos: "photos",
  Signatures: "signatures",
} as const;

type ModuleKeyMapKey = keyof typeof MODULE_KEY_MAP;

// Reverse mapping for display names
export const MODULE_LABEL_MAP: Record<ModuleKey, string> = Object.entries(
  MODULE_KEY_MAP
).reduce((acc, [label, key]) => {
  acc[key as ModuleKey] = label;
  return acc;
}, {} as Record<ModuleKey, string>);

// Helper function to get module key
export function getModuleKey(moduleType: ModuleKeyMapKey): ModuleKey {
  return MODULE_KEY_MAP[moduleType];
}

// Helper function to get module label
export function getModuleLabel(key: ModuleKey): string {
  return MODULE_LABEL_MAP[key];
}

// Runtime type guard for module keys
export function assertModuleKey(key: string): asserts key is ModuleKey {
  if (!Object.values(MODULE_KEY_MAP).includes(key as ModuleKey)) {
    throw new Error(`Invalid module key: ${key}`);
  }
}

export type FlraForm = {
  id: string;
  userId: string;
  companyId?: string;
  projectId?: string;
  title?: string;
  description?: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  createdAt: string;
  submittedAt?: string | null;
};
