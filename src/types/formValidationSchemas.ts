/**
 * Form Validation Schemas - CRITICAL SYSTEM FILE
 * ===============================================
 *
 * This file is the single source of truth for all form data validation.
 * DO NOT MODIFY without understanding the full impact on the validation system.
 *
 * CRITICAL: These schemas are the single source of truth for form data validation.
 *
 * Rules:
 * 1. All form data MUST be validated against these schemas before saving
 * 2. All field definitions MUST be validated before rendering
 * 3. Use .safeParse() for validation - never .parse() in production code
 * 4. Never bypass validation - any code that skips validation is a defect
 * 5. All validation errors must be shown to users, not just logged
 *
 * Usage:
 * ```typescript
 * // For form data
 * const result = schemaMap[moduleKey].safeParse(data);
 * if (!result.success) {
 *   // Show errors, block save
 *   return;
 * }
 *
 * // For field definitions
 * const result = moduleFieldSchema.safeParse(fieldDef);
 * if (!result.success) {
 *   // Show errors, block render
 *   return;
 * }
 * ```
 */

import { z } from "zod";

// Common validation patterns
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// --- Date/time regex and refinements ---
const dateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const isValidDate = (val: string | null) => !val || dateRegex.test(val);
const isValidTime = (val: string | null) => !val || timeRegex.test(val);

// Base field schema for all field types (strict DB-bound version)
const BaseFieldStrict = z.object({
  id: z.string().uuid("Invalid UUID format"),
  form_id: z.string().uuid("Invalid form ID format"),
  form_module_id: z.string().uuid("Invalid module ID format"),
  name: z.string().min(1, "Field name is required"),
  label: z.string().min(1, "Label is required"),
  type: z.string(),
  required: z.boolean(),
  field_order: z.number().int().min(0, "Field order must be 0 or greater"),
  default_value: z.string().nullable(),
  version: z.number().int().min(1, "Version must be 1 or greater"),
});

// Base field schema for all field types (loose builder version)
// BUILDER-ONLY: Used for form builder/preview mode where some fields may be optional
// DO NOT USE for runtime validation of saved data - use BaseFieldStrict instead
const BaseFieldLoose = z.object({
  id: z.string().uuid("Invalid UUID format").optional(),
  form_id: z.string().uuid("Invalid form ID format").optional(),
  form_module_id: z.string().uuid("Invalid module ID format").optional(),
  name: z.string().min(1, "Field name is required"),
  label: z.string().min(1, "Label is required"),
  type: z.string(),
  required: z.boolean().default(false),
  field_order: z
    .number()
    .int()
    .min(0, "Field order must be 0 or greater")
    .default(0),
  default_value: z.string().nullable().optional(),
  version: z.number().int().min(1, "Version must be 1 or greater").default(1),
});

// Select field schema (strict)
const SelectFieldStrict = BaseFieldStrict.extend({
  type: z.enum(["select", "multiselect"]),
  options: z.array(
    z.object({
      label: z.string().min(1, "Option label is required"),
      value: z.string().min(1, "Option value is required"),
    })
  ),
});

// Select field schema (loose)
// BUILDER-ONLY: Used for form builder/preview mode where options may be empty
// DO NOT USE for runtime validation of saved data - use SelectFieldStrict instead
const SelectFieldLoose = BaseFieldLoose.extend({
  type: z.enum(["select", "multiselect"]),
  options: z
    .array(
      z.object({
        label: z.string().min(1, "Option label is required"),
        value: z.string().min(1, "Option value is required"),
      })
    )
    .default([]),
});

// Non-select field schema (strict)
const NonSelectFieldStrict = BaseFieldStrict.extend({
  type: z.enum([
    "text",
    "boolean",
    "date",
    "time",
    "number",
    "textarea",
    "file",
    "signature",
  ]),
  options: z.undefined(),
});

