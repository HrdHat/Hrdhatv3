/**
 * Centralized Validation Error Mapping
 *
 * This utility provides consistent error message formatting and field name mapping
 * across the entire application. All validation errors should flow through this system.
 */

import type { ZodError, ZodIssue } from "zod";
import type { ModuleKey } from "../types/formTypes";

// User-friendly field names for all modules
const FIELD_NAME_MAP: Record<string, string> = {
  // General Info fields
  project_name: "Project Name",
  project_address: "Project Address",
  task_location: "Task Location",
  supervisor_name: "Supervisor Name",
  supervisor_contact: "Supervisor Contact",
  date: "Date",
  crew_members_count: "Number of Crew Members",
  task_description: "Task Description",
  start_time: "Start Time",
  end_time: "End Time",

  // Pre-Job Checklist fields
  is_fit_for_duty: "Fit for Duty",
  reviewed_work_area_for_hazards: "Work Area Review",
  required_ppe_for_today: "PPE Available",
  equipment_inspection_up_to_date: "Equipment Inspection",
  completed_flra_hazard_assessment: "FLRA Assessment",
  safety_signage_installed_and_checked: "Safety Signage",
  working_alone_today: "Working Alone",
  required_permits_for_tasks: "Required Permits",
  barricades_signage_barriers_installed_good: "Barricades/Barriers",
  clear_access_to_emergency_exits: "Emergency Access",
  trained_and_competent_for_tasks: "Training/Competency",
  inspected_tools_and_equipment: "Tools Inspection",
  reviewed_control_measures_needed: "Control Measures",
  reviewed_emergency_procedures: "Emergency Procedures",
  all_required_permits_in_place: "All Permits",
  communicated_with_crew_about_plan: "Crew Communication",
  need_for_spotters_barricades_special_controls: "Special Controls",
  weather_suitable_for_work: "Weather Conditions",
  know_designated_first_aid_attendant: "First Aid Contact",
  aware_of_site_notices_or_bulletins: "Site Notices",

  // PPE Checklist fields
  ppe_hardhat: "Hard Hat",
  ppe_safety_vest: "Safety Vest",
  ppe_safety_glasses: "Safety Glasses",
  ppe_fall_protection: "Fall Protection",
  ppe_coveralls: "Coveralls",
  ppe_gloves: "Gloves",
  ppe_mask: "Mask",
  ppe_respirator: "Respirator",

  // Platform fields
  platform_ladder: "Ladder",
  platform_step_bench: "Step Bench",
  platform_sawhorses: "Sawhorses",
  platform_baker_scaffold: "Baker Scaffold",
  platform_scaffold: "Scaffold",
  platform_scissor_lift: "Scissor Lift",
  platform_boom_lift: "Boom Lift",
  platform_swing_stage: "Swing Stage",
  platform_hydro_lift: "Hydro Lift",

  // Task Hazard fields
  task: "Task",
  hazard: "Hazard",
  risk_level_before: "Initial Risk Level",
  control: "Control Measure",
  risk_level_after: "Final Risk Level",

  // Photo fields
  photo_url: "Photo",
  description: "Description",

  // Signature fields
  worker_name: "Worker Name",
  signature_url: "Signature",
  role: "Role",
  signature_hash: "Signature Hash",

  // Common fields
  id: "ID",
  form_id: "Form ID",
  form_module_id: "Module ID",
  created_at: "Created At",
  updated_at: "Updated At",
  version: "Version",
};

// Module-specific field labels for array modules
const ARRAY_MODULE_FIELD_LABELS: Record<string, Record<string, string>> = {
  taskHazards: {
    task: "Task",
    hazard: "Hazard",
    risk_level_before: "Initial Risk Level",
    control: "Control Measure",
    risk_level_after: "Final Risk Level",
  },
  photos: {
    photo_url: "Photo",
    description: "Description",
  },
  signatures: {
    worker_name: "Worker Name",
    signature_url: "Signature",
    role: "Role",
  },
};

// Error message type mapping
const ERROR_TYPE_MESSAGES: Record<string, string> = {
  too_small: "Value is too small",
  too_big: "Value is too large",
  invalid_type: "Invalid type",
  invalid_literal: "Invalid value",
  invalid_union: "Invalid value",
  invalid_enum_value: "Invalid selection",
  unrecognized_keys: "Unknown fields",
  invalid_arguments: "Invalid arguments",
  invalid_return_type: "Invalid return type",
  invalid_date: "Invalid date",
  invalid_string: "Invalid text",
  too_small_array: "Not enough items",
  too_big_array: "Too many items",
  invalid_intersection_types: "Invalid combination",
  not_multiple_of: "Must be a multiple of the specified value",
  custom: "Validation failed",
};

