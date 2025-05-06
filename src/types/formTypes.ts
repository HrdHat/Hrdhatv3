// Shared FLRA form types for use in centralized state management

export type FlraHeader = {
  form_number?: string | null;
  form_name?: string | null;
  form_date?: string | null; // ISO date string
};

export type GeneralInformation = {
  project_name?: string | null;
  project_address?: string | null;
  task_location?: string | null;
  supervisor_name?: string | null;
  supervisor_contact?: string | null;
  date?: string | null; // ISO date string
  crew_members_count?: number | null;
  task_description?: string | null;
  start_time?: string | null; // ISO time string
  end_time?: string | null; // ISO time string
};

export type PreJobTaskChecklist = {
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
};

export type TaskHazardControl = {
  task: string;
  hazard: string;
  risk_level_before?: number | null;
  control: string;
  risk_level_after?: number | null;
};

export type FlraPhoto = {
  photo_url: string;
  description?: string | null;
};

export type Signature = {
  worker_name: string;
  signature_url: string;
  signed_at: string; // ISO datetime string
};

export type PpeEquipmentChecklist = {
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
};

export type FlraFormState = {
  header: FlraHeader;
  general: GeneralInformation;
  preJobChecklist: PreJobTaskChecklist;
  ppeChecklist: PpeEquipmentChecklist;
  taskHazards: TaskHazardControl[];
  photos: FlraPhoto[];
  signatures: Signature[];
  status?: 'draft' | 'submitted' | 'archived';
}; 