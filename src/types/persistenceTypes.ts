/**
 * Phase 5: Server-Side Persistence Types
 * ======================================
 * 
 * Type definitions for enhanced server-side persistence operations
 * including batch saves, optimistic locking, conflict resolution, and audit logging.
 */

// ─── SERVER REQUEST TYPES ───────────────────────────────────────────────────

export interface SaveModuleRequest {
  moduleId: string;
  data: Record<string, unknown>;
  version?: number;
  skipConflictCheck?: boolean;
}

export interface BatchSaveRequest {
  formId: string;
  saves: SaveModuleRequest[];
  clientTimestamp?: string;
  metadata?: {
    batchId?: string;
    priority?: 'low' | 'normal' | 'high';
    source?: 'auto-save' | 'manual' | 'blur' | 'unload';
  };
}

export interface SingleSaveRequest {
  formId: string;
  moduleId: string;
  data: Record<string, unknown>;
  version?: number;
  skipConflictCheck?: boolean;
  metadata?: {
    source?: 'auto-save' | 'manual' | 'blur' | 'unload';
  };
}

// ─── SERVER RESPONSE TYPES ──────────────────────────────────────────────────

export interface ConflictInfo {
  serverVersion: number;
  lastModifiedBy: string;
  lastModifiedAt: string;
  hasConflict: boolean;
}

export interface SaveResult {
  moduleId: string;
  success: boolean;
  version?: number;
  error?: string;
  conflictInfo?: ConflictInfo;
}

export interface BatchSaveResponse {
  success: boolean;
  results: SaveResult[];
  totalSaved: number;
  totalFailed: number;
  batchId: string;
  serverTimestamp: string;
  error?: string;
}

export interface SingleSaveResponse {
  success: boolean;
  result: SaveResult;
  serverTimestamp: string;
}

// ─── PERSISTENCE SERVICE TYPES ──────────────────────────────────────────────

export interface PersistenceConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  batchSize: number;
  enableCompression: boolean;
  enableMetrics: boolean;
}

export interface PersistenceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  batchSaveCount: number;
  singleSaveCount: number;
  conflictCount: number;
  retryCount: number;
  lastRequestTime?: Date;
  successRate: number;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

// ─── CONFLICT RESOLUTION TYPES ──────────────────────────────────────────────

export interface ConflictResolutionStrategy {
  type: 'auto-merge' | 'user-choice' | 'server-wins' | 'client-wins' | 'pause';
  autoMergeFields?: string[];
  userPromptTimeout?: number;
}

export interface ConflictResolutionResult {
  resolution: 'merged' | 'client-wins' | 'server-wins' | 'cancelled';
  resolvedData?: Record<string, unknown>;
  mergeStrategy?: string;
  userInput?: boolean;
}

export interface PendingConflict {
  moduleId: string;
  clientData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  conflictInfo: ConflictInfo;
  timestamp: Date;
  attempts: number;
}

// ─── QUEUE MANAGEMENT TYPES ─────────────────────────────────────────────────

export interface SaveQueueItem {
  id: string;
  formId: string;
  moduleId: string;
  data: Record<string, unknown>;
  version?: number;
  priority: 'low' | 'normal' | 'high';
  source: 'auto-save' | 'manual' | 'blur' | 'unload';
  timestamp: Date;
  attempts: number;
  maxAttempts: number;
  nextRetry?: Date;
  error?: string;
}

export interface SaveQueue {
  items: SaveQueueItem[];
  processing: Set<string>;
  failed: SaveQueueItem[];
  completed: SaveQueueItem[];
  paused: boolean;
  maxSize: number;
  batchSize: number;
}

export interface QueueMetrics {
  queueSize: number;
  processingCount: number;
  failedCount: number;
  completedCount: number;
  averageWaitTime: number;
  throughput: number; // items per minute
  lastProcessedTime?: Date;
}

// ─── NETWORK OPTIMIZATION TYPES ─────────────────────────────────────────────

export interface CompressionConfig {
  enabled: boolean;
  threshold: number; // bytes - only compress if payload is larger
  algorithm: 'gzip' | 'deflate';
  level: number; // 1-9 compression level
}

export interface NetworkOptimization {
  enableCompression: boolean;
  enableBatching: boolean;
  batchTimeout: number;
  maxConcurrentRequests: number;
  connectionPoolSize: number;
  keepAlive: boolean;
}

// ─── AUDIT AND MONITORING TYPES ─────────────────────────────────────────────

