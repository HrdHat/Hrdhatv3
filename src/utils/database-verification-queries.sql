-- Database Table Verification Queries
-- =====================================
-- Run these queries on your live database to verify table names match your tableMap

-- 1. Check if all expected tables exist
-- This will show which tables from your tableMap actually exist in the database

SELECT 
  table_name,
  CASE 
    WHEN table_name = 'form_instances' THEN '✅ header module'
    WHEN table_name = 'form_instance_general_info' THEN '✅ general module'
    WHEN table_name = 'form_instance_pre_job_checklist' THEN '✅ preJobChecklist module'
    WHEN table_name = 'form_instance_ppe_platform' THEN '✅ ppeChecklist module'
    WHEN table_name = 'form_instance_hazards' THEN '✅ taskHazards module'
    WHEN table_name = 'form_asset_photos' THEN '✅ photos module'
    WHEN table_name = 'form_instance_signatures' THEN '✅ signatures module'
    ELSE '❓ Unknown table'
  END as module_mapping
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'form_instances',
    'form_instance_general_info',
    'form_instance_pre_job_checklist', 
    'form_instance_ppe_platform',
    'form_instance_hazards',
    'form_asset_photos',
    'form_instance_signatures'
  )
ORDER BY table_name;

-- 2. Find tables with similar names (to catch typos)
-- This will help identify if there are tables with similar names that might be causing confusion

SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%form_instance%' 
    OR table_name LIKE '%form_asset%'
  )
ORDER BY table_name;

-- 3. Check for the specific typo mentioned in the error
-- Look for any table that might have the extra "o"

SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%general_info%';

-- 4. Get complete list of all form-related tables
-- This gives you the full picture of what's actually in your database

SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'form_%'
ORDER BY table_name;

-- 5. Check table existence individually (run these one by one if needed)

-- Does form_instances exist?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'form_instances'
) as form_instances_exists;

-- Does form_instance_general_info exist?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'form_instance_general_info'
) as general_info_exists;

-- Does form_instance_pre_job_checklist exist?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'form_instance_pre_job_checklist'
) as pre_job_checklist_exists;

-- Does form_instance_ppe_platform exist?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'form_instance_ppe_platform'
) as ppe_platform_exists;

-- Does form_instance_hazards exist?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'form_instance_hazards'
) as hazards_exists;

-- Does form_asset_photos exist?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'form_asset_photos'
) as photos_exists;

-- Does form_instance_signatures exist?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'form_instance_signatures'
) as signatures_exists; 