// Phase 3 Form State Management Types
// Comprehensive type definitions for client-side state tracking and management

import { FieldDefinition } from './formTypes';

// Validation system types
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
    code?: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  validatedAt: Date;
  moduleId: string;
}

export interface FieldValidationResult {
  field: string;
  isValid: boolean;
  value: unknown;
  error?: string;
  warning?: string;
  validatedAt: Date;
}

// Enhanced validation options
export interface ValidationOptions {
  validateRequired?: boolean;
  validateType?: boolean;
  validateFormat?: boolean;
  validateCustomRules?: boolean;
  stopOnFirstError?: boolean;
  includeWarnings?: boolean;
}

// State change tracking for audit and debugging
export interface StateChange {
  id: string;
  moduleId: string;
  fieldName?: string;
  changeType: 'create' | 'update' | 'delete' | 'validate' | 'save' | 'conflict';
  oldValue?: unknown;
  newValue?: unknown;
  timestamp: Date;
  userId?: string;
  source: 'user_input' | 'auto_save' | 'server_sync' | 'conflict_resolution' | 'system';
  metadata?: Record<string, unknown>;
}

// State history for undo/redo functionality
export interface StateSnapshot {
  id: string;
  moduleId: string;
  data: Record<string, unknown>;
  timestamp: Date;
  changeType: StateChange['changeType'];
  description?: string;
}

export interface StateHistory {
  snapshots: StateSnapshot[];
  currentIndex: number;
  maxHistory: number;
  canUndo: boolean;
  canRedo: boolean;
}

// Form progress and completion tracking
export interface FormProgress {
  moduleProgress: Record<string, ModuleProgress>;
  overallCompletion: number; // 0-100 percentage
  requiredFieldsCompleted: number;
  totalRequiredFields: number;
  optionalFieldsCompleted: number;
  totalOptionalFields: number;
  validationErrors: number;
  validationWarnings: number;
  lastUpdated: Date;
}

export interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  completion: number; // 0-100 percentage
  requiredFieldsCompleted: number;
  totalRequiredFields: number;
  optionalFieldsCompleted: number;
  totalOptionalFields: number;
  hasErrors: boolean;
  hasWarnings: boolean;
  lastModified?: Date;
  isValid: boolean;
}

// Save operation tracking
export interface SaveOperation {
  id: string;
  moduleId: string;
  status: 'pending' | 'saving' | 'success' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  dataSize?: number; // bytes
  retryCount?: number;
  error?: SaveError;
  optimistic: boolean;
}

export interface SaveError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  timestamp: Date;
}

// Network and sync status
export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt?: Date;
  pendingSaveCount: number;
  failedSaveCount: number;
  conflictCount: number;
  autoSaveEnabled: boolean;
  syncStrategy: 'immediate' | 'debounced' | 'manual';
}

// Conflict resolution types (re-exported from useFormData for consistency)
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
  resolvedBy?: string; // userId
}

export interface ConflictResolutionStrategy {
  strategy: 'server_wins' | 'client_wins' | 'manual' | 'smart_merge';
  autoResolve: boolean;
  preserveUserChanges: boolean;
  notifyUser: boolean;
  createBackup: boolean;
}

// Performance monitoring
export interface FormStateMetrics {
  formId: string;
  loadTime: number; // milliseconds
  initialRenderTime: number; // milliseconds
  averageUpdateTime: number; // milliseconds
  memoryUsage: number; // bytes
  renderCount: number;
  updateCount: number;
  saveCount: number;
  errorCount: number;
  cacheHitRate: number; // 0-1
  lastMeasuredAt: Date;
}

export interface PerformanceThresholds {
  maxLoadTime: number; // milliseconds
  maxRenderTime: number; // milliseconds
  maxUpdateTime: number; // milliseconds
  maxMemoryUsage: number; // bytes
  minCacheHitRate: number; // 0-1
}

// Form state configuration
export interface FormStateConfig {
  enableOptimisticUpdates: boolean;
  enableStateHistory: boolean;
  enablePerformanceTracking: boolean;
  enableConflictDetection: boolean;
  enableAutoSave: boolean;
  enableStateValidation: boolean;
  persistState: boolean;
  
  // Timing configurations
  autoSaveDelay: number; // milliseconds
  validationDebounce: number; // milliseconds
  saveRetryAttempts: number;
  saveRetryDelay: number; // milliseconds
  
  // Storage configurations
  stateHistoryLimit: number;
  localStorageKey?: string;
  sessionStorageKey?: string;
  
  // Conflict resolution
  conflictResolutionStrategy: ConflictResolutionStrategy;
  
  // Performance monitoring
  performanceThresholds?: PerformanceThresholds;
  enablePerformanceWarnings: boolean;
}

// UI state types
export interface FormUIState {
  activeModule?: string;
  visibleModules: Set<string>;
  expandedSections: Set<string>;
  focusedField?: string;
  showValidationErrors: boolean;
  showConflictDialog: boolean;
  showUnsavedChangesWarning: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
}

