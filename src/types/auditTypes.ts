/**
 * Phase 7: Audit and Versioning Types
 * ===================================
 * 
 * Type definitions for comprehensive audit logging and version management.
 * These types support the enhanced versioning and audit system implemented in Phase 7.
 */

// ─── CORE AUDIT TYPES ───────────────────────────────────────────────────────

export type ChangeType = 'create' | 'update' | 'delete' | 'restore' | 'migrate';

export type ChangeSource = 
  | 'auto-save'      // Automatic save from user interaction
  | 'manual'         // Manual save button click
  | 'bulk-update'    // Batch operation
  | 'system'         // System-initiated change
  | 'migration'      // Data migration operation
  | 'import'         // Data import operation
  | 'api';           // External API call

export interface AuditMetadata {
  source: ChangeSource;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  batchId?: string;
  reason?: string;
  context?: Record<string, unknown>;
}

export interface AuditEntry {
  id: string;
  entryId: string;                  // References form_data_entries.id
  formId?: string;                  // Added for convenience (derived from entry)
  moduleId?: string;                // Added for convenience (derived from entry)
  data: Record<string, unknown>;    // Snapshot of data before change
  changedBy: string | null;         // User ID who made the change
  changeType: ChangeType;
  changeReason?: string;
  createdAt: string;
  metadata?: AuditMetadata;
}

// ─── VERSION MANAGEMENT TYPES ───────────────────────────────────────────────

export interface VersionInfo {
  currentVersion: number;
  lastModifiedBy: string | null;
  lastModifiedAt: string | null;
  entryExists: boolean;
  isLocked?: boolean;               // For future locking features
  lockExpiry?: string;              // For future locking features
}

export interface ConflictInfo {
  hasConflict: boolean;
  serverVersion: number;
  clientVersion: number;
  lastModifiedBy: string | null;
  lastModifiedAt: string | null;
  conflictReason?: 'version_mismatch' | 'concurrent_edit' | 'lock_violation';
}

export interface VersionConflictDetails extends ConflictInfo {
  moduleId: string;
  formId: string;
  serverData?: Record<string, unknown>;
  clientData?: Record<string, unknown>;
  conflictedFields?: string[];      // Fields that differ between versions
  suggestions?: ConflictResolutionSuggestion[];
}

export type ConflictResolutionStrategy = 
  | 'keep_server'    // Discard client changes, keep server version
  | 'keep_client'    // Force client changes, overwrite server
  | 'merge_manual'   // Manual field-by-field resolution
  | 'merge_auto';    // Automatic merge (if possible)

export interface ConflictResolutionSuggestion {
  field: string;
  strategy: ConflictResolutionStrategy;
  reason: string;
  confidence: number;               // 0-1 confidence score
}

// ─── AUDIT STATISTICS AND REPORTING ─────────────────────────────────────────

export interface AuditStatistics {
  totalAuditEntries: number;
  oldestEntryDate: string | null;
  newestEntryDate: string | null;
  uniqueUsers: number;
  entriesLast30Days: number;
  averageEntriesPerDay: number;
  changeTypeBreakdown: Record<ChangeType, number>;
  topActiveUsers: Array<{
    userId: string;
    entryCount: number;
  }>;
}

export interface AuditReport {
  reportId: string;
  generatedAt: string;
  generatedBy: string;
  dateRange: {
    start: string;
    end: string;
  };
  filters: AuditReportFilters;
  statistics: AuditStatistics;
  entries: AuditEntry[];
  metadata: {
    totalEntries: number;
    totalPages: number;
    currentPage: number;
    reportType: AuditReportType;
  };
}

export type AuditReportType = 
  | 'user_activity'     // Activity for specific user(s)
  | 'form_history'      // History for specific form(s)
  | 'system_audit'      // System-wide audit
  | 'compliance'        // Compliance-focused report
  | 'security';         // Security-focused report

export interface AuditReportFilters {
  userIds?: string[];
  formIds?: string[];
  moduleIds?: string[];
  changeTypes?: ChangeType[];
  changeSources?: ChangeSource[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchTerm?: string;              // Search in change reasons or metadata
}

// ─── AUDIT TRAIL AND TIMELINE ───────────────────────────────────────────────

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  event: AuditEvent;
  actor: AuditActor;
  target: AuditTarget;
  changes: AuditChanges[];
  context: AuditContext;
}

