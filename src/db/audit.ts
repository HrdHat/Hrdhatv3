/**
 * Phase 7: Audit Database Operations
 * ==================================
 * 
 * Database operations for audit logging and history management.
 * These functions interface with the Phase 7 audit triggers and procedures.
 */

import { supabase } from './supabaseClient';

// ─── TYPE DEFINITIONS ───────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  entryId: string;
  data: Record<string, unknown>;
  changedBy: string | null;
  changeType: 'create' | 'update' | 'delete' | 'restore' | 'migrate';
  changeReason?: string;
  createdAt: string;
}

export interface AuditStatistics {
  totalAuditEntries: number;
  oldestEntryDate: string | null;
  newestEntryDate: string | null;
  uniqueUsers: number;
  entriesLast30Days: number;
  averageEntriesPerDay: number;
}

export interface AuditCleanupResult {
  deletedCount: number;
  oldestRemainingDate: string | null;
  cleanupCompletedAt: string;
}

export interface CreateAuditEntryOptions {
  entryId: string;
  data: Record<string, unknown>;
  changedBy: string;
  changeType: 'create' | 'update' | 'delete' | 'restore' | 'migrate';
  changeReason?: string;
}

// ─── AUDIT ENTRY MANAGEMENT ─────────────────────────────────────────────────

/**
 * Create a manual audit entry
 * Note: Most audit entries are created automatically by triggers
 */
