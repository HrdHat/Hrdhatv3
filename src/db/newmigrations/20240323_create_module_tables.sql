-- Migration: Create module-related tables
-- Date: 2024-03-23

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create modules table
CREATE TABLE IF NOT EXISTS public.modules (
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

-- 2. Create module_fields table
CREATE TABLE IF NOT EXISTS public.module_fields (
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

-- 3. Create form_module_fields table
CREATE TABLE IF NOT EXISTS public.form_module_fields (
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

-- Insert default FLRA modules
INSERT INTO public.modules (id, name, label, description, version, scope, is_active, created_at)
VALUES
  (uuid_generate_v4(), 'header', 'FLRA Header', 'Header section for FLRA forms', 1, 'stock', true, now()),
  (uuid_generate_v4(), 'general_info', 'General Information', 'General information section for FLRA forms', 1, 'stock', true, now()),
  (uuid_generate_v4(), 'hazards', 'Hazards', 'Hazards identification section for FLRA forms', 1, 'stock', true, now()),
  (uuid_generate_v4(), 'controls', 'Controls', 'Controls and mitigation section for FLRA forms', 1, 'stock', true, now()),
  (uuid_generate_v4(), 'signatures', 'Signatures', 'Signatures section for FLRA forms', 1, 'stock', true, now())
ON CONFLICT (name) DO NOTHING; 