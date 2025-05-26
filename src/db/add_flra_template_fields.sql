-- Add template module fields for FLRA modules
-- This populates the template_module_fields table with the fields that should be available for each module

-- First, get the module IDs for reference
-- We'll need to replace these with actual UUIDs from your database

-- General Information Module Fields
INSERT INTO template_module_fields (module_id, name, label, type, required, field_order, default_value, version, scope)
SELECT 
  tm.id as module_id,
  'project_name' as name,
  'Project Name' as label,
  'text' as type,
  true as required,
  1 as field_order,
  null as default_value,
  1 as version,
  'stock' as scope
FROM template_modules tm WHERE tm.name = 'general_information'
UNION ALL
SELECT 
  tm.id, 'project_address', 'Project Address', 'text', true, 2, null, 1, 'stock'
FROM template_modules tm WHERE tm.name = 'general_information'
UNION ALL
SELECT 
  tm.id, 'task_location', 'Task Location', 'text', true, 3, null, 1, 'stock'
FROM template_modules tm WHERE tm.name = 'general_information'
UNION ALL
SELECT 
  tm.id, 'supervisor_name', 'Supervisor Name', 'text', true, 4, null, 1, 'stock'
FROM template_modules tm WHERE tm.name = 'general_information'
UNION ALL
SELECT 
  tm.id, 'supervisor_contact', 'Supervisor Contact', 'text', true, 5, null, 1, 'stock'
FROM template_modules tm WHERE tm.name = 'general_information'
UNION ALL
SELECT 
  tm.id, 'date', 'Date', 'date', true, 6, null, 1, 'stock'
FROM template_modules tm WHERE tm.name = 'general_information'
UNION ALL
SELECT 
  tm.id, 'crew_members_count', 'Crew Members Count', 'number', true, 7, null, 1, 'stock'
FROM template_modules tm WHERE tm.name = 'general_information'
UNION ALL
SELECT 
  tm.id, 'task_description', 'Task Description', 'textarea', true, 8, null, 1, 'stock'
FROM template_modules tm WHERE tm.name = 'general_information'
UNION ALL
SELECT 
  tm.id, 'start_time', 'Start Time', 'time', true, 9, null, 1, 'stock'
FROM template_modules tm WHERE tm.name = 'general_information'
UNION ALL
SELECT 
  tm.id, 'end_time', 'End Time', 'time', true, 10, null, 1, 'stock'
FROM template_modules tm WHERE tm.name = 'general_information'
ON CONFLICT (module_id, name) DO NOTHING;

-- Pre-Job Checklist Module Fields
INSERT INTO template_module_fields (module_id, name, label, type, required, field_order, default_value, version, scope)
SELECT 
  tm.id as module_id,
  'is_fit_for_duty' as name,
  'Is fit for duty' as label,
  'boolean' as type,
  true as required,
  1 as field_order,
  'false' as default_value,
  1 as version,
  'stock' as scope
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'reviewed_work_area_for_hazards', 'Reviewed work area for hazards', 'boolean', true, 2, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'required_ppe_for_today', 'Required PPE for today', 'boolean', true, 3, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'equipment_inspection_up_to_date', 'Equipment inspection up to date', 'boolean', true, 4, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'completed_flra_hazard_assessment', 'Completed FLRA hazard assessment', 'boolean', true, 5, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'safety_signage_installed_and_checked', 'Safety signage installed and checked', 'boolean', true, 6, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'working_alone_today', 'Working alone today', 'boolean', true, 7, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'required_permits_for_tasks', 'Required permits for tasks', 'boolean', true, 8, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'barricades_signage_barriers_installed_good', 'Barricades/signage/barriers installed good', 'boolean', true, 9, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'clear_access_to_emergency_exits', 'Clear access to emergency exits', 'boolean', true, 10, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'trained_and_competent_for_tasks', 'Trained and competent for tasks', 'boolean', true, 11, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'inspected_tools_and_equipment', 'Inspected tools and equipment', 'boolean', true, 12, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'reviewed_control_measures_needed', 'Reviewed control measures needed', 'boolean', true, 13, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'reviewed_emergency_procedures', 'Reviewed emergency procedures', 'boolean', true, 14, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'all_required_permits_in_place', 'All required permits in place', 'boolean', true, 15, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'communicated_with_crew_about_plan', 'Communicated with crew about plan', 'boolean', true, 16, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'need_for_spotters_barricades_special_controls', 'Need for spotters/barricades/special controls', 'boolean', true, 17, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'weather_suitable_for_work', 'Weather suitable for work', 'boolean', true, 18, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'know_designated_first_aid_attendant', 'Know designated first aid attendant', 'boolean', true, 19, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
UNION ALL
SELECT 
  tm.id, 'aware_of_site_notices_or_bulletins', 'Aware of site notices or bulletins', 'boolean', true, 20, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'pre_job_checklist'
ON CONFLICT (module_id, name) DO NOTHING;

-- PPE Platform Inspection Module Fields
INSERT INTO template_module_fields (module_id, name, label, type, required, field_order, default_value, version, scope)
SELECT 
  tm.id as module_id,
  'ppe_hardhat' as name,
  'PPE: Hard Hat' as label,
  'boolean' as type,
  true as required,
  1 as field_order,
  'false' as default_value,
  1 as version,
  'stock' as scope
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'ppe_safety_vest', 'PPE: Safety Vest', 'boolean', true, 2, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'ppe_safety_glasses', 'PPE: Safety Glasses', 'boolean', true, 3, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'ppe_fall_protection', 'PPE: Fall Protection', 'boolean', true, 4, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'ppe_coveralls', 'PPE: Coveralls', 'boolean', true, 5, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'ppe_gloves', 'PPE: Gloves', 'boolean', true, 6, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'ppe_mask', 'PPE: Mask', 'boolean', true, 7, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'ppe_respirator', 'PPE: Respirator', 'boolean', true, 8, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'platform_ladder', 'Platform: Ladder', 'boolean', true, 9, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'platform_step_bench', 'Platform: Step Bench', 'boolean', true, 10, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'platform_sawhorses', 'Platform: Sawhorses', 'boolean', true, 11, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'platform_baker_scaffold', 'Platform: Baker Scaffold', 'boolean', true, 12, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'platform_scaffold', 'Platform: Scaffold', 'boolean', true, 13, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'platform_scissor_lift', 'Platform: Scissor Lift', 'boolean', true, 14, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'platform_boom_lift', 'Platform: Boom Lift', 'boolean', true, 15, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'platform_swing_stage', 'Platform: Swing Stage', 'boolean', true, 16, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
UNION ALL
SELECT 
  tm.id, 'platform_hydro_lift', 'Platform: Hydro Lift', 'boolean', true, 17, 'false', 1, 'stock'
FROM template_modules tm WHERE tm.name = 'ppe_platform_inspection'
ON CONFLICT (module_id, name) DO NOTHING; 