export interface AuditEvent {
  type: ChangeType;
  source: ChangeSource;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditActor {
  id: string;
  type: 'user' | 'system' | 'api' | 'migration';
  name: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface AuditTarget {
  type: 'form' | 'module' | 'field' | 'system';
  id: string;
  name: string;
  path: string[];                   // Hierarchical path (e.g., ['form', 'module', 'field'])
}

export interface AuditChanges {
  field: string;
  fieldLabel?: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: 'added' | 'modified' | 'removed';
  dataType: string;
}

export interface AuditContext {
  formId?: string;
  moduleId?: string;
  batchId?: string;
  parentOperation?: string;
  relatedChanges?: string[];        // IDs of related audit entries
}

// ─── AUDIT CONFIGURATION AND POLICIES ───────────────────────────────────────

export interface AuditPolicy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  
  // What to audit
  targets: {
    forms: string[] | '*';          // Specific forms or all
    modules: string[] | '*';        // Specific modules or all
    changeTypes: ChangeType[];
  };
  
  // Retention policy
  retention: {
    days: number;
    archiveOlderEntries: boolean;
    deleteAfterArchive: boolean;
  };
  
  // Notification settings
  notifications: {
    enabled: boolean;
    events: ChangeType[];
    recipients: string[];
    channels: ('email' | 'webhook' | 'dashboard')[];
  };
  
  // Compliance settings
  compliance: {
    standard?: string;              // e.g., 'SOX', 'HIPAA', 'GDPR'
    requireChangeReason: boolean;
    requireManagerApproval: boolean;
    sensitiveFields: string[];      // Fields requiring special handling
  };
}

export interface AuditConfiguration {
  defaultPolicy: string;            // Default policy ID
  policies: AuditPolicy[];
  globalSettings: {
    enableRealTimeAudit: boolean;
    enableBatchAudit: boolean;
    maxBatchSize: number;
    auditQueueSize: number;
    enablePerformanceTracking: boolean;
  };
  retentionDefaults: {
    standardRetentionDays: number;
    sensitiveDataRetentionDays: number;
    archivedDataRetentionDays: number;
  };
}

// ─── AUDIT HEALTH AND MONITORING ────────────────────────────────────────────

export interface AuditHealthStatus {
  isHealthy: boolean;
  lastCheckAt: string;
  issues: AuditHealthIssue[];
  metrics: AuditHealthMetrics;
  recommendations: AuditRecommendation[];
}

export interface AuditHealthIssue {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'performance' | 'data_integrity' | 'compliance' | 'security';
  title: string;
  description: string;
  detectedAt: string;
  suggestedActions: string[];
}

export interface AuditHealthMetrics {
  auditLatency: {
    average: number;                // ms
    p95: number;                    // ms
    p99: number;                    // ms
  };
  auditThroughput: {
    entriesPerSecond: number;
    entriesPerMinute: number;
    entriesPerHour: number;
  };
  storageMetrics: {
    totalAuditEntries: number;
    storageSizeBytes: number;
    growthRatePerDay: number;
    projectedFullDate?: string;     // When storage might be full
  };
  integrityMetrics: {
    missingEntries: number;
    corruptedEntries: number;
    lastIntegrityCheck: string;
  };
}

export interface AuditRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'performance' | 'storage' | 'security' | 'compliance';
  title: string;
  description: string;
  estimatedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
  actions: string[];
}

// ─── VERSION COMPARISON AND DIFF ────────────────────────────────────────────

export interface VersionComparison {
  moduleId: string;
  formId: string;
  fromVersion: number;
  toVersion: number;
  comparedAt: string;
  differences: FieldDifference[];
  summary: ComparisonSummary;
}

export interface FieldDifference {
  fieldPath: string;                // e.g., 'general.project_name'
  fieldLabel?: string;
  fieldType: string;
  changeType: 'added' | 'modified' | 'removed';
  oldValue: unknown;
  newValue: unknown;
  significance: 'minor' | 'major' | 'critical';
}

export interface ComparisonSummary {
  totalChanges: number;
  addedFields: number;
  modifiedFields: number;
  removedFields: number;
  significanceBreakdown: Record<'minor' | 'major' | 'critical', number>;
  impactAssessment: string;
}

// ─── AUDIT INTEGRATION TYPES ────────────────────────────────────────────────

export interface AuditableOperation {
  operationId: string;
  operationType: ChangeType;
  operationSource: ChangeSource;
  targetModuleId: string;
  targetFormId: string;
  expectedVersion?: number;
  reason?: string;
  metadata?: AuditMetadata;
}

export interface AuditOperationResult {
  operationId: string;
  success: boolean;
  auditEntryId?: string;
  versionInfo?: VersionInfo;
  conflictInfo?: ConflictInfo;
  error?: string;
  warnings?: string[];
}

// ─── UTILITY AND HELPER TYPES ───────────────────────────────────────────────

export interface AuditQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'change_type' | 'changed_by';
  sortOrder?: 'asc' | 'desc';
  includeMetadata?: boolean;
  includeDataSnapshot?: boolean;
}

export interface AuditExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  includeMetadata: boolean;
  includeDataSnapshots: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: AuditReportFilters;
  compression?: 'none' | 'gzip' | 'zip';
}

export interface AuditImportResult {
  importId: string;
  importedAt: string;
  totalEntries: number;
  successfulEntries: number;
  failedEntries: number;
  errors: Array<{
    line: number;
    error: string;
    data?: Record<string, unknown>;
  }>;
  warnings: string[];
}

// ─── DEFAULT CONFIGURATIONS ─────────────────────────────────────────────────

export const DEFAULT_AUDIT_POLICY: Partial<AuditPolicy> = {
  targets: {
    forms: '*',
    modules: '*',
    changeTypes: ['create', 'update', 'delete'],
  },
  retention: {
    days: 90,
    archiveOlderEntries: true,
    deleteAfterArchive: false,
  },
  notifications: {
    enabled: false,
    events: ['delete'],
    recipients: [],
    channels: ['dashboard'],
  },
  compliance: {
    requireChangeReason: false,
    requireManagerApproval: false,
    sensitiveFields: [],
  },
};

export const DEFAULT_AUDIT_CONFIGURATION: Partial<AuditConfiguration> = {
  globalSettings: {
    enableRealTimeAudit: true,
    enableBatchAudit: true,
    maxBatchSize: 100,
    auditQueueSize: 1000,
    enablePerformanceTracking: true,
  },
  retentionDefaults: {
    standardRetentionDays: 90,
    sensitiveDataRetentionDays: 365,
    archivedDataRetentionDays: 2555, // 7 years
  },
}; 