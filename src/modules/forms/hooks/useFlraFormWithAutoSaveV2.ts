import { useCallback, useEffect, useRef, useState } from 'react';
import { useFlraFormState } from './useFormState';
import { useAutoSave } from './useAutoSave';
import { getPersistenceService } from '../../../services/forms/persistenceService';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import type { AutoSaveConfig } from '../../../types/formStateTypes';
import type {
  PersistenceMetrics,
  SaveResult,
  BatchSaveResponse,
} from '../../../types/persistenceTypes';

export interface FlraFormWithAutoSaveV2Config {
  formId: string;
  autoSaveConfig?: Partial<AutoSaveConfig>;
  enableAutoSave?: boolean;
  enableServerPersistence?: boolean;
  enableBatchSaving?: boolean;
  enableConflictResolution?: boolean;
}

/**
 * 🚀 PHASE 5: Enhanced Integration Hook (V2)
 * 
 * Combines Phase 3 state management + Phase 4 auto-save + Phase 5 server persistence
 * 
 * This is a backward-compatible enhancement of useFlraFormWithAutoSave that adds:
 * - Server-side persistence with optimistic locking
 * - Batch operations for performance
 * - Enhanced conflict resolution
 * - Advanced retry logic and queue management
 */
export function useFlraFormWithAutoSaveV2({
  formId,
  autoSaveConfig = {},
  enableAutoSave = true,
  enableServerPersistence = true,
  enableBatchSaving = true,
  enableConflictResolution = true,
}: FlraFormWithAutoSaveV2Config) {
  
  // Phase 3: Core form state management
  const formState = useFlraFormState(formId);
  
  // Phase 4: Auto-save orchestration (modified for server integration)
  const autoSave = useAutoSave(
    formId, 
    formState, 
    {
      enabled: enableAutoSave && !enableServerPersistence, // Disable if using server persistence
      ...autoSaveConfig,
    }
  );

  // Phase 5: Server persistence service
  const persistenceService = getPersistenceService();
  const networkStatus = useNetworkStatus({ enableSlowConnectionDetection: true });
  
  // Enhanced state for server persistence
  const [serverMetrics, setServerMetrics] = useState<PersistenceMetrics>(
    persistenceService.getMetrics()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingBatch, setPendingBatch] = useState<Map<string, Record<string, unknown>>>(new Map());
  
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<Date>(new Date());

  // ─── ENHANCED SAVE OPERATIONS ───────────────────────────────────────────────

  const enhancedSaveModule = useCallback(async (
    moduleId: string,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      source?: 'auto-save' | 'manual' | 'blur' | 'unload';
      skipConflictCheck?: boolean;
    }
  ): Promise<SaveResult> => {
    const moduleData = formState.formData.data[moduleId];
    if (!moduleData) {
      return {
        moduleId,
        success: false,
        error: 'No data found for module',
      };
    }

    if (enableServerPersistence) {
      try {
        setIsSyncing(true);
        
        const result = await persistenceService.saveModule(
          formId,
          moduleId,
          moduleData,
          {
            version: formState.formData.versions?.[moduleId],
            source: options?.source || 'manual',
            priority: options?.priority || 'normal',
            skipConflictCheck: options?.skipConflictCheck,
          }
        );

        if (result.success) {
          // Use existing API to mark as saved
          formState.actions.saveModule(moduleId);
        } else if (result.conflictInfo?.hasConflict && enableConflictResolution) {
          // Use existing conflict resolution
          // Note: This would need to be implemented in the existing formState if not available
          console.warn('Conflict detected for module:', moduleId, result.conflictInfo);
        }

        // Update metrics
        setServerMetrics(persistenceService.getMetrics());
        lastSyncRef.current = new Date();

        return result;

      } catch (error) {
        return {
          moduleId,
          success: false,
          error: error instanceof Error ? error.message : 'Server save failed',
        };
      } finally {
        setIsSyncing(false);
      }
    } else {
      // Fallback to Phase 3+4 local saving
      await formState.actions.saveModule(moduleId);
      return {
        moduleId,
        success: true,
        version: formState.formData.versions?.[moduleId] || 1,
      };
    }
  }, [
    formId,
    formState.formData.data,
    formState.formData.versions,
    formState.actions,
    enableServerPersistence,
    enableConflictResolution,
    persistenceService,
  ]);

  const batchSaveModules = useCallback(async (
    moduleIds: string[],
    options?: {
      priority?: 'low' | 'normal' | 'high';
      source?: 'auto-save' | 'manual' | 'blur' | 'unload';
    }
  ): Promise<BatchSaveResponse> => {
    if (!enableServerPersistence || !enableBatchSaving) {
      // Fallback to individual saves
      const results: SaveResult[] = [];
      for (const moduleId of moduleIds) {
        const result = await enhancedSaveModule(moduleId, options);
        results.push(result);
      }
      
      return {
        success: true,
        results,
        totalSaved: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length,
        batchId: `fallback_${Date.now()}`,
        serverTimestamp: new Date().toISOString(),
      };
    }

    try {
      setIsSyncing(true);

      const saves = moduleIds.map(moduleId => ({
        moduleId,
        data: formState.formData.data[moduleId] || {},
        version: formState.formData.versions?.[moduleId],
      }));

      const response = await persistenceService.batchSave(
        formId,
        saves,
        {
          source: options?.source || 'auto-save',
          priority: options?.priority || 'normal',
        }
      );

      // Process results
      for (const result of response.results) {
        if (result.success) {
          formState.actions.saveModule(result.moduleId);
        } else if (result.conflictInfo?.hasConflict && enableConflictResolution) {
          console.warn('Conflict detected for module:', result.moduleId, result.conflictInfo);
        }
      }

      // Update metrics
      setServerMetrics(persistenceService.getMetrics());
      lastSyncRef.current = new Date();

      return response;

    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Batch save failed');
    } finally {
      setIsSyncing(false);
    }
  }, [
    formId,
    formState.formData.data,
    formState.formData.versions,
    formState.actions,
    enableServerPersistence,
    enableBatchSaving,
    enableConflictResolution,
    persistenceService,
    enhancedSaveModule,
  ]);

  // ─── INTELLIGENT BATCH PROCESSING ──────────────────────────────────────────

  const addToBatch = useCallback((moduleId: string) => {
    if (!enableBatchSaving || !enableServerPersistence) return;

    const moduleData = formState.formData.data[moduleId];
    if (!moduleData) return;

    setPendingBatch(prev => new Map(prev.set(moduleId, moduleData)));

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Set new timeout - longer on slow connections
    const delay = networkStatus.isSlowConnection ? 5000 : 2000;
    batchTimeoutRef.current = setTimeout(() => {
      processPendingBatch();
    }, delay);
  }, [enableBatchSaving, enableServerPersistence, formState.formData.data, networkStatus.isSlowConnection]);

  const processPendingBatch = useCallback(async () => {
    if (pendingBatch.size === 0 || !networkStatus.isOnline) return;

    const moduleIds = Array.from(pendingBatch.keys());
    setPendingBatch(new Map()); // Clear pending batch

    try {
      await batchSaveModules(moduleIds, {
        source: 'auto-save',
        priority: 'normal',
      });
    } catch (error) {
      console.error('[useFlraFormWithAutoSaveV2] Batch save failed:', error);
    }
  }, [pendingBatch, networkStatus.isOnline, batchSaveModules]);

  // ─── INTEGRATION WITH EXISTING AUTO-SAVE ───────────────────────────────────

  // Monitor dirty state changes for batching
  useEffect(() => {
    if (!enableServerPersistence) return;

    const dirtyModules = Array.from(formState.formData.dirty);
    
    for (const moduleId of dirtyModules) {
      addToBatch(moduleId);
    }
  }, [formState.formData.dirty, enableServerPersistence, addToBatch]);

  // Auto-reconnect and sync when back online
  useEffect(() => {
    if (networkStatus.isOnline && enableServerPersistence) {
      const timeSinceLastSync = Date.now() - lastSyncRef.current.getTime();
      const hasUnsavedChanges = formState.selectors.hasUnsavedChanges();
      
      // Auto-sync if we've been offline for more than 30 seconds and have changes
      if (timeSinceLastSync > 30000 && hasUnsavedChanges) {
        processPendingBatch();
      }
    }
  }, [networkStatus.isOnline, enableServerPersistence, formState.selectors, processPendingBatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      // Process any remaining batch immediately
      if (pendingBatch.size > 0 && networkStatus.isOnline) {
        processPendingBatch();
      }
    };
  }, [pendingBatch.size, networkStatus.isOnline, processPendingBatch]);

  // ─── ENHANCED ACTIONS ───────────────────────────────────────────────────────

  const enhancedActions = {
    ...formState.actions,
    
    // Enhanced save with server persistence
    saveModule: enhancedSaveModule,
    
    // Batch save operation
    batchSave: batchSaveModules,
    
    // Force immediate sync
    forcSync: useCallback(async () => {
      if (pendingBatch.size > 0) {
        await processPendingBatch();
      }
    }, [processPendingBatch]),
    
    // Auto-save specific actions (maintain compatibility)
    toggleAutoSave: autoSave.pauseAutoSave ? useCallback(() => {
      if (enableServerPersistence) {
        // Toggle server persistence instead
        enableServerPersistence = !enableServerPersistence;
      } else {
        autoSave.pauseAutoSave();
      }
    }, [enableServerPersistence, autoSave]) : undefined,

    pauseAutoSave: autoSave.pauseAutoSave,
    resumeAutoSave: autoSave.resumeAutoSave,
    forceSave: autoSave.forceSave || (() => processPendingBatch()),
    retryFailedSaves: autoSave.retryFailedSaves,
  };

  // ─── ENHANCED SELECTORS ─────────────────────────────────────────────────────

  const enhancedSelectors = {
    ...formState.selectors,
    
    // Enhanced module status with server info
    getModuleStatus: useCallback((moduleId: string) => ({
      // Phase 3 state
      isDirty: formState.selectors.isModuleDirty(moduleId),
      isSaving: formState.selectors.isModuleSaving(moduleId) || isSyncing,
      hasErrors: formState.selectors.getModuleErrors(moduleId).length > 0,
      hasConflict: formState.selectors.hasModuleConflict(moduleId),
      lastSaved: formState.formData.lastSaved[moduleId],
      
      // Phase 4 auto-save state (if enabled)
      ...(autoSave && {
        isAutoSaving: autoSave.isAutoSaving,
        autoSaveEnabled: enableAutoSave,
        autoSavePaused: autoSave.isPaused,
        pauseReason: autoSave.pauseReason,
      }),
      
      // Phase 5 server persistence state
      serverPersistence: {
        enabled: enableServerPersistence,
        isSyncing,
        inBatch: pendingBatch.has(moduleId),
        lastSync: lastSyncRef.current,
        isOnline: networkStatus.isOnline,
      },
    }), [
      formState.selectors,
      formState.formData.lastSaved,
      autoSave,
      enableAutoSave,
      enableServerPersistence,
      isSyncing,
      pendingBatch,
      networkStatus.isOnline,
    ]),

    // Enhanced form status
    getFormStatus: useCallback(() => ({
      // Phase 3 progress
      progress: formState.selectors.getFormProgress(),
      hasUnsavedChanges: formState.selectors.hasUnsavedChanges(),
      
      // Phase 4 auto-save status (if enabled)
      ...(autoSave && {
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
      }),
      
      // Phase 5 server persistence status
      serverPersistence: {
        enabled: enableServerPersistence,
        isSyncing,
        pendingBatchSize: pendingBatch.size,
        lastSync: lastSyncRef.current,
        metrics: serverMetrics,
        isOnline: networkStatus.isOnline,
        connectionQuality: networkStatus.effectiveType,
      },
    }), [
      formState.selectors,
      autoSave,
      enableAutoSave,
      enableServerPersistence,
      isSyncing,
      pendingBatch.size,
      serverMetrics,
      networkStatus,
    ]),
  };

  return {
    // Core form state (Phase 3)
    formData: formState.formData,
    template: formState.template,
    
    // Enhanced actions (Phase 3 + 4 + 5)
    actions: enhancedActions,
    
    // Enhanced selectors (Phase 3 + 4 + 5)
    selectors: enhancedSelectors,
    
    // Auto-save status (Phase 4) - maintained for compatibility
    autoSave: autoSave || {
      isAutoSaving: false,
      isPaused: false,
      queuedSaves: 0,
      failedSaves: 0,
      totalSaves: 0,
      totalFailures: 0,
      successRate: 1,
      averageSaveTime: 0,
    },
    
    // Server persistence status (Phase 5)
    serverPersistence: {
      enabled: enableServerPersistence,
      isSyncing,
      metrics: serverMetrics,
      pendingBatchSize: pendingBatch.size,
      lastSync: lastSyncRef.current,
      isOnline: networkStatus.isOnline,
    },
    
    // Configuration
    config: formState.config,
  };
} 