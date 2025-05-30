import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useFlraFormState } from './useFormState';
import { 
  AutoSaveConfig, 
  AutoSaveStatus,
  DEFAULT_AUTO_SAVE_CONFIG 
} from '../../../types/formStateTypes';

export interface AutoSaveHookReturn extends AutoSaveStatus {
  pauseAutoSave: () => void;
  resumeAutoSave: () => void;
  forceSave: () => Promise<void>;
  retryFailedSaves: () => Promise<void>;
  setConfig: (newConfig: Partial<AutoSaveConfig>) => void;
}

/**
 * Advanced auto-save orchestration hook for FLRA forms
 * Integrates with Phase 3 state management and enhances with intelligent timing
 */
export function useAutoSave(
  formId: string,
  formState: ReturnType<typeof useFlraFormState>,
  config: Partial<AutoSaveConfig> = {}
): AutoSaveHookReturn {
  const fullConfig = { ...DEFAULT_AUTO_SAVE_CONFIG, ...config };
  const networkStatus = useNetworkStatus({ 
    autoSaveOnReconnect: true,
    enableSlowConnectionDetection: fullConfig.networkAware 
  });

  const [status, setStatus] = useState<AutoSaveStatus>({
    isAutoSaving: false,
    queuedSaves: 0,
    failedSaves: 0,
    isPaused: false,
    totalSaves: 0,
    totalFailures: 0,
  });

  const [currentConfig, setCurrentConfig] = useState(fullConfig);
  const saveQueueRef = useRef<Set<string>>(new Set());
  const failedSavesRef = useRef<Set<string>>(new Set());
  const lastSaveAttemptRef = useRef<Record<string, number>>({});
  const metricsRef = useRef({
    totalSaveTime: 0,
    saveCount: 0,
  });

  // Adaptive timing based on field type and user behavior
  const getAdaptiveDelay = useCallback((moduleId: string): number => {
    if (!currentConfig.adaptiveTiming) return currentConfig.debounceMs;

    // Slow down auto-save on slow connections
    if (networkStatus.isSlowConnection) {
      return currentConfig.debounceMs * 2;
    }

    // Speed up for simple modules, slow down for complex ones
    const module = formState.template.modules.find(m => m.id === moduleId);
    if (module?.usesFields && module.fieldDefinitions) {
      const fieldCount = module.fieldDefinitions.length;
      if (fieldCount > 20) return currentConfig.debounceMs * 1.5; // Complex forms
      if (fieldCount < 5) return currentConfig.debounceMs * 0.7; // Simple forms
    }

    return currentConfig.debounceMs;
  }, [currentConfig.adaptiveTiming, currentConfig.debounceMs, networkStatus.isSlowConnection, formState.template.modules]);

  // Save operation with conflict and error handling
  const performSave = useCallback(async (moduleIds: string[]): Promise<boolean> => {
    if (!currentConfig.enabled || status.isPaused) return false;

    setStatus(prev => ({ ...prev, isAutoSaving: true }));

    let allSuccessful = true;
    const savedModules: string[] = [];
    const saveStartTime = Date.now();

    try {
      for (const moduleId of moduleIds) {
        // Check for conflicts
        const hasConflict = formState.selectors.hasModuleConflict(moduleId);
        if (hasConflict && currentConfig.conflictStrategy === 'pause') {
          setStatus(prev => ({ 
            ...prev, 
            isPaused: true, 
            pauseReason: 'conflict'
          }));
          continue;
        }

        // Skip if module is already saving
        if (formState.selectors.isModuleSaving(moduleId)) {
          continue;
        }

        try {
          await formState.actions.saveModule(moduleId);
          savedModules.push(moduleId);
          saveQueueRef.current.delete(moduleId);
          failedSavesRef.current.delete(moduleId);
          lastSaveAttemptRef.current[moduleId] = Date.now();
        } catch (error) {
          console.warn(`Auto-save failed for module ${moduleId}:`, error);
          failedSavesRef.current.add(moduleId);
          allSuccessful = false;

          // Handle network errors
          if (!networkStatus.isOnline) {
            setStatus(prev => ({ 
              ...prev, 
              isPaused: true, 
              pauseReason: 'offline'
            }));
            break;
          }
        }
      }

      // Update metrics
      const saveTime = Date.now() - saveStartTime;
      metricsRef.current.totalSaveTime += saveTime;
      metricsRef.current.saveCount += savedModules.length;

      setStatus(prev => ({
        ...prev,
        lastAutoSave: savedModules.length > 0 ? new Date() : prev.lastAutoSave,
        queuedSaves: saveQueueRef.current.size,
        failedSaves: failedSavesRef.current.size,
        totalSaves: prev.totalSaves + savedModules.length,
        totalFailures: prev.totalFailures + (moduleIds.length - savedModules.length),
        averageSaveTime: metricsRef.current.saveCount > 0 ? 
          metricsRef.current.totalSaveTime / metricsRef.current.saveCount : undefined,
        successRate: prev.totalSaves + prev.totalFailures > 0 ?
          (prev.totalSaves + savedModules.length) / (prev.totalSaves + prev.totalFailures + moduleIds.length) : 1,
      }));

    } finally {
      setStatus(prev => ({ ...prev, isAutoSaving: false }));
    }

    return allSuccessful;
  }, [currentConfig.enabled, currentConfig.conflictStrategy, status.isPaused, formState.actions, formState.selectors, networkStatus.isOnline]);

  // Debounced save function with adaptive timing
  const debouncedSave = useDebounce(
    useCallback(async (moduleIds: string[]) => {
      if (currentConfig.batchSaves && moduleIds.length > 1) {
        await performSave(moduleIds);
      } else {
        // Save one by one if batching is disabled
        for (const moduleId of moduleIds) {
          await performSave([moduleId]);
        }
      }
    }, [performSave, currentConfig.batchSaves]),
    { 
      delay: currentConfig.debounceMs,
      maxWait: currentConfig.debounceMs * 3, // Ensure saves happen within reasonable time
    }
  );

  // Monitor dirty state changes and trigger auto-save
  useEffect(() => {
    if (!currentConfig.enabled || status.isPaused) return;

    const dirtyModules = Array.from(formState.formData.dirty);
    if (dirtyModules.length === 0) return;

    // Add to save queue
    dirtyModules.forEach(moduleId => saveQueueRef.current.add(moduleId));
    setStatus(prev => ({ ...prev, queuedSaves: saveQueueRef.current.size }));

    // Trigger debounced save
    debouncedSave(dirtyModules);
  }, [formState.formData.dirty, currentConfig.enabled, status.isPaused, debouncedSave]);

  // Auto-resume when conflicts are resolved
  useEffect(() => {
    if (status.isPaused && status.pauseReason === 'conflict') {
      const hasAnyConflicts = formState.template.modules.some(module => 
        formState.selectors.hasModuleConflict(module.id)
      );
      
      if (!hasAnyConflicts) {
        setStatus(prev => ({ ...prev, isPaused: false, pauseReason: undefined }));
      }
    }
  }, [formState.template.modules, formState.selectors, status.isPaused, status.pauseReason]);

  // Auto-resume when back online
  useEffect(() => {
    if (status.isPaused && status.pauseReason === 'offline' && networkStatus.isOnline) {
      setStatus(prev => ({ ...prev, isPaused: false, pauseReason: undefined }));
      
      // Trigger save for queued items
      if (saveQueueRef.current.size > 0) {
        debouncedSave(Array.from(saveQueueRef.current));
      }
    }
  }, [networkStatus.isOnline, status.isPaused, status.pauseReason, debouncedSave]);

  // Save on page unload
  useEffect(() => {
    if (!currentConfig.saveOnUnload) return;

    const handleBeforeUnload = () => {
      if (saveQueueRef.current.size > 0) {
        debouncedSave.flush(); // Force immediate save
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentConfig.saveOnUnload, debouncedSave]);

  // Save on visibility change (tab switch, minimize)
  useEffect(() => {
    if (!currentConfig.saveOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (document.hidden && saveQueueRef.current.size > 0) {
        debouncedSave.flush();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentConfig.saveOnVisibilityChange, debouncedSave]);

  // Control functions
  const pauseAutoSave = useCallback(() => {
    setStatus(prev => ({ ...prev, isPaused: true, pauseReason: 'manual' }));
    debouncedSave.cancel();
  }, [debouncedSave]);

  const resumeAutoSave = useCallback(() => {
    setStatus(prev => ({ ...prev, isPaused: false, pauseReason: undefined }));
    
    // Trigger save for any dirty modules
    const dirtyModules = Array.from(formState.formData.dirty);
    if (dirtyModules.length > 0) {
      debouncedSave(dirtyModules);
    }
  }, [debouncedSave, formState.formData.dirty]);

  const forceSave = useCallback(async () => {
    debouncedSave.cancel(); // Cancel pending debounced save
    const dirtyModules = Array.from(formState.formData.dirty);
    if (dirtyModules.length > 0) {
      await performSave(dirtyModules);
    }
  }, [debouncedSave, formState.formData.dirty, performSave]);

  const retryFailedSaves = useCallback(async () => {
    const failedModules = Array.from(failedSavesRef.current);
    if (failedModules.length > 0) {
      await performSave(failedModules);
    }
  }, [performSave]);

  const setConfig = useCallback((newConfig: Partial<AutoSaveConfig>) => {
    setCurrentConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  return {
    ...status,
    pauseAutoSave,
    resumeAutoSave,
    forceSave,
    retryFailedSaves,
    setConfig,
  };
} 