export interface FieldError {
  field: string;
  message: string;
  path: string[];
}

export interface ValidationErrorResult {
  errors: FieldError[];
  fieldErrors: Record<string, string[]>;
  hasErrors: boolean;
}

/**
 * Get user-friendly field name
 */
export function getUserFieldName(field: string, moduleKey?: ModuleKey): string {
  const parts = field.split(".");

  // Handle array indices (e.g., "0.task" for array modules)
  if (parts.length === 2 && !isNaN(Number(parts[0]))) {
    const index = Number(parts[0]) + 1;
    const property = parts[1];

    if (moduleKey && ARRAY_MODULE_FIELD_LABELS[moduleKey]) {
      const label =
        ARRAY_MODULE_FIELD_LABELS[moduleKey][property] ||
        FIELD_NAME_MAP[property] ||
        property;
      return `${label} #${index}`;
    }

    const label = FIELD_NAME_MAP[property] || property;
    return `${label} #${index}`;
  }

  // Handle nested array paths (e.g., "taskHazards.0.task")
  if (parts.length > 2 && !isNaN(Number(parts[1]))) {
    const arrayKey = parts[0];
    const index = Number(parts[1]) + 1;
    const property = parts[2];

    if (ARRAY_MODULE_FIELD_LABELS[arrayKey]) {
      const label =
        ARRAY_MODULE_FIELD_LABELS[arrayKey][property] ||
        FIELD_NAME_MAP[property] ||
        property;
      return `${label} #${index}`;
    }

    const label = FIELD_NAME_MAP[property] || property;
    return `${label} #${index}`;
  }

  return FIELD_NAME_MAP[field] || field;
}

/**
 * Format a single Zod issue into a user-friendly error
 */
export function formatZodIssue(
  issue: ZodIssue,
  moduleKey?: ModuleKey
): FieldError {
  const path = issue.path.join(".");
  const fieldName = getUserFieldName(path, moduleKey);

  let message = issue.message;

  // Use custom error messages for common validation types
  if (issue.code === "too_small") {
    if (issue.minimum === 1) {
      message = `${fieldName} is required`;
    } else {
      message = `${fieldName} must be at least ${issue.minimum}`;
    }
  } else if (issue.code === "too_big") {
    message = `${fieldName} must be at most ${issue.maximum}`;
  } else if (issue.code === "invalid_type") {
    message = `${fieldName} must be a ${issue.expected}`;
  } else if (issue.code === "invalid_enum_value") {
    message = `${fieldName} must be one of: ${issue.options.join(", ")}`;
  } else if (ERROR_TYPE_MESSAGES[issue.code]) {
    message = `${fieldName}: ${ERROR_TYPE_MESSAGES[issue.code]}`;
  }

  return {
    field: path,
    message,
    path: issue.path.map(String),
  };
}

/**
 * Format Zod validation errors into user-friendly messages
 */
export function formatZodErrors(
  error: ZodError,
  moduleKey?: ModuleKey
): ValidationErrorResult {
  const errors: FieldError[] = [];
  const fieldErrors: Record<string, string[]> = {};

  error.issues.forEach((issue) => {
    const fieldError = formatZodIssue(issue, moduleKey);
    errors.push(fieldError);

    // Group errors by field
    if (!fieldErrors[fieldError.field]) {
      fieldErrors[fieldError.field] = [];
    }
    fieldErrors[fieldError.field].push(fieldError.message);
  });

  return {
    errors,
    fieldErrors,
    hasErrors: errors.length > 0,
  };
}

/**
 * Get validation errors for a specific field
 */
export function getFieldErrors(
  fieldErrors: Record<string, string[]>,
  fieldName: string
): string[] {
  return fieldErrors[fieldName] || [];
}

/**
 * Get the first error message for a field
 */
export function getFieldError(
  fieldErrors: Record<string, string[]>,
  fieldName: string
): string | undefined {
  const errors = getFieldErrors(fieldErrors, fieldName);
  return errors[0];
}

/**
 * Format validation errors for display in UI
 */
export function formatErrorsForDisplay(result: ValidationErrorResult): string {
  if (!result.hasErrors) {
    return "";
  }

  const errorMessages = result.errors.map((err) => err.message);

  if (errorMessages.length === 1) {
    return errorMessages[0];
  }

  return `Please fix the following errors:\n${errorMessages
    .map((msg) => `• ${msg}`)
    .join("\n")}`;
}

/**
 * Create a validation error response
 */
export function createValidationError(
  message: string,
  fieldErrors?: Record<string, string[]>
): ValidationErrorResult {
  return {
    errors: [
      {
        field: "",
        message,
        path: [],
      },
    ],
    fieldErrors: fieldErrors || {},
    hasErrors: true,
  };
}
