-- 1. TABLES (dependency order)

-- profiles (no dependencies)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  email text unique not null,
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

-- form_list (no dependencies)
create table if not exists public.form_list (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  is_active boolean default true,
  is_enabled boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- module_list (no dependencies)
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

-- forms (depends on profiles)
create table if not exists public.forms (
  id uuid primary key default uuid_generate_v4(),
  form_number text unique not null,
  created_by uuid references public.profiles(id)
);

-- form_template_modules (depends on form_list, module_list)
create table if not exists public.form_template_modules (
  id uuid primary key default uuid_generate_v4(),
  form_list_id uuid not null references public.form_list(id),
  module_list_id uuid not null references public.module_list(id),
  module_order integer not null,
  is_required boolean default true not null
);

-- form_modules (depends on forms, module_list)
create table if not exists public.form_modules (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  module_list_id uuid not null references public.module_list(id),
  module_order integer not null,
  is_required boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- user_form_module_preferences (depends on profiles, form_list, module_list)
create table if not exists public.user_form_module_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id),
  form_list_id uuid not null references public.form_list(id),
  module_list_id uuid not null references public.module_list(id),
  module_order integer not null,
  is_required boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- flra_header (depends on form_modules)
create table if not exists public.flra_header (
  id uuid primary key default uuid_generate_v4(),
  form_module_id uuid references public.form_modules(id),
  form_number text,
  form_name text,
  form_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- general_information (depends on form_modules)
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
  start_time time,
  end_time time,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- pre_job_task_checklist (depends on forms, form_modules)
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

-- task_hazard_control (depends on forms, form_modules)
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

-- flra_photos (depends on forms, form_modules)
create table if not exists public.flra_photos (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  form_module_id uuid references public.form_modules(id),
  photo_url text not null,
  description text,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- signatures (depends on forms, form_modules)
create table if not exists public.signatures (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  form_module_id uuid references public.form_modules(id),
  worker_name text not null,
  signature_url text not null,
  signed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ppe_platform_inspection (depends on forms, form_modules)
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

-- 2. TRIGGERS, FUNCTIONS, INSERTS

-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, created_at, updated_at, is_active)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), now(), now(), true)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists update_profiles_updated_at on public.profiles;
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute procedure update_updated_at_column();

drop trigger if exists update_form_list_updated_at on public.form_list;
create or replace function update_form_list_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger update_form_list_updated_at
before update on public.form_list
for each row
execute procedure update_form_list_updated_at_column();

drop trigger if exists update_module_list_updated_at on public.module_list;
create or replace function update_module_list_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger update_module_list_updated_at
before update on public.module_list
for each row
execute procedure update_module_list_updated_at_column();

-- Insert default modules for FLRA forms
insert into public.module_list (id, name, description, is_active, is_enabled, is_default, created_at, updated_at)
values
  (uuid_generate_v4(), 'FLRA Header', 'Header section for FLRA forms', true, true, true, now(), now()),
  (uuid_generate_v4(), 'General Information', 'General info section for FLRA forms', true, true, true, now(), now()),
  (uuid_generate_v4(), 'Pre Job/Task Checklist', 'Checklist before starting the job/task', true, true, true, now(), now()),
  (uuid_generate_v4(), 'PPE & Equipment Checklist', 'Checklist for PPE and equipment', true, true, true, now(), now()),
  (uuid_generate_v4(), 'Task Hazard Control Module', 'Module for identifying and controlling hazards', true, true, true, now(), now()),
  (uuid_generate_v4(), 'FLRA Photos', 'Section for uploading photos', true, true, true, now(), now()),
  (uuid_generate_v4(), 'Signatures', 'Section for signatures', true, true, true, now(), now())
  on conflict (name) do nothing;

-- 3. RLS, POLICIES, INDEXES

-- Remove password_hash if present
alter table public.profiles drop column if exists password_hash;

-- Add created_by to forms if not exists
alter table public.forms add column if not exists created_by uuid references public.profiles(id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.forms enable row level security;
alter table public.form_modules enable row level security;
alter table public.user_form_module_preferences enable row level security;

-- Profiles policies (UPDATED)
-- First, drop all existing profile policies to ensure clean state
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Allow inserts for self or trigger" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Allow service role inserts" on public.profiles;

-- Then create the three essential policies
create policy "Allow inserts for self or trigger"
  on public.profiles for insert
  with check (auth.uid() = id OR auth.uid() IS NULL);

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Forms policies
drop policy if exists "Users can view their own forms" on public.forms;
create policy "Users can view their own forms"
  on public.forms for select
  using (auth.uid() = created_by);

drop policy if exists "Users can insert forms" on public.forms;
create policy "Users can insert forms"
  on public.forms for insert
  with check (auth.uid() = created_by);

drop policy if exists "Users can update their own forms" on public.forms;
create policy "Users can update their own forms"
  on public.forms for update
  using (auth.uid() = created_by);

drop policy if exists "Users can delete their own forms" on public.forms;
create policy "Users can delete their own forms"
  on public.forms for delete
  using (auth.uid() = created_by);

-- Form modules policies
drop policy if exists "Users can access modules of their own forms" on public.form_modules;
create policy "Users can access modules of their own forms"
  on public.form_modules for select
  using (
    exists (
      select 1 from public.forms
      where public.forms.id = form_modules.form_id
      and public.forms.created_by = auth.uid()
    )
  );

drop policy if exists "Users can insert modules for their own forms" on public.form_modules;
create policy "Users can insert modules for their own forms"
  on public.form_modules for insert
  with check (
    exists (
      select 1 from public.forms
      where public.forms.id = form_modules.form_id
      and public.forms.created_by = auth.uid()
    )
  );

drop policy if exists "Users can update modules of their own forms" on public.form_modules;
create policy "Users can update modules of their own forms"
  on public.form_modules for update
  using (
    exists (
      select 1 from public.forms
      where public.forms.id = form_modules.form_id
      and public.forms.created_by = auth.uid()
    )
  );

drop policy if exists "Users can delete modules of their own forms" on public.form_modules;
create policy "Users can delete modules of their own forms"
  on public.form_modules for delete
  using (
    exists (
      select 1 from public.forms
      where public.forms.id = form_modules.form_id
      and public.forms.created_by = auth.uid()
    )
  );

-- User form module preferences policies
drop policy if exists "Users can access their own module preferences" on public.user_form_module_preferences;
create policy "Users can access their own module preferences"
  on public.user_form_module_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own module preferences" on public.user_form_module_preferences;
create policy "Users can insert their own module preferences"
  on public.user_form_module_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own module preferences" on public.user_form_module_preferences;
create policy "Users can update their own module preferences"
  on public.user_form_module_preferences for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own module preferences" on public.user_form_module_preferences;
create policy "Users can delete their own module preferences"
  on public.user_form_module_preferences for delete
  using (auth.uid() = user_id);

-- Add this policy to your profiles table:
drop policy if exists "Allow service role inserts" on public.profiles;
drop policy if exists "Allow inserts for self or trigger" on public.profiles;
create policy "Allow inserts for self or trigger"
  on public.profiles for insert
  with check (auth.uid() = id OR auth.uid() IS NULL);

-- Indexes for performance
create index if not exists idx_forms_created_by on public.forms(created_by);
create index if not exists idx_form_modules_form_id on public.form_modules(form_id);
create index if not exists idx_user_form_module_preferences_user_id on public.user_form_module_preferences(user_id);

-- (Optional) Storage bucket policy example (run in Supabase Storage SQL editor, not here)
-- create policy "Users can access their own logos"
--   on storage.objects for select
--   using (auth.uid()::text = split_part(name, '/', 1)); 