export async function createAuditEntry(
  options: CreateAuditEntryOptions
): Promise<{ success: boolean; auditId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('form_data_entries_history')
      .insert({
        entry_id: options.entryId,
        data: options.data,
        changed_by: options.changedBy,
        change_type: options.changeType,
        change_reason: options.changeReason || 'manual_entry',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[createAuditEntry] Database error:', error);
      return {
        success: false,
        error: `Failed to create audit entry: ${error.message}`,
      };
    }

    return {
      success: true,
      auditId: data.id,
    };

  } catch (error) {
    console.error('[createAuditEntry] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get audit history for a specific form data entry
 */
export async function getAuditHistory(
  entryId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AuditEntry[]> {
  try {
    const { data, error } = await supabase
      .from('form_data_entries_history')
      .select(`
        id,
        entry_id,
        data,
        changed_by,
        change_type,
        change_reason,
        created_at
      `)
      .eq('entry_id', entryId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[getAuditHistory] Database error:', error);
      throw new Error(`Failed to get audit history: ${error.message}`);
    }

    return (data || []).map(entry => ({
      id: entry.id,
      entryId: entry.entry_id,
      data: entry.data as Record<string, unknown>,
      changedBy: entry.changed_by,
      changeType: entry.change_type as AuditEntry['changeType'],
      changeReason: entry.change_reason || undefined,
      createdAt: entry.created_at,
    }));

  } catch (error) {
    console.error('[getAuditHistory] Unexpected error:', error);
    throw error;
  }
}

/**
 * Get audit history for all modules in a form
 */
export async function getFormAuditHistory(
  formId: string,
  limit: number = 100,
  offset: number = 0
): Promise<Array<AuditEntry & { moduleId: string }>> {
  try {
    // First get all entry IDs for this form
    const { data: formEntries, error: entriesError } = await supabase
      .from('form_data_entries')
      .select('id, module_id')
      .eq('form_id', formId);

    if (entriesError) {
      throw new Error(`Failed to get form entries: ${entriesError.message}`);
    }

    if (!formEntries || formEntries.length === 0) {
      return [];
    }

    const entryIds = formEntries.map(entry => entry.id);
    const entryModuleMap = formEntries.reduce((acc, entry) => {
      acc[entry.id] = entry.module_id;
      return acc;
    }, {} as Record<string, string>);

    // Get audit history for all entries
    const { data, error } = await supabase
      .from('form_data_entries_history')
      .select(`
        id,
        entry_id,
        data,
        changed_by,
        change_type,
        change_reason,
        created_at
      `)
      .in('entry_id', entryIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[getFormAuditHistory] Database error:', error);
      throw new Error(`Failed to get form audit history: ${error.message}`);
    }

    return (data || []).map(entry => ({
      id: entry.id,
      entryId: entry.entry_id,
      moduleId: entryModuleMap[entry.entry_id] || 'unknown',
      data: entry.data as Record<string, unknown>,
      changedBy: entry.changed_by,
      changeType: entry.change_type as AuditEntry['changeType'],
      changeReason: entry.change_reason || undefined,
      createdAt: entry.created_at,
    }));

  } catch (error) {
    console.error('[getFormAuditHistory] Unexpected error:', error);
    throw error;
  }
}

/**
 * Get audit history for a specific user
 */
export async function getUserAuditHistory(
  userId: string,
  limit: number = 100,
  offset: number = 0,
  startDate?: string,
  endDate?: string
): Promise<AuditEntry[]> {
  try {
    let query = supabase
      .from('form_data_entries_history')
      .select(`
        id,
        entry_id,
        data,
        changed_by,
        change_type,
        change_reason,
        created_at
      `)
      .eq('changed_by', userId)
      .order('created_at', { ascending: false });

    // Add date filters if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('[getUserAuditHistory] Database error:', error);
      throw new Error(`Failed to get user audit history: ${error.message}`);
    }

    return (data || []).map(entry => ({
      id: entry.id,
      entryId: entry.entry_id,
      data: entry.data as Record<string, unknown>,
      changedBy: entry.changed_by,
      changeType: entry.change_type as AuditEntry['changeType'],
      changeReason: entry.change_reason || undefined,
      createdAt: entry.created_at,
    }));

  } catch (error) {
    console.error('[getUserAuditHistory] Unexpected error:', error);
    throw error;
  }
}

// ─── AUDIT STATISTICS AND MONITORING ────────────────────────────────────────

/**
 * Get comprehensive audit statistics
 * Uses the get_audit_statistics database function from Phase 7 migration
 */
export async function getAuditStatistics(): Promise<AuditStatistics> {
  try {
    const { data, error } = await supabase.rpc('get_audit_statistics');

    if (error) {
      console.error('[getAuditStatistics] Database error:', error);
      throw new Error(`Failed to get audit statistics: ${error.message}`);
    }

    // Handle empty result
    if (!data || data.length === 0) {
      return {
        totalAuditEntries: 0,
        oldestEntryDate: null,
        newestEntryDate: null,
        uniqueUsers: 0,
        entriesLast30Days: 0,
        averageEntriesPerDay: 0,
      };
    }

    const stats = data[0];
    return {
      totalAuditEntries: stats.total_audit_entries || 0,
      oldestEntryDate: stats.oldest_entry_date,
      newestEntryDate: stats.newest_entry_date,
      uniqueUsers: stats.unique_users || 0,
      entriesLast30Days: stats.entries_last_30_days || 0,
      averageEntriesPerDay: parseFloat(stats.average_entries_per_day) || 0,
    };

  } catch (error) {
    console.error('[getAuditStatistics] Unexpected error:', error);
    throw error;
  }
}

/**
 * Get audit statistics for a specific date range
 */
export async function getAuditStatisticsByDateRange(
  startDate: string,
  endDate: string
): Promise<{
  totalEntries: number;
  uniqueUsers: number;
  changeTypeBreakdown: Record<string, number>;
  dailyActivity: Array<{ date: string; count: number }>;
}> {
  try {
    // Get basic stats for date range
    const { data: statsData, error: statsError } = await supabase
      .from('form_data_entries_history')
      .select('changed_by, change_type, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (statsError) {
      throw new Error(`Failed to get date range statistics: ${statsError.message}`);
    }

    const entries = statsData || [];
    const uniqueUsers = new Set(entries.map(e => e.changed_by).filter(Boolean)).size;
    
    // Change type breakdown
    const changeTypeBreakdown = entries.reduce((acc, entry) => {
      const type = entry.change_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Daily activity (simplified - could be enhanced with SQL aggregation)
    const dailyActivity = entries.reduce((acc, entry) => {
      const date = entry.created_at.split('T')[0]; // Get date part
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, [] as Array<{ date: string; count: number }>)
    .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalEntries: entries.length,
      uniqueUsers,
      changeTypeBreakdown,
      dailyActivity,
    };

  } catch (error) {
    console.error('[getAuditStatisticsByDateRange] Unexpected error:', error);
    throw error;
  }
}

// ─── AUDIT MAINTENANCE AND CLEANUP ──────────────────────────────────────────

/**
 * Clean up old audit entries based on retention policy
 * Uses the cleanup_audit_history database function from Phase 7 migration
 */
export async function cleanupAuditHistory(
  retentionDays: number = 90,
  batchSize: number = 1000
): Promise<AuditCleanupResult> {
  try {
    const { data, error } = await supabase.rpc('cleanup_audit_history', {
      p_retention_days: retentionDays,
      p_batch_size: batchSize,
    });

    if (error) {
      console.error('[cleanupAuditHistory] Database error:', error);
      throw new Error(`Failed to cleanup audit history: ${error.message}`);
    }

    // Handle empty result
    if (!data || data.length === 0) {
      return {
        deletedCount: 0,
        oldestRemainingDate: null,
        cleanupCompletedAt: new Date().toISOString(),
      };
    }

    const result = data[0];
    return {
      deletedCount: result.deleted_count || 0,
      oldestRemainingDate: result.oldest_remaining_date,
      cleanupCompletedAt: result.cleanup_completed_at,
    };

  } catch (error) {
    console.error('[cleanupAuditHistory] Unexpected error:', error);
    throw error;
  }
}

/**
 * Export audit data for compliance or backup purposes
 */
export async function exportAuditData(
  startDate: string,
  endDate: string,
  entryIds?: string[]
): Promise<{
  entries: AuditEntry[];
  metadata: {
    exportDate: string;
    dateRange: { start: string; end: string };
    totalEntries: number;
    entryIds?: string[];
  };
}> {
  try {
    let query = supabase
      .from('form_data_entries_history')
      .select(`
        id,
        entry_id,
        data,
        changed_by,
        change_type,
        change_reason,
        created_at
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    // Filter by specific entry IDs if provided
    if (entryIds && entryIds.length > 0) {
      query = query.in('entry_id', entryIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[exportAuditData] Database error:', error);
      throw new Error(`Failed to export audit data: ${error.message}`);
    }

    const entries = (data || []).map(entry => ({
      id: entry.id,
      entryId: entry.entry_id,
      data: entry.data as Record<string, unknown>,
      changedBy: entry.changed_by,
      changeType: entry.change_type as AuditEntry['changeType'],
      changeReason: entry.change_reason || undefined,
      createdAt: entry.created_at,
    }));

    return {
      entries,
      metadata: {
        exportDate: new Date().toISOString(),
        dateRange: { start: startDate, end: endDate },
        totalEntries: entries.length,
        entryIds,
      },
    };

  } catch (error) {
    console.error('[exportAuditData] Unexpected error:', error);
    throw error;
  }
}

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────

/**
 * Check if audit logging is healthy and functioning
 */
export async function checkAuditHealth(): Promise<{
  isHealthy: boolean;
  issues: string[];
  statistics: AuditStatistics;
}> {
  const issues: string[] = [];

  try {
    // Get basic statistics
    const statistics = await getAuditStatistics();

    // Check if audit entries are being created recently
    if (statistics.entriesLast30Days === 0) {
      issues.push('No audit entries created in the last 30 days');
    }

    // Check if there are any audit entries at all
    if (statistics.totalAuditEntries === 0) {
      issues.push('No audit entries found in the system');
    }

    // Check if audit entries are too old (might indicate trigger issues)
    if (statistics.newestEntryDate) {
      const newestDate = new Date(statistics.newestEntryDate);
      const daysSinceNewest = (Date.now() - newestDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceNewest > 7) {
        issues.push(`Newest audit entry is ${Math.round(daysSinceNewest)} days old`);
      }
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      statistics,
    };

  } catch (error) {
    console.error('[checkAuditHealth] Error checking audit health:', error);
    return {
      isHealthy: false,
      issues: [`Failed to check audit health: ${error instanceof Error ? error.message : 'Unknown error'}`],
      statistics: {
        totalAuditEntries: 0,
        oldestEntryDate: null,
        newestEntryDate: null,
        uniqueUsers: 0,
        entriesLast30Days: 0,
        averageEntriesPerDay: 0,
      },
    };
  }
} 