CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE companies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE flra_header (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_module_id uuid,
    form_number text,
    form_name text,
    form_date date,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE flra_photos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    form_module_id uuid,
    photo_url text NOT NULL,
    description text,
    uploaded_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE form_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    module_id uuid NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE form_data_photos (
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

CREATE TABLE form_list (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    is_enabled boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE form_module_fields (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    form_module_id uuid NOT NULL,
    module_field_id uuid,
    name text NOT NULL,
    label text NOT NULL,
    type text NOT NULL,
    required boolean NOT NULL DEFAULT false,
    field_order integer NOT NULL,
    default_value text,
    version integer NOT NULL DEFAULT 1
);

CREATE TABLE form_modules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    module_id uuid NOT NULL,
    module_order integer NOT NULL,
    is_required boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    completion_state text NOT NULL DEFAULT 'not_started'::text
);

CREATE TABLE form_template_modules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_list_id uuid NOT NULL,
    module_list_id uuid NOT NULL,
    module_order integer NOT NULL,
    is_required boolean NOT NULL DEFAULT true
);

CREATE TABLE forms (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_number text,
    created_by uuid,
    status text DEFAULT 'draft'::text,
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

CREATE TABLE general_information (
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

CREATE TABLE module_fields (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id uuid NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    type text NOT NULL,
    required boolean NOT NULL DEFAULT false,
    field_order integer NOT NULL,
    default_value text,
    version integer NOT NULL DEFAULT 1,
    scope text NOT NULL DEFAULT 'stock'::text,
    company_id uuid,
    project_id uuid
);

CREATE TABLE module_list (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    is_enabled boolean NOT NULL DEFAULT true,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE modules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    label text NOT NULL,
    description text,
    version integer NOT NULL DEFAULT 1,
    scope text NOT NULL DEFAULT 'stock'::text,
    company_id uuid,
    project_id uuid,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    renderer_key text NOT NULL,
    uses_fields boolean DEFAULT true
);

CREATE TABLE ppe_platform_inspection (
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

CREATE TABLE pre_job_task_checklist (
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

CREATE TABLE profiles (
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

CREATE TABLE projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id uuid,
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE signatures (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    form_module_id uuid,
    worker_name text NOT NULL,
    signature_url text NOT NULL,
    signed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    signature_hash text,
    role text,
    metadata jsonb
);

CREATE TABLE task_hazard_control (
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

CREATE TABLE user_form_module_preferences (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    form_list_id uuid NOT NULL,
    module_list_id uuid NOT NULL,
    module_order integer NOT NULL,
    is_required boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Foreign Key Constraints
ALTER TABLE flra_header ADD CONSTRAINT fk_flra_header_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE flra_photos ADD CONSTRAINT fk_flra_photos_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE flra_photos ADD CONSTRAINT fk_flra_photos_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE form_data ADD CONSTRAINT fk_form_data_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE form_data ADD CONSTRAINT fk_form_data_module_id FOREIGN KEY (module_id) REFERENCES form_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE form_data_photos ADD CONSTRAINT fk_form_data_photos_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE form_data_photos ADD CONSTRAINT fk_form_data_photos_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE form_data_photos ADD CONSTRAINT fk_form_data_photos_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE form_module_fields ADD CONSTRAINT fk_form_module_fields_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE form_module_fields ADD CONSTRAINT fk_form_module_fields_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE form_module_fields ADD CONSTRAINT fk_form_module_fields_module_field_id FOREIGN KEY (module_field_id) REFERENCES module_fields(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE form_modules ADD CONSTRAINT fk_form_modules_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE form_template_modules ADD CONSTRAINT fk_form_template_modules_form_list_id FOREIGN KEY (form_list_id) REFERENCES form_list(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE form_template_modules ADD CONSTRAINT fk_form_template_modules_module_list_id FOREIGN KEY (module_list_id) REFERENCES module_list(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE forms ADD CONSTRAINT fk_forms_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE forms ADD CONSTRAINT fk_forms_created_by FOREIGN KEY (created_by) REFERENCES profiles(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE forms ADD CONSTRAINT fk_forms_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE forms ADD CONSTRAINT fk_forms_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE general_information ADD CONSTRAINT fk_general_information_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE module_fields ADD CONSTRAINT fk_module_fields_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE module_fields ADD CONSTRAINT fk_module_fields_module_id FOREIGN KEY (module_id) REFERENCES modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE module_fields ADD CONSTRAINT fk_module_fields_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE modules ADD CONSTRAINT fk_modules_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE modules ADD CONSTRAINT fk_modules_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ppe_platform_inspection ADD CONSTRAINT fk_ppe_platform_inspection_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ppe_platform_inspection ADD CONSTRAINT fk_ppe_platform_inspection_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE pre_job_task_checklist ADD CONSTRAINT fk_pre_job_task_checklist_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE pre_job_task_checklist ADD CONSTRAINT fk_pre_job_task_checklist_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE projects ADD CONSTRAINT fk_projects_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE signatures ADD CONSTRAINT fk_signatures_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE signatures ADD CONSTRAINT fk_signatures_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE task_hazard_control ADD CONSTRAINT fk_task_hazard_control_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE task_hazard_control ADD CONSTRAINT fk_task_hazard_control_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE user_form_module_preferences ADD CONSTRAINT fk_user_form_module_preferences_form_list_id FOREIGN KEY (form_list_id) REFERENCES form_list(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE user_form_module_preferences ADD CONSTRAINT fk_user_form_module_preferences_module_list_id FOREIGN KEY (module_list_id) REFERENCES module_list(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE user_form_module_preferences ADD CONSTRAINT fk_user_form_module_preferences_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE NO ACTION ON DELETE NO ACTION;

-- Ensure PRIMARY KEY constraints for all listed tables
ALTER TABLE profiles                     ADD CONSTRAINT pk_profiles_id PRIMARY KEY (id);
ALTER TABLE form_list                    ADD CONSTRAINT pk_form_list_id PRIMARY KEY (id);
ALTER TABLE module_list                  ADD CONSTRAINT pk_module_list_id PRIMARY KEY (id);
ALTER TABLE forms                        ADD CONSTRAINT pk_forms_id PRIMARY KEY (id);
ALTER TABLE form_template_modules        ADD CONSTRAINT pk_form_template_modules_id PRIMARY KEY (id);
ALTER TABLE form_modules                 ADD CONSTRAINT pk_form_modules_id PRIMARY KEY (id);
ALTER TABLE user_form_module_preferences ADD CONSTRAINT pk_user_form_module_preferences_id PRIMARY KEY (id);
ALTER TABLE flra_header                  ADD CONSTRAINT pk_flra_header_id PRIMARY KEY (id);
ALTER TABLE general_information          ADD CONSTRAINT pk_general_information_id PRIMARY KEY (id);
ALTER TABLE pre_job_task_checklist       ADD CONSTRAINT pk_pre_job_task_checklist_id PRIMARY KEY (id);
ALTER TABLE task_hazard_control          ADD CONSTRAINT pk_task_hazard_control_id PRIMARY KEY (id);
ALTER TABLE flra_photos                  ADD CONSTRAINT pk_flra_photos_id PRIMARY KEY (id);
ALTER TABLE signatures                   ADD CONSTRAINT pk_signatures_id PRIMARY KEY (id);
ALTER TABLE ppe_platform_inspection      ADD CONSTRAINT pk_ppe_platform_inspection_id PRIMARY KEY (id);
ALTER TABLE form_data                    ADD CONSTRAINT pk_form_data_id PRIMARY KEY (id);
ALTER TABLE companies                    ADD CONSTRAINT pk_companies_id PRIMARY KEY (id);
ALTER TABLE projects                     ADD CONSTRAINT pk_projects_id PRIMARY KEY (id);
ALTER TABLE form_data_photos             ADD CONSTRAINT pk_form_data_photos_id PRIMARY KEY (id);
ALTER TABLE modules                      ADD CONSTRAINT pk_modules_id PRIMARY KEY (id);
ALTER TABLE module_fields                ADD CONSTRAINT pk_module_fields_id PRIMARY KEY (id);
ALTER TABLE form_module_fields           ADD CONSTRAINT pk_form_module_fields_id PRIMARY KEY (id);

-- Unique Constraints
ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
ALTER TABLE form_list ADD CONSTRAINT form_list_name_key UNIQUE (name);
ALTER TABLE module_list ADD CONSTRAINT module_list_name_key UNIQUE (name);
ALTER TABLE form_data ADD CONSTRAINT form_data_form_module_unique UNIQUE (form_id, module_id);
ALTER TABLE companies ADD CONSTRAINT companies_name_key UNIQUE (name);
ALTER TABLE form_data_photos ADD CONSTRAINT unique_storage_path UNIQUE (storage_path);
ALTER TABLE modules ADD CONSTRAINT modules_name_key UNIQUE (name);
ALTER TABLE module_fields ADD CONSTRAINT module_fields_module_id_name_key UNIQUE (module_id, name);
ALTER TABLE form_module_fields ADD CONSTRAINT form_module_fields_form_module_id_name_key UNIQUE (form_module_id, name);
ALTER TABLE form_list ADD CONSTRAINT form_list_name_unique UNIQUE (name);
ALTER TABLE modules ADD CONSTRAINT modules_name_unique UNIQUE (name);
ALTER TABLE module_fields ADD CONSTRAINT module_fields_name_unique UNIQUE (module_id, name);
ALTER TABLE user_form_module_preferences ADD CONSTRAINT user_form_module_preferences_unique UNIQUE (user_id, form_list_id, module_list_id);

-- Indexes
CREATE INDEX idx_form_data_form_id ON form_data(form_id);
CREATE INDEX idx_form_data_module_id ON form_data(module_id);
CREATE INDEX idx_form_data_photos_form_id ON form_data_photos(form_id);
CREATE INDEX idx_form_data_photos_is_deleted ON form_data_photos(is_deleted);
CREATE INDEX idx_form_data_photos_sort_order ON form_data_photos(sort_order);
CREATE INDEX idx_form_data_photos_tag ON form_data_photos(tag);
CREATE INDEX idx_form_data_photos_uploaded_by ON form_data_photos(uploaded_by);
CREATE INDEX idx_form_modules_completion_state ON form_modules(completion_state);
CREATE INDEX idx_form_modules_form_id ON form_modules(form_id);
CREATE INDEX idx_forms_created_at ON forms(created_at);
CREATE INDEX idx_forms_created_by ON forms(created_by);
CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_signatures_hash ON signatures(signature_hash);
CREATE INDEX idx_user_form_module_preferences_user_id ON user_form_module_preferences(user_id);

-- Enable RLS on all relevant tables
ALTER TABLE form_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_data_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_form_module_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for form_data
CREATE POLICY "Users can read their own form data"
  ON form_data FOR SELECT USING (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = form_data.form_id AND forms.created_by = auth.uid())
  );

CREATE POLICY "Users can update their own form data"
  ON form_data FOR UPDATE USING (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = form_data.form_id AND forms.created_by = auth.uid())
  );

-- Policies for form_data_photos
CREATE POLICY "Users can insert photos for their forms"
  ON form_data_photos FOR INSERT WITH CHECK (
    (EXISTS (SELECT 1 FROM forms WHERE forms.id = form_data_photos.form_id AND forms.created_by = auth.uid())) AND (auth.uid() = uploaded_by)
  );

CREATE POLICY "Users can soft delete their own photos"
  ON form_data_photos FOR UPDATE USING (
    (NOT is_deleted) AND (EXISTS (SELECT 1 FROM forms WHERE forms.id = form_data_photos.form_id AND forms.created_by = auth.uid())) AND (auth.uid() = uploaded_by)
  );

CREATE POLICY "Users can update their own photos"
  ON form_data_photos FOR UPDATE USING (
    (NOT is_deleted) AND (EXISTS (SELECT 1 FROM forms WHERE forms.id = form_data_photos.form_id AND forms.created_by = auth.uid())) AND (auth.uid() = uploaded_by)
  );

CREATE POLICY "Users can view photos for their forms"
  ON form_data_photos FOR SELECT USING (
    (NOT is_deleted) AND (EXISTS (SELECT 1 FROM forms WHERE forms.id = form_data_photos.form_id AND forms.created_by = auth.uid()))
  );

-- Policies for form_modules
CREATE POLICY "Users can access modules of their own forms"
  ON form_modules FOR SELECT USING (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = form_modules.form_id AND forms.user_id = auth.uid())
  );

CREATE POLICY "Users can delete modules of their own forms"
  ON form_modules FOR DELETE USING (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = form_modules.form_id AND forms.user_id = auth.uid())
  );

CREATE POLICY "Users can insert modules for their own forms"
  ON form_modules FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = form_modules.form_id AND forms.user_id = auth.uid())
  );

CREATE POLICY "Users can update modules of their own forms"
  ON form_modules FOR UPDATE USING (
    EXISTS (SELECT 1 FROM forms WHERE forms.id = form_modules.form_id AND forms.user_id = auth.uid())
  );

-- Policies for forms
CREATE POLICY "Users can create their own forms"
  ON forms FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own forms"
  ON forms FOR DELETE USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert forms"
  ON forms FOR INSERT WITH CHECK (
    auth.uid() = created_by
  );

CREATE POLICY "Users can read their own forms"
  ON forms FOR SELECT USING (
    auth.uid() = created_by
  );

CREATE POLICY "Users can update their own forms"
  ON forms FOR UPDATE USING (
    auth.uid() = user_id
  ) WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can view their own forms"
  ON forms FOR SELECT USING (
    auth.uid() = user_id
  );

-- Policies for profiles
CREATE POLICY "Allow inserts for self or trigger"
  ON profiles FOR INSERT WITH CHECK (
    (auth.uid() = id) OR (auth.uid() IS NULL)
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (
    auth.uid() = id
  );

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (
    auth.uid() = id
  );

-- Policies for user_form_module_preferences
CREATE POLICY "Users can access their own module preferences"
  ON user_form_module_preferences FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own module preferences"
  ON user_form_module_preferences FOR DELETE USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert their own module preferences"
  ON user_form_module_preferences FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update their own module preferences"
  ON user_form_module_preferences FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Trigger functions and triggers

-- 1. Update updated_at BEFORE UPDATE triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_form_data_updated_at
  BEFORE UPDATE ON form_data
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_form_data_photos_updated_at
  BEFORE UPDATE ON form_data_photos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_form_list_updated_at
  BEFORE UPDATE ON form_list
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_module_list_updated_at
  BEFORE UPDATE ON module_list
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. AFTER INSERT trigger for profiles (placeholder logic)
CREATE OR REPLACE FUNCTION after_profile_created_copy_flra_modules()
RETURNS TRIGGER AS $$
BEGIN
  -- TODO: Implement logic to copy FLRA modules for the new profile
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_profile_created_copy_flra_modules
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION after_profile_created_copy_flra_modules(); 