import { useRef, useState, useCallback } from "react";
import { debounce } from "lodash";
import {
  saveFormHeader,
  SaveFormHeaderInput,
} from "../services/forms/saveFormHeader";
import { useToast } from "./useToast";
import { ValidationError } from "../utils/validation";

interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  validationErrors: Record<string, string[]> | null;
}

export function useDebouncedFormHeaderSave(delay = 1000) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    isSaving: false,
    lastSaved: null,
    error: null,
    validationErrors: null,
  });

  const { showToast } = useToast();
  const saveQueueRef = useRef<Map<string, SaveFormHeaderInput>>(new Map());

  const processSaveQueue = useCallback(async () => {
    if (saveQueueRef.current.size === 0) return;

    setSaveStatus((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      for (const [key, params] of saveQueueRef.current) {
        try {
          const result = await saveFormHeader(params);

          if (!result.success) {
            if (result.validationErrors) {
              showToast({
                type: "error",
                message:
                  "Validation failed: " +
                  result.validationErrors.map((e) => e.message).join(", "),
              });
              setSaveStatus((prev) => ({
                ...prev,
                error: "Validation failed",
                validationErrors:
                  result.validationErrors?.reduce((acc, err) => {
                    const path = "root"; // Since we don't have path in ValidationError
                    acc[path] = acc[path] || [];
                    acc[path].push(err.message);
                    return acc;
                  }, {} as Record<string, string[]>) || null,
              }));
            } else {
              showToast({
                type: "error",
                message: result.error?.message || "Failed to save form header",
              });
              setSaveStatus((prev) => ({
                ...prev,
                error: result.error?.message || "Failed to save form header",
                validationErrors: null,
              }));
            }
            continue;
          }

          setSaveStatus((prev) => ({
            ...prev,
            lastSaved: new Date(),
            error: null,
            validationErrors: null,
          }));

          saveQueueRef.current.delete(key);
        } catch (error) {
          console.error("Error saving form header:", error);
          showToast({
            type: "error",
            message: "Failed to save changes. Will retry automatically.",
          });
          setSaveStatus((prev) => ({
            ...prev,
            error: "Failed to save changes",
            validationErrors: null,
          }));
        }
      }
    } finally {
      setSaveStatus((prev) => ({ ...prev, isSaving: false }));
    }
  }, [showToast]);

  const debouncedProcessQueue = useCallback(debounce(processSaveQueue, delay), [
    processSaveQueue,
    delay,
  ]);

  const save = useCallback(
    (params: SaveFormHeaderInput) => {
      const key = `${params.formId}`;
      saveQueueRef.current.set(key, params);
      debouncedProcessQueue();
    },
    [debouncedProcessQueue]
  );

  const retry = useCallback(() => {
    processSaveQueue();
  }, [processSaveQueue]);

  return {
    save,
    retry,
    saveStatus,
  };
}
