-- ============================================================================
-- PHASE 7 MIGRATION: Versioning & Audit Logging
-- ============================================================================
-- 
-- This migration implements comprehensive versioning and audit logging for
-- the form data system, building on the foundation established in Phases 1-6.
--
-- Features:
-- 1. Enhanced optimistic locking with automatic version management
-- 2. Comprehensive audit logging with automatic history snapshots
-- 3. Retention policies for audit data management
-- 4. Performance optimizations for version and audit operations
--
-- Dependencies: Phases 1-6 complete (form_data_entries and history tables)
-- ============================================================================

-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PRE-MIGRATION VALIDATION
-- ============================================================================

DO $$
BEGIN
    -- Verify Phase 6 completion
    IF NOT EXISTS (
        SELECT FROM pg_indexes 
        WHERE indexname = 'idx_form_data_entries_version' 
        AND tablename = 'form_data_entries'
    ) THEN
        RAISE EXCEPTION 'Phase 6 version index missing. Please run Phase 6 migration first.';
    END IF;
    
    -- Verify required tables exist
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'form_data_entries_history'
    ) THEN
        RAISE EXCEPTION 'form_data_entries_history table missing. Please run Phase 1-5 migrations first.';
    END IF;
    
    RAISE NOTICE '✅ Phase 7 pre-migration validation complete';
END $$;

