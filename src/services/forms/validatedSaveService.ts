/**
 * Validated Save Service
 *
 * This service implements the error boundary pattern from plan 1.3.5 part C.
 * It validates data before save and provides enhanced error handling and UX.
 */

import { saveFormModuleData, ModuleKey } from "./saveFormModuleData";
import { schemaMap } from "../../types/formValidationSchemas";
import {
  formatZodErrorsWithContext,
  ValidationError,
} from "../../utils/validation";
import toast from "react-hot-toast";

export interface ValidatedSaveResult {
  success: boolean;
  error?: string;
  validationErrors?: ValidationError[];
}

export interface ValidatedSaveParams {
  formId: string;
  moduleKey: ModuleKey;
  data: any;
  moduleId?: string;
  showToast?: boolean;
}

/**
 * Save form module data with validation error boundary
 * Implements the pattern from plan 1.3.5 part C
 */
export async function saveWithValidation({
  formId,
  moduleKey,
  data,
  moduleId,
  showToast = true,
}: ValidatedSaveParams): Promise<ValidatedSaveResult> {
  /**
   * VALIDATION RULE: All module data must pass Zod validation before save.
   * This prevents invalid data from being persisted to the database.
   * Any validation failure must be shown to the user and block the save.
   */
  // Error boundary at save-time - validate before any save attempt
  const schema = schemaMap[moduleKey];
  if (!schema) {
    const error = `No validation schema found for module key: ${moduleKey}`;
    if (showToast) {
      toast.error(error);
    }
    return { success: false, error };
  }

  const result = schema.safeParse(data);
  if (!result.success) {
    // Format errors with moduleKey so you get "Task #1" instead of "0.id"
    const errors = formatZodErrorsWithContext(result.error, moduleKey);

    // Surface them in toast
    if (showToast) {
      const errorMessage =
        errors.length === 1
          ? `${errors[0].userField}: ${errors[0].message}`
          : `Validation failed: ${errors.map((e) => e.message).join("; ")}`;

      toast.error(errorMessage, {
        duration: 5000,
        position: "top-right",
      });
    }

    return { success: false, validationErrors: errors };
  }

  // Data is valid, proceed with save
  try {
    const saveResult = await saveFormModuleData({
      formId,
      moduleKey,
      data,
      moduleId,
    });

    if (!saveResult.success && showToast) {
      toast.error(saveResult.error || "Failed to save data");
    }

    return saveResult;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to save data";
    if (showToast) {
      toast.error(errorMessage);
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Batch save multiple modules with validation
 */
export async function batchSaveWithValidation(
  saves: ValidatedSaveParams[]
): Promise<ValidatedSaveResult[]> {
  const results: ValidatedSaveResult[] = [];

  for (const saveParams of saves) {
    const result = await saveWithValidation({
      ...saveParams,
      showToast: false, // Don't show individual toasts for batch operations
    });
    results.push(result);
  }

  // Show summary toast for batch operation
  const failedSaves = results.filter((r) => !r.success);
  if (failedSaves.length > 0) {
    const totalErrors = failedSaves.reduce(
      (sum, result) => sum + (result.validationErrors?.length || 1),
      0
    );
    toast.error(
      `${failedSaves.length} modules failed to save with ${totalErrors} validation errors`
    );
  } else {
    toast.success(`Successfully saved ${saves.length} modules`);
  }

  return results;
}
