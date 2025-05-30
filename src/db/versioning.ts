/**
 * Phase 7: Versioning Database Operations
 * ======================================
 * 
 * Database operations for version management and optimistic locking.
 * These functions interface with the Phase 7 database triggers and procedures.
 */

import { supabase } from './supabaseClient';

// ─── TYPE DEFINITIONS ───────────────────────────────────────────────────────

export interface VersionInfo {
  currentVersion: number;
  lastModifiedBy: string | null;
  lastModifiedAt: string | null;
  entryExists: boolean;
}

export interface ConflictResult {
  hasConflict: boolean;
  serverVersion: number;
  lastModifiedBy: string | null;
  lastModifiedAt: string | null;
}

export interface VersionUpdateResult {
  success: boolean;
  newVersion?: number;
  conflictInfo?: ConflictResult;
  error?: string;
}

// ─── VERSION INFORMATION QUERIES ────────────────────────────────────────────

/**
 * Get current version information for a module
 * Uses the get_module_version_info database function from Phase 7 migration
 */
export async function getModuleVersionInfo(
  formId: string,
  moduleId: string
): Promise<VersionInfo> {
  try {
    const { data, error } = await supabase.rpc('get_module_version_info', {
      p_form_id: formId,
      p_module_id: moduleId,
    });

    if (error) {
      console.error('[getModuleVersionInfo] Database error:', error);
      throw new Error(`Failed to get version info: ${error.message}`);
    }

    // Handle empty result (module doesn't exist yet)
    if (!data || data.length === 0) {
      return {
        currentVersion: 0,
        lastModifiedBy: null,
        lastModifiedAt: null,
        entryExists: false,
      };
    }

    const result = data[0];
    return {
      currentVersion: result.current_version || 0,
      lastModifiedBy: result.last_modified_by,
      lastModifiedAt: result.last_modified_at,
      entryExists: result.entry_exists || false,
    };

  } catch (error) {
    console.error('[getModuleVersionInfo] Unexpected error:', error);
    throw error;
  }
}

/**
 * Check for version conflicts before updating
 * Uses the check_version_conflict database function from Phase 7 migration
 */
export async function checkVersionConflict(
  formId: string,
  moduleId: string,
  expectedVersion: number
): Promise<ConflictResult> {
  try {
    const { data, error } = await supabase.rpc('check_version_conflict', {
      p_form_id: formId,
      p_module_id: moduleId,
      p_expected_version: expectedVersion,
    });

    if (error) {
      console.error('[checkVersionConflict] Database error:', error);
      throw new Error(`Failed to check version conflict: ${error.message}`);
    }

    // Handle empty result
    if (!data || data.length === 0) {
      return {
        hasConflict: false,
        serverVersion: 0,
        lastModifiedBy: null,
        lastModifiedAt: null,
      };
    }

    const result = data[0];
    return {
      hasConflict: result.has_conflict || false,
      serverVersion: result.server_version || 0,
      lastModifiedBy: result.last_modified_by,
      lastModifiedAt: result.last_modified_at,
    };

  } catch (error) {
    console.error('[checkVersionConflict] Unexpected error:', error);
    throw error;
  }
}

// ─── VERSION-AWARE SAVE OPERATIONS ──────────────────────────────────────────

/**
 * Save module data with automatic version increment and conflict detection
 * The version increment is handled automatically by the Phase 7 triggers
 */