// Non-select field schema (loose)
// BUILDER-ONLY: Used for form builder/preview mode where some fields may be optional
// DO NOT USE for runtime validation of saved data - use NonSelectFieldStrict instead
const NonSelectFieldLoose = BaseFieldLoose.extend({
  type: z.enum([
    "text",
    "boolean",
    "date",
    "time",
    "number",
    "textarea",
    "file",
    "signature",
  ]),
  options: z.undefined(),
});

// Combined field schemas using discriminated unions
export const moduleFieldSchemaStrict = z.discriminatedUnion("type", [
  SelectFieldStrict,
  NonSelectFieldStrict,
]);

// BUILDER-ONLY: Used for form builder/preview mode where validation is more lenient
// DO NOT USE for runtime validation of saved data - use moduleFieldSchemaStrict instead
export const moduleFieldSchemaLoose = z.discriminatedUnion("type", [
  SelectFieldLoose,
  NonSelectFieldLoose,
]);

// Module Payload Schemas (matching DB schema exactly)
export const generalInfoSchema = z
  .object({
    id: z.string().uuid("Invalid UUID format"),
    form_module_id: z.string().uuid("Invalid module ID format").nullable(),
    project_name: z.string().min(1, "Required"),
    project_address: z.string().nullable(),
    task_location: z.string().nullable(),
    supervisor_name: z.string().nullable(),
    supervisor_contact: z
      .string()
      .regex(phoneRegex, "Invalid phone number format")
      .nullable(),
    date: z.string().nullable().refine(isValidDate, {
      message: "Please enter a valid date (YYYY-MM-DD)",
    }),
    crew_members_count: z.number().int().nullable(),
    task_description: z.string().nullable(),
    start_time: z
      .string()
      .nullable()
      .refine(isValidTime, { message: "Please enter a valid time (HH:MM)" }),
    end_time: z
      .string()
      .nullable()
      .refine(isValidTime, { message: "Please enter a valid time (HH:MM)" }),
    created_at: z.string().datetime(),
  })
  .strict();

export const preJobChecklistSchema = z
  .object({
    id: z.string().uuid("Invalid UUID format"),
    form_id: z.string().uuid("Invalid form ID format"),
    form_module_id: z.string().uuid("Invalid module ID format").nullable(),
    is_fit_for_duty: z.boolean().nullable(),
    reviewed_work_area_for_hazards: z.boolean().nullable(),
    required_ppe_for_today: z.boolean().nullable(),
    equipment_inspection_up_to_date: z.boolean().nullable(),
    completed_flra_hazard_assessment: z.boolean().nullable(),
    safety_signage_installed_and_checked: z.boolean().nullable(),
    working_alone_today: z.boolean().nullable(),
    required_permits_for_tasks: z.boolean().nullable(),
    barricades_signage_barriers_installed_good: z.boolean().nullable(),
    clear_access_to_emergency_exits: z.boolean().nullable(),
    trained_and_competent_for_tasks: z.boolean().nullable(),
    inspected_tools_and_equipment: z.boolean().nullable(),
    reviewed_control_measures_needed: z.boolean().nullable(),
    reviewed_emergency_procedures: z.boolean().nullable(),
    all_required_permits_in_place: z.boolean().nullable(),
    communicated_with_crew_about_plan: z.boolean().nullable(),
    need_for_spotters_barricades_special_controls: z.boolean().nullable(),
    weather_suitable_for_work: z.boolean().nullable(),
    know_designated_first_aid_attendant: z.boolean().nullable(),
    aware_of_site_notices_or_bulletins: z.boolean().nullable(),
    created_at: z.string().datetime(),
  })
  .strict();

