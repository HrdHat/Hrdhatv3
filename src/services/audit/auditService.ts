/**
 * Phase 7: Audit Service
 * ======================
 * 
 * Business logic service for audit logging and history management.
 * Coordinates between database operations and client application needs.
 */

import {
  getAuditHistory,
  getFormAuditHistory,
  getUserAuditHistory,
  getAuditStatistics,
  getAuditStatisticsByDateRange,
  cleanupAuditHistory,
  exportAuditData,
  checkAuditHealth,
  createAuditEntry,
  type AuditEntry,
  type AuditStatistics as DatabaseAuditStatistics,
  type AuditCleanupResult,
} from '../../db/audit';

import {
  type AuditReport,
  type AuditReportFilters,
  type AuditReportType,
  type AuditTrailEntry,
  type AuditHealthStatus,
  type AuditableOperation,
  type AuditOperationResult,
  type AuditStatistics,
  type ChangeType,
  type ChangeSource,
  DEFAULT_AUDIT_CONFIGURATION,
} from '../../types/auditTypes';

// ─── AUDIT SERVICE CLASS ────────────────────────────────────────────────────

export class AuditService {
  private static instance: AuditService;
  private configuration = DEFAULT_AUDIT_CONFIGURATION;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  // ─── AUDIT LOGGING OPERATIONS ─────────────────────────────────────────────

