/**
 * Database Query Analysis Utilities - Phase 6
 * 
 * Provides comprehensive tools for analyzing query performance,
 * index usage, and database optimization opportunities.
 * 
 * Integrates with Phase 4 performance monitoring infrastructure.
 */

import { supabase } from '../supabaseClient';
import type { 
  DatabaseMetrics, 
  IndexUsageStats, 
  SlowQueryInfo, 
  QueryPerformanceReport 
} from '../../types/databaseTypes';

/**
 * Analyzes current index usage for form_data_entries table
 */
export async function analyzeIndexUsage(): Promise<IndexUsageStats[]> {
  try {
    const { data, error } = await supabase.rpc('analyze_form_data_index_usage');
    
    if (error) {
      console.error('[analyzeIndexUsage] Error:', error);
      return [];
    }

    return data?.map((row: any) => ({
      indexName: row.index_name,
      tableName: row.table_name,
      indexSize: row.index_size,
      indexScans: row.index_scans,
      tuplesRead: row.tuples_read,
      tuplesFetched: row.tuples_fetched,
      usageRatio: row.usage_ratio,
      efficiency: calculateIndexEfficiency(row),
      recommendation: generateIndexRecommendation(row)
    })) || [];

  } catch (error) {
    console.error('[analyzeIndexUsage] Unexpected error:', error);
    return [];
  }
}

/**
 * Gets slow queries related to form_data_entries
 */
export async function getSlowQueries(): Promise<SlowQueryInfo[]> {
  try {
    const { data, error } = await supabase.rpc('get_form_data_slow_queries');
    
    if (error) {
      console.error('[getSlowQueries] Error:', error);
      return [];
    }

    return data?.map((row: any) => ({
      query: row.query,
      calls: row.calls,
      totalTime: row.total_time,
      meanTime: row.mean_time,
      rows: row.rows,
      hitRatio: row.hit_ratio,
      severity: classifyQuerySeverity(row.mean_time),
      optimization: suggestQueryOptimization(row)
    })) || [];

  } catch (error) {
    console.error('[getSlowQueries] Unexpected error:', error);
    return [];
  }
}

/**
 * Comprehensive database performance analysis
 */
export async function generatePerformanceReport(): Promise<QueryPerformanceReport> {
  try {
    const [indexStats, slowQueries, tableStats] = await Promise.all([
      analyzeIndexUsage(),
      getSlowQueries(),
      getTableStatistics()
    ]);

    const report: QueryPerformanceReport = {
      timestamp: new Date(),
      indexStats,
      slowQueries,
      tableStats,
      overallHealth: calculateOverallHealth(indexStats, slowQueries),
      recommendations: generateRecommendations(indexStats, slowQueries),
      metrics: {
        totalIndexes: indexStats.length,
        activeIndexes: indexStats.filter(idx => idx.indexScans > 0).length,
        unusedIndexes: indexStats.filter(idx => idx.indexScans === 0).length,
        averageQueryTime: calculateAverageQueryTime(slowQueries),
        indexHitRatio: calculateIndexHitRatio(indexStats),
        optimizationScore: calculateOptimizationScore(indexStats, slowQueries)
      }
    };

    return report;

  } catch (error) {
    console.error('[generatePerformanceReport] Error:', error);
    return {
      timestamp: new Date(),
      indexStats: [],
      slowQueries: [],
      tableStats: null,
      overallHealth: 'unknown',
      recommendations: ['Unable to generate performance report. Check database connectivity.'],
      metrics: {
        totalIndexes: 0,
        activeIndexes: 0,
        unusedIndexes: 0,
        averageQueryTime: 0,
        indexHitRatio: 0,
        optimizationScore: 0
      }
    };
  }
}

/**
 * Gets detailed table statistics
 */