export const ppeChecklistSchema = z
  .object({
    id: z.string().uuid("Invalid UUID format"),
    form_id: z.string().uuid("Invalid form ID format"),
    form_module_id: z.string().uuid("Invalid module ID format").nullable(),
    ppe_hardhat: z.boolean().nullable(),
    ppe_safety_vest: z.boolean().nullable(),
    ppe_safety_glasses: z.boolean().nullable(),
    ppe_fall_protection: z.boolean().nullable(),
    ppe_coveralls: z.boolean().nullable(),
    ppe_gloves: z.boolean().nullable(),
    ppe_mask: z.boolean().nullable(),
    ppe_respirator: z.boolean().nullable(),
    platform_ladder: z.boolean().nullable(),
    platform_step_bench: z.boolean().nullable(),
    platform_sawhorses: z.boolean().nullable(),
    platform_baker_scaffold: z.boolean().nullable(),
    platform_scaffold: z.boolean().nullable(),
    platform_scissor_lift: z.boolean().nullable(),
    platform_boom_lift: z.boolean().nullable(),
    platform_swing_stage: z.boolean().nullable(),
    platform_hydro_lift: z.boolean().nullable(),
    created_at: z.string().datetime(),
  })
  .strict();

export const taskHazardControlSchema = z
  .object({
    id: z.string().uuid("Invalid UUID format"),
    form_id: z.string().uuid("Invalid form ID format"),
    form_module_id: z.string().uuid("Invalid module ID format").nullable(),
    task: z.string().min(1, "Task is required"),
    hazard: z.string().min(1, "Hazard is required"),
    risk_level_before: z
      .number()
      .int()
      .min(1, "Risk level must be between 1 and 5")
      .max(5, "Risk level must be between 1 and 5")
      .nullable(),
    control: z.string().min(1, "Control is required"),
    risk_level_after: z
      .number()
      .int()
      .min(1, "Risk level must be between 1 and 5")
      .max(5, "Risk level must be between 1 and 5")
      .nullable(),
    created_at: z.string().datetime(),
  })
  .strict();

export const formAssetPhotoSchema = z
  .object({
    id: z.string().uuid("Invalid UUID format"),
    form_id: z.string().uuid("Invalid form ID format"),
    form_module_id: z.string().uuid("Invalid module ID format").nullable(),
    photo_url: z.string().url("Invalid photo URL format"),
    photo_description: z.string().nullable(),
    uploaded_at: z.string().datetime(),
  })
  .strict();

export const signatureSchema = z
  .object({
    id: z.string().uuid("Invalid UUID format"),
    form_id: z.string().uuid("Invalid form ID format"),
    form_module_id: z.string().uuid("Invalid module ID format").nullable(),
    worker_name: z.string().min(1, "Worker name is required"),
    signature_url: z.string().url("Invalid signature URL format"),
    signed_at: z.string().datetime(),
    signature_hash: z.string().nullable(),
    role: z.string().nullable(),
    metadata: z.record(z.unknown()).nullable(),
    signed_by: z.string().uuid("Invalid user ID format").nullable(),
    is_deleted: z.boolean().nullable(),
    deleted_at: z.string().datetime().nullable(),
  })
  .strict();

// Form instance schema (header)
export const formInstanceSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
  form_number: z.string().nullable(),
  created_by: z.string().uuid("Invalid user ID format").nullable(),
  status: z.string().nullable(),
  last_modified: z.string().datetime().nullable(),
  created_at: z.string().datetime().optional(),
  auto_archived: z.boolean().nullable(),
  data: z.record(z.unknown()).nullable(),
  company_id: z.string().uuid("Invalid company ID format").nullable(),
  project_id: z.string().uuid("Invalid project ID format").nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  version: z.number().int().min(1, "Version must be 1 or greater"),
  submitted_at: z.string().datetime().nullable(),
  user_id: z.string().uuid("Invalid user ID format").nullable(),
  form_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .nullable(),
});

// Combined Module Data Schema
export const moduleDataSchema = z.object({
  header: formInstanceSchema,
  general: generalInfoSchema,
  preJobChecklist: preJobChecklistSchema,
  ppeChecklist: ppeChecklistSchema,
  taskHazards: z.array(taskHazardControlSchema).min(0),
  photos: z.array(formAssetPhotoSchema).min(0),
  signatures: z.array(signatureSchema).min(0),
});

