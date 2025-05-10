-- Migration: Update forms.status to include 'archived' and ensure default is 'draft'
-- Date: 2024-03-21

-- First, drop the existing check constraint
ALTER TABLE public.forms 
DROP CONSTRAINT IF EXISTS forms_status_check;

-- Then add the new check constraint with 'archived' status
ALTER TABLE public.forms 
ADD CONSTRAINT forms_status_check 
CHECK (status in ('draft', 'submitted', 'archived'));

-- Ensure the default is set to 'draft'
ALTER TABLE public.forms 
ALTER COLUMN status SET DEFAULT 'draft'; 