async function getTableStatistics() {
  try {
    const { data, error } = await supabase
      .from('pg_stat_user_tables')
      .select('*')
      .eq('relname', 'form_data_entries')
      .single();

    if (error) {
      console.error('[getTableStatistics] Error:', error);
      return null;
    }

    return {
      sequentialScans: data.seq_scan,
      sequentialTuples: data.seq_tup_read,
      indexScans: data.idx_scan,
      indexTuples: data.idx_tup_fetch,
      inserts: data.n_tup_ins,
      updates: data.n_tup_upd,
      deletes: data.n_tup_del,
      hotUpdates: data.n_tup_hot_upd,
      liveRows: data.n_live_tup,
      deadRows: data.n_dead_tup,
      lastVacuum: data.last_vacuum,
      lastAutoVacuum: data.last_autovacuum,
      lastAnalyze: data.last_analyze,
      lastAutoAnalyze: data.last_autoanalyze
    };

  } catch (error) {
    console.error('[getTableStatistics] Error:', error);
    return null;
  }
}

/**
 * Calculate index efficiency based on usage patterns
 */
function calculateIndexEfficiency(indexRow: any): 'excellent' | 'good' | 'poor' | 'unused' {
  if (indexRow.index_scans === 0) return 'unused';
  
  const efficiency = indexRow.usage_ratio;
  if (efficiency >= 0.8) return 'excellent';
  if (efficiency >= 0.5) return 'good';
  return 'poor';
}

/**
 * Generate index-specific recommendations
 */
function generateIndexRecommendation(indexRow: any): string {
  if (indexRow.index_scans === 0) {
    return 'Consider dropping this unused index to improve write performance';
  }
  
  if (indexRow.usage_ratio < 0.3) {
    return 'Low usage ratio - verify if this index is still needed';
  }
  
  if (indexRow.usage_ratio >= 0.8) {
    return 'Excellent performance - keep this index';
  }
  
  return 'Monitor usage patterns for optimization opportunities';
}

/**
 * Classify query severity based on execution time
 */
function classifyQuerySeverity(meanTime: number): 'critical' | 'high' | 'medium' | 'low' {
  if (meanTime > 1000) return 'critical'; // > 1 second
  if (meanTime > 500) return 'high';      // > 500ms
  if (meanTime > 100) return 'medium';    // > 100ms
  return 'low';
}

/**
 * Suggest query optimization based on patterns
 */
function suggestQueryOptimization(queryRow: any): string[] {
  const suggestions: string[] = [];
  
  if (queryRow.hit_ratio < 95) {
    suggestions.push('Consider adding appropriate indexes to improve cache hit ratio');
  }
  
  if (queryRow.mean_time > 100 && queryRow.query.includes('data->>')) {
    suggestions.push('JSONB field queries detected - ensure GIN index is being used');
  }
  
  if (queryRow.query.includes('LIKE') || queryRow.query.includes('ILIKE')) {
    suggestions.push('Text search queries detected - consider full-text search indexes');
  }
  
  if (queryRow.calls > 1000 && queryRow.mean_time > 50) {
    suggestions.push('High-frequency query with moderate latency - priority optimization target');
  }
  
  return suggestions.length > 0 ? suggestions : ['Query appears well-optimized'];
}

/**
 * Calculate overall database health score
 */
function calculateOverallHealth(
  indexStats: IndexUsageStats[], 
  slowQueries: SlowQueryInfo[]
): 'excellent' | 'good' | 'needs_attention' | 'critical' {
  const unusedIndexCount = indexStats.filter(idx => idx.efficiency === 'unused').length;
  const criticalQueries = slowQueries.filter(q => q.severity === 'critical').length;
  const highSeverityQueries = slowQueries.filter(q => q.severity === 'high').length;
  
  if (criticalQueries > 0) return 'critical';
  if (highSeverityQueries > 3 || unusedIndexCount > 5) return 'needs_attention';
  if (slowQueries.length < 5 && unusedIndexCount < 3) return 'excellent';
  return 'good';
}

/**
 * Generate comprehensive recommendations
 */
