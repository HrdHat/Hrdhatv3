| table_name                   | column_name                                   | data_type                | is_nullable | column_default               |
| ---------------------------- | --------------------------------------------- | ------------------------ | ----------- | ---------------------------- |
| companies                    | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| companies                    | name                                          | text                     | NO          | null                         |
| companies                    | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| form_instances               | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| form_instances               | form_module_id                                | uuid                     | YES         | null                         |
| form_instances               | form_number                                   | text                     | YES         | null                         |
| form_instances               | form_name                                     | text                     | YES         | null                         |
| form_instances               | form_date                                     | date                     | YES         | null                         |
| form_instances               | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| form_instances               | user_form_id                                  | text                     | YES         | null                         |
| form_asset_photos            | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| form_asset_photos            | form_id                                       | uuid                     | NO          | null                         |
| form_asset_photos            | form_module_id                                | uuid                     | YES         | null                         |
| form_asset_photos            | photo_url                                     | text                     | NO          | null                         |
| form_asset_photos            | description                                   | text                     | YES         | null                         |
| form_asset_photos            | uploaded_at                                   | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| form_data_entries            | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| form_data_entries            | form_id                                       | uuid                     | NO          | null                         |
| form_data_entries            | module_id                                     | uuid                     | NO          | null                         |
| form_data_entries            | data                                          | jsonb                    | NO          | null                         |
| form_data_entries            | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| form_data_entries            | updated_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| form_data_photos             | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| form_data_photos             | form_id                                       | uuid                     | NO          | null                         |
| form_data_photos             | form_module_id                                | uuid                     | NO          | null                         |
| form_data_photos             | uploaded_by                                   | uuid                     | NO          | null                         |
| form_data_photos             | storage_path                                  | text                     | NO          | null                         |
| form_data_photos             | public_url                                    | text                     | NO          | null                         |
| form_data_photos             | file_name                                     | text                     | NO          | null                         |
| form_data_photos             | file_size                                     | integer                  | NO          | null                         |
| form_data_photos             | mime_type                                     | text                     | NO          | null                         |
| form_data_photos             | description                                   | text                     | YES         | null                         |
| form_data_photos             | sort_order                                    | integer                  | YES         | null                         |
| form_data_photos             | tag                                           | text                     | YES         | null                         |
| form_data_photos             | source                                        | text                     | YES         | null                         |
| form_data_photos             | uploaded_at                                   | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| form_data_photos             | updated_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| form_data_photos             | is_deleted                                    | boolean                  | YES         | false                        |
| form_data_photos             | deleted_at                                    | timestamp with time zone | YES         | null                         |
| form_list                    | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| form_list                    | name                                          | text                     | NO          | null                         |
| form_list                    | description                                   | text                     | YES         | null                         |
| form_list                    | is_active                                     | boolean                  | YES         | true                         |
| form_list                    | is_enabled                                    | boolean                  | NO          | true                         |
| form_list                    | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| form_list                    | updated_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| form_instance_module_fields  | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| form_instance_module_fields  | form_id                                       | uuid                     | NO          | null                         |
| form_instance_module_fields  | form_module_id                                | uuid                     | NO          | null                         |
| form_instance_module_fields  | module_field_id                               | uuid                     | YES         | null                         |
| form_instance_module_fields  | name                                          | text                     | NO          | null                         |
| form_instance_module_fields  | label                                         | text                     | NO          | null                         |
| form_instance_module_fields  | type                                          | text                     | NO          | null                         |
| form_instance_module_fields  | required                                      | boolean                  | NO          | false                        |
| form_instance_module_fields  | field_order                                   | integer                  | NO          | null                         |
| form_instance_module_fields  | default_value                                 | text                     | YES         | null                         |
| form_instance_module_fields  | version                                       | integer                  | NO          | 1                            |
| form_modules                 | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| form_modules                 | form_id                                       | uuid                     | NO          | null                         |
| form_modules                 | module_id                                     | uuid                     | NO          | null                         |
| form_modules                 | module_order                                  | integer                  | NO          | null                         |
| form_modules                 | is_required                                   | boolean                  | NO          | true                         |
| form_modules                 | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| form_modules                 | completion_state                              | text                     | NO          | 'not_started'::text          |
| form_template_modules        | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| form_template_modules        | form_list_id                                  | uuid                     | NO          | null                         |
| form_template_modules        | module_list_id                                | uuid                     | NO          | null                         |
| form_template_modules        | module_order                                  | integer                  | NO          | null                         |
| form_template_modules        | is_required                                   | boolean                  | NO          | true                         |
| forms                        | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| forms                        | form_number                                   | text                     | YES         | null                         |
| forms                        | created_by                                    | uuid                     | YES         | null                         |
| forms                        | status                                        | text                     | YES         | 'draft'::text                |
| forms                        | last_modified                                 | timestamp with time zone | YES         | timezone('utc'::text, now()) |
| forms                        | created_at                                    | timestamp with time zone | NO          | now()                        |
| forms                        | auto_archived                                 | boolean                  | YES         | false                        |
| forms                        | data                                          | jsonb                    | YES         | null                         |
| forms                        | company_id                                    | uuid                     | YES         | null                         |
| forms                        | project_id                                    | uuid                     | YES         | null                         |
| forms                        | title                                         | text                     | YES         | null                         |
| forms                        | description                                   | text                     | YES         | null                         |
| forms                        | version                                       | integer                  | NO          | 1                            |
| forms                        | submitted_at                                  | timestamp with time zone | YES         | null                         |
| forms                        | user_id                                       | uuid                     | YES         | null                         |
| general_information          | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| general_information          | form_module_id                                | uuid                     | YES         | null                         |
| general_information          | project_name                                  | text                     | YES         | null                         |
| general_information          | project_address                               | text                     | YES         | null                         |
| general_information          | task_location                                 | text                     | YES         | null                         |
| general_information          | supervisor_name                               | text                     | YES         | null                         |
| general_information          | supervisor_contact                            | text                     | YES         | null                         |
| general_information          | date                                          | date                     | YES         | null                         |
| general_information          | crew_members_count                            | integer                  | YES         | null                         |
| general_information          | task_description                              | text                     | YES         | null                         |
| general_information          | start_time                                    | time without time zone   | YES         | null                         |
| general_information          | end_time                                      | time without time zone   | YES         | null                         |
| general_information          | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| module_fields                | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| module_fields                | module_id                                     | uuid                     | NO          | null                         |
| module_fields                | name                                          | text                     | NO          | null                         |
| module_fields                | label                                         | text                     | NO          | null                         |
| module_fields                | type                                          | text                     | NO          | null                         |
| module_fields                | required                                      | boolean                  | NO          | false                        |
| module_fields                | field_order                                   | integer                  | NO          | null                         |
| module_fields                | default_value                                 | text                     | YES         | null                         |
| module_fields                | version                                       | integer                  | NO          | 1                            |
| module_fields                | scope                                         | text                     | NO          | 'stock'::text                |
| module_fields                | company_id                                    | uuid                     | YES         | null                         |
| module_fields                | project_id                                    | uuid                     | YES         | null                         |
| module_list                  | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| module_list                  | name                                          | text                     | NO          | null                         |
| module_list                  | description                                   | text                     | YES         | null                         |
| module_list                  | is_active                                     | boolean                  | YES         | true                         |
| module_list                  | is_enabled                                    | boolean                  | NO          | true                         |
| module_list                  | is_default                                    | boolean                  | NO          | false                        |
| module_list                  | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| module_list                  | updated_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| modules                      | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| modules                      | name                                          | text                     | NO          | null                         |
| modules                      | label                                         | text                     | NO          | null                         |
| modules                      | description                                   | text                     | YES         | null                         |
| modules                      | version                                       | integer                  | NO          | 1                            |
| modules                      | scope                                         | text                     | NO          | 'stock'::text                |
| modules                      | company_id                                    | uuid                     | YES         | null                         |
| modules                      | project_id                                    | uuid                     | YES         | null                         |
| modules                      | is_active                                     | boolean                  | NO          | true                         |
| modules                      | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| modules                      | renderer_key                                  | text                     | NO          | null                         |
| modules                      | uses_fields                                   | boolean                  | YES         | true                         |
| ppe_platform_inspection      | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| ppe_platform_inspection      | form_id                                       | uuid                     | NO          | null                         |
| ppe_platform_inspection      | form_module_id                                | uuid                     | YES         | null                         |
| ppe_platform_inspection      | ppe_hardhat                                   | boolean                  | YES         | null                         |
| ppe_platform_inspection      | ppe_safety_vest                               | boolean                  | YES         | null                         |
| ppe_platform_inspection      | ppe_safety_glasses                            | boolean                  | YES         | null                         |
| ppe_platform_inspection      | ppe_fall_protection                           | boolean                  | YES         | null                         |
| ppe_platform_inspection      | ppe_coveralls                                 | boolean                  | YES         | null                         |
| ppe_platform_inspection      | ppe_gloves                                    | boolean                  | YES         | null                         |
| ppe_platform_inspection      | ppe_mask                                      | boolean                  | YES         | null                         |
| ppe_platform_inspection      | ppe_respirator                                | boolean                  | YES         | null                         |
| ppe_platform_inspection      | platform_ladder                               | boolean                  | YES         | null                         |
| ppe_platform_inspection      | platform_step_bench                           | boolean                  | YES         | null                         |
| ppe_platform_inspection      | platform_sawhorses                            | boolean                  | YES         | null                         |
| ppe_platform_inspection      | platform_baker_scaffold                       | boolean                  | YES         | null                         |
| ppe_platform_inspection      | platform_scaffold                             | boolean                  | YES         | null                         |
| ppe_platform_inspection      | platform_scissor_lift                         | boolean                  | YES         | null                         |
| ppe_platform_inspection      | platform_boom_lift                            | boolean                  | YES         | null                         |
| ppe_platform_inspection      | platform_swing_stage                          | boolean                  | YES         | null                         |
| ppe_platform_inspection      | platform_hydro_lift                           | boolean                  | YES         | null                         |
| ppe_platform_inspection      | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| pre_job_task_checklist       | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| pre_job_task_checklist       | form_id                                       | uuid                     | NO          | null                         |
| pre_job_task_checklist       | form_module_id                                | uuid                     | YES         | null                         |
| pre_job_task_checklist       | is_fit_for_duty                               | boolean                  | YES         | null                         |
| pre_job_task_checklist       | reviewed_work_area_for_hazards                | boolean                  | YES         | null                         |
| pre_job_task_checklist       | required_ppe_for_today                        | boolean                  | YES         | null                         |
| pre_job_task_checklist       | equipment_inspection_up_to_date               | boolean                  | YES         | null                         |
| pre_job_task_checklist       | completed_flra_hazard_assessment              | boolean                  | YES         | null                         |
| pre_job_task_checklist       | safety_signage_installed_and_checked          | boolean                  | YES         | null                         |
| pre_job_task_checklist       | working_alone_today                           | boolean                  | YES         | null                         |
| pre_job_task_checklist       | required_permits_for_tasks                    | boolean                  | YES         | null                         |
| pre_job_task_checklist       | barricades_signage_barriers_installed_good    | boolean                  | YES         | null                         |
| pre_job_task_checklist       | clear_access_to_emergency_exits               | boolean                  | YES         | null                         |
| pre_job_task_checklist       | trained_and_competent_for_tasks               | boolean                  | YES         | null                         |
| pre_job_task_checklist       | inspected_tools_and_equipment                 | boolean                  | YES         | null                         |
| pre_job_task_checklist       | reviewed_control_measures_needed              | boolean                  | YES         | null                         |
| pre_job_task_checklist       | reviewed_emergency_procedures                 | boolean                  | YES         | null                         |
| pre_job_task_checklist       | all_required_permits_in_place                 | boolean                  | YES         | null                         |
| pre_job_task_checklist       | communicated_with_crew_about_plan             | boolean                  | YES         | null                         |
| pre_job_task_checklist       | need_for_spotters_barricades_special_controls | boolean                  | YES         | null                         |
| pre_job_task_checklist       | weather_suitable_for_work                     | boolean                  | YES         | null                         |
| pre_job_task_checklist       | know_designated_first_aid_attendant           | boolean                  | YES         | null                         |
| pre_job_task_checklist       | aware_of_site_notices_or_bulletins            | boolean                  | YES         | null                         |
| pre_job_task_checklist       | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| profiles                     | id                                            | uuid                     | NO          | null                         |
| profiles                     | email                                         | text                     | NO          | null                         |
| profiles                     | full_name                                     | text                     | NO          | null                         |
| profiles                     | phone_number                                  | text                     | YES         | null                         |
| profiles                     | company                                       | text                     | YES         | null                         |
| profiles                     | position_title                                | text                     | YES         | null                         |
| profiles                     | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| profiles                     | updated_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| profiles                     | last_login                                    | timestamp with time zone | YES         | null                         |
| profiles                     | is_active                                     | boolean                  | NO          | true                         |
| profiles                     | logo_url                                      | text                     | YES         | null                         |
| profiles                     | default_form_name                             | text                     | YES         | null                         |
| projects                     | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| projects                     | company_id                                    | uuid                     | YES         | null                         |
| projects                     | name                                          | text                     | NO          | null                         |
| projects                     | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| signatures                   | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| signatures                   | form_id                                       | uuid                     | NO          | null                         |
| signatures                   | form_module_id                                | uuid                     | YES         | null                         |
| signatures                   | worker_name                                   | text                     | NO          | null                         |
| signatures                   | signature_url                                 | text                     | NO          | null                         |
| signatures                   | signed_at                                     | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| signatures                   | signature_hash                                | text                     | YES         | null                         |
| signatures                   | role                                          | text                     | YES         | null                         |
| signatures                   | metadata                                      | jsonb                    | YES         | null                         |
| signatures                   | signed_by                                     | uuid                     | YES         | null                         |
| signatures                   | is_deleted                                    | boolean                  | YES         | false                        |
| signatures                   | deleted_at                                    | timestamp with time zone | YES         | null                         |
| task_hazard_control          | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| task_hazard_control          | form_id                                       | uuid                     | NO          | null                         |
| task_hazard_control          | form_module_id                                | uuid                     | YES         | null                         |
| task_hazard_control          | task                                          | text                     | NO          | null                         |
| task_hazard_control          | hazard                                        | text                     | NO          | null                         |
| task_hazard_control          | risk_level_before                             | integer                  | YES         | null                         |
| task_hazard_control          | control                                       | text                     | NO          | null                         |
| task_hazard_control          | risk_level_after                              | integer                  | YES         | null                         |
| task_hazard_control          | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| user_form_module_preferences | id                                            | uuid                     | NO          | uuid_generate_v4()           |
| user_form_module_preferences | user_id                                       | uuid                     | NO          | null                         |
| user_form_module_preferences | form_list_id                                  | uuid                     | NO          | null                         |
| user_form_module_preferences | module_list_id                                | uuid                     | NO          | null                         |
| user_form_module_preferences | module_order                                  | integer                  | NO          | null                         |
| user_form_module_preferences | is_required                                   | boolean                  | NO          | true                         |
| user_form_module_preferences | created_at                                    | timestamp with time zone | NO          | timezone('utc'::text, now()) |