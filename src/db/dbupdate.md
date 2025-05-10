| table_name                   | column_name                                      | data_type                                     | is_nullable     |
| ---------------------------- | ------------------------------------------------ | --------------------------------------------- | --------------- | -------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| companies                    | id                                               | uuid                                          | NO              |
| companies                    | name                                             | text                                          | NO              |
| companies                    | created_at                                       | timestamp with time zone                      | NO              |
| flra_header                  | id                                               | uuid                                          | NO              |
| flra_header                  | form_module_id                                   | uuid                                          | YES             |
| flra_header                  | form_number                                      | text                                          | YES             |
| flra_header                  | form_name                                        | text                                          | YES             |
| flra_header                  | form_date                                        | date                                          | YES             |
| flra_header                  | created_at                                       | timestamp with time zone                      | NO              |
| flra_photos                  | id                                               | uuid                                          | NO              |
| flra_photos                  | form_id                                          | uuid                                          | NO              |
| flra_photos                  | form_module_id                                   | uuid                                          | YES             |
| flra_photos                  | photo_url                                        | text                                          | NO              |
| flra_photos                  | description                                      | text                                          | YES             |
| flra_photos                  | uploaded_at                                      | timestamp with time zone                      | NO              |
| form_data                    | id                                               | uuid                                          | NO              |
| form_data                    | form_id                                          | uuid                                          | NO              |
| form_data                    | module_id                                        | uuid                                          | NO              |
| form_data                    | data                                             | jsonb                                         | NO              |
| form_data                    | created_at                                       | timestamp with time zone                      | NO              |
| form_data                    | updated_at                                       | timestamp with time zone                      | NO              |
| form_data_photos             | id                                               | uuid                                          | NO              |
| form_data_photos             | form_id                                          | uuid                                          | NO              |
| form_data_photos             | form_module_id                                   | uuid                                          | NO              |
| form_data_photos             | uploaded_by                                      | uuid                                          | NO              |
| form_data_photos             | storage_path                                     | text                                          | NO              |
| form_data_photos             | public_url                                       | text                                          | NO              |
| form_data_photos             | file_name                                        | text                                          | NO              |
| form_data_photos             | file_size                                        | integer                                       | NO              |
| form_data_photos             | mime_type                                        | text                                          | NO              |
| form_data_photos             | description                                      | text                                          | YES             |
| form_data_photos             | sort_order                                       | integer                                       | YES             |
| form_data_photos             | tag                                              | text                                          | YES             |
| form_data_photos             | source                                           | text                                          | YES             |
| form_data_photos             | uploaded_at                                      | timestamp with time zone                      | NO              |
| form_data_photos             | updated_at                                       | timestamp with time zone                      | NO              |
| form_data_photos             | is_deleted                                       | boolean                                       | YES             |
| form_data_photos             | deleted_at                                       | timestamp with time zone                      | YES             |
| form_list                    | id                                               | uuid                                          | NO              |
| form_list                    | name                                             | text                                          | NO              |
| form_list                    | description                                      | text                                          | YES             |
| form_list                    | is_active                                        | boolean                                       | YES             |
| form_list                    | is_enabled                                       | boolean                                       | NO              |
| form_list                    | created_at                                       | timestamp with time zone                      | NO              |
| form_list                    | updated_at                                       | timestamp with time zone                      | NO              |
| form_modules                 | id                                               | uuid                                          | NO              |
| form_modules                 | form_id                                          | uuid                                          | NO              |
| form_modules                 | module_id                                        | uuid                                          | NO              |
| form_modules                 | module_order                                     | integer                                       | NO              |
| form_modules                 | is_required                                      | boolean                                       | NO              |
| form_modules                 | created_at                                       | timestamp with time zone                      | NO              |
| form_template_modules        | id                                               | uuid                                          | NO              |
| form_template_modules        | form_list_id                                     | uuid                                          | NO              |
| form_template_modules        | module_list_id                                   | uuid                                          | NO              |
| form_template_modules        | module_order                                     | integer                                       | NO              |
| form_template_modules        | is_required                                      | boolean                                       | NO              |
| forms                        | id                                               | uuid                                          | NO              |
| forms                        | form_number                                      | text                                          | YES             |
| forms                        | created_by                                       | uuid                                          | YES             |
| forms                        | status                                           | text                                          | YES             |
| forms                        | last_modified                                    | timestamp with time zone                      | YES             |
| forms                        | created_at                                       | timestamp with time zone                      | NO              |
| forms                        | auto_archived                                    | boolean                                       | YES             |
| forms                        | data                                             | jsonb                                         | YES             |
| forms                        | company_id                                       | uuid                                          | YES             |
| forms                        | project_id                                       | uuid                                          | YES             |
| forms                        | title                                            | text                                          | YES             |
| forms                        | description                                      | text                                          | YES             |
| forms                        | version                                          | integer                                       | NO              |
| forms                        | submitted_at                                     | timestamp with time zone                      | YES             |
| forms                        | user_id                                          | uuid                                          | YES             |
| general_information          | id                                               | uuid                                          | NO              |
| general_information          | form_module_id                                   | uuid                                          | YES             |
| general_information          | project_name                                     | text                                          | YES             |
| general_information          | project_address                                  | text                                          | YES             |
| general_information          | task_location                                    | text                                          | YES             |
| general_information          | supervisor_name                                  | text                                          | YES             |
| general_information          | supervisor_contact                               | text                                          | YES             |
| general_information          | date                                             | date                                          | YES             |
| general_information          | crew_members_count                               | integer                                       | YES             |
| general_information          | task_description                                 | text                                          | YES             |
| general_information          | start_time                                       | time without time zone                        | YES             |
| general_information          | end_time                                         | time without time zone                        | YES             |
| general_information          | created_at                                       | timestamp with time zone                      | NO              |
| module_list                  | id                                               | uuid                                          | NO              |
| module_list                  | name                                             | text                                          | NO              |
| module_list                  | description                                      | text                                          | YES             |
| module_list                  | is_active                                        | boolean                                       | YES             |
| module_list                  | is_enabled                                       | boolean                                       | NO              |
| module_list                  | is_default                                       | boolean                                       | NO              |
| module_list                  | created_at                                       | timestamp with time zone                      | NO              |
| module_list                  | updated_at                                       | timestamp with time zone                      | NO              |
| ppe_platform_inspection      | id                                               | uuid                                          | NO              |
| ppe_platform_inspection      | form_id                                          | uuid                                          | NO              |
| ppe_platform_inspection      | form_module_id                                   | uuid                                          | YES             |
| ppe_platform_inspection      | ppe_hardhat                                      | boolean                                       | YES             |
| ppe_platform_inspection      | ppe_safety_vest                                  | boolean                                       | YES             |
| ppe_platform_inspection      | ppe_safety_glasses                               | boolean                                       | YES             |
| ppe_platform_inspection      | ppe_fall_protection                              | boolean                                       | YES             |
| ppe_platform_inspection      | ppe_coveralls                                    | boolean                                       | YES             |
| ppe_platform_inspection      | ppe_gloves                                       | boolean                                       | YES             |
| ppe_platform_inspection      | ppe_mask                                         | boolean                                       | YES             |
| ppe_platform_inspection      | ppe_respirator                                   | boolean                                       | YES             |
| ppe_platform_inspection      | platform_ladder                                  | boolean                                       | YES             |
| ppe_platform_inspection      | platform_step_bench                              | boolean                                       | YES             |
| ppe_platform_inspection      | platform_sawhorses                               | boolean                                       | YES             |
| ppe_platform_inspection      | platform_baker_scaffold                          | boolean                                       | YES             |
| ppe_platform_inspection      | platform_scaffold                                | boolean                                       | YES             |
| ppe_platform_inspection      | platform_scissor_lift                            | boolean                                       | YES             |
| ppe_platform_inspection      | platform_boom_lift                               | boolean                                       | YES             |
| ppe_platform_inspection      | platform_swing_stage                             | boolean                                       | YES             |
| ppe_platform_inspection      | platform_hydro_lift                              | boolean                                       | YES             |
| ppe_platform_inspection      | created_at                                       | timestamp with time zone                      | NO              |
| pre_job_task_checklist       | id                                               | uuid                                          | NO              |
| pre_job_task_checklist       | form_id                                          | uuid                                          | NO              |
| pre_job_task_checklist       | form_module_id                                   | uuid                                          | YES             |
| pre_job_task_checklist       | is_fit_for_duty                                  | boolean                                       | YES             |
| pre_job_task_checklist       | reviewed_work_area_for_hazards                   | boolean                                       | YES             |
| pre_job_task_checklist       | required_ppe_for_today                           | boolean                                       | YES             |
| pre_job_task_checklist       | equipment_inspection_up_to_date                  | boolean                                       | YES             |
| pre_job_task_checklist       | completed_flra_hazard_assessment                 | boolean                                       | YES             |
| pre_job_task_checklist       | safety_signage_installed_and_checked             | boolean                                       | YES             |
| pre_job_task_checklist       | working_alone_today                              | boolean                                       | YES             |
| pre_job_task_checklist       | required_permits_for_tasks                       | boolean                                       | YES             |
| pre_job_task_checklist       | barricades_signage_barriers_installed_good       | boolean                                       | YES             |
| pre_job_task_checklist       | clear_access_to_emergency_exits                  | boolean                                       | YES             |
| pre_job_task_checklist       | trained_and_competent_for_tasks                  | boolean                                       | YES             |
| pre_job_task_checklist       | inspected_tools_and_equipment                    | boolean                                       | YES             |
| pre_job_task_checklist       | reviewed_control_measures_needed                 | boolean                                       | YES             |
| pre_job_task_checklist       | reviewed_emergency_procedures                    | boolean                                       | YES             |
| pre_job_task_checklist       | all_required_permits_in_place                    | boolean                                       | YES             |
| pre_job_task_checklist       | communicated_with_crew_about_plan                | boolean                                       | YES             |
| pre_job_task_checklist       | need_for_spotters_barricades_special_controls    | boolean                                       | YES             |
| pre_job_task_checklist       | weather_suitable_for_work                        | boolean                                       | YES             |
| pre_job_task_checklist       | know_designated_first_aid_attendant              | boolean                                       | YES             |
| pre_job_task_checklist       | aware_of_site_notices_or_bulletins               | boolean                                       | YES             |
| pre_job_task_checklist       | created_at                                       | timestamp with time zone                      | NO              |
| profiles                     | id                                               | uuid                                          | NO              |
| profiles                     | email                                            | text                                          | NO              |
| profiles                     | full_name                                        | text                                          | NO              |
| profiles                     | phone_number                                     | text                                          | YES             |
| profiles                     | company                                          | text                                          | YES             |
| profiles                     | position_title                                   | text                                          | YES             |
| profiles                     | created_at                                       | timestamp with time zone                      | NO              |
| profiles                     | updated_at                                       | timestamp with time zone                      | NO              |
| profiles                     | last_login                                       | timestamp with time zone                      | YES             |
| profiles                     | is_active                                        | boolean                                       | NO              |
| profiles                     | logo_url                                         | text                                          | YES             |
| profiles                     | default_form_name                                | text                                          | YES             |
| projects                     | id                                               | uuid                                          | NO              |
| projects                     | company_id                                       | uuid                                          | YES             |
| projects                     | name                                             | text                                          | NO              |
| projects                     | created_at                                       | timestamp with time zone                      | NO              |
| signatures                   | id                                               | uuid                                          | NO              |
| signatures                   | form_id                                          | uuid                                          | NO              |
| signatures                   | form_module_id                                   | uuid                                          | YES             |
| signatures                   | worker_name                                      | text                                          | NO              |
| signatures                   | signature_url                                    | text                                          | NO              |
| signatures                   | signed_at                                        | timestamp with time zone                      | NO              |
| task_hazard_control          | id                                               | uuid                                          | NO              |
| task_hazard_control          | form_id                                          | uuid                                          | NO              |
| task_hazard_control          | form_module_id                                   | uuid                                          | YES             |
| task_hazard_control          | task                                             | text                                          | NO              |
| task_hazard_control          | hazard                                           | text                                          | NO              |
| task_hazard_control          | risk_level_before                                | integer                                       | YES             |
| task_hazard_control          | control                                          | text                                          | NO              |
| task_hazard_control          | risk_level_after                                 | integer                                       | YES             |
| task_hazard_control          | created_at                                       | timestamp with time zone                      | NO              |
| user_form_module_preferences | id                                               | uuid                                          | NO              |
| user_form_module_preferences | user_id                                          | uuid                                          | NO              |
| user_form_module_preferences | form_list_id                                     | uuid                                          | NO              |
| user_form_module_preferences | module_list_id                                   | uuid                                          | NO              |
| user_form_module_preferences | module_order                                     | integer                                       | NO              |
| user_form_module_preferences | is_required                                      | boolean                                       | NO              |
| user_form_module_preferences | created_at                                       | timestamp with time zone                      | NO              |
| table_schema                 | constraint_name                                  | table_name                                    | column_name     | foreign_table_schema | foreign_table_name   | foreign_column_name                                                                                                                                                          |
| ------------                 | ------------------------------------------------ | ----------------------------                  | --------------- | -------------------- | -------------------- | -------------------                                                                                                                                                          |
| storage                      | objects_bucketId_fkey                            | objects                                       | bucket_id       | storage              | buckets              | id                                                                                                                                                                           |
| auth                         | identities_user_id_fkey                          | identities                                    | user_id         | auth                 | users                | id                                                                                                                                                                           |
| auth                         | sessions_user_id_fkey                            | sessions                                      | user_id         | auth                 | users                | id                                                                                                                                                                           |
| auth                         | refresh_tokens_session_id_fkey                   | refresh_tokens                                | session_id      | auth                 | sessions             | id                                                                                                                                                                           |
| auth                         | mfa_factors_user_id_fkey                         | mfa_factors                                   | user_id         | auth                 | users                | id                                                                                                                                                                           |
| auth                         | mfa_challenges_auth_factor_id_fkey               | mfa_challenges                                | factor_id       | auth                 | mfa_factors          | id                                                                                                                                                                           |
| auth                         | mfa_amr_claims_session_id_fkey                   | mfa_amr_claims                                | session_id      | auth                 | sessions             | id                                                                                                                                                                           |
| auth                         | sso_domains_sso_provider_id_fkey                 | sso_domains                                   | sso_provider_id | auth                 | sso_providers        | id                                                                                                                                                                           |
| auth                         | saml_providers_sso_provider_id_fkey              | saml_providers                                | sso_provider_id | auth                 | sso_providers        | id                                                                                                                                                                           |
| auth                         | saml_relay_states_sso_provider_id_fkey           | saml_relay_states                             | sso_provider_id | auth                 | sso_providers        | id                                                                                                                                                                           |
| auth                         | saml_relay_states_flow_state_id_fkey             | saml_relay_states                             | flow_state_id   | auth                 | flow_state           | id                                                                                                                                                                           |
| auth                         | one_time_tokens_user_id_fkey                     | one_time_tokens                               | user_id         | auth                 | users                | id                                                                                                                                                                           |
| storage                      | s3_multipart_uploads_bucket_id_fkey              | s3_multipart_uploads                          | bucket_id       | storage              | buckets              | id                                                                                                                                                                           |
| storage                      | s3_multipart_uploads_parts_upload_id_fkey        | s3_multipart_uploads_parts                    | upload_id       | storage              | s3_multipart_uploads | id                                                                                                                                                                           |
| storage                      | s3_multipart_uploads_parts_bucket_id_fkey        | s3_multipart_uploads_parts                    | bucket_id       | storage              | buckets              | id                                                                                                                                                                           |
| public                       | forms_created_by_fkey                            | forms                                         | created_by      | public               | profiles             | id                                                                                                                                                                           |
| public                       | form_template_modules_form_list_id_fkey          | form_template_modules                         | form_list_id    | public               | form_list            | id                                                                                                                                                                           |
| public                       | form_template_modules_module_list_id_fkey        | form_template_modules                         | module_list_id  | public               | module_list          | id                                                                                                                                                                           |
| public                       | form_modules_form_id_fkey                        | form_modules                                  | form_id         | public               | forms                | id                                                                                                                                                                           |
| public                       | user_form_module_preferences_user_id_fkey        | user_form_module_preferences                  | user_id         | public               | profiles             | id                                                                                                                                                                           |
| public                       | user_form_module_preferences_form_list_id_fkey   | user_form_module_preferences                  | form_list_id    | public               | form_list            | id                                                                                                                                                                           |
| public                       | user_form_module_preferences_module_list_id_fkey | user_form_module_preferences                  | module_list_id  | public               | module_list          | id                                                                                                                                                                           |
| public                       | flra_header_form_module_id_fkey                  | flra_header                                   | form_module_id  | public               | form_modules         | id                                                                                                                                                                           |
| public                       | general_information_form_module_id_fkey          | general_information                           | form_module_id  | public               | form_modules         | id                                                                                                                                                                           |
| public                       | pre_job_task_checklist_form_id_fkey              | pre_job_task_checklist                        | form_id         | public               | forms                | id                                                                                                                                                                           |
| public                       | pre_job_task_checklist_form_module_id_fkey       | pre_job_task_checklist                        | form_module_id  | public               | form_modules         | id                                                                                                                                                                           |
| public                       | task_hazard_control_form_id_fkey                 | task_hazard_control                           | form_id         | public               | forms                | id                                                                                                                                                                           |
| public                       | task_hazard_control_form_module_id_fkey          | task_hazard_control                           | form_module_id  | public               | form_modules         | id                                                                                                                                                                           |
| public                       | flra_photos_form_id_fkey                         | flra_photos                                   | form_id         | public               | forms                | id                                                                                                                                                                           |
| public                       | flra_photos_form_module_id_fkey                  | flra_photos                                   | form_module_id  | public               | form_modules         | id                                                                                                                                                                           |
| public                       | signatures_form_id_fkey                          | signatures                                    | form_id         | public               | forms                | id                                                                                                                                                                           |
| public                       | signatures_form_module_id_fkey                   | signatures                                    | form_module_id  | public               | form_modules         | id                                                                                                                                                                           |
| public                       | ppe_platform_inspection_form_id_fkey             | ppe_platform_inspection                       | form_id         | public               | forms                | id                                                                                                                                                                           |
| public                       | ppe_platform_inspection_form_module_id_fkey      | ppe_platform_inspection                       | form_module_id  | public               | form_modules         | id                                                                                                                                                                           |
| public                       | form_data_form_id_fkey                           | form_data                                     | form_id         | public               | forms                | id                                                                                                                                                                           |
| public                       | form_data_module_id_fkey                         | form_data                                     | module_id       | public               | form_modules         | id                                                                                                                                                                           |
| public                       | projects_company_id_fkey                         | projects                                      | company_id      | public               | companies            | id                                                                                                                                                                           |
| public                       | form_data_photos_form_id_fkey                    | form_data_photos                              | form_id         | public               | forms                | id                                                                                                                                                                           |
| public                       | form_data_photos_form_module_id_fkey             | form_data_photos                              | form_module_id  | public               | form_modules         | id                                                                                                                                                                           |
| public                       | form_data_photos_uploaded_by_fkey                | form_data_photos                              | uploaded_by     | public               | profiles             | id                                                                                                                                                                           |
| public                       | forms_company_id_fkey                            | forms                                         | company_id      | public               | companies            | id                                                                                                                                                                           |
| public                       | forms_project_id_fkey                            | forms                                         | project_id      | public               | projects             | id                                                                                                                                                                           |
| public                       | forms_user_id_fkey                               | forms                                         | user_id         | public               | profiles             | id                                                                                                                                                                           |
| schemaname                   | tablename                                        | policyname                                    | permissive      | roles                | cmd                  | qual                                                                                                                                                                         | with_check                                                                                                                                              |
| ----------                   | ----------------------------                     | --------------------------------------------- | ----------      | ---------------      | ------               | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public                       | form_data                                        | Users can read their own form data            | PERMISSIVE      | {public}             | SELECT               | (EXISTS ( SELECT 1                                                                                                                                                           |

FROM forms
WHERE ((forms.id = form_data.form_id) AND (forms.created_by = auth.uid())))) | null |
| public | form_data | Users can update their own form data | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
FROM forms
WHERE ((forms.id = form_data.form_id) AND (forms.created_by = auth.uid())))) | null |
| public | form_data_photos | Users can insert photos for their forms | PERMISSIVE | {public} | INSERT | null | ((EXISTS ( SELECT 1
FROM forms
WHERE ((forms.id = form_data_photos.form_id) AND (forms.created_by = auth.uid())))) AND (auth.uid() = uploaded_by)) |
| public | form_data_photos | Users can soft delete their own photos | PERMISSIVE | {public} | UPDATE | ((NOT is_deleted) AND (EXISTS ( SELECT 1
FROM forms
WHERE ((forms.id = form_data_photos.form_id) AND (forms.created_by = auth.uid())))) AND (auth.uid() = uploaded_by)) | null |
| public | form_data_photos | Users can update their own photos | PERMISSIVE | {public} | UPDATE | ((NOT is_deleted) AND (EXISTS ( SELECT 1
FROM forms
WHERE ((forms.id = form_data_photos.form_id) AND (forms.created_by = auth.uid())))) AND (auth.uid() = uploaded_by)) | null |
| public | form_data_photos | Users can view photos for their forms | PERMISSIVE | {public} | SELECT | ((NOT is_deleted) AND (EXISTS ( SELECT 1
FROM forms
WHERE ((forms.id = form_data_photos.form_id) AND (forms.created_by = auth.uid()))))) | null |
| public | form_modules | Users can access modules of their own forms | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
FROM forms
WHERE ((forms.id = form_modules.form_id) AND (forms.user_id = auth.uid())))) | null |
| public | form_modules | Users can delete modules of their own forms | PERMISSIVE | {public} | DELETE | (EXISTS ( SELECT 1
FROM forms
WHERE ((forms.id = form_modules.form_id) AND (forms.user_id = auth.uid())))) | null |
| public | form_modules | Users can insert modules for their own forms | PERMISSIVE | {public} | INSERT | null | (EXISTS ( SELECT 1
FROM forms
WHERE ((forms.id = form_modules.form_id) AND (forms.user_id = auth.uid())))) |
| public | form_modules | Users can update modules of their own forms | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
FROM forms
WHERE ((forms.id = form_modules.form_id) AND (forms.user_id = auth.uid())))) | null |
| public | forms | Users can create their own forms | PERMISSIVE | {authenticated} | INSERT | null | (auth.uid() = user_id) |
| public | forms | Users can delete their own forms | PERMISSIVE | {authenticated} | DELETE | (auth.uid() = user_id) | null |
| public | forms | Users can insert forms | PERMISSIVE | {public} | INSERT | null | (auth.uid() = created_by) |
| public | forms | Users can read their own forms | PERMISSIVE | {public} | SELECT | (auth.uid() = created_by) | null |
| public | forms | Users can update their own forms | PERMISSIVE | {authenticated} | UPDATE | (auth.uid() = user_id) | (auth.uid() = user_id) |
| public | forms | Users can view their own forms | PERMISSIVE | {authenticated} | SELECT | (auth.uid() = user_id) | null |
| public | profiles | Allow inserts for self or trigger | PERMISSIVE | {public} | INSERT | null | ((auth.uid() = id) OR (auth.uid() IS NULL)) |
| public | profiles | Users can update their own profile | PERMISSIVE | {public} | UPDATE | (auth.uid() = id) | null |
| public | profiles | Users can view their own profile | PERMISSIVE | {public} | SELECT | (auth.uid() = id) | null |
| public | user_form_module_preferences | Users can access their own module preferences | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id) | null |
| public | user_form_module_preferences | Users can delete their own module preferences | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id) | null |
| public | user_form_module_preferences | Users can insert their own module preferences | PERMISSIVE | {public} | INSERT | null | (auth.uid() = user_id) |
| public | user_form_module_preferences | Users can update their own module preferences | PERMISSIVE | {public} | UPDATE | (auth.uid() = user_id) | null |
| table_name | trigger_name | event | definition |
| ---------------- | --------------------------------------- | ------ | --------------------------------------------------------- |
| form_data | update_form_data_updated_at | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
| form_data_photos | update_form_data_photos_updated_at | UPDATE | EXECUTE FUNCTION update_form_data_photos_updated_at() |
| form_list | update_form_list_updated_at | UPDATE | EXECUTE FUNCTION update_form_list_updated_at_column() |
| module_list | update_module_list_updated_at | UPDATE | EXECUTE FUNCTION update_module_list_updated_at_column() |
| profiles | after_profile_created_copy_flra_modules | INSERT | EXECUTE FUNCTION copy_default_flra_modules_for_new_user() |
| profiles | update_profiles_updated_at | UPDATE | EXECUTE FUNCTION update_updated_at_column() |
