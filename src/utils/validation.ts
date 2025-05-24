import { z } from "zod";

export interface ValidationError {
  field: string;
  message: string;
  userField?: string; // Human-readable field name
}

// Map technical field names to user-friendly names
const fieldNameMap: Record<string, string> = {
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

  // PPE Checklist fields
  ppe_hardhat: "Hard Hat",
  ppe_safety_vest: "Safety Vest",
  ppe_safety_glasses: "Safety Glasses",
  ppe_fall_protection: "Fall Protection",
  ppe_coveralls: "Coveralls",
  ppe_gloves: "Gloves",
  ppe_mask: "Mask",
  ppe_respirator: "Respirator",

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
};

// Module-specific field label maps for array modules
const arrayModuleFieldLabels: Record<string, Record<string, string>> = {
  taskHazards: {
    id: "Task",
    task: "Task",
    hazard: "Hazard",
    risk_level_before: "Initial Risk Level",
    control: "Control Measure",
    risk_level_after: "Final Risk Level",
  },
  photos: {
    id: "Photo",
    photo_url: "Photo",
    description: "Description",
  },
  signatures: {
    id: "Signature",
    worker_name: "Worker Name",
    signature_url: "Signature",
    role: "Role",
  },
};

/**
 * Gets display name for module keys
 */
function getModuleDisplayName(moduleKey: string): string {
  const moduleNames: Record<string, string> = {
    header: "Form Header",
    general: "General Information",
    preJobChecklist: "Pre-Job Checklist",
    ppeChecklist: "PPE Checklist",
    taskHazards: "Task Hazards",
    photos: "Photos",
    signatures: "Signatures",
  };
  return moduleNames[moduleKey] || moduleKey;
}

/**
 * Gets a user-friendly field name
 * @param field The technical field name
 * @param message The error message
 * @param moduleKey The module key (optional)
 * @returns The user-friendly field name
 */
function getUserFieldName(
  field: string,
  message?: string,
  moduleKey?: string
): string {
  const parts = field.split(".");

  // Handle array indices (e.g., "0.task" for array modules)
  if (parts.length === 2 && !isNaN(Number(parts[0]))) {
    const index = Number(parts[0]) + 1;
    const property = parts[1];

    // If we have a moduleKey and it's an array module, use specific labels
    if (moduleKey && arrayModuleFieldLabels[moduleKey]) {
      const label =
        arrayModuleFieldLabels[moduleKey][property] ||
        fieldNameMap[property] ||
        property;
      return `${label} #${index}`;
    }

    const label = fieldNameMap[property] || property;
    return `${label} #${index}`;
  }

  // Handle nested array paths (e.g., "taskHazards.0.task")
  if (parts.length > 2 && !isNaN(Number(parts[1]))) {
    const arrayKey = parts[0];
    const index = Number(parts[1]) + 1;
    const property = parts[2];

    // Use the array module labels if available
    if (arrayModuleFieldLabels[arrayKey]) {
      const label =
        arrayModuleFieldLabels[arrayKey][property] ||
        fieldNameMap[property] ||
        property;
      return `${label} #${index}`;
    }

    const label = fieldNameMap[property] || property;
    return `${label} #${index}`;
  }

  return fieldNameMap[field] || field;
}

/**
 * Formats Zod validation errors into user-friendly messages
 * @param error The ZodError to format
 * @param moduleKey The module key (optional)
 * @returns Array of field-specific error messages
 */
export function formatZodErrors(
  error: z.ZodError,
  moduleKey?: string
): ValidationError[] {
  return error.issues.map((issue) => {
    const field = issue.path.join(".");
    let message = issue.message;
    return {
      field,
      message,
      userField: getUserFieldName(field, message, moduleKey),
    };
  });
}

/**
 * Enhanced error formatting with module context for better UX
 * @param error The ZodError to format
 * @param moduleKey The module key for context-aware error messages
 * @returns Array of field-specific error messages with enhanced context
 */
export function formatZodErrorsWithContext(
  error: z.ZodError,
  moduleKey?: string
): ValidationError[] {
  return error.issues.map((issue) => {
    const field = issue.path.join(".");
    let message = issue.message;

    // Enhance message based on context
    if (moduleKey) {
      // Add module context to error messages
      const moduleDisplayName = getModuleDisplayName(moduleKey);
      if (issue.path.length === 0) {
        message = `${moduleDisplayName}: ${message}`;
      }
    }

    return {
      field,
      message,
      userField: getUserFieldName(field, message, moduleKey),
    };
  });
}

/**
 * Formats a single validation error message for display
 * @param error The ZodError to format
 * @returns A user-friendly error message
 */
export function formatZodErrorSummary(error: z.ZodError): string {
  const errors = formatZodErrors(error);
  if (errors.length === 1) {
    return `${errors[0].userField}: ${errors[0].message}`;
  }
  return `${errors.length} validation errors found. Please check the form.`;
}

/**
 * Creates a validation error map for easy field lookup
 * @param errors Array of validation errors
 * @returns Map of field names to error messages
 */
export function createValidationErrorMap(
  errors: ValidationError[]
): Record<string, string[]> {
  const errorMap: Record<string, string[]> = {};

  errors.forEach((error) => {
    if (!errorMap[error.field]) {
      errorMap[error.field] = [];
    }
    errorMap[error.field].push(error.message);
  });

  return errorMap;
}

/**
 * Checks if a field has validation errors
 * @param fieldName The field name to check
 * @param errorMap The validation error map
 * @returns True if field has errors
 */
export function hasFieldError(
  fieldName: string,
  errorMap: Record<string, string[]>
): boolean {
  return !!(errorMap[fieldName] && errorMap[fieldName].length > 0);
}

/**
 * Gets error messages for a specific field
 * @param fieldName The field name
 * @param errorMap The validation error map
 * @returns Array of error messages for the field
 */
export function getFieldErrors(
  fieldName: string,
  errorMap: Record<string, string[]>
): string[] {
  return errorMap[fieldName] || [];
}
