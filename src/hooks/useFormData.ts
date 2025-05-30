import { useState, useCallback, useRef, useEffect } from 'react';

// State interfaces for Phase 3 implementation
export interface ConflictInfo {
  moduleId: string;
  conflictType: 'version_mismatch' | 'concurrent_edit' | 'data_changed';
  serverVersion: number;
  clientVersion: number;
  serverData: Record<string, unknown>;
  clientData: Record<string, unknown>;
  conflictedFields: string[];
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: 'accept_server' | 'accept_client' | 'merge_manual';
}

export interface OptimisticUpdate {
  id: string;
  moduleId: string;
  data: Record<string, unknown>;
  createdAt: Date;
  status: 'pending' | 'confirmed' | 'failed';
  error?: string;
}

export interface FormDataState {
  data: Record<string, Record<string, unknown>>; // { [moduleId]: moduleData }
  dirty: Set<string>;                           // Set of dirty moduleIds
  saving: Set<string>;                          // Set of moduleIds being saved
  errors: Record<string, string[]>;             // { [moduleId]: errorMessages }
  lastSaved: Record<string, Date>;              // { [moduleId]: lastSaveTime }
  versions: Record<string, number>;             // { [moduleId]: version }
  conflicts: Record<string, ConflictInfo>;      // { [moduleId]: conflictDetails }
  optimisticUpdates: Record<string, OptimisticUpdate[]>; // { [moduleId]: updates }
}

export interface FormDataConfig {
  enableOptimisticUpdates: boolean;
  conflictResolutionStrategy: 'server_wins' | 'client_wins' | 'manual';
  stateHistoryLimit: number;
  performanceTracking: boolean;
  persistState: boolean; // Whether to persist state to localStorage
}

const DEFAULT_CONFIG: FormDataConfig = {
  enableOptimisticUpdates: true,
  conflictResolutionStrategy: 'manual',
  stateHistoryLimit: 10,
  performanceTracking: false,
  persistState: true,
};

