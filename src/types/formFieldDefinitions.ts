/**
 * Centralized Form Field Definitions
 *
 * This file serves as the single source of truth for all form field definitions.
 * All field configurations must:
 * 1. Match the database schema exactly (snake_case naming)
 * 2. Have descriptive labels for users
 * 3. Match the corresponding Zod schema validations
 * 4. Be validated at runtime before rendering
 */

import type { ModuleField } from "./formModules";

// Field types that match both UI components and database
export type FieldType =
  | "text"
  | "boolean"
  | "date"
  | "time"
  | "number"
  | "textarea"
  | "select"
  | "multiselect";

// Base field definition interface
export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: Array<{
    label: string;
    value: string;
  }>;
}

// Common validation patterns (matching formValidationSchemas.ts)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;
const dateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
// URL regex pattern for basic URL validation
const urlRegex = /^https?:\/\/.+/;

// General Information Module Fields
export const GENERAL_INFO_FIELDS: FieldDefinition[] = [
  {
    name: "project_name",
    label: "Project Name",
    type: "text",
    required: true,
    validation: {
      min: 1,
      message: "Project Name is required",
    },
  },
  {
    name: "project_address",
    label: "Project Address",
    type: "text",
    required: false,
  },
  {
    name: "location",
    label: "Task Location",
    type: "text",
    required: false,
  },
  {
    name: "supervisor_name",
    label: "Supervisor Name",
    type: "text",
    required: false,
  },
  {
    name: "supervisor_contact",
    label: "Supervisor Contact",
    type: "text",
    required: false,
    validation: {
      pattern: phoneRegex.source,
      message: "Invalid phone number format",
    },
  },
  {
    name: "form_date",
    label: "Date",
    type: "date",
    required: false,
    validation: {
      pattern: dateRegex.source,
      message: "Please enter a valid date (YYYY-MM-DD)",
    },
  },
  {
    name: "crew_members_count",
    label: "Number of Crew Members",
    type: "number",
    required: false,
    validation: {
      min: 0,
      max: 999,
    },
  },
  {
    name: "work_description",
    label: "Task Description",
    type: "textarea",
    required: false,
  },
  {
    name: "start_time",
    label: "Start Time",
    type: "time",
    required: false,
    validation: {
      pattern: timeRegex.source,
      message: "Please enter a valid time (HH:MM)",
    },
  },
  {
    name: "end_time",
    label: "End Time",
    type: "time",
    required: false,
    validation: {
      pattern: timeRegex.source,
      message: "Please enter a valid time (HH:MM)",
    },
  },
];

