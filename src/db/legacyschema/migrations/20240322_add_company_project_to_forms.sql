-- Migration: Add company_id and project_id to forms table
-- Date: 2024-03-22

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create modules table if it doesn't exist
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

-- Insert default FLRA modules
INSERT INTO public.modules (id, name, label, description, version, scope, is_active, created_at)
VALUES
  (uuid_generate_v4(), 'header', 'FLRA Header', 'Header section for FLRA forms', 1, 'stock', true, now()),
  (uuid_generate_v4(), 'general_info', 'General Information', 'General information section for FLRA forms', 1, 'stock', true, now()),
  (uuid_generate_v4(), 'hazards', 'Hazards', 'Hazards identification section for FLRA forms', 1, 'stock', true, now()),
  (uuid_generate_v4(), 'controls', 'Controls', 'Controls and mitigation section for FLRA forms', 1, 'stock', true, now()),
  (uuid_generate_v4(), 'signatures', 'Signatures', 'Signatures section for FLRA forms', 1, 'stock', true, now())
ON CONFLICT (name) DO NOTHING;

-- Add id column with default UUID if it doesn't exist
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS id uuid DEFAULT uuid_generate_v4() NOT NULL;

-- Make form_number nullable and remove unique constraint if it exists
ALTER TABLE public.forms
ALTER COLUMN form_number DROP NOT NULL;

-- Drop the unique constraint first
ALTER TABLE public.forms
DROP CONSTRAINT IF EXISTS forms_form_number_key;

-- Add user_id column if it doesn't exist
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);

-- Add company_id column
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- Add project_id column
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id);

-- Add title and description columns if they don't exist
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS description text;

-- Add version column if it doesn't exist
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- Add submitted_at column if it doesn't exist
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone;

-- Add created_at column if it doesn't exist
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Update existing rows to set user_id = created_by if user_id is null
UPDATE public.forms
SET user_id = created_by
WHERE user_id IS NULL AND created_by IS NOT NULL;

-- Update form_modules table to use module_id instead of module_list_id
ALTER TABLE public.form_modules
DROP CONSTRAINT IF EXISTS form_modules_module_list_id_fkey;

ALTER TABLE public.form_modules
RENAME COLUMN module_list_id TO module_id;

ALTER TABLE public.form_modules
ADD CONSTRAINT form_modules_module_id_fkey
FOREIGN KEY (module_id) REFERENCES public.modules(id);

-- Enable Row Level Security
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_modules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can view their own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can update their own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can delete their own forms" ON public.forms;

DROP POLICY IF EXISTS "Users can access modules of their own forms" ON public.form_modules;
DROP POLICY IF EXISTS "Users can insert modules for their own forms" ON public.form_modules;
DROP POLICY IF EXISTS "Users can update modules of their own forms" ON public.form_modules;
DROP POLICY IF EXISTS "Users can delete modules of their own forms" ON public.form_modules;

-- Create policies for forms
CREATE POLICY "Users can create their own forms"
ON public.forms FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own forms"
ON public.forms FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms"
ON public.forms FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms"
ON public.forms FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create policies for form_modules
CREATE POLICY "Users can access modules of their own forms"
ON public.form_modules FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.forms
    WHERE public.forms.id = form_modules.form_id
    AND public.forms.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert modules for their own forms"
ON public.form_modules FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forms
    WHERE public.forms.id = form_modules.form_id
    AND public.forms.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update modules of their own forms"
ON public.form_modules FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.forms
    WHERE public.forms.id = form_modules.form_id
    AND public.forms.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete modules of their own forms"
ON public.form_modules FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.forms
    WHERE public.forms.id = form_modules.form_id
    AND public.forms.user_id = auth.uid()
  )
); 