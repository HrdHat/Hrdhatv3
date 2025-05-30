/**
 * Database Performance Monitor Service - Phase 6
 * 
 * Integrates with Phase 4 auto-save monitoring to provide comprehensive
 * database performance tracking and optimization recommendations.
 * 
 * Monitors query performance, index usage, and database health in real-time.
 */

import { 
  generatePerformanceReport, 
  analyzeIndexUsage, 
  getSlowQueries,
  startQueryMonitoring 
} from '../../db/optimization/queryAnalyzer';
import type { 
  DatabaseMetrics, 
  DatabaseMonitoringConfig, 
  MonitoringEvent,
  OptimizationOpportunity,
  PerformanceBaseline,
  DatabasePerformanceIntegration 
} from '../../types/databaseTypes';

/**
 * Default monitoring configuration
 */
const DEFAULT_MONITORING_CONFIG: DatabaseMonitoringConfig = {
  enabled: true,
  intervalMs: 60000, // 1 minute
  slowQueryThresholdMs: 100,
  indexUsageThreshold: 0.1,
  alertThresholds: {
    criticalQueryTime: 1000, // 1 second
    lowIndexHitRatio: 95,
    highSlowQueryCount: 10
  },
  retentionDays: 7
};

/**
 * Database Performance Monitor Service Class
 */
export class DatabasePerformanceMonitor {
  private config: DatabaseMonitoringConfig;
  private isMonitoring: boolean = false;
  private stopMonitoring?: () => void;
  private listeners: Set<(event: MonitoringEvent) => void> = new Set();
  private metricsHistory: DatabaseMetrics[] = [];
  private lastBaseline?: PerformanceBaseline;

