/**
 * Database Performance Dashboard - Phase 6
 * 
 * Real-time database performance monitoring dashboard.
 * Integrates with Phase 4 auto-save monitoring for comprehensive oversight.
 */

import React, { useState, useEffect } from 'react';
import { 
  useDatabaseMetrics, 
  useAutoSaveDatabaseMetrics, 
  useDatabaseHealth,
  useIndexPerformance
} from '../../../hooks/useDatabaseMetrics';
import type { MonitoringEvent } from '../../../types/databaseTypes';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface DatabasePerformanceDashboardProps {
  className?: string;
  compact?: boolean;
  showOptimizations?: boolean;
  refreshInterval?: number;
  onAlert?: (event: MonitoringEvent) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DatabasePerformanceDashboard({
  className = '',
  compact = false,
  showOptimizations = true,
  refreshInterval = 60000,
  onAlert
}: DatabasePerformanceDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'indexes' | 'queries' | 'autosave'>('overview');
  const [alertHistory, setAlertHistory] = useState<MonitoringEvent[]>([]);

  // Hook into database metrics
  const databaseMetrics = useDatabaseMetrics({
    intervalMs: refreshInterval,
    autoStart: true
  });

  const autoSaveMetrics = useAutoSaveDatabaseMetrics();
  const healthMetrics = useDatabaseHealth();
  const indexMetrics = useIndexPerformance();

  // Handle alerts
  useEffect(() => {
    const removeListener = databaseMetrics.addEventListener((event) => {
      if (event.severity === 'warning' || event.severity === 'error' || event.severity === 'critical') {
        setAlertHistory(prev => [event, ...prev].slice(0, 10)); // Keep last 10 alerts
        onAlert?.(event);
      }
    });

    return removeListener;
  }, [databaseMetrics, onAlert]);

  if (compact) {
    return <CompactDashboard {...{ databaseMetrics, healthMetrics, className }} />;
  }

  return (
    <div className={`database-performance-dashboard ${className}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h3>Database Performance Monitor</h3>
          <div className="dashboard-status">
            <HealthIndicator health={healthMetrics.health} score={healthMetrics.score} />
            <span className="last-update">
              Last updated: {databaseMetrics.metrics?.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="dashboard-controls">
          <button
            onClick={() => databaseMetrics.refreshMetrics()}
            disabled={databaseMetrics.isLoading}
            className="btn-refresh"
            title="Refresh metrics"
          >
            🔄 Refresh
          </button>
          
          {databaseMetrics.isMonitoring ? (
            <button
              onClick={databaseMetrics.stopMonitoring}
              className="btn-stop"
              title="Stop monitoring"
            >
              ⏹️ Stop
            </button>
          ) : (
            <button
              onClick={databaseMetrics.startMonitoring}
              className="btn-start"
              title="Start monitoring"
            >
              ▶️ Start
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {databaseMetrics.error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{databaseMetrics.error}</span>
          <button
            onClick={() => databaseMetrics.startMonitoring()}
            className="error-retry"
          >
            Retry
          </button>
        </div>
      )}

      {/* Alert banner */}
      {healthMetrics.alerts > 0 && (
        <div className="alert-banner">
          <span className="alert-icon">🚨</span>
          <span className="alert-message">
            {healthMetrics.alerts} active alerts requiring attention
          </span>
          <button
            onClick={() => setSelectedTab('overview')}
            className="alert-view"
          >
            View Details
          </button>
        </div>
      )}

      {/* Tab navigation */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${selectedTab === 'indexes' ? 'active' : ''}`}
          onClick={() => setSelectedTab('indexes')}
        >
          Indexes
        </button>
        <button
          className={`tab ${selectedTab === 'queries' ? 'active' : ''}`}
          onClick={() => setSelectedTab('queries')}
        >
          Queries
        </button>
        <button
          className={`tab ${selectedTab === 'autosave' ? 'active' : ''}`}
          onClick={() => setSelectedTab('autosave')}
        >
          Auto-Save
        </button>
      </div>

      {/* Tab content */}
      <div className="dashboard-content">
        {selectedTab === 'overview' && (
          <OverviewTab
            metrics={databaseMetrics.metrics}
            health={healthMetrics}
            optimizations={databaseMetrics.optimizationOpportunities}
            alertHistory={alertHistory}
            showOptimizations={showOptimizations}
          />
        )}

        {selectedTab === 'indexes' && (
          <IndexesTab
            indexStats={indexMetrics.indexStats}
            unusedCount={indexMetrics.unusedIndexes}
            poorPerformers={indexMetrics.poorPerformers}
            efficiency={indexMetrics.overallEfficiency}
          />
        )}

        {selectedTab === 'queries' && (
          <QueriesTab
            slowQueries={databaseMetrics.metrics?.slowQueries || []}
            metricsHistory={databaseMetrics.metricsHistory}
          />
        )}

        {selectedTab === 'autosave' && (
          <AutoSaveTab
            autoSaveMetrics={autoSaveMetrics}
            integration={databaseMetrics.autoSaveIntegration}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT DASHBOARD
// ============================================================================

function CompactDashboard({
  databaseMetrics,
  healthMetrics,
  className
}: {
  databaseMetrics: any;
  healthMetrics: any;
  className: string;
}) {
  return (
    <div className={`database-performance-compact ${className}`}>
      <div className="compact-status">
        <HealthIndicator health={healthMetrics.health} score={healthMetrics.score} compact />
        
        <div className="compact-metrics">
          <div className="metric">
            <span className="metric-label">Query Time:</span>
            <span className="metric-value">
              {databaseMetrics.metrics?.queryTime || 0}ms
            </span>
          </div>
          
          <div className="metric">
            <span className="metric-label">Hit Ratio:</span>
            <span className="metric-value">
              {databaseMetrics.metrics?.indexHitRatio || 0}%
            </span>
          </div>
          
          {healthMetrics.alerts > 0 && (
            <div className="metric alert">
              <span className="metric-icon">🚨</span>
              <span className="metric-value">{healthMetrics.alerts}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HEALTH INDICATOR
// ============================================================================

function HealthIndicator({
  health,
  score,
  compact = false
}: {
  health: string;
  score: number;
  compact?: boolean;
}) {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return '#22c55e';
      case 'good': return '#3b82f6';
      case 'needs_attention': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return '🟢';
      case 'good': return '🔵';
      case 'needs_attention': return '🟡';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  if (compact) {
    return (
      <div className="health-indicator compact">
        <span className="health-icon">{getHealthIcon(health)}</span>
        <span className="health-score">{score}/100</span>
      </div>
    );
  }

  return (
    <div className="health-indicator">
      <div className="health-status">
        <span className="health-icon">{getHealthIcon(health)}</span>
        <span className="health-text">{health.replace('_', ' ')}</span>
      </div>
      <div className="health-score">
        <div
          className="score-bar"
          style={{
            width: `${score}%`,
            backgroundColor: getHealthColor(health)
          }}
        />
        <span className="score-text">{score}/100</span>
      </div>
    </div>
  );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function OverviewTab({
  metrics,
  health,
  optimizations,
  alertHistory,
  showOptimizations
}: any) {
  return (
    <div className="overview-tab">
      {/* Key metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Query Performance</h4>
          <div className="metric-value large">
            {metrics?.queryTime || 0}ms
          </div>
          <div className="metric-label">Average Response Time</div>
        </div>

        <div className="metric-card">
          <h4>Index Efficiency</h4>
          <div className="metric-value large">
            {metrics?.indexHitRatio || 0}%
          </div>
          <div className="metric-label">Cache Hit Ratio</div>
        </div>

        <div className="metric-card">
          <h4>Optimization Score</h4>
          <div className="metric-value large">
            {health.score}/100
          </div>
          <div className="metric-label">Overall Performance</div>
        </div>

        <div className="metric-card">
          <h4>Active Alerts</h4>
          <div className="metric-value large">
            {health.alerts}
          </div>
          <div className="metric-label">Requiring Attention</div>
        </div>
      </div>

      {/* Recent alerts */}
      {alertHistory.length > 0 && (
        <div className="alert-section">
          <h4>Recent Alerts</h4>
          <div className="alert-list">
            {alertHistory.slice(0, 5).map((alert: MonitoringEvent, index: number) => (
              <div key={index} className={`alert-item ${alert.severity}`}>
                <span className="alert-time">
                  {alert.timestamp ? alert.timestamp.toLocaleTimeString() : 'N/A'}
                </span>
                <span className="alert-message">{alert.message || 'No message'}</span>
                <span className="alert-severity">{alert.severity || 'unknown'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization opportunities */}
      {showOptimizations && optimizations?.length > 0 && (
        <div className="optimization-section">
          <h4>Optimization Opportunities</h4>
          <div className="optimization-list">
            {optimizations.slice(0, 3).map((opp: any, index: number) => (
              <div key={index} className={`optimization-item ${opp.priority}`}>
                <div className="optimization-header">
                  <span className="optimization-type">{opp.type}</span>
                  <span className="optimization-priority">{opp.priority}</span>
                </div>
                <div className="optimization-description">{opp.description}</div>
                <div className="optimization-impact">{opp.impact}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IndexesTab({ indexStats, unusedCount, poorPerformers, efficiency }: any) {
  return (
    <div className="indexes-tab">
      {/* Index summary */}
      <div className="index-summary">
        <div className="summary-card">
          <h4>Total Indexes</h4>
          <div className="summary-value">{indexStats.length}</div>
        </div>
        
        <div className="summary-card">
          <h4>Unused</h4>
          <div className="summary-value">{unusedCount}</div>
        </div>
        
        <div className="summary-card">
          <h4>Poor Performers</h4>
          <div className="summary-value">{poorPerformers}</div>
        </div>
        
        <div className="summary-card">
          <h4>Overall Efficiency</h4>
          <div className="summary-value">{Math.round(efficiency * 100)}%</div>
        </div>
      </div>

      {/* Index details */}
      <div className="index-details">
        <h4>Index Performance Details</h4>
        <div className="index-table">
          <div className="table-header">
            <span>Index Name</span>
            <span>Size</span>
            <span>Scans</span>
            <span>Efficiency</span>
            <span>Status</span>
          </div>
          
          {indexStats.map((idx: any, index: number) => (
            <div key={index} className="table-row">
              <span className="index-name">{idx.indexName}</span>
              <span className="index-size">{idx.indexSize}</span>
              <span className="index-scans">{idx.indexScans.toLocaleString()}</span>
              <span className="index-efficiency">{Math.round(idx.usageRatio * 100)}%</span>
              <span className={`index-status ${idx.efficiency}`}>
                {idx.efficiency}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QueriesTab({ slowQueries, metricsHistory }: any) {
  return (
    <div className="queries-tab">
      {/* Query performance summary */}
      <div className="query-summary">
        <h4>Slow Query Analysis</h4>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-label">Total Slow Queries:</span>
            <span className="stat-value">{slowQueries.length}</span>
          </div>
          
          <div className="stat">
            <span className="stat-label">Critical:</span>
            <span className="stat-value critical">
              {slowQueries.filter((q: any) => q.severity === 'critical').length}
            </span>
          </div>
          
          <div className="stat">
            <span className="stat-label">High Priority:</span>
            <span className="stat-value high">
              {slowQueries.filter((q: any) => q.severity === 'high').length}
            </span>
          </div>
        </div>
      </div>

      {/* Slow queries list */}
      {slowQueries.length > 0 && (
        <div className="slow-queries">
          <h4>Slow Queries</h4>
          {slowQueries.map((query: any, index: number) => (
            <div key={index} className={`query-item ${query.severity}`}>
              <div className="query-header">
                <span className="query-time">{query.meanTime}ms avg</span>
                <span className="query-calls">{query.calls} calls</span>
                <span className="query-severity">{query.severity}</span>
              </div>
              
              <div className="query-text">
                {query.query.length > 100 
                  ? `${query.query.substring(0, 100)}...` 
                  : query.query
                }
              </div>
              
              {query.optimization.length > 0 && (
                <div className="query-optimizations">
                  <strong>Suggestions:</strong>
                  <ul>
                    {query.optimization.map((opt: string, optIndex: number) => (
                      <li key={optIndex}>{opt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AutoSaveTab({ autoSaveMetrics, integration }: any) {
  return (
    <div className="autosave-tab">
      {/* Auto-save performance overview */}
      <div className="autosave-overview">
        <h4>Auto-Save Performance</h4>
        
        <div className="performance-status">
          <div className={`status-indicator ${autoSaveMetrics.isOptimal ? 'optimal' : 'needs-attention'}`}>
            {autoSaveMetrics.isOptimal ? '✅ Optimal' : '⚠️ Needs Attention'}
          </div>
        </div>

        <div className="autosave-metrics">
          <div className="metric-card">
            <h5>Average Save Time</h5>
            <div className="metric-value">
              {integration?.autoSaveMetrics?.averageSaveTime || 0}ms
            </div>
          </div>

          <div className="metric-card">
            <h5>Success Rate</h5>
            <div className="metric-value">
              {integration?.autoSaveMetrics?.saveSuccessRate || 0}%
            </div>
          </div>

          <div className="metric-card">
            <h5>Queued Saves</h5>
            <div className="metric-value">
              {integration?.autoSaveMetrics?.queuedSaves || 0}
            </div>
          </div>

          <div className="metric-card">
            <h5>Batch Efficiency</h5>
            <div className="metric-value">
              {Math.round((integration?.autoSaveMetrics?.batchEfficiency || 0) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {autoSaveMetrics.recommendations.length > 0 && (
        <div className="autosave-recommendations">
          <h4>Performance Recommendations</h4>
          <ul>
            {autoSaveMetrics.recommendations.map((rec: string, index: number) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Database integration metrics */}
      {integration && (
        <div className="database-integration">
          <h4>Database Integration Metrics</h4>
          
          <div className="integration-grid">
            <div className="integration-section">
              <h5>Query Performance</h5>
              <div className="integration-metrics">
                <div className="metric">
                  <span>Module Queries:</span>
                  <span>{integration.indexOptimization.moduleQueryTime}ms</span>
                </div>
                <div className="metric">
                  <span>Form Queries:</span>
                  <span>{integration.indexOptimization.formQueryTime}ms</span>
                </div>
                <div className="metric">
                  <span>Batch Operations:</span>
                  <span>{integration.indexOptimization.batchQueryTime}ms</span>
                </div>
                <div className="metric">
                  <span>Version Checks:</span>
                  <span>{integration.indexOptimization.versionCheckTime}ms</span>
                </div>
              </div>
            </div>

            <div className="integration-section">
              <h5>Real-time Metrics</h5>
              <div className="integration-metrics">
                <div className="metric">
                  <span>Queries/sec:</span>
                  <span>{integration.realTimeMetrics.queriesPerSecond}</span>
                </div>
                <div className="metric">
                  <span>Avg Latency:</span>
                  <span>{integration.realTimeMetrics.averageLatency}ms</span>
                </div>
                <div className="metric">
                  <span>Cache Hit Rate:</span>
                  <span>{integration.realTimeMetrics.cacheHitRate}%</span>
                </div>
                <div className="metric">
                  <span>Error Rate:</span>
                  <span>{integration.realTimeMetrics.errorRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 