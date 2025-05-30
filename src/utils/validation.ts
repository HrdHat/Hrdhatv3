/**
 * Validation Utilities - CRITICAL SYSTEM FILE
 * ===========================================
 *
 * This file provides core validation utilities used throughout the application.
 * DO NOT MODIFY without understanding the full impact on validation error handling.
 *
 * These utilities format Zod validation errors into user-friendly messages
 * and provide field-level error management for the UI.
 */

// Map technical field names to user-friendly names
const fieldNameMap: Record<string, string> = {
  // General Info fields
  project_name: "Project Name",
  project_address: "Project Address",
  location: "Task Location",
  supervisor_name: "Supervisor Name",
  supervisor_contact: "Supervisor Contact",
  form_date: "Date",
  crew_members_count: "Number of Crew Members",
  work_description: "Task Description",
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

// Add new lightweight validation helper
export function validateField(type: string, value: any, required = false): boolean {
  if (required && (value === undefined || value === null || value === '')) return false;
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return true;
  }
}
