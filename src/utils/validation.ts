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

/**
 * Gets a user-friendly field name
 * @param field The technical field name
 * @returns The user-friendly field name
 */
function getUserFieldName(field: string): string {
  // Handle array indices (e.g., "photos.0.photo_url" -> "Photo #1")
  const parts = field.split(".");
  if (parts.length > 1 && !isNaN(Number(parts[1]))) {
    const index = Number(parts[1]) + 1;
    const baseField = parts[parts.length - 1];
    return `${fieldNameMap[baseField] || baseField} #${index}`;
  }
  return fieldNameMap[field] || field;
}

/**
 * Formats Zod validation errors into user-friendly messages
 * @param error The ZodError to format
 * @returns Array of field-specific error messages
 */
export function formatZodErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => {
    const field = issue.path.join(".");
    const userField = getUserFieldName(field);

    // Customize error messages for common cases
    let message = issue.message;
    if (message.includes("Invalid date format")) {
      message = "Please enter a valid date (YYYY-MM-DD)";
    } else if (message.includes("Invalid time format")) {
      message = "Please enter a valid time (HH:MM)";
    } else if (message.includes("Invalid phone number format")) {
      message = "Please enter a valid phone number";
    } else if (message.includes("Invalid UUID format")) {
      message = "Invalid ID format";
    }

    return {
      field,
      message,
      userField,
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