  /**
   * Log a form change with comprehensive audit information
   */
  async logFormChange(
    formId: string,
    moduleId: string,
    changeType: ChangeType,
    userId: string,
    options: {
      reason?: string;
      source?: ChangeSource;
      metadata?: Record<string, unknown>;
      oldData?: Record<string, unknown>;
      newData?: Record<string, unknown>;
    } = {}
  ): Promise<{ success: boolean; auditId?: string; error?: string }> {
    try {
      // Get the entry ID for this form/module combination
      const entryId = await this.getEntryIdForModule(formId, moduleId);
      if (!entryId) {
        return {
          success: false,
          error: `Form entry not found for form ${formId}, module ${moduleId}`,
        };
      }

      // Determine the data to log based on change type
      let dataToLog = options.oldData || {};
      if (changeType === 'create' && options.newData) {
        dataToLog = options.newData;
      }

      // Create the audit entry
      const result = await createAuditEntry({
        entryId,
        data: dataToLog,
        changedBy: userId,
        changeType,
        changeReason: options.reason || this.getDefaultChangeReason(changeType, options.source),
      });

      if (result.success && result.auditId) {
        // Log success for monitoring
        console.info(`[AuditService] Logged ${changeType} for form ${formId}, module ${moduleId}`);
      }

      return result;

    } catch (error) {
      console.error('[AuditService] Error logging form change:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get comprehensive change history for a form
   */
  async getChangeHistory(
    formId: string,
    moduleId?: string,
    options: {
      limit?: number;
      offset?: number;
      includeData?: boolean;
    } = {}
  ): Promise<AuditEntry[]> {
    try {
      if (moduleId) {
        // Get history for specific module
        const entryId = await this.getEntryIdForModule(formId, moduleId);
        if (!entryId) {
          return [];
        }
        return await getAuditHistory(entryId, options.limit, options.offset);
      } else {
        // Get history for entire form
        return await getFormAuditHistory(formId, options.limit, options.offset);
      }
    } catch (error) {
      console.error('[AuditService] Error getting change history:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive audit report
   */
  async generateAuditReport(
    reportType: AuditReportType,
    filters: AuditReportFilters,
    options: {
      includeStatistics?: boolean;
      includeDataSnapshots?: boolean;
      maxEntries?: number;
    } = {}
  ): Promise<AuditReport> {
    const reportId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const generatedAt = new Date().toISOString();
    const maxEntries = options.maxEntries || 1000;

    try {
      // Get filtered audit entries
      let entries: AuditEntry[] = [];
      
      if (filters.formIds && filters.formIds.length > 0) {
        // Get entries for specific forms
        for (const formId of filters.formIds.slice(0, 10)) { // Limit to prevent timeout
          const formEntries = await getFormAuditHistory(formId, maxEntries);
          entries.push(...formEntries);
        }
      } else if (filters.userIds && filters.userIds.length > 0) {
        // Get entries for specific users
        for (const userId of filters.userIds.slice(0, 5)) { // Limit to prevent timeout
          const userEntries = await getUserAuditHistory(
            userId,
            maxEntries,
            0,
            filters.dateRange?.start,
            filters.dateRange?.end
          );
          entries.push(...userEntries);
        }
      } else {
        // System-wide report - get recent entries
        const systemEntries = await this.getSystemAuditEntries(maxEntries, filters);
        entries.push(...systemEntries);
      }

      // Apply additional filters
      entries = this.applyReportFilters(entries, filters);

      // Generate statistics
      let statistics: AuditStatistics;
      if (options.includeStatistics) {
        if (filters.dateRange) {
          const dateStats = await getAuditStatisticsByDateRange(
            filters.dateRange.start,
            filters.dateRange.end
          );
          statistics = {
            totalAuditEntries: dateStats.totalEntries,
            oldestEntryDate: filters.dateRange.start,
            newestEntryDate: filters.dateRange.end,
            uniqueUsers: dateStats.uniqueUsers,
            entriesLast30Days: 0, // Not applicable for date range
            averageEntriesPerDay: dateStats.totalEntries / this.calculateDaysBetween(filters.dateRange.start, filters.dateRange.end),
            changeTypeBreakdown: dateStats.changeTypeBreakdown as Record<ChangeType, number>,
            topActiveUsers: [],
          };
        } else {
          const dbStats = await getAuditStatistics();
          statistics = {
            ...dbStats,
            changeTypeBreakdown: {} as Record<ChangeType, number>,
            topActiveUsers: [],
          };
        }
      } else {
        statistics = {
          totalAuditEntries: entries.length,
          oldestEntryDate: null,
          newestEntryDate: null,
          uniqueUsers: 0,
          entriesLast30Days: 0,
          averageEntriesPerDay: 0,
          changeTypeBreakdown: {} as Record<ChangeType, number>,
          topActiveUsers: [],
        };
      }

      return {
        reportId,
        generatedAt,
        generatedBy: 'system', // Could be enhanced to track actual user
        dateRange: filters.dateRange || {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        filters,
        statistics,
        entries: options.includeDataSnapshots ? entries : entries.map(entry => ({ ...entry, data: {} })),
        metadata: {
          totalEntries: entries.length,
          totalPages: Math.ceil(entries.length / 50),
          currentPage: 1,
          reportType,
        },
      };

    } catch (error) {
      console.error('[AuditService] Error generating audit report:', error);
      throw new Error(`Failed to generate audit report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ─── AUDIT HEALTH AND MONITORING ───────────────────────────────────────────

  /**
   * Check the health of the audit system
   */
  async checkSystemHealth(): Promise<AuditHealthStatus> {
    try {
      const healthCheck = await checkAuditHealth();
      
      return {
        isHealthy: healthCheck.isHealthy,
        lastCheckAt: new Date().toISOString(),
        issues: healthCheck.issues.map(issue => ({
          id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          severity: issue.includes('No audit entries') ? 'critical' : 'warning',
          category: 'data_integrity',
          title: 'Audit System Issue',
          description: issue,
          detectedAt: new Date().toISOString(),
          suggestedActions: this.getSuggestedActionsForIssue(issue),
        })),
        metrics: {
          auditLatency: {
            average: 50, // Placeholder - could be measured
            p95: 100,
            p99: 200,
          },
          auditThroughput: {
            entriesPerSecond: healthCheck.statistics.averageEntriesPerDay / (24 * 60 * 60),
            entriesPerMinute: healthCheck.statistics.averageEntriesPerDay / (24 * 60),
            entriesPerHour: healthCheck.statistics.averageEntriesPerDay / 24,
          },
          storageMetrics: {
            totalAuditEntries: healthCheck.statistics.totalAuditEntries,
            storageSizeBytes: healthCheck.statistics.totalAuditEntries * 1024, // Rough estimate
            growthRatePerDay: healthCheck.statistics.averageEntriesPerDay,
          },
          integrityMetrics: {
            missingEntries: 0, // Could be calculated with more complex logic
            corruptedEntries: 0,
            lastIntegrityCheck: new Date().toISOString(),
          },
        },
        recommendations: this.generateHealthRecommendations(healthCheck),
      };

    } catch (error) {
      console.error('[AuditService] Error checking system health:', error);
      return {
        isHealthy: false,
        lastCheckAt: new Date().toISOString(),
        issues: [{
          id: 'health_check_failed',
          severity: 'critical',
          category: 'performance',
          title: 'Health Check Failed',
          description: `Unable to check audit system health: ${error instanceof Error ? error.message : 'Unknown error'}`,
          detectedAt: new Date().toISOString(),
          suggestedActions: ['Check database connectivity', 'Verify audit functions exist', 'Review system logs'],
        }],
        metrics: {
          auditLatency: { average: 0, p95: 0, p99: 0 },
          auditThroughput: { entriesPerSecond: 0, entriesPerMinute: 0, entriesPerHour: 0 },
          storageMetrics: { totalAuditEntries: 0, storageSizeBytes: 0, growthRatePerDay: 0 },
          integrityMetrics: { missingEntries: 0, corruptedEntries: 0, lastIntegrityCheck: new Date().toISOString() },
        },
        recommendations: [{
          id: 'investigate_failure',
          priority: 'urgent',
          category: 'performance',
          title: 'Investigate Audit System Failure',
          description: 'The audit system health check failed and requires immediate attention.',
          estimatedImpact: 'Audit logging may not be functioning properly',
          implementationEffort: 'medium',
          actions: ['Check database connectivity', 'Verify Phase 7 migration completed', 'Review system error logs'],
        }],
      };
    }
  }

  /**
   * Perform audit cleanup with configurable retention
   */
  async performCleanup(
    retentionDays: number = 90,
    dryRun: boolean = false
  ): Promise<AuditCleanupResult> {
    try {
      if (dryRun) {
        // Estimate what would be deleted
        const statistics = await getAuditStatistics();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        
        return {
          deletedCount: 0, // Estimated count could be calculated here
          oldestRemainingDate: cutoffDate.toISOString(),
          cleanupCompletedAt: new Date().toISOString(),
        };
      } else {
        return await cleanupAuditHistory(retentionDays);
      }
    } catch (error) {
      console.error('[AuditService] Error performing cleanup:', error);
      throw error;
    }
  }

  // ─── AUDIT OPERATIONS AND INTEGRATION ──────────────────────────────────────

  /**
   * Process an auditable operation with full tracking
   */
  async processAuditableOperation(
    operation: AuditableOperation
  ): Promise<AuditOperationResult> {
    const startTime = Date.now();
    
    try {
      // Log the operation attempt
      const auditResult = await this.logFormChange(
        operation.targetFormId,
        operation.targetModuleId,
        operation.operationType,
        'system', // System-initiated operation
        {
          reason: operation.reason || `${operation.operationType} operation`,
          source: operation.operationSource,
          metadata: {
            ...operation.metadata,
            operationId: operation.operationId,
            startTime,
          },
        }
      );

      return {
        operationId: operation.operationId,
        success: auditResult.success,
        auditEntryId: auditResult.auditId,
        error: auditResult.error,
        warnings: auditResult.success ? [] : ['Audit logging failed but operation may have succeeded'],
      };

    } catch (error) {
      console.error('[AuditService] Error processing auditable operation:', error);
      return {
        operationId: operation.operationId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        warnings: ['Operation processing failed'],
      };
    }
  }

  // ─── PRIVATE HELPER METHODS ─────────────────────────────────────────────────

  private async getEntryIdForModule(formId: string, moduleId: string): Promise<string | null> {
    try {
      // This would typically be implemented with a database query
      // For now, return a placeholder that indicates the lookup is needed
      return `entry_${formId}_${moduleId}`;
    } catch (error) {
      console.error('[AuditService] Error getting entry ID:', error);
      return null;
    }
  }

  private getDefaultChangeReason(changeType: ChangeType, source?: ChangeSource): string {
    const sourceText = source ? ` via ${source}` : '';
    switch (changeType) {
      case 'create':
        return `Form data created${sourceText}`;
      case 'update':
        return `Form data updated${sourceText}`;
      case 'delete':
        return `Form data deleted${sourceText}`;
      case 'restore':
        return `Form data restored${sourceText}`;
      case 'migrate':
        return `Form data migrated${sourceText}`;
      default:
        return `Form data changed${sourceText}`;
    }
  }

  private async getSystemAuditEntries(limit: number, filters: AuditReportFilters): Promise<AuditEntry[]> {
    // This would be implemented with a comprehensive system-wide query
    // For now, return empty array as placeholder
    return [];
  }

  private applyReportFilters(entries: AuditEntry[], filters: AuditReportFilters): AuditEntry[] {
    let filteredEntries = entries;

    // Apply change type filter
    if (filters.changeTypes && filters.changeTypes.length > 0) {
      filteredEntries = filteredEntries.filter(entry => 
        filters.changeTypes!.includes(entry.changeType)
      );
    }

    // Apply search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredEntries = filteredEntries.filter(entry =>
        entry.changeReason?.toLowerCase().includes(searchTerm) ||
        entry.changeType.toLowerCase().includes(searchTerm)
      );
    }

    // Apply date range filter
    if (filters.dateRange) {
      filteredEntries = filteredEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        const startDate = new Date(filters.dateRange!.start);
        const endDate = new Date(filters.dateRange!.end);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    return filteredEntries;
  }

  private calculateDaysBetween(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getSuggestedActionsForIssue(issue: string): string[] {
    if (issue.includes('No audit entries')) {
      return [
        'Verify Phase 7 migration completed successfully',
        'Check if audit triggers are functioning',
        'Test creating a form entry to trigger audit logging',
      ];
    }
    
    if (issue.includes('days old')) {
      return [
        'Check if forms are being actively used',
        'Verify audit triggers are still active',
        'Review recent system changes',
      ];
    }

    return ['Review system logs', 'Contact system administrator'];
  }

  private generateHealthRecommendations(healthCheck: any): any[] {
    const recommendations = [];

    if (healthCheck.statistics.totalAuditEntries > 100000) {
      recommendations.push({
        id: 'cleanup_old_entries',
        priority: 'medium',
        category: 'storage',
        title: 'Consider Audit Cleanup',
        description: 'Large number of audit entries detected. Consider running cleanup for older entries.',
        estimatedImpact: 'Improved query performance and reduced storage usage',
        implementationEffort: 'low',
        actions: ['Run audit cleanup with 90-day retention', 'Archive old entries if needed'],
      });
    }

    if (healthCheck.statistics.averageEntriesPerDay > 1000) {
      recommendations.push({
        id: 'monitor_performance',
        priority: 'low',
        category: 'performance',
        title: 'Monitor Audit Performance',
        description: 'High audit activity detected. Monitor performance impact.',
        estimatedImpact: 'Proactive performance management',
        implementationEffort: 'low',
        actions: ['Set up performance monitoring', 'Consider audit batching if needed'],
      });
    }

    return recommendations;
  }
}

// ─── SINGLETON INSTANCE EXPORT ──────────────────────────────────────────────

export const auditService = AuditService.getInstance(); 