// Pre-Job Checklist Fields
export const PRE_JOB_CHECKLIST_FIELDS: FieldDefinition[] = [
  {
    name: "is_fit_for_duty",
    label: "Are you fit for duty?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "reviewed_work_area_for_hazards",
    label: "Have you reviewed the work area for hazards?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "required_ppe_for_today",
    label: "Do you have the required PPE for today's tasks?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "equipment_inspection_up_to_date",
    label: "Is equipment inspection up to date?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "completed_flra_hazard_assessment",
    label: "Have you completed the FLRA hazard assessment?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "safety_signage_installed_and_checked",
    label: "Is safety signage installed and checked?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "working_alone_today",
    label: "Are you working alone today?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "required_permits_for_tasks",
    label: "Are required permits for tasks in place?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "barricades_signage_barriers_installed_good",
    label: "Are barricades, signage, and barriers installed properly?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "clear_access_to_emergency_exits",
    label: "Is there clear access to emergency exits?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "trained_and_competent_for_tasks",
    label: "Are you trained and competent for today's tasks?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "inspected_tools_and_equipment",
    label: "Have you inspected tools and equipment?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "reviewed_control_measures_needed",
    label: "Have you reviewed control measures needed?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "reviewed_emergency_procedures",
    label: "Have you reviewed emergency procedures?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "all_required_permits_in_place",
    label: "Are all required permits in place?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "communicated_with_crew_about_plan",
    label: "Have you communicated with crew about the plan?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "need_for_spotters_barricades_special_controls",
    label: "Is there a need for spotters, barricades, or special controls?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "weather_suitable_for_work",
    label: "Is the weather suitable for work?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "know_designated_first_aid_attendant",
    label: "Do you know the designated first aid attendant?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "aware_of_site_notices_or_bulletins",
    label: "Are you aware of site notices or bulletins?",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
];

// PPE and Platform Checklist Fields
export const PPE_CHECKLIST_FIELDS: FieldDefinition[] = [
  // PPE Items
  {
    name: "ppe_hardhat",
    label: "Hard Hat",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "ppe_safety_vest",
    label: "Safety Vest",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "ppe_safety_glasses",
    label: "Safety Glasses",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "ppe_fall_protection",
    label: "Fall Protection",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "ppe_coveralls",
    label: "Coveralls",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "ppe_gloves",
    label: "Gloves",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "ppe_mask",
    label: "Mask",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "ppe_respirator",
    label: "Respirator",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  // Platform Items
  {
    name: "platform_ladder",
    label: "Ladder",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "platform_step_bench",
    label: "Step Bench",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "platform_sawhorses",
    label: "Sawhorses",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "platform_baker_scaffold",
    label: "Baker Scaffold",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "platform_scaffold",
    label: "Scaffold",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "platform_scissor_lift",
    label: "Scissor Lift",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "platform_boom_lift",
    label: "Boom Lift",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "platform_swing_stage",
    label: "Swing Stage",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
  {
    name: "platform_hydro_lift",
    label: "Hydro Lift",
    type: "boolean",
    required: false,
    defaultValue: false,
  },
];

// Task Hazard Control Fields
export const TASK_HAZARD_FIELDS: FieldDefinition[] = [
  {
    name: "task",
    label: "Task",
    type: "text",
    required: true,
    validation: {
      min: 1,
      message: "Task is required",
    },
  },
  {
    name: "hazard",
    label: "Hazard",
    type: "text",
    required: true,
    validation: {
      min: 1,
      message: "Hazard is required",
    },
  },
  {
    name: "risk_level_before",
    label: "Risk Level Before",
    type: "number",
    required: false,
    validation: {
      min: 1,
      max: 5,
      message: "Risk level must be 1–5",
    },
  },
  {
    name: "control",
    label: "Control Measure",
    type: "text",
    required: true,
    validation: {
      min: 1,
      message: "Control is required",
    },
  },
  {
    name: "risk_level_after",
    label: "Risk Level After",
    type: "number",
    required: false,
    validation: {
      min: 1,
      max: 5,
      message: "Risk level must be 1–5",
    },
  },
];

// Photo Module Fields
export const PHOTO_FIELDS: FieldDefinition[] = [
  {
    name: "photo_url",
    label: "Photo",
    type: "text",
    required: true,
    validation: {
      pattern: urlRegex.source,
      message: "Invalid photo URL",
    },
  },
  {
    name: "photo_description",
    label: "Description",
    type: "text",
    required: false,
  },
];

// Signature Module Fields
export const SIGNATURE_FIELDS: FieldDefinition[] = [
  {
    name: "worker_name",
    label: "Worker Name",
    type: "text",
    required: true,
    validation: {
      min: 1,
      message: "Worker name is required",
    },
  },
  {
    name: "signature_url",
    label: "Signature",
    type: "text",
    required: true,
    validation: {
      pattern: urlRegex.source,
      message: "Invalid signature URL",
    },
  },
  {
    name: "role",
    label: "Role",
    type: "text",
    required: false,
  },
];

// Module field mapping
export const MODULE_FIELD_MAP: Record<string, FieldDefinition[]> = {
  general: GENERAL_INFO_FIELDS,
  preJobChecklist: PRE_JOB_CHECKLIST_FIELDS,
  ppeChecklist: PPE_CHECKLIST_FIELDS,
  taskHazards: TASK_HAZARD_FIELDS,
  photos: PHOTO_FIELDS,
  signatures: SIGNATURE_FIELDS,
};

// Field validation helper
export function validateFieldDefinition(field: FieldDefinition): string[] {
  const errors: string[] = [];

  if (!field.name) {
    errors.push("Field name is required");
  }

  if (!field.label || field.label.trim().length < 2) {
    errors.push("Field label must be at least 2 characters");
  }

  const validTypes: FieldType[] = [
    "text",
    "boolean",
    "date",
    "time",
    "number",
    "textarea",
    "select",
    "multiselect",
  ];
  if (!validTypes.includes(field.type)) {
    errors.push(`Invalid field type: ${field.type}`);
  }

  // Validate select/multiselect fields have options
  if (
    (field.type === "select" || field.type === "multiselect") &&
    (!field.options || field.options.length === 0)
  ) {
    errors.push("Select fields must have at least one option");
  }

  // Validate options format
  if (field.options) {
    field.options.forEach((option, index) => {
      if (!option.label || !option.value) {
        errors.push(`Option ${index + 1} must have both label and value`);
      }
    });
  }

  return errors;
}

// Convert field definition to ModuleField (for dynamic rendering)
export function toModuleField(field: FieldDefinition, id: string): ModuleField {
  return {
    id,
    type: field.type as ModuleField["type"],
    label: field.label,
    required: field.required,
  };
}
