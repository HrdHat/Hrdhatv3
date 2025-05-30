import { useCallback, useEffect, useRef, useState } from 'react';
import { useFlraFormState } from './useFormState';
import { useAutoSave } from './useAutoSave';
import { getPersistenceService } from '../../../services/forms/persistenceService';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import type {
  PersistenceHookConfig,
  PersistenceHookReturn,
  SaveQueueItem,
  PendingConflict,
  ConflictResolutionResult,
  PersistenceMetrics,
  SaveResult,
  BatchSaveResponse,
  SaveModuleRequest,
} from '../../../types/persistenceTypes';

/**
 * 🚀 PHASE 5: Complete Persistence Integration Hook
 * 
 * Integrates Phase 3 state management + Phase 4 auto-save + Phase 5 server persistence
 * 
 * This hook provides a unified interface for:
 * - Enhanced server-side persistence with optimistic locking
 * - Batch operations for improved performance
 * - Advanced conflict resolution
 * - Queue management with retry logic
 * - Real-time metrics and monitoring
 */
export function usePersistenceIntegration({
  formId,
  enableBatchSaving = true,
  enableConflictResolution = true,
  enableMetrics = true,
  retryConfig,
  conflictStrategy,
  networkOptimization,
}: PersistenceHookConfig): PersistenceHookReturn {
  
  // Core hooks from previous phases
  const formState = useFlraFormState(formId);
  const autoSave = useAutoSave(formId, formState, {
    enabled: false, // We'll manage saving ourselves
    batchSaves: enableBatchSaving,
  });
  const networkStatus = useNetworkStatus({ enableSlowConnectionDetection: true });
  
  // Persistence service
  const persistenceService = getPersistenceService();
  
  // Local state
  const [isProcessing, setIsProcessing] = useState(false);
  const [queue, setQueue] = useState<SaveQueueItem[]>([]);
  const [conflicts, setConflicts] = useState<PendingConflict[]>([]);
  const [metrics, setMetrics] = useState<PersistenceMetrics>(persistenceService.getMetrics());
  
  const queueRef = useRef<SaveQueueItem[]>([]);
  const conflictsRef = useRef<PendingConflict[]>([]);
  const processingRef = useRef<Set<string>>(new Set());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─── CORE SAVE OPERATIONS ───────────────────────────────────────────────────

  const saveModule = useCallback(async (
    moduleId: string,
    data: Record<string, unknown>,
    options: {
      priority?: 'low' | 'normal' | 'high';
      source?: 'auto-save' | 'manual' | 'blur' | 'unload';
      skipConflictCheck?: boolean;
    } = {}
  ): Promise<SaveResult> => {
    try {
      setIsProcessing(true);

      // Get current version from form state
      const currentVersion = formState.formData.versions[moduleId] || 1;
      
      const result = await persistenceService.saveModule(
        formId,
        moduleId,
        data,
        {
          version: currentVersion,
          skipConflictCheck: options.skipConflictCheck,
          source: options.source || 'manual',
          priority: options.priority || 'normal',
        }
      );

      if (result.success && result.version) {
        // Update local version tracking
        formState.actions.updateModuleVersion(moduleId, result.version);
        
        // Clear from dirty state if successful
        formState.actions.markModuleClean(moduleId);
      } else if (result.conflictInfo?.hasConflict && enableConflictResolution) {
        // Handle conflict
        await handleConflict(moduleId, data, result.conflictInfo);
      }

      // Update metrics
      setMetrics(persistenceService.getMetrics());
      
      return result;

    } finally {
      setIsProcessing(false);
    }
  }, [formId, formState.actions, formState.formData.versions, persistenceService, enableConflictResolution]);

  const batchSave = useCallback(async (
    saves: SaveModuleRequest[],
    options: {
      priority?: 'low' | 'normal' | 'high';
      source?: 'auto-save' | 'manual' | 'blur' | 'unload';
      batchId?: string;
    } = {}
  ): Promise<BatchSaveResponse> => {
    try {
      setIsProcessing(true);

      // Add version information to saves
      const enhancedSaves = saves.map(save => ({
        ...save,
        version: save.version || formState.formData.versions[save.moduleId] || 1,
      }));

      const response = await persistenceService.batchSave(
        formId,
        enhancedSaves,
        options
      );

      // Process results
      for (const result of response.results) {
        if (result.success && result.version) {
          // Update local version tracking
          formState.actions.updateModuleVersion(result.moduleId, result.version);
          formState.actions.markModuleClean(result.moduleId);
        } else if (result.conflictInfo?.hasConflict && enableConflictResolution) {
          // Find the original save data for conflict resolution
          const originalSave = saves.find(s => s.moduleId === result.moduleId);
          if (originalSave) {
            await handleConflict(result.moduleId, originalSave.data, result.conflictInfo);
          }
        }
      }

      // Update metrics
      setMetrics(persistenceService.getMetrics());

      return response;

    } finally {
      setIsProcessing(false);
    }
  }, [formId, formState.actions, formState.formData.versions, persistenceService, enableConflictResolution]);

  // ─── QUEUE MANAGEMENT ────────────────────────────────────────────────────────

  const addToQueue = useCallback((
    moduleId: string,
    data: Record<string, unknown>,
    options: {
      priority?: 'low' | 'normal' | 'high';
      source?: 'auto-save' | 'manual' | 'blur' | 'unload';
    } = {}
  ) => {
    const queueItem: SaveQueueItem = {
      id: `${moduleId}_${Date.now()}`,
      formId,
      moduleId,
      data,
      version: formState.formData.versions[moduleId],
      priority: options.priority || 'normal',
      source: options.source || 'auto-save',
      timestamp: new Date(),
      attempts: 0,
      maxAttempts: 3,
    };

    queueRef.current.push(queueItem);
    setQueue([...queueRef.current]);

    // Trigger batch processing if enabled
    if (enableBatchSaving) {
      scheduleBatchProcessing();
    } else {
      processQueueItem(queueItem);
    }
  }, [formId, formState.formData.versions, enableBatchSaving]);

  const scheduleBatchProcessing = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      processBatch();
    }, networkStatus.isSlowConnection ? 5000 : 2000); // Slower on poor connections
  }, [networkStatus.isSlowConnection]);

  const processBatch = useCallback(async () => {
    if (queueRef.current.length === 0 || !networkStatus.isOnline) {
      return;
    }

    // Group items by priority and take up to batch size
    const highPriority = queueRef.current.filter(item => item.priority === 'high');
    const normalPriority = queueRef.current.filter(item => item.priority === 'normal');
    const lowPriority = queueRef.current.filter(item => item.priority === 'low');

    const batchItems = [
      ...highPriority.slice(0, 5),
      ...normalPriority.slice(0, 5),
      ...lowPriority.slice(0, 2),
    ].slice(0, 10); // Max 10 items per batch

    if (batchItems.length === 0) return;

    // Remove items from queue
    queueRef.current = queueRef.current.filter(item => !batchItems.includes(item));
    setQueue([...queueRef.current]);

    try {
      const saves = batchItems.map(item => ({
        moduleId: item.moduleId,
        data: item.data,
        version: item.version,
      }));

      await batchSave(saves, {
        batchId: `auto_batch_${Date.now()}`,
        source: 'auto-save',
        priority: 'normal',
      });

    } catch (error) {
      console.error('[usePersistenceIntegration] Batch processing failed:', error);
      
      // Return failed items to queue for retry
      const failedItems = batchItems.map(item => ({
        ...item,
        attempts: item.attempts + 1,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));

      queueRef.current.push(...failedItems);
      setQueue([...queueRef.current]);
    }
  }, [networkStatus.isOnline, batchSave]);

  const processQueueItem = useCallback(async (item: SaveQueueItem) => {
    if (processingRef.current.has(item.id)) {
      return; // Already processing
    }

    processingRef.current.add(item.id);

    try {
      const result = await persistenceService.processQueueItem(item);
      
      if (result.success) {
        // Remove from queue
        queueRef.current = queueRef.current.filter(q => q.id !== item.id);
        setQueue([...queueRef.current]);
      } else {
        // Update with error and retry if attempts left
        const updatedItem = {
          ...item,
          attempts: item.attempts + 1,
          error: result.error,
        };

        if (updatedItem.attempts < updatedItem.maxAttempts) {
          const index = queueRef.current.findIndex(q => q.id === item.id);
          if (index >= 0) {
            queueRef.current[index] = updatedItem;
            setQueue([...queueRef.current]);
          }
        } else {
          // Remove from queue after max attempts
          queueRef.current = queueRef.current.filter(q => q.id !== item.id);
          setQueue([...queueRef.current]);
        }
      }

    } finally {
      processingRef.current.delete(item.id);
    }
  }, [persistenceService]);

  // ─── CONFLICT RESOLUTION ─────────────────────────────────────────────────────

  const handleConflict = useCallback(async (
    moduleId: string,
    clientData: Record<string, unknown>,
    conflictInfo: any
  ) => {
    // Get server data for conflict resolution
    const serverData = await formState.actions.loadModuleData(moduleId);
    
    const conflict: PendingConflict = {
      moduleId,
      clientData,
      serverData: serverData || {},
      conflictInfo,
      timestamp: new Date(),
      attempts: 0,
    };

    conflictsRef.current.push(conflict);
    setConflicts([...conflictsRef.current]);

    // Pause auto-save for this module
    formState.actions.setModuleConflict(moduleId, conflictInfo);
  }, [formState.actions]);

  const resolveConflict = useCallback(async (
    moduleId: string,
    resolution: ConflictResolutionResult
  ) => {
    const conflictIndex = conflictsRef.current.findIndex(c => c.moduleId === moduleId);
    if (conflictIndex === -1) return;

    const conflict = conflictsRef.current[conflictIndex];
    
    try {
      let dataToSave: Record<string, unknown>;

      switch (resolution.resolution) {
        case 'client-wins':
          dataToSave = conflict.clientData;
          break;
        case 'server-wins':
          dataToSave = conflict.serverData;
          break;
        case 'merged':
          dataToSave = resolution.resolvedData || conflict.clientData;
          break;
        default:
          return; // Cancelled
      }

      // Save with skip conflict check
      const result = await saveModule(moduleId, dataToSave, {
        skipConflictCheck: true,
        source: 'manual',
        priority: 'high',
      });

      if (result.success) {
        // Remove conflict
        conflictsRef.current.splice(conflictIndex, 1);
        setConflicts([...conflictsRef.current]);
        
        // Clear conflict state
        formState.actions.clearModuleConflict(moduleId);
      }

    } catch (error) {
      console.error('[usePersistenceIntegration] Conflict resolution failed:', error);
    }
  }, [saveModule, formState.actions]);

  // ─── QUEUE CONTROLS ─────────────────────────────────────────────────────────

  const retryFailedSaves = useCallback(async () => {
    const failedItems = queueRef.current.filter(item => item.error);
    
    for (const item of failedItems) {
      const resetItem = { ...item, attempts: 0, error: undefined };
      await processQueueItem(resetItem);
    }
  }, [processQueueItem]);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setQueue([]);
  }, []);

  const pauseQueue = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
  }, []);

  const resumeQueue = useCallback(() => {
    if (queueRef.current.length > 0) {
      scheduleBatchProcessing();
    }
  }, [scheduleBatchProcessing]);

  // ─── INTEGRATION WITH EXISTING AUTO-SAVE ────────────────────────────────────

  // Monitor dirty state changes and add to queue
  useEffect(() => {
    const dirtyModules = Array.from(formState.formData.dirty);
    
    for (const moduleId of dirtyModules) {
      const moduleData = formState.formData.data[moduleId];
      if (moduleData) {
        addToQueue(moduleId, moduleData, {
          source: 'auto-save',
          priority: 'normal',
        });
      }
    }
  }, [formState.formData.dirty, formState.formData.data, addToQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      // Process any remaining queue items immediately
      if (queueRef.current.length > 0) {
        processBatch();
      }
    };
  }, [processBatch]);

  // Update configuration
  const updateConfig = useCallback((newConfig: any) => {
    persistenceService.updateConfig(newConfig);
  }, [persistenceService]);

  // ─── RETURN INTERFACE ───────────────────────────────────────────────────────

  return {
    // Core save operations
    saveModule,
    batchSave,
    
    // Queue management
    queue: {
      items: queue,
      processing: processingRef.current,
      failed: queue.filter(item => item.error),
      completed: [],
      paused: !networkStatus.isOnline,
      maxSize: 100,
      batchSize: 10,
    },
    retryFailedSaves,
    clearQueue,
    pauseQueue,
    resumeQueue,
    
    // Conflict resolution
    conflicts,
    resolveConflict,
    
    // Status and metrics
    isOnline: networkStatus.isOnline,
    isProcessing,
    metrics,
    
    // Configuration
    updateConfig,
  };
} 