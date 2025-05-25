import { z } from "zod";

// Base schemas for common field types
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Shared shapes for each module
export const generalInfoShape = {
  id: z.string().uuid(),
  form_module_id: z.string().uuid().nullable().optional(),
  project_name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name must be less than 100 characters")
    .nullable()
    .optional(),
  project_address: z
    .string()
    .min(5, "Project address must be at least 5 characters")
    .max(200, "Project address must be less than 200 characters")
    .nullable()
    .optional(),
  task_location: z
    .string()
    .min(2, "Task location must be at least 2 characters")
    .max(100, "Task location must be less than 100 characters")
    .nullable()
    .optional(),
  supervisor_name: z
    .string()
    .min(2, "Supervisor name must be at least 2 characters")
    .max(100, "Supervisor name must be less than 100 characters")
    .nullable()
    .optional(),
  supervisor_contact: z
    .string()
    .regex(phoneRegex, "Invalid phone number format")
    .nullable()
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .nullable()
    .optional(),
  crew_members_count: z
    .number()
    .int()
    .min(1, "Must have at least 1 crew member")
    .max(100, "Maximum 100 crew members allowed")
    .nullable()
    .optional(),
  task_description: z
    .string()
    .min(10, "Task description must be at least 10 characters")
    .max(1000, "Task description must be less than 1000 characters")
    .nullable()
    .optional(),
  start_time: z
    .string()
    .regex(timeRegex, "Invalid time format (HH:MM)")
    .nullable()
    .optional(),
  end_time: z
    .string()
    .regex(timeRegex, "Invalid time format (HH:MM)")
    .nullable()
    .optional(),
  created_at: z.string().datetime(),
};

export const preJobChecklistShape = {
  id: z.string().uuid(),
  form_id: z.string().uuid(),
  form_module_id: z.string().uuid().nullable().optional(),
  is_fit_for_duty: z.boolean().nullable().optional(),
  reviewed_work_area_for_hazards: z.boolean().nullable().optional(),
  required_ppe_for_today: z.boolean().nullable().optional(),
  equipment_inspection_up_to_date: z.boolean().nullable().optional(),
  completed_flra_hazard_assessment: z.boolean().nullable().optional(),
  safety_signage_installed_and_checked: z.boolean().nullable().optional(),
  working_alone_today: z.boolean().nullable().optional(),
  required_permits_for_tasks: z.boolean().nullable().optional(),
  barricades_signage_barriers_installed_good: z.boolean().nullable().optional(),
  clear_access_to_emergency_exits: z.boolean().nullable().optional(),
  trained_and_competent_for_tasks: z.boolean().nullable().optional(),
  inspected_tools_and_equipment: z.boolean().nullable().optional(),
  reviewed_control_measures_needed: z.boolean().nullable().optional(),
  reviewed_emergency_procedures: z.boolean().nullable().optional(),
  all_required_permits_in_place: z.boolean().nullable().optional(),
  communicated_with_crew_about_plan: z.boolean().nullable().optional(),
  need_for_spotters_barricades_special_controls: z
    .boolean()
    .nullable()
    .optional(),
  weather_suitable_for_work: z.boolean().nullable().optional(),
  know_designated_first_aid_attendant: z.boolean().nullable().optional(),
  aware_of_site_notices_or_bulletins: z.boolean().nullable().optional(),
  created_at: z.string().datetime(),
};

export const ppeChecklistShape = {
  id: z.string().uuid(),
  form_id: z.string().uuid(),
  form_module_id: z.string().uuid().nullable().optional(),
  ppe_hardhat: z.boolean().nullable().optional(),
  ppe_safety_vest: z.boolean().nullable().optional(),
  ppe_safety_glasses: z.boolean().nullable().optional(),
  ppe_fall_protection: z.boolean().nullable().optional(),
  ppe_coveralls: z.boolean().nullable().optional(),
  ppe_gloves: z.boolean().nullable().optional(),
  ppe_mask: z.boolean().nullable().optional(),
  ppe_respirator: z.boolean().nullable().optional(),
  platform_ladder: z.boolean().nullable().optional(),
  platform_step_bench: z.boolean().nullable().optional(),
  platform_sawhorses: z.boolean().nullable().optional(),
  platform_baker_scaffold: z.boolean().nullable().optional(),
  platform_scaffold: z.boolean().nullable().optional(),
  platform_scissor_lift: z.boolean().nullable().optional(),
  platform_boom_lift: z.boolean().nullable().optional(),
  platform_swing_stage: z.boolean().nullable().optional(),
  platform_hydro_lift: z.boolean().nullable().optional(),
  created_at: z.string().datetime(),
};

export const formInstanceShape = {
  id: z.string().uuid(),
  form_number: z.string().nullable().optional(),
  user_form_id: z.string().nullable().optional(),
  created_by: z.string().uuid().nullable().optional(),
  status: z.string().nullable().optional(),
  last_modified: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  auto_archived: z.boolean().nullable().optional(),
  data: z.record(z.unknown()).nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters")
    .nullable()
    .optional(),
  description: z.string().nullable().optional(),
  version: z.number().int().min(0),
  submitted_at: z.string().datetime().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  form_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .nullable()
    .optional(),
};

export const taskHazardControlShape = {
  id: z.string().uuid(),
  form_id: z.string().uuid(),
  form_module_id: z.string().uuid().nullable().optional(),
  task: z
    .string()
    .min(2, "Task must be at least 2 characters")
    .max(200, "Task must be less than 200 characters"),
  hazard: z
    .string()
    .min(2, "Hazard must be at least 2 characters")
    .max(200, "Hazard must be less than 200 characters"),
  risk_level_before: z.number().int().min(1).max(5).nullable().optional(),
  control: z
    .string()
    .min(2, "Control must be at least 2 characters")
    .max(500, "Control must be less than 500 characters"),
  risk_level_after: z.number().int().min(1).max(5).nullable().optional(),
  created_at: z.string().datetime(),
};

export const formAssetPhotoShape = {
  id: z.string().uuid(),
  form_id: z.string().uuid(),
  form_module_id: z.string().uuid().nullable().optional(),
  photo_url: z.string().url(),
  photo_description: z.string().max(500).nullable().optional(),
  uploaded_at: z.string().datetime(),
};

export const signatureShape = {
  id: z.string().uuid(),
  form_id: z.string().uuid(),
  form_module_id: z.string().uuid().nullable().optional(),
  worker_name: z
    .string()
    .min(2, "Worker name must be at least 2 characters")
    .max(100, "Worker name must be less than 100 characters"),
  signature_url: z.string().url(),
  signed_at: z.string().datetime(),
  signature_hash: z.string().max(64).nullable().optional(),
  role: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  signed_by: z.string().uuid().nullable().optional(),
  is_deleted: z.boolean().nullable().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
};
