-- Drop form_id columns from all module tables
-- This migration completes the refactor to use only form_module_id as foreign key

-- Drop form_id from general info table
ALTER TABLE form_instance_general_info DROP COLUMN form_id CASCADE;

-- Drop form_id from pre-job checklist table  
ALTER TABLE form_instance_pre_job_checklist DROP COLUMN form_id CASCADE;

-- Drop form_id from PPE platform table
ALTER TABLE form_instance_ppe_platform DROP COLUMN form_id CASCADE;

-- Drop form_id from hazards table
ALTER TABLE form_instance_hazards DROP COLUMN form_id CASCADE;

-- Drop form_id from signatures table
ALTER TABLE form_instance_signatures DROP COLUMN form_id CASCADE;

-- Note: form_asset_photos form_id column was already dropped in previous migration 