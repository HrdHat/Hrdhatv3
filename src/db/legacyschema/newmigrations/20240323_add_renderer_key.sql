-- Migration: Add renderer_key to modules table
-- Date: 2024-03-23

-- Add renderer_key column
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS renderer_key text;

-- Update existing modules with appropriate renderer keys
UPDATE public.modules 
SET renderer_key = 'GenericModuleRenderer'
WHERE name IN ('header', 'general_info', 'signatures');

UPDATE public.modules 
SET renderer_key = 'TaskHazardModule'
WHERE name IN ('hazards', 'controls');

-- Make renderer_key required for future inserts
ALTER TABLE public.modules 
ALTER COLUMN renderer_key SET NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.modules.renderer_key IS 'Specifies which frontend component should render this module (e.g. TaskHazardModule, GenericModuleRenderer)'; 