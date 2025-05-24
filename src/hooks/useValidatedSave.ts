import { useCallback } from "react";
import { useValidation } from "../contexts/ValidationContext";
import {
  saveFormModuleData,
  ModuleKey,
} from "../services/forms/saveFormModuleData";
import { schemaMap } from "../types/formValidationSchemas";
import { formatZodErrorsWithContext } from "../utils/validation";
import toast from "react-hot-toast";

interface UseValidatedSaveOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useValidatedSave(options: UseValidatedSaveOptions = {}) {
  const { setValidationErrors, clearValidationErrors } = useValidation();
  const { onSuccess, onError } = options;

  const saveWithValidation = useCallback(
    async (params: {
      formId: string;
      moduleKey: ModuleKey;
      data: any;
      moduleId?: string;
    }) => {
      // Clear previous validation errors
      clearValidationErrors();

      // Validate data before save
      const schema = schemaMap[params.moduleKey];
      if (!schema) {
        const errorMessage = `No validation schema found for module: ${params.moduleKey}`;
        toast.error(errorMessage);
        onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }

      const result = schema.safeParse(params.data);
      if (!result.success) {
        // Format errors with module context
        const errors = formatZodErrorsWithContext(
          result.error,
          params.moduleKey
        );

        // Set validation errors for inline display
        setValidationErrors(errors);

        // Show toast with summary
        const errorMessage =
          errors.length === 1
            ? `${errors[0].userField}: ${errors[0].message}`
            : `${errors.length} validation errors found. Please check the highlighted fields.`;

        toast.error(errorMessage, {
          duration: 5000,
          position: "top-right",
        });

        onError?.(errorMessage);
        return { success: false, validationErrors: errors };
      }

      // Data is valid, proceed with save
      try {
        const saveResult = await saveFormModuleData(params);

        if (!saveResult.success) {
          if (saveResult.validationErrors) {
            setValidationErrors(saveResult.validationErrors);
          }

          const errorMessage = saveResult.error || "Failed to save data";
          toast.error(errorMessage);
          onError?.(errorMessage);
          return saveResult;
        }

        // Success
        clearValidationErrors();
        onSuccess?.();
        return saveResult;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save data";
        toast.error(errorMessage);
        onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [setValidationErrors, clearValidationErrors, onSuccess, onError]
  );

  return { saveWithValidation };
}
