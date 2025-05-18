-- HrdHat Schema v2 (schema2.sql)
-- Clean, modern, template-instance separation, user/company module customization

-- Master module catalog
CREATE TABLE IF NOT EXISTS template_modules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    label text NOT NULL,
    description text,
    version integer NOT NULL DEFAULT 1,
    scope text NOT NULL DEFAULT 'stock',
    company_id uuid,
    project_id uuid,
    is_active boolean NOT NULL DEFAULT true,
    renderer_key text, -- renderer for UI
    uses_fields boolean DEFAULT true, -- does this module use fields?
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_template_modules_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_template_modules_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Fields for each template module
CREATE TABLE IF NOT EXISTS template_module_fields (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id uuid NOT NULL REFERENCES template_modules(id),
    name text NOT NULL,
    label text NOT NULL,
    type text NOT NULL,
    required boolean NOT NULL DEFAULT false,
    field_order integer NOT NULL,
    default_value text,
    version integer NOT NULL DEFAULT 1,
    scope text NOT NULL DEFAULT 'stock',
    company_id uuid,
    project_id uuid,
    CONSTRAINT fk_template_module_fields_module_id FOREIGN KEY (module_id) REFERENCES template_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_template_module_fields_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_template_module_fields_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- User/company module preferences (customization layer)
CREATE TABLE IF NOT EXISTS user_form_module_preferences (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    form_list_id uuid NOT NULL,
    template_module_id uuid, -- nullable to match live DB
    module_order integer NOT NULL,
    is_required boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, form_list_id, template_module_id),
    CONSTRAINT fk_user_form_module_preferences_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_user_form_module_preferences_form_list_id FOREIGN KEY (form_list_id) REFERENCES form_templates(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_user_form_module_preferences_template_module_id FOREIGN KEY (template_module_id) REFERENCES template_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Form templates (list of available form types)
CREATE TABLE IF NOT EXISTS form_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    is_enabled boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Form templates (list of available form types, legacy)
CREATE TABLE IF NOT EXISTS form_list (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    description text,
    is_active boolean DEFAULT true,
    is_enabled boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Template: which modules are in which form template (default structure)
CREATE TABLE IF NOT EXISTS form_template_modules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_list_id uuid NOT NULL REFERENCES form_list(id),
    template_module_id uuid REFERENCES template_modules(id),
    module_order integer NOT NULL,
    is_required boolean NOT NULL DEFAULT true,
    CONSTRAINT fk_form_template_modules_form_list_id FOREIGN KEY (form_list_id) REFERENCES form_templates(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- Instance tables (per-form data)
CREATE TABLE IF NOT EXISTS form_instances (
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
    user_id uuid,
    CONSTRAINT fk_form_instances_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_instances_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_instances_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_instances_created_by FOREIGN KEY (created_by) REFERENCES profiles(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS form_instance_modules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL REFERENCES form_instances(id),
    module_id uuid NOT NULL REFERENCES template_modules(id),
    module_order integer NOT NULL,
    is_required boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    completion_state text NOT NULL DEFAULT 'not_started',
    CONSTRAINT fk_form_instance_modules_form_id FOREIGN KEY (form_id) REFERENCES form_instances(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_instance_modules_module_id FOREIGN KEY (module_id) REFERENCES template_modules(id) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS form_instance_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL REFERENCES form_instances(id),
    module_id uuid NOT NULL REFERENCES form_instance_modules(id),
    data jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_form_instance_data_form_id FOREIGN KEY (form_id) REFERENCES form_instances(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_instance_data_module_id FOREIGN KEY (module_id) REFERENCES form_instance_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS form_data_entries (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    module_id uuid NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_form_data_entries_form_id FOREIGN KEY (form_id) REFERENCES form_instances(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_data_entries_module_id FOREIGN KEY (module_id) REFERENCES form_instance_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS form_instance_general_info (
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
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_form_instance_general_info_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS form_instance_pre_job_checklist (
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
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_form_instance_pre_job_checklist_form_id FOREIGN KEY (form_id) REFERENCES form_instances(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_instance_pre_job_checklist_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS form_instance_hazards (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    form_module_id uuid,
    task text NOT NULL,
    hazard text NOT NULL,
    risk_level_before integer,
    control text NOT NULL,
    risk_level_after integer,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_form_instance_hazards_form_id FOREIGN KEY (form_id) REFERENCES form_instances(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_instance_hazards_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS form_instance_signatures (
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
    deleted_at timestamp with time zone,
    CONSTRAINT fk_form_instance_signatures_form_id FOREIGN KEY (form_id) REFERENCES form_instances(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_instance_signatures_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_instance_signatures_signed_by FOREIGN KEY (signed_by) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS form_instance_ppe_platform (
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
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_form_instance_ppe_platform_form_id FOREIGN KEY (form_id) REFERENCES form_instances(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_instance_ppe_platform_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS form_instance_module_fields (
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
    version integer NOT NULL DEFAULT 1,
    CONSTRAINT fk_form_instance_module_fields_form_id FOREIGN KEY (form_id) REFERENCES form_instances(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_instance_module_fields_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_instance_module_fields_module_field_id FOREIGN KEY (module_field_id) REFERENCES template_module_fields(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS form_asset_photos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id uuid NOT NULL,
    form_module_id uuid,
    photo_url text NOT NULL,
    description text,
    uploaded_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_form_asset_photos_form_id FOREIGN KEY (form_id) REFERENCES form_instances(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_form_asset_photos_form_module_id FOREIGN KEY (form_module_id) REFERENCES form_instance_modules(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id uuid,
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_projects_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS companies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS and policies (from live DB)
ALTER TABLE template_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON template_modules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to modules" ON template_modules
  FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE form_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own forms" ON form_instances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own forms" ON form_instances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms" ON form_instances
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" ON form_instances
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes and constraints
CREATE INDEX IF NOT EXISTS idx_user_form_module_preferences_user_id ON user_form_module_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_form_instance_modules_form_id ON form_instance_modules(form_id);
CREATE INDEX IF NOT EXISTS idx_form_instance_data_form_id ON form_instance_data(form_id);
CREATE INDEX IF NOT EXISTS idx_template_modules_name ON template_modules(name);

-- BEGIN AUTO-GENERATED INDEXES/KEYS (from pasteqries.md)
-- template_modules
CREATE UNIQUE INDEX IF NOT EXISTS modules_name_key ON template_modules(name);
CREATE UNIQUE INDEX IF NOT EXISTS modules_name_unique ON template_modules(name);
CREATE UNIQUE INDEX IF NOT EXISTS template_modules_pkey ON template_modules(id);

-- template_module_fields
CREATE UNIQUE INDEX IF NOT EXISTS module_fields_module_id_name_key ON template_module_fields(module_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS module_fields_name_unique ON template_module_fields(module_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS template_module_fields_pkey ON template_module_fields(id);

-- user_form_module_preferences
CREATE INDEX IF NOT EXISTS idx_user_form_module_preferences_user_id ON user_form_module_preferences(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_form_module_preferences_pkey ON user_form_module_preferences(id);

-- form_templates
CREATE UNIQUE INDEX IF NOT EXISTS form_list_name_key ON form_templates(name);
CREATE UNIQUE INDEX IF NOT EXISTS form_list_name_unique ON form_templates(name);
CREATE UNIQUE INDEX IF NOT EXISTS form_list_pkey ON form_templates(id);

-- form_template_modules
CREATE UNIQUE INDEX IF NOT EXISTS form_template_modules_pkey ON form_template_modules(id);

-- form_instances
CREATE UNIQUE INDEX IF NOT EXISTS form_instances_pkey ON form_instances(id);
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON form_instances(created_at);
CREATE INDEX IF NOT EXISTS idx_forms_created_by ON form_instances(created_by);
CREATE INDEX IF NOT EXISTS idx_forms_status ON form_instances(status);

-- form_instance_modules
CREATE UNIQUE INDEX IF NOT EXISTS form_instance_modules_pkey ON form_instance_modules(id);
CREATE INDEX IF NOT EXISTS idx_form_modules_completion_state ON form_instance_modules(completion_state);
CREATE INDEX IF NOT EXISTS idx_form_modules_form_id ON form_instance_modules(form_id);

-- form_instance_module_fields
CREATE UNIQUE INDEX IF NOT EXISTS form_instance_module_fields_form_module_id_name_key ON form_instance_module_fields(form_module_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS form_instance_module_fields_pkey ON form_instance_module_fields(id);

-- form_instance_data
CREATE UNIQUE INDEX IF NOT EXISTS form_instance_data_pkey ON form_instance_data(id);
CREATE INDEX IF NOT EXISTS idx_form_instance_data_form_id ON form_instance_data(form_id);

-- form_data_entries
CREATE UNIQUE INDEX IF NOT EXISTS form_data_entries_form_module_unique ON form_data_entries(form_id, module_id);
CREATE UNIQUE INDEX IF NOT EXISTS form_data_pkey ON form_data_entries(id);
CREATE INDEX IF NOT EXISTS idx_form_data_form_id ON form_data_entries(form_id);
CREATE INDEX IF NOT EXISTS idx_form_data_module_id ON form_data_entries(module_id);

-- form_instance_general_info
CREATE UNIQUE INDEX IF NOT EXISTS form_instance_general_info_pkey ON form_instance_general_info(id);

-- form_instance_hazards
CREATE UNIQUE INDEX IF NOT EXISTS form_instance_hazards_pkey ON form_instance_hazards(id);

-- form_instance_ppe_platform
CREATE UNIQUE INDEX IF NOT EXISTS form_instance_ppe_platform_pkey ON form_instance_ppe_platform(id);

-- form_instance_pre_job_checklist
CREATE UNIQUE INDEX IF NOT EXISTS form_instance_pre_job_checklist_pkey ON form_instance_pre_job_checklist(id);

-- form_instance_signatures
CREATE UNIQUE INDEX IF NOT EXISTS form_instance_signatures_pkey ON form_instance_signatures(id);
CREATE INDEX IF NOT EXISTS idx_signatures_hash ON form_instance_signatures(signature_hash);
CREATE INDEX IF NOT EXISTS idx_signatures_is_deleted ON form_instance_signatures(is_deleted);

-- form_asset_photos
CREATE UNIQUE INDEX IF NOT EXISTS flra_photos_pkey ON form_asset_photos(id);

-- projects
CREATE UNIQUE INDEX IF NOT EXISTS projects_pkey ON projects(id);

-- companies
CREATE UNIQUE INDEX IF NOT EXISTS companies_name_key ON companies(name);
CREATE UNIQUE INDEX IF NOT EXISTS companies_pkey ON companies(id);
-- END AUTO-GENERATED INDEXES/KEYS 

-- === FINAL SCHEMA FIXES AND MODULE INTEGRATION ===
-- Ensure form_template_modules has template_module_id column
ALTER TABLE form_template_modules
ADD COLUMN IF NOT EXISTS template_module_id uuid REFERENCES template_modules(id);

-- Drop legacy column if it exists
ALTER TABLE form_template_modules
DROP COLUMN IF EXISTS module_list_id;

-- Add Photos and Signatures modules to template_modules
INSERT INTO template_modules (name, label, renderer_key, uses_fields)
VALUES 
  ('photos', 'Photos', 'PhotoModuleRenderer', false),
  ('signatures', 'Signatures', 'SignatureModuleRenderer', false)
ON CONFLICT (name) DO NOTHING;

-- Link Photos and Signatures modules to the FLRA template in form_template_modules
-- Replace the UUIDs below with the actual IDs from your template_modules table if needed
INSERT INTO form_template_modules (form_list_id, template_module_id, module_order, is_required)
VALUES
  ('3f7556b4-0f72-4cd6-894f-c7fdb3b10a7b', '8bccd1bc-787c-4ca1-98db-88509b04949c', 4, false), -- photos
  ('3f7556b4-0f72-4cd6-894f-c7fdb3b10a7b', '9695b682-a8e0-484f-b388-87ba051d44e1', 5, true); -- signatures

-- === END FINAL SCHEMA FIXES === 