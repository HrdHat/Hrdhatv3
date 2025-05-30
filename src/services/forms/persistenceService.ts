/**
 * Phase 5: Enhanced Persistence Service
 * ====================================
 * 
 * Server-side persistence integration with batch operations, conflict resolution,
 * optimistic locking, and performance optimization. Builds on existing Phase 3+4 infrastructure.
 */

import { supabase } from '../../db/supabaseClient';
import type {
  BatchSaveRequest,
  BatchSaveResponse,
  SingleSaveRequest,
  SingleSaveResponse,
  SaveResult,
  PersistenceConfig,
  PersistenceMetrics,
  PersistenceError,
  RetryConfig,
  SaveQueueItem,
  ConflictInfo,
} from '../../types/persistenceTypes';
import {
  DEFAULT_PERSISTENCE_CONFIG,
  DEFAULT_RETRY_CONFIG,
} from '../../types/persistenceTypes';

/**
 * Enhanced persistence service with server-side integration
 */
export class PersistenceService {
  private config: PersistenceConfig;
  private retryConfig: RetryConfig;
  private metrics: PersistenceMetrics;
  private requestQueue: Map<string, AbortController> = new Map();

  constructor(config?: Partial<PersistenceConfig>) {
    this.config = { ...DEFAULT_PERSISTENCE_CONFIG, ...config };
    this.retryConfig = DEFAULT_RETRY_CONFIG;
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): PersistenceMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      batchSaveCount: 0,
      singleSaveCount: 0,
      conflictCount: 0,
      retryCount: 0,
      successRate: 1,
    };
  }

  // ─── CORE SAVE OPERATIONS ───────────────────────────────────────────────────

  /**
   * Save a single module with optimistic locking and conflict detection
   */
  async saveModule(
    formId: string,
    moduleId: string,
    data: Record<string, unknown>,
    options: {
      version?: number;
      skipConflictCheck?: boolean;
      source?: 'auto-save' | 'manual' | 'blur' | 'unload';
      priority?: 'low' | 'normal' | 'high';
    } = {}
  ): Promise<SaveResult> {
    const startTime = Date.now();
    const requestId = `single_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.metrics.totalRequests++;
      this.metrics.singleSaveCount++;

      const request: SingleSaveRequest = {
        formId,
        moduleId,
        data,
        version: options.version,
        skipConflictCheck: options.skipConflictCheck || false,
        metadata: {
          source: options.source || 'manual',
        },
      };

      const result = await this.executeWithRetry(
        () => this.performSingleSave(request, requestId),
        requestId
      );

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);
      
      if (result.conflictInfo?.hasConflict) {
        this.metrics.conflictCount++;
      }

      return result;

    } catch (error) {
      this.updateMetrics(false, Date.now() - startTime);
      
      return {
        moduleId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save multiple modules in a single batch operation
   */
  async batchSave(
    formId: string,
    saves: Array<{
      moduleId: string;
      data: Record<string, unknown>;
      version?: number;
      skipConflictCheck?: boolean;
    }>,
    options: {
      batchId?: string;
      source?: 'auto-save' | 'manual' | 'blur' | 'unload';
      priority?: 'low' | 'normal' | 'high';
    } = {}
  ): Promise<BatchSaveResponse> {
    const startTime = Date.now();
    const requestId = options.batchId || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.metrics.totalRequests++;
      this.metrics.batchSaveCount++;

      const request: BatchSaveRequest = {
        formId,
        saves: saves.map(save => ({
          moduleId: save.moduleId,
          data: save.data,
          version: save.version,
          skipConflictCheck: save.skipConflictCheck || false,
        })),
        clientTimestamp: new Date().toISOString(),
        metadata: {
          batchId: requestId,
          source: options.source || 'manual',
          priority: options.priority || 'normal',
        },
      };

      const response = await this.executeWithRetry(
        () => this.performBatchSave(request, requestId),
        requestId
      );

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);
      
      const conflicts = response.results.filter(r => r.conflictInfo?.hasConflict).length;
      this.metrics.conflictCount += conflicts;

      return response;

    } catch (error) {
      this.updateMetrics(false, Date.now() - startTime);
      
      throw this.createPersistenceError(
        'BATCH_SAVE_FAILED',
        error instanceof Error ? error.message : 'Unknown error',
        'server',
        true,
        { formId, batchId: requestId }
      );
    }
  }

  // ─── NETWORK OPERATIONS ─────────────────────────────────────────────────────

  private async performSingleSave(
    request: SingleSaveRequest,
    requestId: string
  ): Promise<SaveResult> {
    const controller = new AbortController();
    this.requestQueue.set(requestId, controller);

    try {
      const { data, error } = await supabase.functions.invoke('saveFormModuleDataV2', {
        body: request,
      });

      if (error) {
        throw new Error(`Server error: ${error.message}`);
      }

      const response = data as SingleSaveResponse;
      return response.result;

    } finally {
      this.requestQueue.delete(requestId);
    }
  }

  private async performBatchSave(
    request: BatchSaveRequest,
    requestId: string
  ): Promise<BatchSaveResponse> {
    const controller = new AbortController();
    this.requestQueue.set(requestId, controller);

    try {
      const { data, error } = await supabase.functions.invoke('saveFormModuleDataV2', {
        body: request,
      });

      if (error) {
        throw new Error(`Server error: ${error.message}`);
      }

      return data as BatchSaveResponse;

    } finally {
      this.requestQueue.delete(requestId);
    }
  }

  // ─── RETRY LOGIC ─────────────────────────────────────────────────────────────

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    requestId: string
  ): Promise<T> {
    let lastError: Error;
    let delay = this.retryConfig.baseDelay;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry if it's the last attempt or error is not retryable
        if (attempt === this.retryConfig.maxAttempts || !this.isRetryableError(lastError)) {
          break;
        }

        this.metrics.retryCount++;
        console.warn(`[PersistenceService] Retry ${attempt}/${this.retryConfig.maxAttempts} for ${requestId}:`, lastError.message);

        // Wait before retry with exponential backoff
        await this.sleep(Math.min(delay, this.retryConfig.maxDelay));
        delay *= this.retryConfig.backoffMultiplier;
      }
    }

    throw lastError!;
  }

  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return true;
    }
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('aborted')) {
      return true;
    }
    
    // Server errors (5xx)
    if (message.includes('server error') || message.includes('500') || message.includes('503')) {
      return true;
    }
    
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─── QUEUE INTEGRATION ──────────────────────────────────────────────────────

  /**
   * Process a queue item with proper error handling and retry logic
   */
  async processQueueItem(item: SaveQueueItem): Promise<SaveResult> {
    try {
      const result = await this.saveModule(
        item.formId,
        item.moduleId,
        item.data,
        {
          version: item.version,
          source: item.source,
          priority: item.priority,
        }
      );

      if (!result.success && result.conflictInfo?.hasConflict) {
        // Handle conflicts specially - don't retry automatically
        return result;
      }

      return result;

    } catch (error) {
      return {
        moduleId: item.moduleId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process multiple queue items as a batch
   */
  async processQueueBatch(items: SaveQueueItem[]): Promise<BatchSaveResponse> {
    if (items.length === 0) {
      throw new Error('Cannot process empty batch');
    }

    const formId = items[0].formId;
    
    // Ensure all items are for the same form
    if (!items.every(item => item.formId === formId)) {
      throw new Error('All batch items must be for the same form');
    }

    const saves = items.map(item => ({
      moduleId: item.moduleId,
      data: item.data,
      version: item.version,
      skipConflictCheck: false,
    }));

    return this.batchSave(formId, saves, {
      batchId: `queue_batch_${Date.now()}`,
      source: 'auto-save',
      priority: 'normal',
    });
  }

  // ─── CONFLICT RESOLUTION ────────────────────────────────────────────────────

  /**
   * Check for conflicts before saving
   */
  async checkForConflicts(
    formId: string,
    moduleId: string,
    clientVersion: number
  ): Promise<ConflictInfo | null> {
    try {
      const { data, error } = await supabase
        .from('form_data_entries')
        .select('version, last_saved_by, updated_at')
        .eq('form_id', formId)
        .eq('module_id', moduleId)
        .single();

      if (error) {
        console.warn('[PersistenceService] Error checking conflicts:', error);
        return null;
      }

      if (!data) {
        return null; // No existing data, no conflict
      }

      const hasConflict = data.version !== clientVersion;
      
      return {
        serverVersion: data.version,
        lastModifiedBy: data.last_saved_by || '',
        lastModifiedAt: data.updated_at || '',
        hasConflict,
      };

    } catch (error) {
      console.warn('[PersistenceService] Unexpected error checking conflicts:', error);
      return null;
    }
  }

  // ─── METRICS AND MONITORING ─────────────────────────────────────────────────

  private updateMetrics(success: boolean, responseTime: number): void {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    const currentAverage = this.metrics.averageResponseTime;
    this.metrics.averageResponseTime = 
      (currentAverage * (totalRequests - 1) + responseTime) / totalRequests;

    // Update success rate
    this.metrics.successRate = this.metrics.successfulRequests / totalRequests;
    this.metrics.lastRequestTime = new Date();
  }

  getMetrics(): PersistenceMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  // ─── CONFIGURATION ──────────────────────────────────────────────────────────

  updateConfig(newConfig: Partial<PersistenceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  updateRetryConfig(newConfig: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...newConfig };
  }

  getConfig(): PersistenceConfig {
    return { ...this.config };
  }

  // ─── UTILITIES ───────────────────────────────────────────────────────────────

  private createPersistenceError(
    code: string,
    message: string,
    type: 'network' | 'validation' | 'conflict' | 'server' | 'timeout' | 'quota',
    retryable: boolean,
    metadata?: Record<string, unknown>
  ): PersistenceError {
    return {
      code,
      message,
      type,
      retryable,
      metadata,
    };
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    for (const [requestId, controller] of this.requestQueue) {
      controller.abort();
      console.log(`[PersistenceService] Cancelled request: ${requestId}`);
    }
    this.requestQueue.clear();
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(requestId: string): boolean {
    const controller = this.requestQueue.get(requestId);
    if (controller) {
      controller.abort();
      this.requestQueue.delete(requestId);
      return true;
    }
    return false;
  }

  /**
   * Get the number of active requests
   */
  getActiveRequestCount(): number {
    return this.requestQueue.size;
  }
}

// ─── SINGLETON INSTANCE ─────────────────────────────────────────────────────

let persistenceServiceInstance: PersistenceService | null = null;

export function getPersistenceService(config?: Partial<PersistenceConfig>): PersistenceService {
  if (!persistenceServiceInstance) {
    persistenceServiceInstance = new PersistenceService(config);
  }
  return persistenceServiceInstance;
}

export function resetPersistenceService(): void {
  if (persistenceServiceInstance) {
    persistenceServiceInstance.cancelAllRequests();
    persistenceServiceInstance = null;
  }
}

// ─── CONVENIENCE FUNCTIONS ──────────────────────────────────────────────────

/**
 * Quick save function for single modules
 */
export async function saveFormModule(
  formId: string,
  moduleId: string,
  data: Record<string, unknown>,
  options?: {
    version?: number;
    skipConflictCheck?: boolean;
    source?: 'auto-save' | 'manual' | 'blur' | 'unload';
  }
): Promise<SaveResult> {
  const service = getPersistenceService();
  return service.saveModule(formId, moduleId, data, options);
}

/**
 * Quick batch save function
 */
export async function batchSaveFormModules(
  formId: string,
  saves: Array<{
    moduleId: string;
    data: Record<string, unknown>;
    version?: number;
  }>,
  options?: {
    source?: 'auto-save' | 'manual' | 'blur' | 'unload';
  }
): Promise<BatchSaveResponse> {
  const service = getPersistenceService();
  return service.batchSave(formId, saves, options);
} 