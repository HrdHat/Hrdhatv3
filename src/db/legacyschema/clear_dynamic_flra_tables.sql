-- clear_dynamic_flra_tables.sql
-- DANGER: This will delete ALL data from the dynamic FLRA tables!
-- Use ONLY in development or test environments.

-- 1. Clear generic and typed form data tables
delete from public.form_data_generic;
delete from public.form_data_ppe;
-- Add more here if you have other form_data_* tables, e.g.:
-- delete from public.form_data_hazards;
-- delete from public.form_data_header;

-- 2. Clear per-form field and module assignments
delete from public.form_module_fields;
delete from public.form_modules;

-- 3. Clear forms
delete from public.forms;

-- 4. Clear global module fields and modules (if you want to reset everything)
delete from public.module_fields;
delete from public.modules;

-- 5. Optionally clear companies and projects (if you want a full reset)
-- delete from public.projects;
-- delete from public.companies;

-- 6. (Optional) Clear legacy tables for a full reset
-- delete from public.flra_header;
-- delete from public.general_information;
-- delete from public.pre_job_task_checklist;
-- delete from public.task_hazard_control;
-- delete from public.flra_photos;
-- delete from public.signatures;
-- delete from public.ppe_platform_inspection;

-- CAUTION: This is destructive and should only be run in development or test environments! 