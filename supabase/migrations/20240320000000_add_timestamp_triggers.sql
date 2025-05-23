-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set updated_at on update
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  -- Set created_at only on insert
  IF TG_OP = 'INSERT' THEN
    NEW.created_at = CURRENT_TIMESTAMP;
    NEW.updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all form-related tables
CREATE TRIGGER set_timestamps_form_instances
  BEFORE INSERT OR UPDATE ON form_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER set_timestamps_form_instance_general_info
  BEFORE INSERT OR UPDATE ON form_instance_general_info
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER set_timestamps_form_instance_pre_job_checklist
  BEFORE INSERT OR UPDATE ON form_instance_pre_job_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER set_timestamps_form_instance_ppe_platform
  BEFORE INSERT OR UPDATE ON form_instance_ppe_platform
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER set_timestamps_form_instance_hazards
  BEFORE INSERT OR UPDATE ON form_instance_hazards
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER set_timestamps_form_asset_photos
  BEFORE INSERT OR UPDATE ON form_asset_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER set_timestamps_form_instance_signatures
  BEFORE INSERT OR UPDATE ON form_instance_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamps(); 