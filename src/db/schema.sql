CREATE TABLE IF NOT EXISTS modules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    label text NOT NULL,
    description text,
    version integer NOT NULL DEFAULT 1,
    scope text NOT NULL DEFAULT 'stock',
    company_id uuid,
    project_id uuid,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS form_data_photos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    form_module_id uuid NOT NULL,
    uploaded_by uuid NOT NULL,
    storage_path text NOT NULL,
    public_url text NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    description text,
    sort_order integer,
    tag text,
    source text,
    uploaded_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    is_deleted boolean DEFAULT false,
    deleted_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS flra_header (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_module_id uuid,
    form_number text,
    form_name text,
    form_date date,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    user_form_id text
);

CREATE TABLE IF NOT EXISTS flra_photos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    form_module_id uuid,
    photo_url text NOT NULL,
    description text,
    uploaded_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS form_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    module_id uuid NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS form_list (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    is_enabled boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS form_instance_modules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    module_id uuid NOT NULL,
    module_order integer NOT NULL,
    is_required boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    completion_state text NOT NULL DEFAULT 'not_started'
);

CREATE TABLE IF NOT EXISTS form_template_modules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_list_id uuid NOT NULL,
    module_list_id uuid NOT NULL,
    module_order integer NOT NULL,
    is_required boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS forms (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_number text,
    created_by uuid,
    status text DEFAULT 'draft',
    last_modified timestamp with time zone DEFAULT timezone('utc'::text, now()),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    auto_archived boolean DEFAULT false,
    data jsonb,
    company_id uuid,
    project_id uuid,
    title text,
    description text,
    version integer NOT NULL DEFAULT 1,
    submitted_at timestamp with time zone,
    user_id uuid
);

