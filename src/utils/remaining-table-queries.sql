-- SQL Queries for Remaining Tables with Field Count Discrepancies
-- ================================================================
--
-- Run these queries in your Supabase SQL editor to get the actual
-- database schema for each table that still has mismatched field counts.

-- 1. FORM_INSTANCE_HAZARDS (has 9 fields, expected 7)
-- ===================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'form_instance_hazards' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. FORM_INSTANCE_PPE_PLATFORM (has 21 fields, expected 19)
-- ==========================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'form_instance_ppe_platform' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. FORM_INSTANCE_PRE_JOB_CHECKLIST (has 24 fields, expected 21)
-- ===============================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'form_instance_pre_job_checklist' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. FORM_INSTANCE_SIGNATURES (has 12 fields, expected 11)
-- ========================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'form_instance_signatures' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Quick Summary Query - Get column counts for all tables
-- =====================================================
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name IN (
    'form_instance_hazards',
    'form_instance_ppe_platform', 
    'form_instance_pre_job_checklist',
    'form_instance_signatures'
) 
AND table_schema = 'public'
GROUP BY table_name
ORDER BY table_name; 