-- Migration: Remove form_id columns, use only form_module_id
-- Date: 2024-12-19
-- Purpose: Simplify foreign key relationships to use only form_module_id

-- ===== REMOVE form_id COLUMNS FROM MODULE TABLES =====

-- Drop form_id foreign key constraints first
ALTER TABLE form_instance_pre_job_checklist 
  DROP CONSTRAINT IF EXISTS fk_form_instance_pre_job_checklist_form_id;

ALTER TABLE form_instance_ppe_platform 
  DROP CONSTRAINT IF EXISTS fk_form_instance_ppe_platform_form_id;

ALTER TABLE form_instance_hazards 
  DROP CONSTRAINT IF EXISTS fk_form_instance_hazards_form_id;

ALTER TABLE form_instance_signatures 
  DROP CONSTRAINT IF EXISTS fk_form_instance_signatures_form_id;

ALTER TABLE form_asset_photos 
  DROP CONSTRAINT IF EXISTS fk_form_asset_photos_form_id;

-- Drop form_id columns
ALTER TABLE form_instance_pre_job_checklist DROP COLUMN IF EXISTS form_id;
ALTER TABLE form_instance_ppe_platform DROP COLUMN IF EXISTS form_id;
ALTER TABLE form_instance_hazards DROP COLUMN IF EXISTS form_id;
ALTER TABLE form_instance_signatures DROP COLUMN IF EXISTS form_id;
ALTER TABLE form_asset_photos DROP COLUMN IF EXISTS form_id;

-- ===== ENSURE form_module_id IS NOT NULL =====

-- Make form_module_id NOT NULL on all tables
ALTER TABLE form_instance_general_info 
  ALTER COLUMN form_module_id SET NOT NULL;

ALTER TABLE form_instance_pre_job_checklist 
  ALTER COLUMN form_module_id SET NOT NULL;

ALTER TABLE form_instance_ppe_platform 
  ALTER COLUMN form_module_id SET NOT NULL;

ALTER TABLE form_instance_hazards 
  ALTER COLUMN form_module_id SET NOT NULL;

ALTER TABLE form_instance_signatures 
  ALTER COLUMN form_module_id SET NOT NULL;

ALTER TABLE form_asset_photos 
  ALTER COLUMN form_module_id SET NOT NULL;

-- ===== ADD UNIQUE CONSTRAINTS FOR SINGLE-ROW MODULES =====

ALTER TABLE form_instance_general_info
  ADD CONSTRAINT uk_general_info_module UNIQUE (form_module_id);

ALTER TABLE form_instance_pre_job_checklist
  ADD CONSTRAINT uk_pre_job_module UNIQUE (form_module_id);

ALTER TABLE form_instance_ppe_platform
  ADD CONSTRAINT uk_ppe_platform_module UNIQUE (form_module_id);

-- Note: hazards, photos, signatures are multi-row modules (no unique constraint)

-- ===== ADD INDEXES FOR PERFORMANCE =====

CREATE INDEX IF NOT EXISTS idx_form_instance_general_info_form_module_id 
  ON form_instance_general_info(form_module_id);

CREATE INDEX IF NOT EXISTS idx_form_instance_pre_job_checklist_form_module_id 
  ON form_instance_pre_job_checklist(form_module_id);

CREATE INDEX IF NOT EXISTS idx_form_instance_ppe_platform_form_module_id 
  ON form_instance_ppe_platform(form_module_id);

CREATE INDEX IF NOT EXISTS idx_form_instance_hazards_form_module_id 
  ON form_instance_hazards(form_module_id);

CREATE INDEX IF NOT EXISTS idx_form_instance_signatures_form_module_id 
  ON form_instance_signatures(form_module_id);

CREATE INDEX IF NOT EXISTS idx_form_asset_photos_form_module_id 
  ON form_asset_photos(form_module_id); 