-- ============================================================================
-- ENHANCED VERSION MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to get current version information for a module
CREATE OR REPLACE FUNCTION get_module_version_info(
    p_form_id UUID,
    p_module_id UUID
) RETURNS TABLE (
    current_version INTEGER,
    last_modified_by UUID,
    last_modified_at TIMESTAMPTZ,
    entry_exists BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(fde.version, 0) as current_version,
        fde.last_saved_by as last_modified_by,
        fde.updated_at as last_modified_at,
        (fde.id IS NOT NULL) as entry_exists
    FROM form_data_entries fde
    WHERE fde.form_id = p_form_id 
    AND fde.module_id = p_module_id;
    
    -- If no record found, return default values
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 0::INTEGER, NULL::UUID, NULL::TIMESTAMPTZ, FALSE::BOOLEAN;
    END IF;
END;
$$;

-- Function to check for version conflicts
CREATE OR REPLACE FUNCTION check_version_conflict(
    p_form_id UUID,
    p_module_id UUID,
    p_expected_version INTEGER
) RETURNS TABLE (
    has_conflict BOOLEAN,
    server_version INTEGER,
    last_modified_by UUID,
    last_modified_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_info RECORD;
BEGIN
    -- Get current version info
    SELECT * INTO v_info 
    FROM get_module_version_info(p_form_id, p_module_id) 
    LIMIT 1;
    
    -- Return conflict information
    RETURN QUERY
    SELECT 
        (v_info.current_version != COALESCE(p_expected_version, 0)) as has_conflict,
        v_info.current_version as server_version,
        v_info.last_modified_by,
        v_info.last_modified_at;
END;
$$;

-- ============================================================================
-- AUTOMATIC VERSION INCREMENT TRIGGER
-- ============================================================================

-- Function to automatically increment version on updates
CREATE OR REPLACE FUNCTION auto_increment_version()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    -- For INSERT operations, ensure version starts at 1
    IF TG_OP = 'INSERT' THEN
        NEW.version = COALESCE(NEW.version, 1);
        NEW.updated_at = NOW();
        RETURN NEW;
    END IF;
    
    -- For UPDATE operations, increment version
    IF TG_OP = 'UPDATE' THEN
        -- Only increment if data actually changed
        IF OLD.data IS DISTINCT FROM NEW.data THEN
            NEW.version = COALESCE(OLD.version, 0) + 1;
            NEW.updated_at = NOW();
            
            -- Log version increment for debugging
            RAISE DEBUG 'Version incremented for module % from % to %', 
                       NEW.module_id, OLD.version, NEW.version;
        ELSE
            -- Keep existing version if no data changes
            NEW.version = OLD.version;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Create version increment trigger
DROP TRIGGER IF EXISTS trigger_auto_increment_version ON form_data_entries;
CREATE TRIGGER trigger_auto_increment_version
    BEFORE INSERT OR UPDATE ON form_data_entries
    FOR EACH ROW
    EXECUTE FUNCTION auto_increment_version();

-- ============================================================================
-- COMPREHENSIVE AUDIT LOGGING TRIGGERS
-- ============================================================================

-- Enhanced audit function with metadata support
CREATE OR REPLACE FUNCTION audit_form_data_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
    v_change_type TEXT;
    v_user_id UUID;
    v_change_reason TEXT;
BEGIN
    -- Determine change type and user
    IF TG_OP = 'DELETE' THEN
        v_change_type = 'delete';
        v_user_id = OLD.last_saved_by;
    ELSIF TG_OP = 'UPDATE' THEN
        v_change_type = 'update';
        v_user_id = NEW.last_saved_by;
    ELSIF TG_OP = 'INSERT' THEN
        v_change_type = 'create';
        v_user_id = NEW.last_saved_by;
    END IF;
    
    -- Default change reason based on operation
    v_change_reason = CASE 
        WHEN TG_OP = 'DELETE' THEN 'data_deletion'
        WHEN TG_OP = 'INSERT' THEN 'initial_creation'
        ELSE 'data_update'
    END;
    
    -- Insert audit record for UPDATE and DELETE (preserve OLD data)
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        INSERT INTO form_data_entries_history (
            entry_id,
            data,
            changed_by,
            change_type,
            change_reason,
            created_at
        ) VALUES (
            OLD.id,
            OLD.data,
            v_user_id,
            v_change_type,
            v_change_reason,
            NOW()
        );
        
        RAISE DEBUG 'Audit entry created for % operation on entry %', v_change_type, OLD.id;
    END IF;
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Create comprehensive audit trigger
DROP TRIGGER IF EXISTS trigger_audit_form_data_changes ON form_data_entries;
CREATE TRIGGER trigger_audit_form_data_changes
    AFTER INSERT OR UPDATE OR DELETE ON form_data_entries
    FOR EACH ROW
    EXECUTE FUNCTION audit_form_data_changes();

-- ============================================================================
-- AUDIT HISTORY MANAGEMENT PROCEDURES
-- ============================================================================

-- Function to clean up old audit entries based on retention policy
CREATE OR REPLACE FUNCTION cleanup_audit_history(
    p_retention_days INTEGER DEFAULT 90,
    p_batch_size INTEGER DEFAULT 1000
) RETURNS TABLE (
    deleted_count INTEGER,
    oldest_remaining_date TIMESTAMPTZ,
    cleanup_completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cutoff_date TIMESTAMPTZ;
    v_deleted_count INTEGER := 0;
    v_batch_deleted INTEGER;
    v_oldest_date TIMESTAMPTZ;
BEGIN
    -- Calculate cutoff date
    v_cutoff_date := NOW() - INTERVAL '1 day' * p_retention_days;
    
    RAISE NOTICE 'Starting audit history cleanup for entries older than %', v_cutoff_date;
    
    -- Delete in batches to avoid long locks
    LOOP
        DELETE FROM form_data_entries_history
        WHERE id IN (
            SELECT id 
            FROM form_data_entries_history 
            WHERE created_at < v_cutoff_date
            ORDER BY created_at
            LIMIT p_batch_size
        );
        
        GET DIAGNOSTICS v_batch_deleted = ROW_COUNT;
        v_deleted_count := v_deleted_count + v_batch_deleted;
        
        -- Exit if no more rows to delete
        EXIT WHEN v_batch_deleted = 0;
        
        -- Log progress for large deletions
        IF v_deleted_count % (p_batch_size * 10) = 0 THEN
            RAISE NOTICE 'Audit cleanup progress: % entries deleted', v_deleted_count;
        END IF;
    END LOOP;
    
    -- Get oldest remaining entry date
    SELECT MIN(created_at) INTO v_oldest_date 
    FROM form_data_entries_history;
    
    RAISE NOTICE 'Audit cleanup completed: % entries deleted', v_deleted_count;
    
    -- Return summary
    RETURN QUERY
    SELECT 
        v_deleted_count,
        v_oldest_date,
        NOW();
END;
$$;

-- Function to get audit statistics
CREATE OR REPLACE FUNCTION get_audit_statistics()
RETURNS TABLE (
    total_audit_entries BIGINT,
    oldest_entry_date TIMESTAMPTZ,
    newest_entry_date TIMESTAMPTZ,
    unique_users BIGINT,
    entries_last_30_days BIGINT,
    average_entries_per_day NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_audit_entries,
        MIN(created_at) as oldest_entry_date,
        MAX(created_at) as newest_entry_date,
        COUNT(DISTINCT changed_by) as unique_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as entries_last_30_days,
        ROUND(
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::NUMERIC / 30, 
            2
        ) as average_entries_per_day
    FROM form_data_entries_history;
END;
$$;

-- ============================================================================
-- ENHANCED HISTORY TABLE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional indexes for audit performance (complementing Phase 6)
CREATE INDEX IF NOT EXISTS idx_form_data_entries_history_change_type 
ON form_data_entries_history (change_type);

CREATE INDEX IF NOT EXISTS idx_form_data_entries_history_changed_by_date 
ON form_data_entries_history (changed_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_form_data_entries_history_entry_date 
ON form_data_entries_history (entry_id, created_at DESC);

-- Composite index for common audit queries
CREATE INDEX IF NOT EXISTS idx_form_data_entries_history_audit_lookup 
ON form_data_entries_history (entry_id, change_type, created_at DESC);

-- ============================================================================
-- AUDIT DATA INTEGRITY CONSTRAINTS
-- ============================================================================

-- Add constraint to ensure valid change types
ALTER TABLE form_data_entries_history 
DROP CONSTRAINT IF EXISTS chk_valid_change_type;

ALTER TABLE form_data_entries_history 
ADD CONSTRAINT chk_valid_change_type 
CHECK (change_type IN ('create', 'update', 'delete', 'restore', 'migrate'));

-- Add constraint to ensure data is not null for valid operations
ALTER TABLE form_data_entries_history 
DROP CONSTRAINT IF EXISTS chk_data_not_null_for_valid_ops;

ALTER TABLE form_data_entries_history 
ADD CONSTRAINT chk_data_not_null_for_valid_ops 
CHECK (
    (change_type = 'delete' AND data IS NOT NULL) OR
    (change_type != 'delete' AND data IS NOT NULL)
);

-- ============================================================================
-- AUTOMATED MAINTENANCE SCHEDULING
-- ============================================================================

-- Create a function for automated daily maintenance
CREATE OR REPLACE FUNCTION daily_audit_maintenance()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cleanup_result RECORD;
BEGIN
    -- Update table statistics
    ANALYZE form_data_entries_history;
    ANALYZE form_data_entries;
    
    -- Cleanup old audit entries (configurable retention)
    SELECT * INTO v_cleanup_result 
    FROM cleanup_audit_history(90) -- 90 day default retention
    LIMIT 1;
    
    -- Log maintenance completion
    RAISE NOTICE 'Daily audit maintenance completed at %. Deleted % audit entries.', 
                 NOW(), v_cleanup_result.deleted_count;
END;
$$;

-- ============================================================================
-- SECURITY AND PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users for read operations
GRANT EXECUTE ON FUNCTION get_module_version_info(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_version_conflict(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_statistics() TO authenticated;

-- Restrict maintenance functions to service role
GRANT EXECUTE ON FUNCTION cleanup_audit_history(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION daily_audit_maintenance() TO service_role;

-- ============================================================================
-- POST-MIGRATION VALIDATION
-- ============================================================================

DO $$
DECLARE
    v_trigger_count INTEGER;
    v_function_count INTEGER;
    v_index_count INTEGER;
BEGIN
    -- Verify triggers were created
    SELECT COUNT(*) INTO v_trigger_count
    FROM information_schema.triggers 
    WHERE event_object_table = 'form_data_entries'
    AND trigger_name IN ('trigger_auto_increment_version', 'trigger_audit_form_data_changes');
    
    -- Verify functions were created
    SELECT COUNT(*) INTO v_function_count
    FROM information_schema.routines 
    WHERE routine_name IN (
        'get_module_version_info', 
        'check_version_conflict', 
        'auto_increment_version',
        'audit_form_data_changes',
        'cleanup_audit_history',
        'get_audit_statistics',
        'daily_audit_maintenance'
    );
    
    -- Verify indexes were created
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes 
    WHERE tablename = 'form_data_entries_history'
    AND indexname LIKE 'idx_form_data_entries_history_%';
    
    -- Report validation results
    IF v_trigger_count >= 2 AND v_function_count >= 7 AND v_index_count >= 4 THEN
        RAISE NOTICE '✅ Phase 7 Migration Complete: % triggers, % functions, % indexes created', 
                     v_trigger_count, v_function_count, v_index_count;
    ELSE
        RAISE WARNING '⚠️ Phase 7 Migration incomplete: triggers=%, functions=%, indexes=%', 
                      v_trigger_count, v_function_count, v_index_count;
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETION LOG
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🚀 Phase 7: Versioning & Audit Logging Migration Complete';
    RAISE NOTICE '📋 Features implemented:';
    RAISE NOTICE '   ✅ Automatic version increment triggers';
    RAISE NOTICE '   ✅ Comprehensive audit logging with history snapshots';
    RAISE NOTICE '   ✅ Version conflict detection functions';
    RAISE NOTICE '   ✅ Audit history retention and cleanup procedures';
    RAISE NOTICE '   ✅ Performance indexes for audit operations';
    RAISE NOTICE '   ✅ Data integrity constraints and security policies';
    RAISE NOTICE '🎯 System ready for enhanced versioning and audit operations';
END $$; 