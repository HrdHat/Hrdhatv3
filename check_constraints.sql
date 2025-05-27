-- Check all unique constraints on form module tables
-- Run these queries in your Supabase SQL editor

-- 1. Check all constraints on form_instance_general_info
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'form_instance_general_info'::regclass;

-- 2. Check all constraints on form_instance_pre_job_checklist  
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'form_instance_pre_job_checklist'::regclass;

-- 3. Check all constraints on form_instance_ppe_platform
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'form_instance_ppe_platform'::regclass;

-- 4. Alternative query - Check all unique constraints across all tables
SELECT 
    t.table_name,
    c.constraint_name,
    c.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints c
JOIN information_schema.key_column_usage kcu 
    ON c.constraint_name = kcu.constraint_name
JOIN information_schema.tables t 
    ON c.table_name = t.table_name
WHERE c.constraint_type = 'UNIQUE' 
    AND t.table_name LIKE 'form_instance_%'
    AND t.table_schema = 'public'
ORDER BY t.table_name, c.constraint_name;

-- 5. Quick check - just show unique constraints on form_module_id columns
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN (
    'form_instance_general_info',
    'form_instance_pre_job_checklist', 
    'form_instance_ppe_platform'
)
AND indexdef LIKE '%UNIQUE%'
AND indexdef LIKE '%form_module_id%'; 