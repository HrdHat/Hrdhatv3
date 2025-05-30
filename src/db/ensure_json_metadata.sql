-- FINALIZED: Ensure JSON metadata and JSONB storage for new saving plan
-- Using existing schema structure with module_id UUID references
-- Compatible with PostgreSQL 13+ and Supabase

-- 0. Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Add field_definitions to existing template_modules table
ALTER TABLE template_modules 
ADD COLUMN IF NOT EXISTS field_definitions JSONB;

-- 2. Enhance existing form_data_entries table - add missing columns
ALTER TABLE form_data_entries 
ADD COLUMN IF NOT EXISTS tenant_id UUID,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_saved_by UUID;

-- 3. Add missing foreign key constraints (with proper PostgreSQL syntax)
-- Check if constraint exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_form_data_entries_form_id' 
        AND table_name = 'form_data_entries'
    ) THEN
        ALTER TABLE form_data_entries 
        ADD CONSTRAINT fk_form_data_entries_form_id 
        FOREIGN KEY (form_id) REFERENCES form_instances(id) ON UPDATE NO ACTION ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_form_data_entries_last_saved_by' 
        AND table_name = 'form_data_entries'
    ) THEN
        ALTER TABLE form_data_entries 
        ADD CONSTRAINT fk_form_data_entries_last_saved_by 
        FOREIGN KEY (last_saved_by) REFERENCES profiles(id) ON UPDATE NO ACTION ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_form_data_entries_form_id ON form_data_entries(form_id);
CREATE INDEX IF NOT EXISTS idx_form_data_entries_module_id ON form_data_entries(module_id);
CREATE INDEX IF NOT EXISTS idx_form_data_entries_tenant_id ON form_data_entries(tenant_id);
CREATE INDEX IF NOT EXISTS gin_form_data_entries_data ON form_data_entries USING gin (data);
CREATE INDEX IF NOT EXISTS idx_form_data_entries_status ON form_data_entries ((data->>'status'));

-- 5. Add history table for audit/versioning
CREATE TABLE IF NOT EXISTS form_data_entries_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL,
    data JSONB NOT NULL,
    changed_by UUID,
    change_type TEXT,
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_form_data_entries_history_entry_id FOREIGN KEY (entry_id) REFERENCES form_data_entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_form_data_entries_history_changed_by FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- 6. Add auto-update trigger for updated_at column (with column existence check)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if updated_at column exists before trying to update it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME 
        AND column_name = 'updated_at'
        AND table_schema = TG_TABLE_SCHEMA
    ) THEN
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if updated_at column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_data_entries' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS update_form_data_entries_updated_at ON form_data_entries;
        
        -- Create new trigger
        CREATE TRIGGER update_form_data_entries_updated_at 
            BEFORE UPDATE ON form_data_entries 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 7. Add indexes for history table
CREATE INDEX IF NOT EXISTS idx_form_data_entries_history_entry_id ON form_data_entries_history(entry_id);
CREATE INDEX IF NOT EXISTS idx_form_data_entries_history_created_at ON form_data_entries_history(created_at);

-- SCHEMA DECISION: Using existing module_id UUID structure
-- Your new saving plan will use: form_data_entries.module_id → template_modules.id
-- This maintains consistency with your existing schema architecture. 