CREATE TABLE IF NOT EXISTS general_information (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_module_id uuid,
    project_name text,
    project_address text,
    task_location text,
    supervisor_name text,
    supervisor_contact text,
    date date,
    crew_members_count integer,
    task_description text,
    start_time time without time zone,
    end_time time without time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS module_fields (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id uuid NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    type text NOT NULL,
    required boolean NOT NULL DEFAULT false,
    field_order integer NOT NULL,
    default_value text,
    version integer NOT NULL DEFAULT 1,
    scope text NOT NULL DEFAULT 'stock',
    company_id uuid,
    project_id uuid
);

CREATE TABLE IF NOT EXISTS module_list (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    is_enabled boolean NOT NULL DEFAULT true,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS ppe_platform_inspection (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    form_module_id uuid,
    ppe_hardhat boolean,
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
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS pre_job_task_checklist (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    form_module_id uuid,
    is_fit_for_duty boolean,
    reviewed_work_area_for_hazards boolean,
    required_ppe_for_today boolean,
    equipment_inspection_up_to_date boolean,
    completed_flra_hazard_assessment boolean,
    safety_signage_installed_and_checked boolean,
    working_alone_today boolean,
    required_permits_for_tasks boolean,
    barricades_signage_barriers_installed_good boolean,
    clear_access_to_emergency_exits boolean,
    trained_and_competent_for_tasks boolean,
    inspected_tools_and_equipment boolean,
    reviewed_control_measures_needed boolean,
    reviewed_emergency_procedures boolean,
    all_required_permits_in_place boolean,
    communicated_with_crew_about_plan boolean,
    need_for_spotters_barricades_special_controls boolean,
    weather_suitable_for_work boolean,
    know_designated_first_aid_attendant boolean,
    aware_of_site_notices_or_bulletins boolean,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    full_name text NOT NULL,
    phone_number text,
    company text,
    position_title text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    last_login timestamp with time zone,
    is_active boolean NOT NULL DEFAULT true,
    logo_url text,
    default_form_name text
);

CREATE TABLE IF NOT EXISTS projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id uuid,
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS signatures (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    form_module_id uuid,
    worker_name text NOT NULL,
    signature_url text NOT NULL,
    signed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    signature_hash text,
    role text,
    metadata jsonb,
    signed_by uuid,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS task_hazard_control (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    form_module_id uuid,
    task text NOT NULL,
    hazard text NOT NULL,
    risk_level_before integer,
    control text NOT NULL,
    risk_level_after integer,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS user_form_module_preferences (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    form_list_id uuid NOT NULL,
    module_list_id uuid NOT NULL,
    module_order integer NOT NULL,
    is_required boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS companies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Foreign Key Constraints
ALTER TABLE profiles
    ADD CONSTRAINT fk_profiles_id_users FOREIGN KEY (id) REFERENCES users(id);

ALTER TABLE forms
    ADD CONSTRAINT fk_forms_created_by_profiles FOREIGN KEY (created_by) REFERENCES profiles(id);
    ADD CONSTRAINT fk_forms_company_id_companies FOREIGN KEY (company_id) REFERENCES companies(id);
    ADD CONSTRAINT fk_forms_project_id_projects FOREIGN KEY (project_id) REFERENCES projects(id);
    ADD CONSTRAINT fk_forms_user_id_profiles FOREIGN KEY (user_id) REFERENCES profiles(id);

ALTER TABLE form_template_modules
    ADD CONSTRAINT fk_form_template_modules_form_list FOREIGN KEY (form_list_id) REFERENCES form_list(id),
    ADD CONSTRAINT fk_form_template_modules_module_list FOREIGN KEY (module_list_id) REFERENCES module_list(id);

ALTER TABLE form_instance_modules
    ADD CONSTRAINT fk_form_instance_modules_form_id_forms FOREIGN KEY (form_id) REFERENCES forms(id),
    ADD CONSTRAINT fk_form_instance_modules_module_id_modules FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;

ALTER TABLE user_form_module_preferences
    ADD CONSTRAINT fk_user_form_module_preferences_user_id FOREIGN KEY (user_id) REFERENCES profiles(id),
    ADD CONSTRAINT fk_user_form_module_preferences_form_list_id FOREIGN KEY (form_list_id) REFERENCES form_list(id),
    ADD CONSTRAINT fk_user_form_module_preferences_module_list_id FOREIGN KEY (module_list_id) REFERENCES module_list(id);

ALTER TABLE flra_header
    ADD CONSTRAINT fk_flra_header_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id);

ALTER TABLE general_information
    ADD CONSTRAINT fk_general_information_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id);

ALTER TABLE pre_job_task_checklist
    ADD CONSTRAINT fk_pre_job_task_checklist_form_id FOREIGN KEY (form_id) REFERENCES forms(id),
    ADD CONSTRAINT fk_pre_job_task_checklist_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id);

ALTER TABLE task_hazard_control
    ADD CONSTRAINT fk_task_hazard_control_form_id FOREIGN KEY (form_id) REFERENCES forms(id),
    ADD CONSTRAINT fk_task_hazard_control_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id);

ALTER TABLE flra_photos
    ADD CONSTRAINT fk_flra_photos_form_id FOREIGN KEY (form_id) REFERENCES forms(id),
    ADD CONSTRAINT fk_flra_photos_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id);

ALTER TABLE signatures
    ADD CONSTRAINT fk_signatures_form_id FOREIGN KEY (form_id) REFERENCES forms(id),
    ADD CONSTRAINT fk_signatures_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id),
    ADD CONSTRAINT fk_signatures_signed_by_users FOREIGN KEY (signed_by) REFERENCES users(id);

ALTER TABLE ppe_platform_inspection
    ADD CONSTRAINT fk_ppe_platform_inspection_form_id FOREIGN KEY (form_id) REFERENCES forms(id),
    ADD CONSTRAINT fk_ppe_platform_inspection_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id);

ALTER TABLE form_data
    ADD CONSTRAINT fk_form_data_form_id FOREIGN KEY (form_id) REFERENCES forms(id),
    ADD CONSTRAINT fk_form_data_module_id FOREIGN KEY (module_id) REFERENCES form_instance_modules(id);

ALTER TABLE projects
    ADD CONSTRAINT fk_projects_company_id FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE form_data_photos
    ADD CONSTRAINT fk_form_data_photos_form_id FOREIGN KEY (form_id) REFERENCES forms(id),
    ADD CONSTRAINT fk_form_data_photos_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id),
    ADD CONSTRAINT fk_form_data_photos_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES profiles(id);

