| ddl                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE TABLE companies (
    created_at timestamp with time zone,
    id uuid,
    name text
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| CREATE TABLE flra_header (
    form_module_id uuid,
    id uuid,
    form_number text,
    form_name text,
    created_at timestamp with time zone,
    form_date date
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| CREATE TABLE flra_photos (
    description text,
    photo_url text,
    uploaded_at timestamp with time zone,
    form_module_id uuid,
    form_id uuid,
    id uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| CREATE TABLE form_data (
    updated_at timestamp with time zone,
    created_at timestamp with time zone,
    data jsonb,
    module_id uuid,
    form_id uuid,
    id uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| CREATE TABLE form_data_photos (
    deleted_at timestamp with time zone,
    form_module_id uuid,
    uploaded_by uuid,
    storage_path text,
    public_url text,
    file_name text,
    mime_type text,
    description text,
    tag text,
    source text,
    form_id uuid,
    is_deleted boolean,
    updated_at timestamp with time zone,
    uploaded_at timestamp with time zone,
    sort_order integer,
    file_size integer,
    id uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| CREATE TABLE form_list (
    description text,
    name text,
    id uuid,
    is_active boolean,
    is_enabled boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| CREATE TABLE form_module_fields (
    type text,
    name text,
    field_order integer,
    required boolean,
    label text,
    module_field_id uuid,
    form_module_id uuid,
    form_id uuid,
    id uuid,
    default_value text,
    version integer
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| CREATE TABLE form_modules (
    id uuid,
    completion_state text,
    created_at timestamp with time zone,
    is_required boolean,
    module_order integer,
    module_id uuid,
    form_id uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| CREATE TABLE form_template_modules (
    form_list_id uuid,
    id uuid,
    module_order integer,
    is_required boolean,
    module_list_id uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| CREATE TABLE forms (
    version integer,
    submitted_at timestamp with time zone,
    status text,
    user_id uuid,
    created_at timestamp with time zone,
    auto_archived boolean,
    created_by uuid,
    last_modified timestamp with time zone,
    id uuid,
    data jsonb,
    description text,
    title text,
    form_number text,
    company_id uuid,
    project_id uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| CREATE TABLE general_information (
    supervisor_contact text,
    date date,
    crew_members_count integer,
    start_time time without time zone,
    end_time time without time zone,
    created_at timestamp with time zone,
    supervisor_name text,
    task_location text,
    project_address text,
    project_name text,
    form_module_id uuid,
    task_description text,
    id uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| CREATE TABLE module_fields (
    company_id uuid,
    type text,
    scope text,
    default_value text,
    label text,
    name text,
    id uuid,
    module_id uuid,
    required boolean,
    field_order integer,
    version integer,
    project_id uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| CREATE TABLE module_list (
    is_enabled boolean,
    id uuid,
    description text,
    name text,
    updated_at timestamp with time zone,
    created_at timestamp with time zone,
    is_default boolean,
    is_active boolean
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| CREATE TABLE modules (
    name text,
    uses_fields boolean,
    created_at timestamp with time zone,
    is_active boolean,
    project_id uuid,
    company_id uuid,
    version integer,
    id uuid,
    renderer_key text,
    scope text,
    description text,
    label text
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| CREATE TABLE ppe_platform_inspection (
    ppe_hardhat boolean,
    id uuid,
    form_id uuid,
    form_module_id uuid,
    ppe_safety_vest boolean,
    ppe_safety_glasses boolean,
    ppe_fall_protection boolean,
    ppe_coveralls boolean,
    ppe_gloves boolean,
    ppe_mask boolean,
    ppe_respirator boolean,
    platform_ladder boolean,
    platform_step_bench boolean,
    platform_sawhorses boolean,
    platform_baker_scaffold boolean,
    platform_scaffold boolean,
    platform_scissor_lift boolean,
    platform_boom_lift boolean,
    platform_swing_stage boolean,
    platform_hydro_lift boolean,
    created_at timestamp with time zone
);                                                                                                                                                                                                                                                                                                                                                                                  |
| CREATE TABLE pre_job_task_checklist (
    clear_access_to_emergency_exits boolean,
    id uuid,
    form_id uuid,
    form_module_id uuid,
    is_fit_for_duty boolean,
    reviewed_work_area_for_hazards boolean,
    required_ppe_for_today boolean,
    equipment_inspection_up_to_date boolean,
    completed_flra_hazard_assessment boolean,
    safety_signage_installed_and_checked boolean,
    working_alone_today boolean,
    required_permits_for_tasks boolean,
    created_at timestamp with time zone,
    aware_of_site_notices_or_bulletins boolean,
    know_designated_first_aid_attendant boolean,
    weather_suitable_for_work boolean,
    need_for_spotters_barricades_special_controls boolean,
    communicated_with_crew_about_plan boolean,
    all_required_permits_in_place boolean,
    reviewed_emergency_procedures boolean,
    barricades_signage_barriers_installed_good boolean,
    reviewed_control_measures_needed boolean,
    inspected_tools_and_equipment boolean,
    trained_and_competent_for_tasks boolean
); |
| CREATE TABLE profiles (
    id uuid,
    logo_url text,
    default_form_name text,
    email text,
    full_name text,
    phone_number text,
    is_active boolean,
    last_login timestamp with time zone,
    company text,
    updated_at timestamp with time zone,
    created_at timestamp with time zone,
    position_title text
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| CREATE TABLE projects (
    name text,
    id uuid,
    created_at timestamp with time zone,
    company_id uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| CREATE TABLE signatures (
    form_module_id uuid,
    signed_at timestamp with time zone,
    metadata jsonb,
    id uuid,
    form_id uuid,
    signature_hash text,
    role text,
    worker_name text,
    signature_url text
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| CREATE TABLE task_hazard_control (
    hazard text,
    created_at timestamp with time zone,
    form_id uuid,
    form_module_id uuid,
    risk_level_before integer,
    risk_level_after integer,
    task text,
    control text,
    id uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| CREATE TABLE user_form_module_preferences (
    created_at timestamp with time zone,
    is_required boolean,
    module_order integer,
    module_list_id uuid,
    id uuid,
    user_id uuid,
    form_list_id uuid
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |