import { z } from "zod";

// Base schemas for common field types
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Shared shapes for each module
export const generalInfoShape = {
  project_name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name must be less than 100 characters"),
  project_address: z
    .string()
    .min(5, "Project address must be at least 5 characters")
    .max(200, "Project address must be less than 200 characters"),
  task_location: z
    .string()
    .min(2, "Task location must be at least 2 characters")
    .max(100, "Task location must be less than 100 characters"),
  supervisor_name: z
    .string()
    .min(2, "Supervisor name must be at least 2 characters")
    .max(100, "Supervisor name must be less than 100 characters"),
  supervisor_contact: z
    .string()
    .regex(phoneRegex, "Invalid phone number format"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  crew_members_count: z
    .number()
    .int()
    .min(1, "Must have at least 1 crew member")
    .max(100, "Maximum 100 crew members allowed"),
  task_description: z
    .string()
    .min(10, "Task description must be at least 10 characters")
    .max(1000, "Task description must be less than 1000 characters"),
  start_time: z.string().regex(timeRegex, "Invalid time format (HH:MM)"),
  end_time: z.string().regex(timeRegex, "Invalid time format (HH:MM)"),
};

export const preJobChecklistShape = {
  is_fit_for_duty: z.boolean(),
  reviewed_work_area_for_hazards: z.boolean(),
  required_ppe_for_today: z.boolean(),
  equipment_inspection_up_to_date: z.boolean(),
  completed_flra_hazard_assessment: z.boolean(),
  safety_signage_installed_and_checked: z.boolean(),
  working_alone_today: z.boolean(),
  required_permits_for_tasks: z.boolean(),
  barricades_signage_barriers_installed_good: z.boolean(),
  clear_access_to_emergency_exits: z.boolean(),
  trained_and_competent_for_tasks: z.boolean(),
  inspected_tools_and_equipment: z.boolean(),
  reviewed_control_measures_needed: z.boolean(),
  reviewed_emergency_procedures: z.boolean(),
  all_required_permits_in_place: z.boolean(),
  communicated_with_crew_about_plan: z.boolean(),
  need_for_spotters_barricades_special_controls: z.boolean(),
  weather_suitable_for_work: z.boolean(),
  know_designated_first_aid_attendant: z.boolean(),
  aware_of_site_notices_or_bulletins: z.boolean(),
};

export const ppeChecklistShape = {
  ppe_hardhat: z.boolean(),
  ppe_safety_vest: z.boolean(),
  ppe_safety_glasses: z.boolean(),
  ppe_fall_protection: z.boolean(),
  ppe_coveralls: z.boolean(),
  ppe_gloves: z.boolean(),
  ppe_mask: z.boolean(),
  ppe_respirator: z.boolean(),
  platform_ladder: z.boolean(),
  platform_step_bench: z.boolean(),
  platform_sawhorses: z.boolean(),
  platform_baker_scaffold: z.boolean(),
  platform_scaffold: z.boolean(),
  platform_scissor_lift: z.boolean(),
  platform_boom_lift: z.boolean(),
  platform_swing_stage: z.boolean(),
  platform_hydro_lift: z.boolean(),
};

export const formInstanceShape = {
  form_number: z.string(),
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  form_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  user_form_id: z.string(),
};

export const taskHazardControlShape = {
  task: z
    .string()
    .min(2, "Task must be at least 2 characters")
    .max(200, "Task must be less than 200 characters"),
  hazard: z
    .string()
    .min(2, "Hazard must be at least 2 characters")
    .max(200, "Hazard must be less than 200 characters"),
  risk_level_before: z.number().int().min(1).max(5),
  control: z
    .string()
    .min(2, "Control must be at least 2 characters")
    .max(500, "Control must be less than 500 characters"),
  risk_level_after: z.number().int().min(1).max(5),
};

export const formAssetPhotoShape = {
  id: z.string().uuid(),
  form_id: z.string().uuid(),
  form_module_id: z.string().uuid(),
  photo_url: z.string().url(),
  uploaded_at: z.string().datetime(),
  uploaded_by: z.string().uuid(),
  is_deleted: z.boolean(),
  description: z.string().max(500),
  sort_order: z.number().int(),
  tag: z.string().max(50),
  source: z.enum(["mobile", "web", "imported"]),
  deleted_at: z.string().datetime(),
  metadata: z.record(z.unknown()),
  photo_hash: z.string().max(64),
};

export const signatureShape = {
  worker_name: z
    .string()
    .min(2, "Worker name must be at least 2 characters")
    .max(100, "Worker name must be less than 100 characters"),
  signature_url: z.string().url(),
  signed_at: z.string().datetime(),
};
