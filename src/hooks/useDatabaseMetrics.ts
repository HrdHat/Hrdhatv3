/**
 * Database Metrics Hook - Phase 6
 * 
 * React hook for monitoring database performance in real-time.
 * Integrates with Phase 4 auto-save monitoring for comprehensive performance tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getPerformanceMonitor, 
  DatabasePerformanceMonitor 
} from '../services/db/performanceMonitor';
import type { 
  DatabaseMetrics, 
  DatabaseMonitoringConfig, 
  MonitoringEvent,
  OptimizationOpportunity,
  DatabasePerformanceIntegration
} from '../types/databaseTypes';

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseDatabaseMetricsOptions {
  enabled?: boolean;
  intervalMs?: number;
  autoStart?: boolean;
  alertThresholds?: {
    criticalQueryTime?: number;
    lowIndexHitRatio?: number;
    highSlowQueryCount?: number;
  };
}

export interface DatabaseMetricsHookReturn {
  // Current state
  metrics: DatabaseMetrics | null;
  isMonitoring: boolean;
  isLoading: boolean;
  error: string | null;

  // Performance data
  metricsHistory: DatabaseMetrics[];
  optimizationOpportunities: OptimizationOpportunity[];
  autoSaveIntegration: DatabasePerformanceIntegration | null;

  // Controls
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => void;
  refreshMetrics: () => Promise<void>;
  getOptimizationOpportunities: () => Promise<void>;

  // Event handling
  addEventListener: (listener: (event: MonitoringEvent) => void) => () => void;

  // Status
  status: {
    health: string;
    optimizationScore: number;
    lastUpdate: Date | null;
    alertCount: number;
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook for monitoring database performance metrics
 */
