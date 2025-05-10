-- schema.sql
-- Core table definitions for HrdHat application

-- 1. Extensions
create extension if not exists "uuid-ossp";

-- 2. Core Tables (no dependencies)

-- Companies
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Projects
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  email text not null unique,
  full_name text not null,
  phone_number text,
  company text,
  position_title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login timestamp with time zone,
  is_active boolean default true not null,
  logo_url text,
  default_form_name text
);

-- Form List (Templates)
create table if not exists public.form_list (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  is_active boolean default true,
  is_enabled boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Module List
create table if not exists public.module_list (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  is_active boolean default true,
  is_enabled boolean default true not null,
  is_default boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Form-related Tables

-- Forms
create table if not exists public.forms (
  id uuid primary key default uuid_generate_v4(),
  form_number text unique,
  created_by uuid references public.profiles(id),
  user_id uuid references public.profiles(id),
  status text default 'draft',
  last_modified timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  auto_archived boolean,
  data jsonb,
  company_id uuid references public.companies(id),
  project_id uuid references public.projects(id),
  title text,
  description text,
  version integer not null default 1,
  submitted_at timestamp with time zone
);

-- Form Modules
create table if not exists public.form_modules (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  module_id uuid not null references public.module_list(id),
  module_order integer not null,
  is_required boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Form Template Modules
create table if not exists public.form_template_modules (
  id uuid primary key default uuid_generate_v4(),
  form_list_id uuid not null references public.form_list(id),
  module_list_id uuid not null references public.module_list(id),
  module_order integer not null,
  is_required boolean default true not null
);

-- User Form Module Preferences
create table if not exists public.user_form_module_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id),
  form_list_id uuid not null references public.form_list(id),
  module_list_id uuid not null references public.module_list(id),
  module_order integer not null,
  is_required boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Form Data Tables

-- Form Data (Generic)
create table if not exists public.form_data (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  module_id uuid not null references public.form_modules(id),
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FLRA Header
create table if not exists public.flra_header (
  id uuid primary key default uuid_generate_v4(),
  form_module_id uuid references public.form_modules(id),
  form_number text,
  form_name text,
  form_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- General Information
create table if not exists public.general_information (
  id uuid primary key default uuid_generate_v4(),
  form_module_id uuid references public.form_modules(id),
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Pre-job Task Checklist
create table if not exists public.pre_job_task_checklist (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  form_module_id uuid references public.form_modules(id),
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Task Hazard Control
create table if not exists public.task_hazard_control (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  form_module_id uuid references public.form_modules(id),
  task text not null,
  hazard text not null,
  risk_level_before integer,
  control text not null,
  risk_level_after integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PPE Platform Inspection
create table if not exists public.ppe_platform_inspection (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  form_module_id uuid references public.form_modules(id),
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Photo and Signature Tables

-- Form Data Photos
create table if not exists public.form_data_photos (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  form_module_id uuid not null references public.form_modules(id),
  uploaded_by uuid not null references public.profiles(id),
  storage_path text not null,
  public_url text not null,
  file_name text not null,
  file_size integer not null,
  mime_type text not null,
  description text,
  sort_order integer,
  tag text,
  source text,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  constraint unique_storage_path unique (storage_path),
  constraint positive_file_size check (file_size > 0),
  constraint valid_soft_delete check (
    (is_deleted = false and deleted_at is null) or
    (is_deleted = true and deleted_at is not null)
  ),
  constraint valid_mime_type check (
    mime_type in ('image/jpeg', 'image/png', 'image/heic', 'image/heif')
  )
);

-- Signatures
create table if not exists public.signatures (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  form_module_id uuid references public.form_modules(id),
  worker_name text not null,
  signature_url text not null,
  signed_at timestamp with time zone default timezone('utc'::text, now()) not null
); 