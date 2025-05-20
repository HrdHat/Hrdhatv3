| table_name                      | column_name                                   | data_type                |
| ------------------------------- | --------------------------------------------- | ------------------------ |
| companies                       | id                                            | uuid                     |
| companies                       | name                                          | text                     |
| companies                       | created_at                                    | timestamp with time zone |
| form_asset_photos               | id                                            | uuid                     |
| form_asset_photos               | form_id                                       | uuid                     |
| form_asset_photos               | form_module_id                                | uuid                     |
| form_asset_photos               | photo_url                                     | text                     |
| form_asset_photos               | description                                   | text                     |
| form_asset_photos               | uploaded_at                                   | timestamp with time zone |
| form_data_entries               | id                                            | uuid                     |
| form_data_entries               | form_id                                       | uuid                     |
| form_data_entries               | module_id                                     | uuid                     |
| form_data_entries               | data                                          | jsonb                    |
| form_data_entries               | created_at                                    | timestamp with time zone |
| form_data_entries               | updated_at                                    | timestamp with time zone |
| form_instance_general_info      | id                                            | uuid                     |
| form_instance_general_info      | form_module_id                                | uuid                     |
| form_instance_general_info      | project_name                                  | text                     |
| form_instance_general_info      | project_address                               | text                     |
| form_instance_general_info      | task_location                                 | text                     |
| form_instance_general_info      | supervisor_name                               | text                     |
| form_instance_general_info      | supervisor_contact                            | text                     |
| form_instance_general_info      | date                                          | date                     |
| form_instance_general_info      | crew_members_count                            | integer                  |
| form_instance_general_info      | task_description                              | text                     |
| form_instance_general_info      | start_time                                    | time without time zone   |
| form_instance_general_info      | end_time                                      | time without time zone   |
| form_instance_general_info      | created_at                                    | timestamp with time zone |
| form_instance_hazards           | id                                            | uuid                     |
| form_instance_hazards           | form_id                                       | uuid                     |
| form_instance_hazards           | form_module_id                                | uuid                     |
| form_instance_hazards           | task                                          | text                     |
| form_instance_hazards           | hazard                                        | text                     |
| form_instance_hazards           | risk_level_before                             | integer                  |
| form_instance_hazards           | control                                       | text                     |
| form_instance_hazards           | risk_level_after                              | integer                  |
| form_instance_hazards           | created_at                                    | timestamp with time zone |
| form_instance_module_fields     | id                                            | uuid                     |
| form_instance_module_fields     | form_id                                       | uuid                     |
| form_instance_module_fields     | form_module_id                                | uuid                     |
| form_instance_module_fields     | module_field_id                               | uuid                     |
| form_instance_module_fields     | name                                          | text                     |
| form_instance_module_fields     | label                                         | text                     |
| form_instance_module_fields     | type                                          | text                     |
| form_instance_module_fields     | required                                      | boolean                  |
| form_instance_module_fields     | field_order                                   | integer                  |
| form_instance_module_fields     | default_value                                 | text                     |
| form_instance_module_fields     | version                                       | integer                  |
| form_instance_modules           | id                                            | uuid                     |
| form_instance_modules           | form_id                                       | uuid                     |
| form_instance_modules           | module_id                                     | uuid                     |
| form_instance_modules           | module_order                                  | integer                  |
| form_instance_modules           | is_required                                   | boolean                  |
| form_instance_modules           | created_at                                    | timestamp with time zone |
| form_instance_modules           | completion_state                              | text                     |
| form_instance_ppe_platform      | id                                            | uuid                     |
| form_instance_ppe_platform      | form_id                                       | uuid                     |
| form_instance_ppe_platform      | form_module_id                                | uuid                     |
| form_instance_ppe_platform      | ppe_hardhat                                   | boolean                  |
| form_instance_ppe_platform      | ppe_safety_vest                               | boolean                  |
| form_instance_ppe_platform      | ppe_safety_glasses                            | boolean                  |
| form_instance_ppe_platform      | ppe_fall_protection                           | boolean                  |
| form_instance_ppe_platform      | ppe_coveralls                                 | boolean                  |
| form_instance_ppe_platform      | ppe_gloves                                    | boolean                  |
| form_instance_ppe_platform      | ppe_mask                                      | boolean                  |
| form_instance_ppe_platform      | ppe_respirator                                | boolean                  |
| form_instance_ppe_platform      | platform_ladder                               | boolean                  |
| form_instance_ppe_platform      | platform_step_bench                           | boolean                  |
| form_instance_ppe_platform      | platform_sawhorses                            | boolean                  |
| form_instance_ppe_platform      | platform_baker_scaffold                       | boolean                  |
| form_instance_ppe_platform      | platform_scaffold                             | boolean                  |
| form_instance_ppe_platform      | platform_scissor_lift                         | boolean                  |
| form_instance_ppe_platform      | platform_boom_lift                            | boolean                  |
| form_instance_ppe_platform      | platform_swing_stage                          | boolean                  |
| form_instance_ppe_platform      | platform_hydro_lift                           | boolean                  |
| form_instance_ppe_platform      | created_at                                    | timestamp with time zone |
| form_instance_pre_job_checklist | id                                            | uuid                     |
| form_instance_pre_job_checklist | form_id                                       | uuid                     |
| form_instance_pre_job_checklist | form_module_id                                | uuid                     |
| form_instance_pre_job_checklist | is_fit_for_duty                               | boolean                  |
| form_instance_pre_job_checklist | reviewed_work_area_for_hazards                | boolean                  |
| form_instance_pre_job_checklist | required_ppe_for_today                        | boolean                  |
| form_instance_pre_job_checklist | equipment_inspection_up_to_date               | boolean                  |
| form_instance_pre_job_checklist | completed_flra_hazard_assessment              | boolean                  |
| form_instance_pre_job_checklist | safety_signage_installed_and_checked          | boolean                  |
| form_instance_pre_job_checklist | working_alone_today                           | boolean                  |
| form_instance_pre_job_checklist | required_permits_for_tasks                    | boolean                  |
| form_instance_pre_job_checklist | barricades_signage_barriers_installed_good    | boolean                  |
| form_instance_pre_job_checklist | clear_access_to_emergency_exits               | boolean                  |
| form_instance_pre_job_checklist | trained_and_competent_for_tasks               | boolean                  |
| form_instance_pre_job_checklist | inspected_tools_and_equipment                 | boolean                  |
| form_instance_pre_job_checklist | reviewed_control_measures_needed              | boolean                  |
| form_instance_pre_job_checklist | reviewed_emergency_procedures                 | boolean                  |
| form_instance_pre_job_checklist | all_required_permits_in_place                 | boolean                  |
| form_instance_pre_job_checklist | communicated_with_crew_about_plan             | boolean                  |
| form_instance_pre_job_checklist | need_for_spotters_barricades_special_controls | boolean                  |
| form_instance_pre_job_checklist | weather_suitable_for_work                     | boolean                  |
| form_instance_pre_job_checklist | know_designated_first_aid_attendant           | boolean                  |
| form_instance_pre_job_checklist | aware_of_site_notices_or_bulletins            | boolean                  |
| form_instance_pre_job_checklist | created_at                                    | timestamp with time zone |
| form_instance_signatures        | id                                            | uuid                     |
| form_instance_signatures        | form_id                                       | uuid                     |
| form_instance_signatures        | form_module_id                                | uuid                     |
| form_instance_signatures        | worker_name                                   | text                     |
| form_instance_signatures        | signature_url                                 | text                     |
| form_instance_signatures        | signed_at                                     | timestamp with time zone |
| form_instance_signatures        | signature_hash                                | text                     |
| form_instance_signatures        | role                                          | text                     |
| form_instance_signatures        | metadata                                      | jsonb                    |
| form_instance_signatures        | signed_by                                     | uuid                     |
| form_instance_signatures        | is_deleted                                    | boolean                  |
| form_instance_signatures        | deleted_at                                    | timestamp with time zone |
| form_instances                  | id                                            | uuid                     |
| form_instances                  | form_number                                   | text                     |
| form_instances                  | created_by                                    | uuid                     |
| form_instances                  | status                                        | text                     |
| form_instances                  | last_modified                                 | timestamp with time zone |
| form_instances                  | created_at                                    | timestamp with time zone |
| form_instances                  | auto_archived                                 | boolean                  |
| form_instances                  | data                                          | jsonb                    |
| form_instances                  | company_id                                    | uuid                     |
| form_instances                  | project_id                                    | uuid                     |
| form_instances                  | title                                         | text                     |
| form_instances                  | description                                   | text                     |
| form_instances                  | version                                       | integer                  |
| form_instances                  | submitted_at                                  | timestamp with time zone |
| form_instances                  | user_id                                       | uuid                     |
| form_instances                  | form_module_id                                | uuid                     |
| form_instances                  | form_date                                     | date                     |
| form_template_modules           | id                                            | uuid                     |
| form_template_modules           | form_list_id                                  | uuid                     |
| form_template_modules           | module_order                                  | integer                  |
| form_template_modules           | is_required                                   | boolean                  |
| form_template_modules           | template_module_id                            | uuid                     |
| form_templates                  | id                                            | uuid                     |
| form_templates                  | name                                          | text                     |
| form_templates                  | description                                   | text                     |
| form_templates                  | is_active                                     | boolean                  |
| form_templates                  | is_enabled                                    | boolean                  |
| form_templates                  | created_at                                    | timestamp with time zone |
| form_templates                  | updated_at                                    | timestamp with time zone |
| profiles                        | id                                            | uuid                     |
| profiles                        | email                                         | text                     |
| profiles                        | full_name                                     | text                     |
| profiles                        | phone_number                                  | text                     |
| profiles                        | company                                       | text                     |
| profiles                        | position_title                                | text                     |
| profiles                        | created_at                                    | timestamp with time zone |
| profiles                        | updated_at                                    | timestamp with time zone |
| profiles                        | last_login                                    | timestamp with time zone |
| profiles                        | is_active                                     | boolean                  |
| profiles                        | logo_url                                      | text                     |
| profiles                        | default_form_name                             | text                     |
| projects                        | id                                            | uuid                     |
| projects                        | company_id                                    | uuid                     |
| projects                        | name                                          | text                     |
| projects                        | created_at                                    | timestamp with time zone |
| template_module_fields          | id                                            | uuid                     |
| template_module_fields          | module_id                                     | uuid                     |
| template_module_fields          | name                                          | text                     |
| template_module_fields          | label                                         | text                     |
| template_module_fields          | type                                          | text                     |
| template_module_fields          | required                                      | boolean                  |
| template_module_fields          | field_order                                   | integer                  |
| template_module_fields          | default_value                                 | text                     |
| template_module_fields          | version                                       | integer                  |
| template_module_fields          | scope                                         | text                     |
| template_module_fields          | company_id                                    | uuid                     |
| template_module_fields          | project_id                                    | uuid                     |
| template_modules                | id                                            | uuid                     |
| template_modules                | name                                          | text                     |
| template_modules                | label                                         | text                     |
| template_modules                | description                                   | text                     |
| template_modules                | version                                       | integer                  |
| template_modules                | scope                                         | text                     |
| template_modules                | company_id                                    | uuid                     |
| template_modules                | project_id                                    | uuid                     |
| template_modules                | is_active                                     | boolean                  |
| template_modules                | created_at                                    | timestamp with time zone |
| template_modules                | renderer_key                                  | text                     |
| template_modules                | uses_fields                                   | boolean                  |
| template_modules                | layout_style                                  | text                     |
| user_form_module_preferences    | id                                            | uuid                     |
| user_form_module_preferences    | user_id                                       | uuid                     |
| user_form_module_preferences    | form_list_id                                  | uuid                     |
| user_form_module_preferences    | module_order                                  | integer                  |
| user_form_module_preferences    | is_required                                   | boolean                  |
| user_form_module_preferences    | created_at                                    | timestamp with time zone |
| user_form_module_preferences    | template_module_id                            | uuid                     |