// Save Parameters Schema
export const saveFormModuleDataParamsSchema = z.object({
  formId: z.string().uuid("Invalid ID format"),
  moduleKey: z.enum([
    "header",
    "general",
    "preJobChecklist",
    "ppeChecklist",
    "taskHazards",
    "photos",
    "signatures",
  ]),
  data: z.any(), // This will be validated against the specific module schema
  moduleId: z.string().uuid("Invalid ID format").optional(),
  version: z.number().int().min(1, "Version must be 1 or greater").optional(),
  updated_at: z.string().datetime().optional(),
});

// Schema map for runtime validation
export const schemaMap = {
  header: formInstanceSchema,
  general: generalInfoSchema,
  preJobChecklist: preJobChecklistSchema,
  ppeChecklist: ppeChecklistSchema,
  taskHazards: z.array(taskHazardControlSchema).min(0),
  photos: z.array(formAssetPhotoSchema).min(0),
  signatures: z.array(signatureSchema).min(0),
} as const;

// Type for module keys
export type ModuleKey = keyof typeof schemaMap;

// Define array modules for easy checking
const ARRAY_MODULES: ModuleKey[] = ["taskHazards", "photos", "signatures"];

// Validation helper functions
export const validateModuleData = (moduleKey: ModuleKey, data: unknown) => {
  const schema = schemaMap[moduleKey];

  // The schema already handles arrays for array modules, so just use it directly
  return schema.safeParse(data);
};

export const validateFieldDefinition = (
  fieldDef: unknown,
  strict: boolean = true
) => {
  const schema = strict ? moduleFieldSchemaStrict : moduleFieldSchemaLoose;
  return schema.safeParse(fieldDef);
};

// Export types
export type ModuleFieldStrict = z.infer<typeof moduleFieldSchemaStrict>;
export type ModuleFieldLoose = z.infer<typeof moduleFieldSchemaLoose>;
export type ModuleData = z.infer<typeof moduleDataSchema>;
export type SaveFormModuleDataParams = z.infer<
  typeof saveFormModuleDataParamsSchema
>;

// Form Creation Schema
export const createFormSchema = z
  .object({
    userId: z.string().uuid("Invalid user ID format"),
    companyId: z.string().uuid("Invalid company ID format").nullable(),
    projectId: z.string().uuid("Invalid project ID format").nullable(),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: z.enum(["draft", "submitted", "approved", "rejected"]),
    submittedAt: z.string().datetime().nullable(),
  })
  .strict();

// Form Module Field Schema
export const formModuleFieldSchema = z
  .object({
    formId: z.string().uuid("Invalid form ID format"),
    formModuleId: z.string().uuid("Invalid module ID format"),
    moduleFieldId: z.string().uuid("Invalid field ID format"),
    name: z
      .string()
      .min(1, "Field name is required")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Field name must contain only letters, numbers, and underscores"
      ),
    label: z.string().min(1, "Field label is required"),
    type: z.enum(
      [
        "text",
        "boolean",
        "number",
        "date",
        "time",
        "select",
        "multiselect",
        "file",
        "signature",
      ],
      {
        errorMap: () => ({ message: "Invalid field type" }),
      }
    ),
    required: z.boolean(),
    fieldOrder: z.number().int().min(0, "Field order must be 0 or greater"),
    defaultValue: z.any().optional(),
    version: z.number().int().min(1, "Version must be 1 or greater"),
  })
  .strict();

// Form Module Field Update Schema (for partial updates)
export const formModuleFieldUpdateSchema = formModuleFieldSchema.partial();

// Export array schemas for array modules
export const taskHazards = z.array(taskHazardControlSchema);
export const photos = z.array(formAssetPhotoSchema);
export const signatures = z.array(signatureSchema);