  constructor(config: Partial<DatabaseMonitoringConfig> = {}) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
  }

  // ============================================================================
  // MONITORING LIFECYCLE
  // ============================================================================

  /**
   * Start database performance monitoring
   */
  async start(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('[DatabasePerformanceMonitor] Already monitoring');
      return;
    }

    this.isMonitoring = true;

    try {
      // Establish baseline if none exists
      if (!this.lastBaseline) {
        await this.establishBaseline();
      }

      // Start continuous monitoring
      this.stopMonitoring = await startQueryMonitoring(
        (metrics) => this.handleMetricsUpdate(metrics),
        this.config.intervalMs
      );

      this.emitEvent({
        timestamp: new Date(),
        type: 'index_scan',
        severity: 'info',
        message: 'Database performance monitoring started',
        details: { config: this.config }
      });

    } catch (error) {
      this.isMonitoring = false;
      throw new Error(`Failed to start monitoring: ${error}`);
    }
  }

  /**
   * Stop database performance monitoring
   */
  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.stopMonitoring?.();
    this.stopMonitoring = undefined;

    this.emitEvent({
      timestamp: new Date(),
      type: 'index_scan',
      severity: 'info',
      message: 'Database performance monitoring stopped',
      details: { metricsCollected: this.metricsHistory.length }
    });
  }

  /**
   * Get current monitoring status
   */
  getStatus(): { 
    isMonitoring: boolean; 
    config: DatabaseMonitoringConfig; 
    metricsCount: number;
    lastMetrics?: DatabaseMetrics;
  } {
    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      metricsCount: this.metricsHistory.length,
      lastMetrics: this.metricsHistory[this.metricsHistory.length - 1]
    };
  }

  // ============================================================================
  // METRICS COLLECTION & ANALYSIS
  // ============================================================================

  /**
   * Get current database metrics
   */
  async getCurrentMetrics(): Promise<DatabaseMetrics> {
    const report = await generatePerformanceReport();
    
    const metrics: DatabaseMetrics = {
      timestamp: new Date(),
      queryTime: report.metrics.averageQueryTime,
      indexHitRatio: report.metrics.indexHitRatio,
      connectionCount: 0, // Would need additional query
      slowQueries: report.slowQueries,
      tableSize: 0, // Would need additional query
      indexEfficiency: report.indexStats,
      optimizationScore: report.metrics.optimizationScore,
      health: report.overallHealth
    };

    return metrics;
  }

  /**
   * Establish performance baseline
   */
  async establishBaseline(): Promise<PerformanceBaseline> {
    try {
      const metrics = await this.getCurrentMetrics();
      
      this.lastBaseline = {
        timestamp: new Date(),
        averageQueryTime: metrics.queryTime,
        indexHitRatio: metrics.indexHitRatio,
        tableSize: metrics.tableSize,
        recordCount: 0, // Would need additional query
        indexCount: metrics.indexEfficiency.length,
        notes: 'Phase 6 initial baseline'
      };

      this.emitEvent({
        timestamp: new Date(),
        type: 'index_scan',
        severity: 'info',
        message: 'Performance baseline established',
        details: this.lastBaseline
      });

      return this.lastBaseline;

    } catch (error) {
      throw new Error(`Failed to establish baseline: ${error}`);
    }
  }

  /**
   * Get performance metrics history
   */
  getMetricsHistory(
    sinceDatetime?: Date,
    limit?: number
  ): DatabaseMetrics[] {
    let history = this.metricsHistory;

    if (sinceDatetime) {
      history = history.filter(metrics => metrics.timestamp >= sinceDatetime);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  // ============================================================================
  // INTEGRATION WITH PHASE 4 AUTO-SAVE
  // ============================================================================

  /**
   * Get database performance integration metrics for Phase 4 auto-save
   */
  async getAutoSaveIntegrationMetrics(): Promise<DatabasePerformanceIntegration> {
    const currentMetrics = await this.getCurrentMetrics();
    const indexStats = await analyzeIndexUsage();
    
    // Calculate metrics specific to auto-save operations
    const moduleQueryStats = indexStats.find(idx => 
      idx.indexName.includes('module_id')
    );
    const formQueryStats = indexStats.find(idx => 
      idx.indexName.includes('form_id')
    );
    
    return {
      autoSaveMetrics: {
        averageSaveTime: currentMetrics.queryTime,
        saveSuccessRate: this.calculateSaveSuccessRate(),
        queuedSaves: 0, // Would come from Phase 4 integration
        batchEfficiency: this.calculateBatchEfficiency()
      },
      indexOptimization: {
        moduleQueryTime: moduleQueryStats?.usageRatio || 0,
        formQueryTime: formQueryStats?.usageRatio || 0,
        batchQueryTime: this.calculateBatchQueryTime(),
        versionCheckTime: this.calculateVersionCheckTime()
      },
      realTimeMetrics: {
        queriesPerSecond: this.calculateQueriesPerSecond(),
        averageLatency: currentMetrics.queryTime,
        cacheHitRate: currentMetrics.indexHitRatio,
        errorRate: this.calculateErrorRate()
      }
    };
  }

  // ============================================================================
  // OPTIMIZATION DETECTION
  // ============================================================================

  /**
   * Detect optimization opportunities
   */
  async detectOptimizationOpportunities(): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];
    
    try {
      const [indexStats, slowQueries] = await Promise.all([
        analyzeIndexUsage(),
        getSlowQueries()
      ]);

      // Detect unused indexes
      const unusedIndexes = indexStats.filter(idx => idx.efficiency === 'unused');
      unusedIndexes.forEach(idx => {
        opportunities.push({
          type: 'index',
          priority: 'medium',
          description: `Unused index detected: ${idx.indexName}`,
          impact: 'Improved write performance by removing index overhead',
          effort: 'Low - single DROP INDEX command',
          recommendation: `Consider dropping unused index ${idx.indexName}`,
          sqlCommand: `DROP INDEX CONCURRENTLY ${idx.indexName};`
        });
      });

      // Detect slow queries needing optimization
      const criticalQueries = slowQueries.filter(q => q.severity === 'critical');
      criticalQueries.forEach(query => {
        opportunities.push({
          type: 'query',
          priority: 'critical',
          description: `Critical slow query detected (${query.meanTime}ms average)`,
          impact: `Potential ${Math.round((query.meanTime - 50) / query.meanTime * 100)}% performance improvement`,
          effort: 'Medium - query analysis and optimization required',
          recommendation: query.optimization.join('; ')
        });
      });

      // Detect low index hit ratios
      const poorIndexes = indexStats.filter(idx => 
        idx.efficiency === 'poor' && idx.indexScans > 100
      );
      poorIndexes.forEach(idx => {
        opportunities.push({
          type: 'index',
          priority: 'high',
          description: `Poor performing index: ${idx.indexName} (${idx.usageRatio} efficiency)`,
          impact: 'Improved query performance with index optimization',
          effort: 'Medium - index analysis and potential rebuild',
          recommendation: `Analyze and potentially rebuild index ${idx.indexName}`
        });
      });

    } catch (error) {
      console.error('[detectOptimizationOpportunities] Error:', error);
    }

    return opportunities.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  /**
   * Add event listener
   */
  addEventListener(listener: (event: MonitoringEvent) => void): () => void {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit monitoring event
   */
  private emitEvent(event: MonitoringEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[DatabasePerformanceMonitor] Listener error:', error);
      }
    });
  }

  // ============================================================================
  // METRICS UPDATE HANDLING
  // ============================================================================

  /**
   * Handle new metrics update
   */
  private handleMetricsUpdate(metrics: DatabaseMetrics): void {
    // Store metrics
    this.metricsHistory.push(metrics);
    
    // Cleanup old metrics
    this.cleanupOldMetrics();
    
    // Check for alerts
    this.checkAlertThresholds(metrics);
    
    // Emit metrics event
    this.emitEvent({
      timestamp: new Date(),
      type: 'index_scan',
      severity: 'info',
      message: 'Metrics updated',
      details: {
        queryTime: metrics.queryTime,
        indexHitRatio: metrics.indexHitRatio,
        health: metrics.health
      }
    });
  }

  /**
   * Check alert thresholds
   */
  private checkAlertThresholds(metrics: DatabaseMetrics): void {
    const { alertThresholds } = this.config;

    // Check critical query time
    if (metrics.queryTime > alertThresholds.criticalQueryTime) {
      this.emitEvent({
        timestamp: new Date(),
        type: 'slow_query',
        severity: 'critical',
        message: `Critical query time detected: ${metrics.queryTime}ms`,
        details: { threshold: alertThresholds.criticalQueryTime, actual: metrics.queryTime }
      });
    }

    // Check low index hit ratio
    if (metrics.indexHitRatio < alertThresholds.lowIndexHitRatio) {
      this.emitEvent({
        timestamp: new Date(),
        type: 'index_scan',
        severity: 'warning',
        message: `Low index hit ratio: ${metrics.indexHitRatio}%`,
        details: { threshold: alertThresholds.lowIndexHitRatio, actual: metrics.indexHitRatio }
      });
    }

    // Check high slow query count
    if (metrics.slowQueries.length > alertThresholds.highSlowQueryCount) {
      this.emitEvent({
        timestamp: new Date(),
        type: 'slow_query',
        severity: 'warning',
        message: `High slow query count: ${metrics.slowQueries.length}`,
        details: { threshold: alertThresholds.highSlowQueryCount, actual: metrics.slowQueries.length }
      });
    }
  }

  /**
   * Cleanup old metrics based on retention policy
   */
  private cleanupOldMetrics(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    
    this.metricsHistory = this.metricsHistory.filter(
      metrics => metrics.timestamp >= cutoffDate
    );
  }

  // ============================================================================
  // HELPER CALCULATIONS
  // ============================================================================

  private calculateSaveSuccessRate(): number {
    // This would integrate with Phase 4 auto-save metrics
    return 99.5; // Default for now
  }

  private calculateBatchEfficiency(): number {
    // This would compare batch vs single save performance
    return 0.8; // Default for now
  }

  private calculateBatchQueryTime(): number {
    const recentMetrics = this.metricsHistory.slice(-10);
    if (recentMetrics.length === 0) return 0;
    
    return recentMetrics.reduce((sum, m) => sum + m.queryTime, 0) / recentMetrics.length;
  }

  private calculateVersionCheckTime(): number {
    // This would measure optimistic locking query performance
    return 10; // Default for now
  }

  private calculateQueriesPerSecond(): number {
    // This would measure database load
    return 50; // Default for now
  }

  private calculateErrorRate(): number {
    // This would track database error percentage
    return 0.1; // Default for now
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let performanceMonitorInstance: DatabasePerformanceMonitor | null = null;

/**
 * Get singleton instance of database performance monitor
 */
export function getPerformanceMonitor(
  config?: Partial<DatabaseMonitoringConfig>
): DatabasePerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new DatabasePerformanceMonitor(config);
  }
  return performanceMonitorInstance;
}

/**
 * Start database monitoring with default configuration
 */
export async function startDatabaseMonitoring(
  config?: Partial<DatabaseMonitoringConfig>
): Promise<DatabasePerformanceMonitor> {
  const monitor = getPerformanceMonitor(config);
  await monitor.start();
  return monitor;
}

/**
 * Stop database monitoring
 */
export function stopDatabaseMonitoring(): void {
  if (performanceMonitorInstance) {
    performanceMonitorInstance.stop();
  }
} 