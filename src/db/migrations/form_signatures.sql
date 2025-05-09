-- Table: form_signatures
CREATE TABLE IF NOT EXISTS form_signatures (
  form_id uuid NOT NULL,
  signed_by uuid NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  storage_path text NOT NULL,
  public_url text NOT NULL,
  name text NOT NULL,
  PRIMARY KEY (form_id, signed_by)
);

-- Enable Row Level Security
ALTER TABLE form_signatures ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow signed_by to insert/select/update their own signature, scoped to 'authenticated' role
CREATE POLICY "Allow self-manage signature" ON form_signatures
  FOR ALL
  TO authenticated
  USING (signed_by = auth.uid())
  WITH CHECK (signed_by = auth.uid());

-- No deletes allowed (enforced by not granting DELETE privilege)
REVOKE DELETE ON form_signatures FROM PUBLIC; 