// Enhanced field definitions with state awareness
export interface StatefulFieldDefinition extends FieldDefinition {
  // Current state
  currentValue?: unknown;
  isDirty: boolean;
  hasError: boolean;
  hasWarning: boolean;
  isValidated: boolean;
  lastModified?: Date;
  
  // Validation state
  validationResult?: FieldValidationResult;
  validationRules?: ValidationRule[];
  
  // UI state
  isFocused: boolean;
  isVisible: boolean;
  isDisabled: boolean;
  isReadonly: boolean;
}

export interface ValidationRule {
  type: 'required' | 'type' | 'format' | 'range' | 'custom';
  message: string;
  severity: 'error' | 'warning';
  validator: (value: unknown, context?: ValidationContext) => boolean;
  params?: Record<string, unknown>;
}

export interface ValidationContext {
  fieldDefinition: FieldDefinition;
  moduleData: Record<string, unknown>;
  formData: Record<string, Record<string, unknown>>;
  userId?: string;
}

// Event types for form state changes
export interface FormStateEvent {
  type: 'field_change' | 'module_save' | 'validation_complete' | 'conflict_detected' | 'state_restored' | 'auto_save_started' | 'auto_save_completed' | 'auto_save_failed' | 'auto_save_paused' | 'auto_save_resumed' | 'auto_save_queue_full';
  moduleId: string;
  fieldName?: string;
  timestamp: Date;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Hook return types for better type safety
export interface UseFormDataReturn {
  state: {
    data: Record<string, Record<string, unknown>>;
    dirty: Set<string>;
    saving: Set<string>;
    errors: Record<string, string[]>;
    lastSaved: Record<string, Date>;
    versions: Record<string, number>;
    conflicts: Record<string, ConflictInfo>;
  };
  
  actions: {
    updateModuleData: (moduleId: string, data: Record<string, unknown>, options?: { skipDirty?: boolean; optimistic?: boolean }) => void;
    markClean: (moduleId: string) => void;
    markSaving: (moduleId: string, saving: boolean) => void;
    setErrors: (moduleId: string, errors: string[]) => void;
    clearErrors: (moduleId: string) => void;
    setVersion: (moduleId: string, version: number) => void;
    handleConflict: (moduleId: string, conflict: ConflictInfo) => void;
    resolveConflict: (moduleId: string, resolution: ConflictInfo['resolution'], mergedData?: Record<string, unknown>) => void;
    resetModule: (moduleId: string) => void;
    clearPersistedState: () => void;
  };
  
  selectors: {
    getModuleData: (moduleId: string) => Record<string, unknown>;
    isModuleDirty: (moduleId: string) => boolean;
    isModuleSaving: (moduleId: string) => boolean;
    getModuleErrors: (moduleId: string) => string[];
    hasModuleConflict: (moduleId: string) => boolean;
    getModuleConflict: (moduleId: string) => ConflictInfo | null;
    hasUnsavedChanges: () => boolean;
    getFormProgress: () => { dirty: number; total: number; saving: number };
    getPerformanceMetrics: () => FormStateMetrics | null;
  };
  
  config: FormStateConfig;
}

// Type guards for runtime type checking
export function isValidationResult(value: unknown): value is ValidationResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ValidationResult).isValid === 'boolean' &&
    Array.isArray((value as ValidationResult).errors) &&
    Array.isArray((value as ValidationResult).warnings) &&
    (value as ValidationResult).validatedAt instanceof Date
  );
}

export function isConflictInfo(value: unknown): value is ConflictInfo {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ConflictInfo).moduleId === 'string' &&
    typeof (value as ConflictInfo).conflictType === 'string' &&
    typeof (value as ConflictInfo).serverVersion === 'number' &&
    typeof (value as ConflictInfo).clientVersion === 'number' &&
    (value as ConflictInfo).detectedAt instanceof Date
  );
}

export function isStateChange(value: unknown): value is StateChange {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as StateChange).id === 'string' &&
    typeof (value as StateChange).moduleId === 'string' &&
    typeof (value as StateChange).changeType === 'string' &&
    (value as StateChange).timestamp instanceof Date
  );
}

// Utility types for form state management
export type FormStateEventHandler<T extends FormStateEvent = FormStateEvent> = (event: T) => void;
export type ModuleDataValidator = (data: Record<string, unknown>, fieldDefinitions: FieldDefinition[]) => ValidationResult;
export type ConflictResolver = (conflict: ConflictInfo) => Promise<ConflictInfo['resolution']>;
export type SaveStrategy = 'immediate' | 'debounced' | 'batch' | 'manual';