export interface SaveEvent {
  id: string;
  formId: string;
  moduleId: string;
  eventType: 'save-start' | 'save-success' | 'save-error' | 'save-conflict' | 'save-retry';
  timestamp: Date;
  userId?: string;
  source: 'auto-save' | 'manual' | 'blur' | 'unload';
  metadata?: {
    batchId?: string;
    version?: number;
    responseTime?: number;
    error?: string;
    retryAttempt?: number;
    dataSize?: number;
  };
}

export interface PerformanceMetrics {
  saveOperations: {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
    p95Time: number;
    p99Time: number;
  };
  networkMetrics: {
    requestCount: number;
    averageResponseTime: number;
    timeouts: number;
    connectionErrors: number;
    bandwidth: number; // bytes per second
  };
  conflictMetrics: {
    total: number;
    resolved: number;
    pending: number;
    autoResolved: number;
    userResolved: number;
  };
  queueMetrics: QueueMetrics;
}

// ─── ERROR HANDLING TYPES ───────────────────────────────────────────────────

export interface PersistenceError {
  code: string;
  message: string;
  type: 'network' | 'validation' | 'conflict' | 'server' | 'timeout' | 'quota';
  retryable: boolean;
  metadata?: {
    statusCode?: number;
    formId?: string;
    moduleId?: string;
    batchId?: string;
    serverTimestamp?: string;
  };
}

export interface ErrorCategories {
  NETWORK_ERROR: 'network';
  VALIDATION_ERROR: 'validation';
  CONFLICT_ERROR: 'conflict';
  SERVER_ERROR: 'server';
  TIMEOUT_ERROR: 'timeout';
  QUOTA_ERROR: 'quota';
}

// ─── INTEGRATION TYPES ──────────────────────────────────────────────────────

export interface PersistenceHookConfig {
  formId: string;
  enableBatchSaving?: boolean;
  enableConflictResolution?: boolean;
  enableMetrics?: boolean;
  retryConfig?: Partial<RetryConfig>;
  conflictStrategy?: ConflictResolutionStrategy;
  networkOptimization?: Partial<NetworkOptimization>;
}

export interface PersistenceHookReturn {
  // Core save operations
  saveModule: (moduleId: string, data: Record<string, unknown>, options?: {
    priority?: 'low' | 'normal' | 'high';
    source?: 'auto-save' | 'manual' | 'blur' | 'unload';
    skipConflictCheck?: boolean;
  }) => Promise<SaveResult>;
  
  batchSave: (saves: SaveModuleRequest[], options?: {
    priority?: 'low' | 'normal' | 'high';
    source?: 'auto-save' | 'manual' | 'blur' | 'unload';
    batchId?: string;
  }) => Promise<BatchSaveResponse>;
  
  // Queue management
  queue: SaveQueue;
  retryFailedSaves: () => Promise<void>;
  clearQueue: () => void;
  pauseQueue: () => void;
  resumeQueue: () => void;
  
  // Conflict resolution
  conflicts: PendingConflict[];
  resolveConflict: (moduleId: string, resolution: ConflictResolutionResult) => Promise<void>;
  
  // Status and metrics
  isOnline: boolean;
  isProcessing: boolean;
  metrics: PersistenceMetrics;
  performanceMetrics?: PerformanceMetrics;
  
  // Configuration
  updateConfig: (config: Partial<PersistenceConfig>) => void;
}

// ─── UTILITY TYPES ──────────────────────────────────────────────────────────

export type SavePriority = 'low' | 'normal' | 'high';
export type SaveSource = 'auto-save' | 'manual' | 'blur' | 'unload';
export type ConflictResolution = 'merged' | 'client-wins' | 'server-wins' | 'cancelled';
export type ErrorType = 'network' | 'validation' | 'conflict' | 'server' | 'timeout' | 'quota';

// ─── DEFAULT CONFIGURATIONS ─────────────────────────────────────────────────

export const DEFAULT_PERSISTENCE_CONFIG: PersistenceConfig = {
  baseUrl: '/functions/v1/saveFormModuleDataV2',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  batchSize: 10,
  enableCompression: true,
  enableMetrics: true,
};

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: ['network', 'timeout', 'server'],
};

export const DEFAULT_CONFLICT_STRATEGY: ConflictResolutionStrategy = {
  type: 'user-choice',
  userPromptTimeout: 60000, // 1 minute
};

export const DEFAULT_NETWORK_OPTIMIZATION: NetworkOptimization = {
  enableCompression: true,
  enableBatching: true,
  batchTimeout: 2000, // 2 seconds
  maxConcurrentRequests: 5,
  connectionPoolSize: 10,
  keepAlive: true,
}; 