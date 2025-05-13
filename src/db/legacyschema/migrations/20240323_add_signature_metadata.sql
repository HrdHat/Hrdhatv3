-- Migration: Add signature metadata fields
-- Date: 2024-03-23

-- Add new columns to signatures table
ALTER TABLE public.signatures
ADD COLUMN IF NOT EXISTS signature_hash text,
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Add comment to explain the columns
COMMENT ON COLUMN public.signatures.signature_hash IS 'Hash of the signature data for verification';
COMMENT ON COLUMN public.signatures.role IS 'Role of the signer (e.g., Worker, Supervisor)';
COMMENT ON COLUMN public.signatures.metadata IS 'Additional metadata stored as JSON';

-- Add index for signature hash lookups
CREATE INDEX IF NOT EXISTS idx_signatures_hash ON public.signatures(signature_hash);

-- Add constraint to ensure valid roles
ALTER TABLE public.signatures
ADD CONSTRAINT valid_signature_role 
CHECK (role IN ('Worker', 'Supervisor')); 