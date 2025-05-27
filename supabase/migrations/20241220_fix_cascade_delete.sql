-- Migration: Fix CASCADE DELETE for form module relationships
-- Date: 2024-12-20
-- Purpose: Fix foreign key constraints to properly cascade delete module data when form_instance_modules are deleted

-- ===== UPDATE FOREIGN KEY CONSTRAINTS TO CASCADE DELETE =====

-- Drop existing foreign key constraints
ALTER TABLE form_instance_general_info 
  DROP CONSTRAINT IF EXISTS fk_form_instance_general_info_form_module_id;

ALTER TABLE form_instance_pre_job_checklist 
  DROP CONSTRAINT IF EXISTS fk_form_instance_pre_job_checklist_form_module_id;

ALTER TABLE form_instance_ppe_platform 
  DROP CONSTRAINT IF EXISTS fk_form_instance_ppe_platform_form_module_id;

ALTER TABLE form_instance_hazards 
  DROP CONSTRAINT IF EXISTS fk_form_instance_hazards_form_module_id;

ALTER TABLE form_instance_signatures 
  DROP CONSTRAINT IF EXISTS fk_form_instance_signatures_form_module_id;

ALTER TABLE form_asset_photos 
  DROP CONSTRAINT IF EXISTS fk_form_asset_photos_form_module_id;

ALTER TABLE form_instance_module_fields 
  DROP CONSTRAINT IF EXISTS fk_form_instance_module_fields_form_module_id;

-- Add new foreign key constraints with CASCADE DELETE
ALTER TABLE form_instance_general_info 
  ADD CONSTRAINT fk_form_instance_general_info_form_module_id 
  FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) 
  ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE form_instance_pre_job_checklist 
  ADD CONSTRAINT fk_form_instance_pre_job_checklist_form_module_id 
  FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) 
  ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE form_instance_ppe_platform 
  ADD CONSTRAINT fk_form_instance_ppe_platform_form_module_id 
  FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) 
  ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE form_instance_hazards 
  ADD CONSTRAINT fk_form_instance_hazards_form_module_id 
  FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) 
  ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE form_instance_signatures 
  ADD CONSTRAINT fk_form_instance_signatures_form_module_id 
  FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) 
  ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE form_asset_photos 
  ADD CONSTRAINT fk_form_asset_photos_form_module_id 
  FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) 
  ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE form_instance_module_fields 
  ADD CONSTRAINT fk_form_instance_module_fields_form_module_id 
  FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) 
  ON UPDATE NO ACTION ON DELETE CASCADE;

-- ===== ALSO FIX THE MAIN FORM_INSTANCE_MODULES CONSTRAINT =====

-- Drop and recreate the form_instance_modules -> form_instances constraint with CASCADE
ALTER TABLE form_instance_modules 
  DROP CONSTRAINT IF EXISTS fk_form_instance_modules_form_id;

ALTER TABLE form_instance_modules 
  ADD CONSTRAINT fk_form_instance_modules_form_id 
  FOREIGN KEY (form_id) REFERENCES form_instances(id) 
  ON UPDATE NO ACTION ON DELETE CASCADE; 