-- Cleanup Script for Transition to New JSONB Saving System
-- This script prepares for the transition while preserving data safety

-- 1. BACKUP: Create backup tables for safety (optional, but recommended)
-- Run these if you want to backup existing data before transition

/*
CREATE TABLE IF NOT EXISTS form_instance_general_info_backup AS 
SELECT * FROM form_instance_general_info;

CREATE TABLE IF NOT EXISTS form_instance_pre_job_checklist_backup AS 
SELECT * FROM form_instance_pre_job_checklist;

CREATE TABLE IF NOT EXISTS form_instance_ppe_platform_backup AS 
SELECT * FROM form_instance_ppe_platform;

CREATE TABLE IF NOT EXISTS form_instance_hazards_backup AS 
SELECT * FROM form_instance_hazards;

CREATE TABLE IF NOT EXISTS form_instance_signatures_backup AS 
SELECT * FROM form_instance_signatures;

-- Note: form_asset_photos likely should stay separate due to file handling
*/

-- 2. VALIDATION: Check data consistency before transition
-- Run these queries to verify data integrity

SELECT 'form_instance_general_info' as table_name, count(*) as record_count 
FROM form_instance_general_info
UNION ALL
SELECT 'form_instance_pre_job_checklist', count(*) 
FROM form_instance_pre_job_checklist
UNION ALL
SELECT 'form_instance_ppe_platform', count(*) 
FROM form_instance_ppe_platform
UNION ALL
SELECT 'form_instance_hazards', count(*) 
FROM form_instance_hazards
UNION ALL
SELECT 'form_instance_signatures', count(*) 
FROM form_instance_signatures
UNION ALL
SELECT 'form_data_entries', count(*) 
FROM form_data_entries;

-- 3. CHECK: Verify form_data_entries is ready
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'form_data_entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. PREPARE: Add any missing indexes for performance
-- (These were added in the main migration, but double-check)
CREATE INDEX IF NOT EXISTS idx_form_data_entries_form_id ON form_data_entries(form_id);
CREATE INDEX IF NOT EXISTS idx_form_data_entries_module_id ON form_data_entries(module_id);
CREATE INDEX IF NOT EXISTS gin_form_data_entries_data ON form_data_entries USING gin (data);

-- 5. MIGRATION READINESS CHECK
-- Verify all required components are in place
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_data_entries') 
        THEN '✅ form_data_entries table exists'
        ELSE '❌ form_data_entries table missing'
    END as status
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'template_modules' AND column_name = 'field_definitions') 
        THEN '✅ template_modules.field_definitions exists'
        ELSE '❌ template_modules.field_definitions missing'
    END
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_data_entries' AND column_name = 'version') 
        THEN '✅ form_data_entries.version exists'
        ELSE '❌ form_data_entries.version missing'
    END;

-- Note: Individual tables will remain during transition period
-- They will be deprecated gradually as new system is verified
-- Do NOT drop them until new system is fully tested and deployed 