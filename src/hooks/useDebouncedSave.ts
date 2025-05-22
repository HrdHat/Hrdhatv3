import { useRef, useState, useCallback } from "react";
import { debounce } from "lodash";
import { saveFields, SaveFieldsParams } from "../services/forms/saveFields";
import { useToast } from "./useToast";
import { useSaveQueue } from "./useSaveQueue";
import { useModuleState } from "./useModuleState";
import { ModuleKey } from "../types/formTypes";

interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  lastVersion: number | null;
  lastUpdatedAt: string | null;
  error: string | null;
  validationErrors: Record<string, string[]> | null;
}

export function useDebouncedSave<T extends ModuleKey>(delay = 1000) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    isSaving: false,
    lastSaved: null,
    lastVersion: null,
    lastUpdatedAt: null,
    error: null,
    validationErrors: null,
  });

  const saveQueue = useSaveQueue();
  const { showToast } = useToast();
  const { setModuleDirty, setModuleSaving, setModuleSaved, setModuleError } =
    useModuleState();
  const saveQueueRef = useRef<Map<string, SaveFieldsParams>>(new Map());

  const processSaveQueue = useCallback(async () => {
    if (saveQueueRef.current.size === 0) return;

    setSaveStatus((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      for (const [key, params] of saveQueueRef.current) {
        try {
          setModuleSaving(params.moduleKey, true);
          const result = await saveFields(params);

          if (result.error) {
            if (result.error === "CONCURRENT_MODIFICATION") {
              showToast(
                "Someone else has modified this form. Please refresh to get the latest changes.",
                "error"
              );
              setSaveStatus((prev) => ({
                ...prev,
                error: "CONCURRENT_MODIFICATION",
                validationErrors: null,
              }));
              setModuleError(
                params.moduleKey,
                "Concurrent modification detected"
              );
              return;
            }

            // Add to save queue if offline or network error
            if (!navigator.onLine || result.error.includes("network")) {
              saveQueue.addToQueue(params);
              showToast(
                "You're offline. Changes will be saved when you're back online.",
                "warning"
              );
              setModuleError(params.moduleKey, "Offline - changes queued");
              continue;
            }

            showToast(result.error, "error");
            setSaveStatus((prev) => ({
              ...prev,
              error: result.error,
              validationErrors: null,
            }));
            setModuleError(params.moduleKey, result.error);
            continue;
          }

          setSaveStatus((prev) => ({
            ...prev,
            lastSaved: new Date(),
            lastVersion: result.version,
            lastUpdatedAt: result.updated_at,
            error: null,
            validationErrors: null,
          }));

          setModuleSaved(params.moduleKey, result.updated_at);
          saveQueueRef.current.delete(key);
        } catch (error) {
          console.error("Error saving fields:", error);
          showToast(
            "Failed to save changes. Will retry automatically.",
            "error"
          );
          setSaveStatus((prev) => ({
            ...prev,
            error: "Failed to save changes",
            validationErrors: null,
          }));
          setModuleError(params.moduleKey, "Failed to save changes");
        } finally {
          setModuleSaving(params.moduleKey, false);
        }
      }
    } finally {
      setSaveStatus((prev) => ({ ...prev, isSaving: false }));
    }
  }, [showToast, saveQueue, setModuleSaving, setModuleSaved, setModuleError]);

  const debouncedProcessQueue = useCallback(debounce(processSaveQueue, delay), [
    processSaveQueue,
    delay,
  ]);

  const save = useCallback(
    (params: SaveFieldsParams) => {
      const key = `${params.formId}-${params.moduleKey}`;
      saveQueueRef.current.set(key, params);
      setModuleDirty(params.moduleKey, true);
      debouncedProcessQueue();
    },
    [debouncedProcessQueue, setModuleDirty]
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
