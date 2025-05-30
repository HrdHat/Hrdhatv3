import { useCallback } from 'react';
import { useFlraFormState } from './useFormState';
import { useAutoSave } from './useAutoSave';
import { AutoSaveConfig } from '../../../types/formStateTypes';

export interface FlraFormWithAutoSaveConfig {
  formId: string;
  autoSaveConfig?: Partial<AutoSaveConfig>;
  enableAutoSave?: boolean;
}

/**
 * 🚀 PHASE 4: Complete integration hook combining Phase 3 state management 
 * with Phase 4 auto-save functionality
 * 
 * This hook provides a unified interface for FLRA forms with:
 * - Real-time state management (Phase 3)
 * - Intelligent auto-save (Phase 4)
 * - Conflict resolution
 * - Network awareness
 * - Performance optimization
 */
export function useFlraFormWithAutoSave({
  formId,
  autoSaveConfig = {},
  enableAutoSave = true,
}: FlraFormWithAutoSaveConfig) {
  
  // Phase 3: Core form state management
  const formState = useFlraFormState(formId);
  
  // Phase 4: Auto-save orchestration
  const autoSave = useAutoSave(
    formId, 
    formState, 
    {
      enabled: enableAutoSave,
      ...autoSaveConfig,
    }
  );

  // Enhanced actions that integrate auto-save
  const enhancedActions = {
    ...formState.actions,
    
    // Override updateModuleData to work with auto-save
    updateModuleData: useCallback((
      moduleId: string, 
      data: Record<string, unknown>, 
      options?: { skipDirty?: boolean; optimistic?: boolean; forceAutoSave?: boolean }
    ) => {
      // Update form state (Phase 3)
      formState.actions.updateModuleData(moduleId, data, options);
      
      // Force auto-save if requested
      if (options?.forceAutoSave && enableAutoSave) {
        autoSave.forceSave();
      }
    }, [formState.actions, autoSave, enableAutoSave]),

    // Enhanced save with auto-save integration
    saveModule: useCallback(async (moduleId: string) => {
      // Pause auto-save during manual save to prevent conflicts
      autoSave.pauseAutoSave();
      
      try {
        await formState.actions.saveModule(moduleId);
      } finally {
        // Resume auto-save after manual save
        autoSave.resumeAutoSave();
      }
    }, [formState.actions, autoSave]),

    // Auto-save specific actions
    toggleAutoSave: useCallback(() => {
      const newConfig = { enabled: !autoSave.isAutoSaving };
      autoSave.setConfig(newConfig);
    }, [autoSave]),

    pauseAutoSave: autoSave.pauseAutoSave,
    resumeAutoSave: autoSave.resumeAutoSave,
    forceSave: autoSave.forceSave,
    retryFailedSaves: autoSave.retryFailedSaves,
  };

  // Enhanced selectors with auto-save info
  const enhancedSelectors = {
    ...formState.selectors,
    
    // Get comprehensive module status including auto-save
    getModuleStatus: useCallback((moduleId: string) => ({
      // Phase 3 state
      isDirty: formState.selectors.isModuleDirty(moduleId),
      isSaving: formState.selectors.isModuleSaving(moduleId),
      hasErrors: formState.selectors.getModuleErrors(moduleId).length > 0,
      hasConflict: formState.selectors.hasModuleConflict(moduleId),
      lastSaved: formState.formData.lastSaved[moduleId],
      
      // Phase 4 auto-save state
      isAutoSaving: autoSave.isAutoSaving,
      autoSaveEnabled: enableAutoSave,
      autoSavePaused: autoSave.isPaused,
      pauseReason: autoSave.pauseReason,
      queuedSaves: autoSave.queuedSaves,
      failedSaves: autoSave.failedSaves,
    }), [formState.selectors, formState.formData.lastSaved, autoSave, enableAutoSave]),

    // Get overall form status
    getFormStatus: useCallback(() => ({
      // Phase 3 progress
      progress: formState.selectors.getFormProgress(),
      hasUnsavedChanges: formState.selectors.hasUnsavedChanges(),
      
      // Phase 4 auto-save status
      autoSave: {
        enabled: enableAutoSave,
        isAutoSaving: autoSave.isAutoSaving,
        isPaused: autoSave.isPaused,
        pauseReason: autoSave.pauseReason,
        queuedSaves: autoSave.queuedSaves,
        failedSaves: autoSave.failedSaves,
        lastAutoSave: autoSave.lastAutoSave,
        totalSaves: autoSave.totalSaves,
        successRate: autoSave.successRate,
      },
    }), [formState.selectors, autoSave, enableAutoSave]),
  };

  return {
    // Core form state (Phase 3)
    formData: formState.formData,
    template: formState.template,
    
    // Enhanced actions (Phase 3 + 4)
    actions: enhancedActions,
    
    // Enhanced selectors (Phase 3 + 4)
    selectors: enhancedSelectors,
    
    // Auto-save status (Phase 4)
    autoSave: {
      isAutoSaving: autoSave.isAutoSaving,
      isPaused: autoSave.isPaused,
      pauseReason: autoSave.pauseReason,
      queuedSaves: autoSave.queuedSaves,
      failedSaves: autoSave.failedSaves,
      lastAutoSave: autoSave.lastAutoSave,
      totalSaves: autoSave.totalSaves,
      totalFailures: autoSave.totalFailures,
      successRate: autoSave.successRate,
      averageSaveTime: autoSave.averageSaveTime,
    },
    
    // Configuration
    config: formState.config,
  };
} 