export function useDatabaseMetrics(
  options: UseDatabaseMetricsOptions = {}
): DatabaseMetricsHookReturn {
  const {
    enabled = true,
    intervalMs = 60000, // 1 minute
    autoStart = true,
    alertThresholds = {}
  } = options;

  // State
  const [metrics, setMetrics] = useState<DatabaseMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<DatabaseMetrics[]>([]);
  const [optimizationOpportunities, setOptimizationOpportunities] = useState<OptimizationOpportunity[]>([]);
  const [autoSaveIntegration, setAutoSaveIntegration] = useState<DatabasePerformanceIntegration | null>(null);
  const [alertCount, setAlertCount] = useState(0);

  // Refs
  const monitorRef = useRef<DatabasePerformanceMonitor | null>(null);
  const eventListenersRef = useRef<Set<() => void>>(new Set());

  // ============================================================================
  // MONITORING CONTROL
  // ============================================================================

  const startMonitoring = useCallback(async (): Promise<void> => {
    if (!enabled || isMonitoring) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create monitoring configuration
      const config: Partial<DatabaseMonitoringConfig> = {
        enabled: true,
        intervalMs,
        alertThresholds: {
          criticalQueryTime: 1000,
          lowIndexHitRatio: 95,
          highSlowQueryCount: 10,
          ...alertThresholds
        }
      };

      // Get monitor instance
      monitorRef.current = getPerformanceMonitor(config);

      // Add event listener for real-time updates
      const removeListener = monitorRef.current.addEventListener((event) => {
        handleMonitoringEvent(event);
      });
      eventListenersRef.current.add(removeListener);

      // Start monitoring
      await monitorRef.current.start();
      setIsMonitoring(true);

      // Get initial metrics
      await refreshMetrics();
      await getOptimizationOpportunities();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start monitoring');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isMonitoring, intervalMs, alertThresholds]);

  const stopMonitoring = useCallback((): void => {
    if (!isMonitoring || !monitorRef.current) return;

    monitorRef.current.stop();
    setIsMonitoring(false);

    // Cleanup event listeners
    eventListenersRef.current.forEach(removeListener => removeListener());
    eventListenersRef.current.clear();
  }, [isMonitoring]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const refreshMetrics = useCallback(async (): Promise<void> => {
    if (!monitorRef.current) return;

    try {
      setIsLoading(true);
      
      // Get current metrics
      const currentMetrics = await monitorRef.current.getCurrentMetrics();
      setMetrics(currentMetrics);

      // Update metrics history
      const history = monitorRef.current.getMetricsHistory(undefined, 100);
      setMetricsHistory(history);

      // Get auto-save integration metrics
      const integration = await monitorRef.current.getAutoSaveIntegrationMetrics();
      setAutoSaveIntegration(integration);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOptimizationOpportunities = useCallback(async (): Promise<void> => {
    if (!monitorRef.current) return;

    try {
      const opportunities = await monitorRef.current.detectOptimizationOpportunities();
      setOptimizationOpportunities(opportunities);
    } catch (err) {
      console.error('[useDatabaseMetrics] Failed to get optimization opportunities:', err);
    }
  }, []);

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  const handleMonitoringEvent = useCallback((event: MonitoringEvent): void => {
    // Update alert count for warning/error events
    if (event.severity === 'warning' || event.severity === 'error' || event.severity === 'critical') {
      setAlertCount(prev => prev + 1);
    }

    // Handle metrics updates
    if (event.type === 'index_scan' && event.details) {
      // Real-time metrics update
      if (event.details.queryTime !== undefined) {
        setMetrics(prev => prev ? {
          ...prev,
          queryTime: event.details.queryTime,
          indexHitRatio: event.details.indexHitRatio || prev.indexHitRatio,
          health: event.details.health || prev.health,
          timestamp: new Date()
        } : null);
      }
    }
  }, []);

  const addEventListener = useCallback((
    listener: (event: MonitoringEvent) => void
  ): (() => void) => {
    if (!monitorRef.current) {
      return () => {}; // No-op if monitor not available
    }

    const removeListener = monitorRef.current.addEventListener(listener);
    eventListenersRef.current.add(removeListener);

    return () => {
      removeListener();
      eventListenersRef.current.delete(removeListener);
    };
  }, []);

  // ============================================================================
  // LIFECYCLE EFFECTS
  // ============================================================================

  // Auto-start monitoring
  useEffect(() => {
    if (autoStart && enabled && !isMonitoring) {
      startMonitoring();
    }

    // Cleanup on unmount
    return () => {
      stopMonitoring();
    };
  }, [autoStart, enabled, isMonitoring, startMonitoring, stopMonitoring]);

  // Periodic refresh
  useEffect(() => {
    if (!isMonitoring) return;

    const refreshInterval = setInterval(() => {
      refreshMetrics();
      getOptimizationOpportunities();
    }, intervalMs);

    return () => clearInterval(refreshInterval);
  }, [isMonitoring, intervalMs, refreshMetrics, getOptimizationOpportunities]);

  // ============================================================================
  // STATUS CALCULATION
  // ============================================================================

  const status = {
    health: metrics?.health || 'unknown',
    optimizationScore: metrics?.optimizationScore || 0,
    lastUpdate: metrics?.timestamp || null,
    alertCount
  };

  // ============================================================================
  // RETURN OBJECT
  // ============================================================================

  return {
    // Current state
    metrics,
    isMonitoring,
    isLoading,
    error,

    // Performance data
    metricsHistory,
    optimizationOpportunities,
    autoSaveIntegration,

    // Controls
    startMonitoring,
    stopMonitoring,
    refreshMetrics,
    getOptimizationOpportunities,

    // Event handling
    addEventListener,

    // Status
    status
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook specifically for auto-save performance monitoring
 */
export function useAutoSaveDatabaseMetrics(): {
  autoSavePerformance: DatabasePerformanceIntegration | null;
  isOptimal: boolean;
  recommendations: string[];
} {
  const { autoSaveIntegration, optimizationOpportunities } = useDatabaseMetrics({
    intervalMs: 30000, // More frequent for auto-save monitoring
    alertThresholds: {
      criticalQueryTime: 200, // Lower threshold for auto-save
    }
  });

  const isOptimal = autoSaveIntegration?.autoSaveMetrics?.averageSaveTime !== undefined &&
                   autoSaveIntegration.autoSaveMetrics.averageSaveTime < 100 &&
                   autoSaveIntegration?.autoSaveMetrics?.saveSuccessRate !== undefined &&
                   autoSaveIntegration.autoSaveMetrics.saveSuccessRate > 99;

  const recommendations = optimizationOpportunities
    .filter(opp => opp.priority === 'critical' || opp.priority === 'high')
    .map(opp => opp.recommendation);

  return {
    autoSavePerformance: autoSaveIntegration,
    isOptimal,
    recommendations
  };
}

/**
 * Hook for real-time database health monitoring
 */
export function useDatabaseHealth(): {
  health: string;
  score: number;
  alerts: number;
  isHealthy: boolean;
} {
  const { metrics, status } = useDatabaseMetrics({
    intervalMs: 10000, // Very frequent health checks
    alertThresholds: {
      criticalQueryTime: 500,
      lowIndexHitRatio: 90,
      highSlowQueryCount: 5
    }
  });

  const isHealthy = status.health === 'excellent' || status.health === 'good';

  return {
    health: status.health,
    score: status.optimizationScore,
    alerts: status.alertCount,
    isHealthy
  };
}

/**
 * Hook for index performance monitoring
 */
export function useIndexPerformance(): {
  indexStats: any[];
  unusedIndexes: number;
  poorPerformers: number;
  overallEfficiency: number;
} {
  const { metrics } = useDatabaseMetrics();

  const indexStats = metrics?.indexEfficiency || [];
  const unusedIndexes = indexStats.filter(idx => idx.efficiency === 'unused').length;
  const poorPerformers = indexStats.filter(idx => idx.efficiency === 'poor').length;
  
  const overallEfficiency = indexStats.length > 0
    ? indexStats.filter(idx => idx.efficiency === 'excellent' || idx.efficiency === 'good').length / indexStats.length
    : 0;

  return {
    indexStats,
    unusedIndexes,
    poorPerformers,
    overallEfficiency
  };
} 