export async function saveModuleWithVersioning(
  formId: string,
  moduleId: string,
  data: Record<string, unknown>,
  userId: string,
  expectedVersion?: number
): Promise<VersionUpdateResult> {
  try {
    // Step 1: Check for version conflicts if expected version provided
    if (expectedVersion !== undefined) {
      const conflict = await checkVersionConflict(formId, moduleId, expectedVersion);
      
      if (conflict.hasConflict) {
        return {
          success: false,
          conflictInfo: conflict,
        };
      }
    }

    // Step 2: Perform the save operation
    // The database trigger will automatically handle version increment
    const { data: result, error } = await supabase
      .from('form_data_entries')
      .upsert({
        form_id: formId,
        module_id: moduleId,
        data: data,
        last_saved_by: userId,
        // Don't set version manually - let the trigger handle it
      }, {
        onConflict: 'form_id,module_id',
        ignoreDuplicates: false,
      })
      .select('version')
      .single();

    if (error) {
      console.error('[saveModuleWithVersioning] Save error:', error);
      return {
        success: false,
        error: `Failed to save module: ${error.message}`,
      };
    }

    return {
      success: true,
      newVersion: result.version,
    };

  } catch (error) {
    console.error('[saveModuleWithVersioning] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch save multiple modules with version checking
 * Each module is saved individually to ensure proper version handling
 */
export async function saveMultipleModulesWithVersioning(
  formId: string,
  moduleUpdates: Array<{
    moduleId: string;
    data: Record<string, unknown>;
    expectedVersion?: number;
  }>,
  userId: string
): Promise<Array<{ moduleId: string; result: VersionUpdateResult }>> {
  const results: Array<{ moduleId: string; result: VersionUpdateResult }> = [];

  // Process each module individually to ensure proper version handling
  for (const update of moduleUpdates) {
    try {
      const result = await saveModuleWithVersioning(
        formId,
        update.moduleId,
        update.data,
        userId,
        update.expectedVersion
      );

      results.push({
        moduleId: update.moduleId,
        result,
      });

      // Stop on first conflict to maintain consistency
      if (!result.success && result.conflictInfo) {
        console.warn(`[saveMultipleModulesWithVersioning] Conflict detected for module ${update.moduleId}, stopping batch`);
        break;
      }

    } catch (error) {
      console.error(`[saveMultipleModulesWithVersioning] Error saving module ${update.moduleId}:`, error);
      results.push({
        moduleId: update.moduleId,
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  return results;
}

// ─── VERSION HISTORY QUERIES ────────────────────────────────────────────────

interface HistoryEntry {
  data: Record<string, unknown>;
  changed_by: string | null;
  created_at: string;
  change_type: string;
}

/**
 * Get version history for a specific module
 */
export async function getModuleVersionHistory(
  formId: string,
  moduleId: string,
  limit: number = 10
): Promise<Array<{
  version: number;
  data: Record<string, unknown>;
  changedBy: string | null;
  changedAt: string;
  changeType: string;
}>> {
  try {
    // First get the entry ID for this module
    const { data: entryData, error: entryError } = await supabase
      .from('form_data_entries')
      .select('id')
      .eq('form_id', formId)
      .eq('module_id', moduleId)
      .single();

    if (entryError || !entryData) {
      console.warn('[getModuleVersionHistory] Module not found:', { formId, moduleId });
      return [];
    }

    // Get history from audit table
    const { data: historyData, error: historyError } = await supabase
      .from('form_data_entries_history')
      .select(`
        data,
        changed_by,
        created_at,
        change_type
      `)
      .eq('entry_id', entryData.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (historyError) {
      console.error('[getModuleVersionHistory] History query error:', historyError);
      throw new Error(`Failed to get version history: ${historyError.message}`);
    }

    // Transform the data to include version numbers
    return (historyData || []).map((entry: HistoryEntry, index: number) => ({
      version: limit - index, // Approximate version (newest first)
      data: entry.data,
      changedBy: entry.changed_by,
      changedAt: entry.created_at,
      changeType: entry.change_type,
    }));

  } catch (error) {
    console.error('[getModuleVersionHistory] Unexpected error:', error);
    throw error;
  }
}

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────

/**
 * Check if a version conflict would occur for multiple modules
 * Useful for batch operation planning
 */
export async function checkMultipleVersionConflicts(
  formId: string,
  modules: Array<{ moduleId: string; expectedVersion: number }>
): Promise<Array<{ moduleId: string; hasConflict: boolean; conflictInfo?: ConflictResult }>> {
  const results: Array<{ moduleId: string; hasConflict: boolean; conflictInfo?: ConflictResult }> = [];

  for (const module of modules) {
    try {
      const conflict = await checkVersionConflict(formId, module.moduleId, module.expectedVersion);
      results.push({
        moduleId: module.moduleId,
        hasConflict: conflict.hasConflict,
        conflictInfo: conflict.hasConflict ? conflict : undefined,
      });
    } catch (error) {
      console.error(`[checkMultipleVersionConflicts] Error checking module ${module.moduleId}:`, error);
      results.push({
        moduleId: module.moduleId,
        hasConflict: true, // Treat errors as conflicts for safety
        conflictInfo: {
          hasConflict: true,
          serverVersion: 0,
          lastModifiedBy: null,
          lastModifiedAt: null,
        },
      });
    }
  }

  return results;
}

/**
 * Get the latest version numbers for multiple modules
 * Useful for form state synchronization
 */
export async function getMultipleModuleVersions(
  formId: string,
  moduleIds: string[]
): Promise<Record<string, VersionInfo>> {
  const versions: Record<string, VersionInfo> = {};

  for (const moduleId of moduleIds) {
    try {
      const versionInfo = await getModuleVersionInfo(formId, moduleId);
      versions[moduleId] = versionInfo;
    } catch (error) {
      console.error(`[getMultipleModuleVersions] Error getting version for module ${moduleId}:`, error);
      // Provide default version info on error
      versions[moduleId] = {
        currentVersion: 0,
        lastModifiedBy: null,
        lastModifiedAt: null,
        entryExists: false,
      };
    }
  }

  return versions;
} 