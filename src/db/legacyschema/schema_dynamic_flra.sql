-- Dynamic FLRA Platform Schema
-- Supports stock/company/project customization, dynamic modules, and clean data separation

-- 0. Companies and Projects (must be first for FK references)
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1. Global Modules Table
create table if not exists public.modules (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique, -- e.g. 'ppe', 'hazards', 'header'
  label text not null,       -- UI label
  description text,
  version integer not null default 1, -- versioning for module definition
  scope text not null default 'stock', -- 'stock', 'company', 'project'
  company_id uuid references public.companies(id), -- nullable
  project_id uuid references public.projects(id),   -- nullable
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Global Module Fields Table
create table if not exists public.module_fields (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid not null references public.modules(id),
  name text not null,         -- unique within module
  label text not null,        -- UI label
  type text not null,         -- e.g. 'boolean', 'text', 'date', etc.
  required boolean default false not null,
  field_order integer not null,
  default_value text,
  version integer not null default 1, -- versioning for field definition
  scope text not null default 'stock', -- 'stock', 'company', 'project'
  company_id uuid references public.companies(id), -- nullable
  project_id uuid references public.projects(id),   -- nullable
  unique(module_id, name)
);

-- 3. Forms Table (per FLRA instance)
create table if not exists public.forms (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id), -- nullable
  company_id uuid references public.companies(id), -- nullable
  created_by uuid references public.profiles(id),
  version integer not null default 1, -- versioning for form instance
  status text not null default 'draft' check (status in ('draft', 'submitted')), -- form status
  title text, -- for easier searching/filtering
  description text, -- for easier searching/filtering
  submitted_at timestamp with time zone, -- track actual submission
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Form Modules Table (per-form module assignment)
create table if not exists public.form_modules (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  module_id uuid not null references public.modules(id),
  module_order integer not null,
  version integer not null default 1, -- versioning for per-form module
  completion_state text not null default 'not_started' check (completion_state in ('not_started', 'in_progress', 'complete')),
  unique(form_id, module_id)
);

-- 5. Form Module Fields Table (per-form field customization)
create table if not exists public.form_module_fields (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  form_module_id uuid not null references public.form_modules(id),
  module_field_id uuid references public.module_fields(id), -- trace to global field
  name text not null,         -- field name
  label text not null,        -- UI label
  type text not null,         -- e.g. 'boolean', 'text', etc.
  required boolean default false not null,
  field_order integer not null,
  default_value text,
  version integer not null default 1, -- versioning for per-form field
  unique(form_module_id, name)
);

-- 6. Example: Per-Module Data Table (PPE)
create table if not exists public.form_data_ppe (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  -- Add fields dynamically based on form_module_fields for this form/module
  -- Example fields:
  ppe_hardhat boolean,
  ppe_safety_vest boolean,
  ppe_safety_glasses boolean,
  ppe_fall_protection boolean,
  ppe_coveralls boolean,
  ppe_gloves boolean,
  ppe_mask boolean,
  ppe_respirator boolean,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6b. Generic Per-Module Data Table (for highly dynamic modules)
create table if not exists public.form_data_generic (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid not null references public.forms(id),
  module_id uuid not null references public.modules(id),
  data jsonb not null, -- consider using Postgres JSON schema validation for field types
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Repeat for other modules: form_data_hazards, form_data_header, etc.

-- 8. RLS (Row Level Security) - IMPORTANT: Add policies for forms and form_data tables
-- Example: Only allow access to forms where created_by = auth.uid()
-- Example: Only allow access to form_data where form_id is accessible by user 