// Default configurations
export const DEFAULT_FORM_STATE_CONFIG: FormStateConfig = {
  enableOptimisticUpdates: true,
  enableStateHistory: false, // Disabled by default for performance
  enablePerformanceTracking: false,
  enableConflictDetection: true,
  enableAutoSave: true,
  enableStateValidation: true,
  persistState: true,
  
  autoSaveDelay: 2000, // 2 seconds
  validationDebounce: 300, // 300ms
  saveRetryAttempts: 3,
  saveRetryDelay: 1000, // 1 second
  
  stateHistoryLimit: 10,
  
  conflictResolutionStrategy: {
    strategy: 'manual',
    autoResolve: false,
    preserveUserChanges: true,
    notifyUser: true,
    createBackup: true,
  },
  
  enablePerformanceWarnings: false,
};

export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  maxLoadTime: 2000, // 2 seconds
  maxRenderTime: 16, // 60fps = 16ms per frame
  maxUpdateTime: 50, // 50ms for state updates
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  minCacheHitRate: 0.8, // 80% cache hit rate
};

// 🔄 NEW: Auto-save system types for Phase 4
export interface AutoSaveConfig {
  enabled: boolean;
  debounceMs: number;
  maxRetries: number;
  retryDelayMs: number;
  batchSaves: boolean;
  saveOnBlur: boolean;
  saveOnUnload: boolean;
  saveOnVisibilityChange: boolean;
  conflictStrategy: 'pause' | 'retry' | 'user_resolve';
  adaptiveTiming: boolean;
  networkAware: boolean;
}

export interface AutoSaveStatus {
  isAutoSaving: boolean;
  lastAutoSave?: Date;
  queuedSaves: number;
  failedSaves: number;
  nextSaveIn?: number; // milliseconds until next save
  isPaused: boolean;
  pauseReason?: 'conflict' | 'offline' | 'manual' | 'error';
  averageSaveTime?: number; // milliseconds
  successRate?: number; // 0-1
  totalSaves: number;
  totalFailures: number;
}

export interface AutoSaveQueue {
  items: AutoSaveQueueItem[];
  maxSize: number;
  processing: boolean;
  lastProcessedAt?: Date;
}

export interface AutoSaveQueueItem {
  id: string;
  moduleId: string;
  data: Record<string, unknown>;
  priority: 'high' | 'normal' | 'low';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  error?: string;
  estimatedSize?: number; // bytes
}

export interface NetworkConnectionInfo {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType?: string;
  effectiveType?: string; // '2g', '3g', '4g', 'slow-2g'
  downlink?: number; // Megabits per second
  rtt?: number; // Round trip time in milliseconds
  saveWhenOnline: boolean;
  lastOnlineAt?: Date;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
}

export interface DebounceOptions {
  delay: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

export interface AutoSaveMetrics {
  totalAutoSaves: number;
  successfulAutoSaves: number;
  failedAutoSaves: number;
  averageAutoSaveTime: number; // milliseconds
  longestAutoSaveTime: number; // milliseconds
  shortestAutoSaveTime: number; // milliseconds
  autoSaveSuccessRate: number; // 0-1
  conflictsDuringAutoSave: number;
  networkErrorsDuringAutoSave: number;
  queueHighWaterMark: number; // maximum queue size reached
  lastAutoSaveMetricsReset: Date;
}

export interface AutoSaveEvent extends FormStateEvent {
  type: 'auto_save_started' | 'auto_save_completed' | 'auto_save_failed' | 'auto_save_paused' | 'auto_save_resumed' | 'auto_save_queue_full';
  autoSaveId?: string;
  duration?: number; // milliseconds
  queueSize?: number;
  error?: string;
  retryCount?: number;
}

// Enhanced form state configuration with auto-save
export interface EnhancedFormStateConfig extends FormStateConfig {
  autoSaveConfig: AutoSaveConfig;
  networkConfig: {
    enableOfflineMode: boolean;
    queueOfflineSaves: boolean;
    maxQueueSize: number;
    enableNetworkQualityDetection: boolean;
  };
  debugConfig: {
    enableAutoSaveLogging: boolean;
    enableMetricsCollection: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

// Type guards for auto-save types
export function isAutoSaveEvent(event: FormStateEvent): event is AutoSaveEvent {
  return event.type.startsWith('auto_save_');
}

export function isAutoSaveQueueItem(value: unknown): value is AutoSaveQueueItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'moduleId' in value &&
    'data' in value &&
    'priority' in value &&
    'attempts' in value
  );
}

// Default auto-save configuration
export const DEFAULT_AUTO_SAVE_CONFIG: AutoSaveConfig = {
  enabled: true,
  debounceMs: 2000, // 2 seconds
  maxRetries: 3,
  retryDelayMs: 1000, // 1 second base delay
  batchSaves: true,
  saveOnBlur: true,
  saveOnUnload: true,
  saveOnVisibilityChange: true,
  conflictStrategy: 'pause',
  adaptiveTiming: true,
  networkAware: true,
}; 