export function useFormData(
  formId: string,
  config: Partial<FormDataConfig> = {}
) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Main state
  const [state, setState] = useState<FormDataState>(() => {
    const initialState: FormDataState = {
      data: {},
      dirty: new Set(),
      saving: new Set(),
      errors: {},
      lastSaved: {},
      versions: {},
      conflicts: {},
      optimisticUpdates: {},
    };

    // Try to restore from localStorage if persistence is enabled
    if (fullConfig.persistState && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`formData_${formId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            ...initialState,
            data: parsed.data || {},
            versions: parsed.versions || {},
            lastSaved: Object.keys(parsed.lastSaved || {}).reduce((acc, key) => {
              acc[key] = new Date(parsed.lastSaved[key]);
              return acc;
            }, {} as Record<string, Date>),
            // Don't restore dirty/saving state - start fresh
          };
        }
      } catch (error) {
        console.warn('Failed to restore form state from localStorage:', error);
      }
    }

    return initialState;
  });

  // Performance tracking
  const performanceRef = useRef({
    renderCount: 0,
    lastRenderTime: Date.now(),
    updateCount: 0,
  });

  // Persist state to localStorage when it changes
  useEffect(() => {
    if (fullConfig.persistState && typeof window !== 'undefined') {
      try {
        const stateToStore = {
          data: state.data,
          versions: state.versions,
          lastSaved: Object.keys(state.lastSaved).reduce((acc, key) => {
            acc[key] = state.lastSaved[key].toISOString();
            return acc;
          }, {} as Record<string, string>),
        };
        localStorage.setItem(`formData_${formId}`, JSON.stringify(stateToStore));
      } catch (error) {
        console.warn('Failed to persist form state to localStorage:', error);
      }
    }
  }, [state.data, state.versions, state.lastSaved, formId, fullConfig.persistState]);

  // Track performance if enabled
  useEffect(() => {
    if (fullConfig.performanceTracking) {
      performanceRef.current.renderCount++;
      performanceRef.current.lastRenderTime = Date.now();
    }
  });

  // Core actions
  const updateModuleData = useCallback((
    moduleId: string, 
    data: Record<string, unknown>,
    options: { skipDirty?: boolean; optimistic?: boolean } = {}
  ) => {
    setState(prevState => {
      const newState = { ...prevState };
      
      // Update data
      newState.data = {
        ...prevState.data,
        [moduleId]: { ...prevState.data[moduleId], ...data }
      };

      // Mark as dirty unless explicitly skipped
      if (!options.skipDirty) {
        newState.dirty = new Set([...prevState.dirty, moduleId]);
      }

      // Clear errors for this module when data is updated
      if (prevState.errors[moduleId]) {
        newState.errors = { ...prevState.errors };
        delete newState.errors[moduleId];
      }

      // Handle optimistic updates
      if (options.optimistic && fullConfig.enableOptimisticUpdates) {
        const optimisticUpdate: OptimisticUpdate = {
          id: `${moduleId}_${Date.now()}`,
          moduleId,
          data,
          createdAt: new Date(),
          status: 'pending',
        };
        
        newState.optimisticUpdates = {
          ...prevState.optimisticUpdates,
          [moduleId]: [...(prevState.optimisticUpdates[moduleId] || []), optimisticUpdate]
        };
      }

      return newState;
    });

    if (fullConfig.performanceTracking) {
      performanceRef.current.updateCount++;
    }
  }, [fullConfig.enableOptimisticUpdates, fullConfig.performanceTracking]);

  const markClean = useCallback((moduleId: string) => {
    setState(prevState => {
      const newDirty = new Set(prevState.dirty);
      newDirty.delete(moduleId);
      
      return {
        ...prevState,
        dirty: newDirty,
        lastSaved: {
          ...prevState.lastSaved,
          [moduleId]: new Date()
        }
      };
    });
  }, []);

  const markSaving = useCallback((moduleId: string, saving: boolean) => {
    setState(prevState => {
      const newSaving = new Set(prevState.saving);
      if (saving) {
        newSaving.add(moduleId);
      } else {
        newSaving.delete(moduleId);
      }
      
      return {
        ...prevState,
        saving: newSaving
      };
    });
  }, []);

  const setErrors = useCallback((moduleId: string, errors: string[]) => {
    setState(prevState => ({
      ...prevState,
      errors: {
        ...prevState.errors,
        [moduleId]: errors
      }
    }));
  }, []);

  const clearErrors = useCallback((moduleId: string) => {
    setState(prevState => {
      const newErrors = { ...prevState.errors };
      delete newErrors[moduleId];
      return {
        ...prevState,
        errors: newErrors
      };
    });
  }, []);

  const setVersion = useCallback((moduleId: string, version: number) => {
    setState(prevState => ({
      ...prevState,
      versions: {
        ...prevState.versions,
        [moduleId]: version
      }
    }));
  }, []);

  const handleConflict = useCallback((moduleId: string, conflict: ConflictInfo) => {
    setState(prevState => ({
      ...prevState,
      conflicts: {
        ...prevState.conflicts,
        [moduleId]: conflict
      }
    }));
  }, []);

  const resolveConflict = useCallback((
    moduleId: string, 
    resolution: 'accept_server' | 'accept_client' | 'merge_manual',
    mergedData?: Record<string, unknown>
  ) => {
    setState(prevState => {
      const conflict = prevState.conflicts[moduleId];
      if (!conflict) return prevState;

      const newState = { ...prevState };
      
      // Update conflict with resolution
      const resolvedConflict = {
        ...conflict,
        resolvedAt: new Date(),
        resolution,
      };
      
      newState.conflicts = {
        ...prevState.conflicts,
        [moduleId]: resolvedConflict
      };

      // Apply resolution to data
      switch (resolution) {
        case 'accept_server':
          newState.data = {
            ...prevState.data,
            [moduleId]: conflict.serverData
          };
          newState.versions = {
            ...prevState.versions,
            [moduleId]: conflict.serverVersion
          };
          break;
        case 'accept_client':
          // Keep current client data, but update version
          newState.versions = {
            ...prevState.versions,
            [moduleId]: conflict.serverVersion
          };
          break;
        case 'merge_manual':
          if (mergedData) {
            newState.data = {
              ...prevState.data,
              [moduleId]: mergedData
            };
            newState.versions = {
              ...prevState.versions,
              [moduleId]: conflict.serverVersion
            };
          }
          break;
      }

      // Mark as dirty if client data was preserved or manual merge was done
      if (resolution === 'accept_client' || resolution === 'merge_manual') {
        newState.dirty = new Set([...prevState.dirty, moduleId]);
      } else {
        // If server data was accepted, mark as clean
        const newDirty = new Set(prevState.dirty);
        newDirty.delete(moduleId);
        newState.dirty = newDirty;
      }

      return newState;
    });
  }, []);

  const confirmOptimisticUpdate = useCallback((moduleId: string, updateId: string) => {
    setState(prevState => {
      const updates = prevState.optimisticUpdates[moduleId] || [];
      const updatedUpdates = updates.map(update => 
        update.id === updateId 
          ? { ...update, status: 'confirmed' as const }
          : update
      );

      return {
        ...prevState,
        optimisticUpdates: {
          ...prevState.optimisticUpdates,
          [moduleId]: updatedUpdates
        }
      };
    });
  }, []);

  const failOptimisticUpdate = useCallback((moduleId: string, updateId: string, error: string) => {
    setState(prevState => {
      const updates = prevState.optimisticUpdates[moduleId] || [];
      const updatedUpdates = updates.map(update => 
        update.id === updateId 
          ? { ...update, status: 'failed' as const, error }
          : update
      );

      return {
        ...prevState,
        optimisticUpdates: {
          ...prevState.optimisticUpdates,
          [moduleId]: updatedUpdates
        }
      };
    });
  }, []);

  const resetModule = useCallback((moduleId: string) => {
    setState(prevState => {
      const newData = { ...prevState.data };
      const newDirty = new Set(prevState.dirty);
      const newSaving = new Set(prevState.saving);
      const newErrors = { ...prevState.errors };
      const newConflicts = { ...prevState.conflicts };
      const newOptimisticUpdates = { ...prevState.optimisticUpdates };

      delete newData[moduleId];
      newDirty.delete(moduleId);
      newSaving.delete(moduleId);
      delete newErrors[moduleId];
      delete newConflicts[moduleId];
      delete newOptimisticUpdates[moduleId];

      return {
        ...prevState,
        data: newData,
        dirty: newDirty,
        saving: newSaving,
        errors: newErrors,
        conflicts: newConflicts,
        optimisticUpdates: newOptimisticUpdates,
      };
    });
  }, []);

  const clearPersistedState = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`formData_${formId}`);
    }
  }, [formId]);

  // Selectors
  const getModuleData = useCallback((moduleId: string): Record<string, unknown> => {
    return state.data[moduleId] || {};
  }, [state.data]);

  const isModuleDirty = useCallback((moduleId: string): boolean => {
    return state.dirty.has(moduleId);
  }, [state.dirty]);

  const isModuleSaving = useCallback((moduleId: string): boolean => {
    return state.saving.has(moduleId);
  }, [state.saving]);

  const getModuleErrors = useCallback((moduleId: string): string[] => {
    return state.errors[moduleId] || [];
  }, [state.errors]);

  const hasModuleConflict = useCallback((moduleId: string): boolean => {
    return !!state.conflicts[moduleId] && !state.conflicts[moduleId].resolvedAt;
  }, [state.conflicts]);

  const getModuleConflict = useCallback((moduleId: string): ConflictInfo | null => {
    return state.conflicts[moduleId] || null;
  }, [state.conflicts]);

  const hasUnsavedChanges = useCallback((): boolean => {
    return state.dirty.size > 0;
  }, [state.dirty]);

  const getFormProgress = useCallback((): { dirty: number; total: number; saving: number } => {
    const total = Object.keys(state.data).length;
    const dirty = state.dirty.size;
    const saving = state.saving.size;
    
    return { dirty, total, saving };
  }, [state.data, state.dirty, state.saving]);

  const getPerformanceMetrics = useCallback(() => {
    if (!fullConfig.performanceTracking) return null;
    
    return {
      renderCount: performanceRef.current.renderCount,
      lastRenderTime: performanceRef.current.lastRenderTime,
      updateCount: performanceRef.current.updateCount,
      memoryUsage: typeof window !== 'undefined' && 'memory' in performance 
        ? (performance as any).memory?.usedJSHeapSize || 0 
        : 0,
    };
  }, [fullConfig.performanceTracking]);

  return {
    // State
    state,
    
    // Actions
    actions: {
      updateModuleData,
      markClean,
      markSaving,
      setErrors,
      clearErrors,
      setVersion,
      handleConflict,
      resolveConflict,
      confirmOptimisticUpdate,
      failOptimisticUpdate,
      resetModule,
      clearPersistedState,
    },
    
    // Selectors
    selectors: {
      getModuleData,
      isModuleDirty,
      isModuleSaving,
      getModuleErrors,
      hasModuleConflict,
      getModuleConflict,
      hasUnsavedChanges,
      getFormProgress,
      getPerformanceMetrics,
    },
    
    // Configuration
    config: fullConfig,
  };
}

export default useFormData; 