function generateRecommendations(
  indexStats: IndexUsageStats[], 
  slowQueries: SlowQueryInfo[]
): string[] {
  const recommendations: string[] = [];
  
  // Index recommendations
  const unusedIndexes = indexStats.filter(idx => idx.efficiency === 'unused');
  if (unusedIndexes.length > 0) {
    recommendations.push(
      `Consider dropping ${unusedIndexes.length} unused indexes: ${unusedIndexes.map(idx => idx.indexName).join(', ')}`
    );
  }
  
  // Query recommendations
  const criticalQueries = slowQueries.filter(q => q.severity === 'critical');
  if (criticalQueries.length > 0) {
    recommendations.push(
      `${criticalQueries.length} critical slow queries require immediate attention`
    );
  }
  
  // Performance recommendations
  const avgIndexHitRatio = calculateIndexHitRatio(indexStats);
  if (avgIndexHitRatio < 95) {
    recommendations.push(
      `Index hit ratio is ${avgIndexHitRatio}% - consider adding missing indexes or increasing shared_buffers`
    );
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Database performance is well-optimized. Continue monitoring.');
  }
  
  return recommendations;
}

/**
 * Calculate average query time across all queries
 */
function calculateAverageQueryTime(slowQueries: SlowQueryInfo[]): number {
  if (slowQueries.length === 0) return 0;
  
  const totalTime = slowQueries.reduce((sum, query) => sum + query.meanTime, 0);
  return Math.round(totalTime / slowQueries.length);
}

/**
 * Calculate index hit ratio across all indexes
 */
function calculateIndexHitRatio(indexStats: IndexUsageStats[]): number {
  if (indexStats.length === 0) return 0;
  
  const totalHits = indexStats.reduce((sum, idx) => sum + idx.tuplesFetched, 0);
  const totalReads = indexStats.reduce((sum, idx) => sum + idx.tuplesRead, 0);
  
  if (totalReads === 0) return 100;
  return Math.round((totalHits / totalReads) * 100);
}

/**
 * Calculate optimization score (0-100)
 */
function calculateOptimizationScore(
  indexStats: IndexUsageStats[], 
  slowQueries: SlowQueryInfo[]
): number {
  let score = 100;
  
  // Deduct for unused indexes
  const unusedCount = indexStats.filter(idx => idx.efficiency === 'unused').length;
  score -= unusedCount * 5;
  
  // Deduct for slow queries
  const criticalCount = slowQueries.filter(q => q.severity === 'critical').length;
  const highCount = slowQueries.filter(q => q.severity === 'high').length;
  
  score -= criticalCount * 20;
  score -= highCount * 10;
  
  // Deduct for low index hit ratio
  const hitRatio = calculateIndexHitRatio(indexStats);
  if (hitRatio < 95) {
    score -= (95 - hitRatio) * 2;
  }
  
  return Math.max(0, score);
}

/**
 * Real-time query performance monitoring
 */
export async function startQueryMonitoring(
  callback: (metrics: DatabaseMetrics) => void,
  intervalMs: number = 60000 // 1 minute default
): Promise<() => void> {
  let isMonitoring = true;
  
  const monitor = async () => {
    if (!isMonitoring) return;
    
    try {
      const report = await generatePerformanceReport();
      
      const metrics: DatabaseMetrics = {
        timestamp: new Date(),
        queryTime: report.metrics.averageQueryTime,
        indexHitRatio: report.metrics.indexHitRatio,
        connectionCount: 0, // Would need separate query
        slowQueries: report.slowQueries,
        tableSize: 0, // Would need separate query  
        indexEfficiency: report.indexStats,
        optimizationScore: report.metrics.optimizationScore,
        health: report.overallHealth
      };
      
      callback(metrics);
      
    } catch (error) {
      console.error('[QueryMonitoring] Error:', error);
    }
    
    // Schedule next monitoring cycle
    setTimeout(monitor, intervalMs);
  };
  
  // Start monitoring
  monitor();
  
  // Return stop function
  return () => {
    isMonitoring = false;
  };
} 