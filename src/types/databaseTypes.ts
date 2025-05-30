/**
 * Database Performance Types - Phase 6
 * 
 * TypeScript definitions for database optimization, query analysis,
 * and performance monitoring infrastructure.
 */

// ============================================================================
// INDEX PERFORMANCE TYPES
// ============================================================================

export interface IndexUsageStats {
  indexName: string;
  tableName: string;
  indexSize: string;              // Human-readable size (e.g., "15 MB")
  indexScans: number;             // Number of times index was used
  tuplesRead: number;             // Total tuples read via this index
  tuplesFetched: number;          // Total tuples fetched via this index
  usageRatio: number;             // Efficiency ratio (0-1)
  efficiency: 'excellent' | 'good' | 'poor' | 'unused';
  recommendation: string;         // Optimization recommendation
}

export interface IndexBloatInfo {
  tableName: string;
  indexName: string;
  bloatRatio: number;             // Percentage of bloat
  wasteBytes: number;             // Wasted bytes due to bloat
  recommendation: string;         // Maintenance recommendation
}

// ============================================================================
// QUERY PERFORMANCE TYPES
// ============================================================================

export interface SlowQueryInfo {
  query: string;                  // SQL query text
  calls: number;                  // Number of times executed
  totalTime: number;              // Total execution time (ms)
  meanTime: number;               // Average execution time (ms)
  rows: number;                   // Average rows returned
  hitRatio: number;               // Cache hit ratio (0-100)
  severity: 'critical' | 'high' | 'medium' | 'low';
  optimization: string[];         // Optimization suggestions
}

export interface QueryPattern {
  pattern: string;                // Query pattern identifier
  frequency: number;              // How often this pattern occurs
  averageTime: number;            // Average execution time
  description: string;            // Human-readable description
  optimizationLevel: 'optimal' | 'good' | 'needs_work' | 'critical';
}

// ============================================================================
// TABLE STATISTICS TYPES
// ============================================================================

export interface TableStatistics {
  sequentialScans: number;        // Sequential scans performed
  sequentialTuples: number;       // Tuples read via sequential scans
  indexScans: number;             // Index scans performed
  indexTuples: number;            // Tuples fetched via index scans
  inserts: number;                // Number of inserts
  updates: number;                // Number of updates
  deletes: number;                // Number of deletes
  hotUpdates: number;             // Hot updates (no index update needed)
  liveRows: number;               // Estimated live rows
  deadRows: number;               // Estimated dead rows
  lastVacuum?: Date;              // Last manual vacuum
  lastAutoVacuum?: Date;          // Last auto vacuum
  lastAnalyze?: Date;             // Last manual analyze
  lastAutoAnalyze?: Date;         // Last auto analyze
}

// ============================================================================
// PERFORMANCE METRICS TYPES
// ============================================================================

export interface DatabaseMetrics {
  timestamp: Date;
  queryTime: number;              // Average query response time (ms)
  indexHitRatio: number;          // Overall index hit ratio (0-100)
  connectionCount: number;        // Active database connections
  slowQueries: SlowQueryInfo[];   // Current slow queries
  tableSize: number;              // Table size in bytes
  indexEfficiency: IndexUsageStats[]; // Index usage statistics
  optimizationScore: number;      // Overall optimization score (0-100)
  health: 'excellent' | 'good' | 'needs_attention' | 'critical' | 'unknown';
}

export interface PerformanceBaseline {
  timestamp: Date;
  averageQueryTime: number;       // Baseline query time
  indexHitRatio: number;          // Baseline hit ratio
  tableSize: number;              // Baseline table size
  recordCount: number;            // Number of records
  indexCount: number;             // Number of indexes
  notes: string;                  // Baseline description
}

// ============================================================================
// COMPREHENSIVE REPORT TYPES
// ============================================================================

export interface QueryPerformanceReport {
  timestamp: Date;
  indexStats: IndexUsageStats[];
  slowQueries: SlowQueryInfo[];
  tableStats: TableStatistics | null;
  overallHealth: 'excellent' | 'good' | 'needs_attention' | 'critical' | 'unknown';
  recommendations: string[];
  metrics: {
    totalIndexes: number;
    activeIndexes: number;
    unusedIndexes: number;
    averageQueryTime: number;
    indexHitRatio: number;
    optimizationScore: number;
  };
}