ALTER TABLE modules
    ADD CONSTRAINT fk_modules_company_id FOREIGN KEY (company_id) REFERENCES companies(id),
    ADD CONSTRAINT fk_modules_project_id FOREIGN KEY (project_id) REFERENCES projects(id);

ALTER TABLE module_fields
    ADD CONSTRAINT fk_module_fields_module_id FOREIGN KEY (module_id) REFERENCES modules(id),
    ADD CONSTRAINT fk_module_fields_company_id FOREIGN KEY (company_id) REFERENCES companies(id),
    ADD CONSTRAINT fk_module_fields_project_id FOREIGN KEY (project_id) REFERENCES projects(id);

ALTER TABLE form_instance_modules
    ADD CONSTRAINT fk_form_instance_modules_form_id_forms FOREIGN KEY (form_id) REFERENCES forms(id),
    ADD CONSTRAINT fk_form_instance_modules_module_id_modules FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;

ALTER TABLE form_module_fields
    ADD CONSTRAINT fk_form_module_fields_form_id FOREIGN KEY (form_id) REFERENCES forms(id),
    ADD CONSTRAINT fk_form_module_fields_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id),
    ADD CONSTRAINT fk_form_module_fields_module_field_id FOREIGN KEY (module_field_id) REFERENCES module_fields(id);

-- Indexes and Unique Constraints
-- Primary keys are already defined in CREATE TABLE statements.

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS companies_name_key ON companies(name);
CREATE UNIQUE INDEX IF NOT EXISTS flra_header_unique_form_number ON flra_header(form_number);
CREATE UNIQUE INDEX IF NOT EXISTS form_data_form_module_unique ON form_data(form_id, module_id);
CREATE UNIQUE INDEX IF NOT EXISTS form_list_name_key ON form_list(name);
CREATE UNIQUE INDEX IF NOT EXISTS form_list_name_unique ON form_list(name);
CREATE UNIQUE INDEX IF NOT EXISTS form_module_fields_form_module_id_name_key ON form_module_fields(form_module_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS module_fields_module_id_name_key ON module_fields(module_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS module_fields_name_unique ON module_fields(module_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS module_list_name_key ON module_list(name);
CREATE UNIQUE INDEX IF NOT EXISTS modules_name_key ON modules(name);
CREATE UNIQUE INDEX IF NOT EXISTS modules_name_unique ON modules(name);
CREATE UNIQUE INDEX IF NOT EXISTS user_form_module_preferences_unique ON user_form_module_preferences(user_id, form_list_id, module_list_id);

-- Non-unique indexes
CREATE INDEX IF NOT EXISTS form_data_photos_form_id_idx ON form_data_photos(form_id);
CREATE INDEX IF NOT EXISTS form_data_photos_is_deleted_idx ON form_data_photos(is_deleted);
CREATE INDEX IF NOT EXISTS form_data_photos_sort_order_idx ON form_data_photos(sort_order);
CREATE INDEX IF NOT EXISTS form_data_photos_tag_idx ON form_data_photos(tag);
CREATE INDEX IF NOT EXISTS form_data_photos_uploaded_by_idx ON form_data_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS form_instance_modules_completion_state_idx ON form_instance_modules(completion_state);
CREATE INDEX IF NOT EXISTS form_instance_modules_form_id_idx ON form_instance_modules(form_id);
CREATE INDEX IF NOT EXISTS forms_created_at_idx ON forms(created_at);
CREATE INDEX IF NOT EXISTS forms_created_by_idx ON forms(created_by);
CREATE INDEX IF NOT EXISTS forms_status_idx ON forms(status);
CREATE INDEX IF NOT EXISTS signatures_hash_idx ON signatures(signature_hash);
CREATE INDEX IF NOT EXISTS signatures_is_deleted_idx ON signatures(is_deleted);
CREATE INDEX IF NOT EXISTS user_form_module_preferences_user_id_idx ON user_form_module_preferences(user_id);
