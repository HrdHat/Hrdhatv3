-- Add completion_state column to form_modules table
ALTER TABLE public.form_modules
ADD COLUMN completion_state text NOT NULL DEFAULT 'not_started';

-- Add constraint to ensure valid completion states
ALTER TABLE public.form_modules
ADD CONSTRAINT valid_completion_state 
CHECK (completion_state IN ('not_started', 'in_progress', 'completed', 'skipped'));

-- Add index for performance on completion_state
CREATE INDEX idx_form_modules_completion_state 
ON public.form_modules(completion_state);

-- Add comment to the column
COMMENT ON COLUMN public.form_modules.completion_state IS 'Tracks the completion status of a form module: not_started, in_progress, completed, or skipped'; 