export interface OptimizationOpportunity {
  type: 'index' | 'query' | 'table' | 'configuration';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string;                 // Expected performance impact
  effort: string;                 // Implementation effort required
  recommendation: string;         // Specific action to take
  sqlCommand?: string;            // SQL to execute (if applicable)
}

// ============================================================================
// MONITORING CONFIGURATION TYPES
// ============================================================================

export interface DatabaseMonitoringConfig {
  enabled: boolean;
  intervalMs: number;             // Monitoring interval
  slowQueryThresholdMs: number;   // Threshold for slow query detection
  indexUsageThreshold: number;    // Threshold for unused index detection
  alertThresholds: {
    criticalQueryTime: number;    // Alert if query time exceeds this
    lowIndexHitRatio: number;     // Alert if hit ratio below this
    highSlowQueryCount: number;   // Alert if too many slow queries
  };
  retentionDays: number;          // How long to keep metrics
}

export interface MonitoringEvent {
  timestamp: Date;
  type: 'index_scan' | 'slow_query' | 'table_scan' | 'optimization_opportunity';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details: Record<string, any>;   // Additional event data
}

// ============================================================================
// INTEGRATION WITH PHASE 4 TYPES
// ============================================================================

export interface DatabasePerformanceIntegration {
  autoSaveMetrics: {
    averageSaveTime: number;      // Average database save time
    saveSuccessRate: number;      // Success rate for saves
    queuedSaves: number;          // Currently queued saves
    batchEfficiency: number;      // Batch vs single save efficiency
  };
  indexOptimization: {
    moduleQueryTime: number;      // Time for module queries
    formQueryTime: number;        // Time for form-wide queries
    batchQueryTime: number;       // Time for batch operations
    versionCheckTime: number;     // Time for version checks
  };
  realTimeMetrics: {
    queriesPerSecond: number;     // Database load
    averageLatency: number;       // Network + DB latency
    cacheHitRate: number;         // Application cache hits
    errorRate: number;            // Database error rate
  };
}

// ============================================================================
// OPTIMIZATION TRACKING TYPES
// ============================================================================

export interface OptimizationResult {
  id: string;
  timestamp: Date;
  type: 'index_creation' | 'query_optimization' | 'configuration_change';
  description: string;
  beforeMetrics: DatabaseMetrics;
  afterMetrics: DatabaseMetrics;
  improvement: {
    queryTimeImprovement: number; // Percentage improvement
    hitRatioImprovement: number;  // Hit ratio improvement
    overallScore: number;         // Overall improvement score
  };
  status: 'applied' | 'testing' | 'reverted' | 'failed';
}

export interface OptimizationHistory {
  optimizations: OptimizationResult[];
  totalImprovements: number;
  lastOptimization: Date;
  cumulativeImprovement: number;
  rollbackHistory: OptimizationResult[];
}

// ============================================================================
// EXPORT COLLECTIONS
// ============================================================================

// Main database performance types
export type DatabaseHealth = 'excellent' | 'good' | 'needs_attention' | 'critical' | 'unknown';
export type QuerySeverity = 'critical' | 'high' | 'medium' | 'low';
export type IndexEfficiency = 'excellent' | 'good' | 'poor' | 'unused';
export type OptimizationType = 'index' | 'query' | 'table' | 'configuration';
export type OptimizationPriority = 'critical' | 'high' | 'medium' | 'low';

// Utility types for database operations
export interface DatabaseQueryOptions {
  timeout?: number;               // Query timeout in ms
  retryAttempts?: number;         // Retry attempts for failed queries
  useIndex?: string;              // Hint for specific index usage
  analyzeQuery?: boolean;         // Whether to analyze query performance
}

export interface DatabaseIndexDefinition {
  name: string;
  table: string;
  columns: string[];
  type: 'btree' | 'gin' | 'gist' | 'hash';
  unique?: boolean;
  concurrent?: boolean;           // Use CONCURRENTLY for creation
  condition?: string;             // Partial index condition
  expression?: string;            // Expression index definition
}

// Phase 6 specific event types
export interface Phase6Event {
  type: 'index_created' | 'optimization_applied' | 'performance_improved' | 'issue_detected';
  phase: 6;
  timestamp: Date;
  data: Record<string, any>;
  impact: 'high' | 'medium' | 'low';
  automated: boolean;             // Whether this was an automated optimization
} 