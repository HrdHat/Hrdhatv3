-- Field Validation Queries
-- =========================
-- Use these queries to validate your field constants against the live database schema

-- 1. Get all columns for form_instances table
-- Validate against FORM_INSTANCE_FIELDS constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'form_instances'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Get all columns for form_instance_general_info table  
-- Validate against FORM_INSTANCE_GENERAL_INFO constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'form_instance_general_info'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Get all columns for form_instance_hazards table
-- Validate against FORM_INSTANCE_HAZARDS constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'form_instance_hazards'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Get all columns for form_instance_ppe_platform table
-- Validate against FORM_INSTANCE_PPE_PLATFORM constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'form_instance_ppe_platform'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Get all columns for form_instance_pre_job_checklist table
-- Validate against FORM_INSTANCE_PRE_JOB_CHECKLIST constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'form_instance_pre_job_checklist'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Get all columns for form_instance_signatures table
-- Validate against FORM_INSTANCE_SIGNATURES constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'form_instance_signatures'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Get all columns for form_asset_photos table
-- Validate against FORM_ASSET_PHOTOS constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'form_asset_photos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Get all columns for form_data_entries table
-- Validate against FORM_DATA_ENTRIES constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'form_data_entries'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Get all columns for form_templates table
-- Validate against FORM_TEMPLATES constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'form_templates'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Get all columns for form_template_modules table
-- Validate against FORM_TEMPLATE_MODULES constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'form_template_modules'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 11. Get all columns for template_modules table
-- Validate against TEMPLATE_MODULES constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'template_modules'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 12. Get all columns for template_module_fields table
-- Validate against TEMPLATE_MODULE_FIELDS constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'template_module_fields'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 13. Get all columns for companies table
-- Validate against COMPANIES constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'companies'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 14. Get all columns for profiles table
-- Validate against PROFILES constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 15. Get all columns for projects table
-- Validate against PROJECTS constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 16. Get all columns for user_form_module_preferences table
-- Validate against USER_FORM_MODULE_PREFERENCES constant
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_form_module_preferences'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Summary query: Get all tables and their column counts
SELECT 
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name IN (
    'form_instances',
    'form_instance_general_info',
    'form_instance_hazards',
    'form_instance_ppe_platform',
    'form_instance_pre_job_checklist',
    'form_instance_signatures',
    'form_asset_photos',
    'form_data_entries',
    'form_templates',
    'form_template_modules',
    'template_modules',
    'template_module_fields',
    'companies',
    'profiles',
    'projects',
    'user_form_module_preferences'
  )
GROUP BY table_name
ORDER BY table_name; 