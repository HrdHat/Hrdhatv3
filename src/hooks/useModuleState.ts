import { useState, useCallback } from "react";
import { ModuleKey } from "../types/formTypes";

interface ModuleState {
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  hasError: boolean;
  error: string | null;
}

interface ModuleStates {
  [key: string]: ModuleState;
}

interface UseModuleStateReturn {
  getModuleState: (moduleKey: ModuleKey) => ModuleState;
  setModuleDirty: (moduleKey: ModuleKey, isDirty: boolean) => void;
  setModuleSaving: (moduleKey: ModuleKey, isSaving: boolean) => void;
  setModuleSaved: (moduleKey: ModuleKey, timestamp: string) => void;
  setModuleError: (moduleKey: ModuleKey, error: string | null) => void;
  resetModuleState: (moduleKey: ModuleKey) => void;
  resetAllStates: () => void;
}

const initialModuleState: ModuleState = {
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  hasError: false,
  error: null,
};

export function useModuleState(): UseModuleStateReturn {
  const [moduleStates, setModuleStates] = useState<ModuleStates>({});

  const getModuleState = useCallback(
    (moduleKey: ModuleKey): ModuleState => {
      return moduleStates[moduleKey] || initialModuleState;
    },
    [moduleStates]
  );

  const setModuleDirty = useCallback(
    (moduleKey: ModuleKey, isDirty: boolean) => {
      setModuleStates((prev) => ({
        ...prev,
        [moduleKey]: {
          ...(prev[moduleKey] || initialModuleState),
          isDirty,
        },
      }));
    },
    []
  );

  const setModuleSaving = useCallback(
    (moduleKey: ModuleKey, isSaving: boolean) => {
      setModuleStates((prev) => ({
        ...prev,
        [moduleKey]: {
          ...(prev[moduleKey] || initialModuleState),
          isSaving,
        },
      }));
    },
    []
  );

  const setModuleSaved = useCallback(
    (moduleKey: ModuleKey, timestamp: string) => {
      setModuleStates((prev) => ({
        ...prev,
        [moduleKey]: {
          ...(prev[moduleKey] || initialModuleState),
          isDirty: false,
          isSaving: false,
          lastSavedAt: timestamp,
          hasError: false,
          error: null,
        },
      }));
    },
    []
  );

  const setModuleError = useCallback(
    (moduleKey: ModuleKey, error: string | null) => {
      setModuleStates((prev) => ({
        ...prev,
        [moduleKey]: {
          ...(prev[moduleKey] || initialModuleState),
          isSaving: false,
          hasError: !!error,
          error,
        },
      }));
    },
    []
  );

  const resetModuleState = useCallback((moduleKey: ModuleKey) => {
    setModuleStates((prev) => ({
      ...prev,
      [moduleKey]: initialModuleState,
    }));
  }, []);

  const resetAllStates = useCallback(() => {
    setModuleStates({});
  }, []);

  return {
    getModuleState,
    setModuleDirty,
    setModuleSaving,
    setModuleSaved,
    setModuleError,
    resetModuleState,
    resetAllStates,
  };
}
