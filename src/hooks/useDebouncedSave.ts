import { useRef, useState, useCallback } from "react";
import { debounce } from "lodash";
import { saveFormModuleData } from "../services/forms/saveFormModuleData";
import { SaveFormModuleDataParams } from "../types/formTypes";
import { useToast } from "./useToast";
import { useSaveQueue } from "./useSaveQueue";
import { useModuleState } from "./useModuleState";
import { ModuleKey } from "../types/formTypes";
import { ValidationError } from "../utils/validation";

interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  lastVersion: number | null;
  lastUpdatedAt: string | null;
  error: string | null;
  validationErrors: ValidationError[] | null;
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
  const saveQueueRef = useRef<Map<string, SaveFormModuleDataParams>>(new Map());

  const processSaveQueue = useCallback(async () => {
    if (saveQueueRef.current.size === 0) return;

    setSaveStatus((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      for (const [key, params] of saveQueueRef.current) {
        try {
          setModuleSaving(params.moduleKey, true);
          const result = await saveFormModuleData(params);

          if (result.error) {
            if (result.error === "CONCURRENT_MODIFICATION") {
              showToast({
                message:
                  "Someone else has modified this form. Please refresh to get the latest changes.",
                type: "error",
              });
              setSaveStatus((prev) => ({
                isSaving: prev.isSaving,
                lastSaved: prev.lastSaved,
                lastVersion: prev.lastVersion,
                lastUpdatedAt: prev.lastUpdatedAt,
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
              showToast({
                message:
                  "You're offline. Changes will be saved when you're back online.",
                type: "warning",
              });
              setModuleError(params.moduleKey, "Offline - changes queued");
              continue;
            }

            showToast({ message: result.error, type: "error" });
            setSaveStatus((prev) => ({
              isSaving: prev.isSaving,
              lastSaved: prev.lastSaved,
              lastVersion: prev.lastVersion,
              lastUpdatedAt: prev.lastUpdatedAt,
              error: result.error || null,
              validationErrors: result.validationErrors || null,
            }));
            setModuleError(params.moduleKey, result.error);
            continue;
          }

          setSaveStatus((prev) => ({
            isSaving: prev.isSaving,
            lastSaved: new Date(),
            lastVersion: params.version || null,
            lastUpdatedAt: params.updated_at || null,
            error: null,
            validationErrors: null,
          }));

          setModuleSaved(
            params.moduleKey,
            params.updated_at || new Date().toISOString()
          );
          saveQueueRef.current.delete(key);
        } catch (error) {
          console.error("Error saving fields:", error);
          showToast({
            message: "Failed to save changes. Will retry automatically.",
            type: "error",
          });
          setSaveStatus((prev) => ({
            isSaving: prev.isSaving,
            lastSaved: prev.lastSaved,
            lastVersion: prev.lastVersion,
            lastUpdatedAt: prev.lastUpdatedAt,
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
    (params: SaveFormModuleDataParams) => {
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
