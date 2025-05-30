/**
 * Database operations for the new JSONB-based form saving system
 * Phase 1: Form Instance Creation and Module Data Saving
 * 
 * This replaces the old per-table saving approach with a unified JSONB system
 * using the form_data_entries table.
 */

import { supabase } from './supabaseClient';
import type { 
  FormDataEntry, 
  CreateFormInstanceInput, 
  CreateFormInstanceResult,
  SaveModuleDataInput,
  SaveModuleDataResult
} from '../types/formTypes';

/**
 * Generate a unique form number (reusing existing logic)
 */
async function generateFormNumber(): Promise<string> {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `FLRA-${ymd}-${random}`;
}

/**
 * Creates a new form instance with default modules
 * Returns the form ID and entry IDs for each module
 */
export async function createFormInstance(
  input: CreateFormInstanceInput
): Promise<CreateFormInstanceResult> {
  try {
    // 1. Generate form number
    const formNumber = await generateFormNumber();
    
    // 2. Create the form_instances record
    const { data: formInstance, error: formError } = await supabase
      .from('form_instances')
      .insert({
        user_id: input.userId,
        created_by: input.userId,
        title: input.title || null,
        description: input.description || null,
        company_id: input.companyId || null,
        project_id: input.projectId || null,
        form_date: input.formDate || null,
        form_number: formNumber,
        status: 'draft',
        version: 1,
        auto_archived: false
      })
      .select('id')
      .single();

    if (formError) {
      console.error('[createFormInstance] Error creating form:', formError);
      return {
        success: false,
        error: `Failed to create form: ${formError.message}`
      };
    }

    const formId = formInstance.id;

    // 3. Create form_instance_modules records
    const moduleInserts = input.templateModuleIds.map((moduleId, index) => ({
      form_id: formId,
      module_id: moduleId,
      module_order: index + 1,
      is_required: true,
      completion_state: 'not_started'
    }));

    const { error: moduleError } = await supabase
      .from('form_instance_modules')
      .insert(moduleInserts);

    if (moduleError) {
      console.error('[createFormInstance] Error creating modules:', moduleError);
      // Don't fail completely - modules can be created later
    }

    // 4. Create initial form_data_entries for each module
    const entryInserts = input.templateModuleIds.map(moduleId => ({
      form_id: formId,
      module_id: moduleId,
      data: {}, // Start with empty data
      tenant_id: input.companyId || null,
      version: 1,
      last_saved_by: input.userId
    }));

    const { data: entries, error: entriesError } = await supabase
      .from('form_data_entries')
      .insert(entryInserts)
      .select('id, module_id');

    if (entriesError) {
      console.error('[createFormInstance] Error creating data entries:', entriesError);
      return {
        success: false,
        error: `Failed to create form data entries: ${entriesError.message}`
      };
    }

    // 5. Build entry ID mapping
    const entryIds: Record<string, string> = {};
    entries?.forEach(entry => {
      entryIds[entry.module_id] = entry.id;
    });

    return {
      success: true,
      formId,
      entryIds
    };

  } catch (error) {
    console.error('[createFormInstance] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Saves module data to the form_data_entries table
 * Uses upsert to handle both new and updated data
 */
export async function saveModuleData(
  input: SaveModuleDataInput
): Promise<SaveModuleDataResult> {
  try {
    // Basic validation
    if (!input.formId || !input.moduleId || !input.data) {
      return {
        success: false,
        error: 'Missing required fields: formId, moduleId, or data'
      };
    }

    // Upsert to form_data_entries
    const { data, error } = await supabase
      .from('form_data_entries')
      .upsert({
        form_id: input.formId,
        module_id: input.moduleId,
        data: input.data,
        version: input.version || 1,
        last_saved_by: input.userId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'form_id,module_id',
        ignoreDuplicates: false
      })
      .select('id')
      .single();

    if (error) {
      console.error('[saveModuleData] Error saving data:', error);
      return {
        success: false,
        error: `Failed to save module data: ${error.message}`
      };
    }

    return {
      success: true,
      entryId: data.id
    };

  } catch (error) {
    console.error('[saveModuleData] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Retrieves module data from form_data_entries
 */
export async function getModuleData(
  formId: string,
  moduleId: string
): Promise<FormDataEntry | null> {
  try {
    const { data, error } = await supabase
      .from('form_data_entries')
      .select('*')
      .eq('form_id', formId)
      .eq('module_id', moduleId)
      .single();

    if (error) {
      console.error('[getModuleData] Error fetching data:', error);
      return null;
    }

    return data;

  } catch (error) {
    console.error('[getModuleData] Unexpected error:', error);
    return null;
  }
}

/**
 * Gets all module data for a form
 */
export async function getFormData(formId: string): Promise<FormDataEntry[]> {
  try {
    const { data, error } = await supabase
      .from('form_data_entries')
      .select('*')
      .eq('form_id', formId)
      .order('created_at');

    if (error) {
      console.error('[getFormData] Error fetching data:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('[getFormData] Unexpected error:', error);
    return [];
  }
}

/**
 * Deletes a form instance and all associated data
 */
export async function deleteFormInstance(formId: string): Promise<boolean> {
  try {
    // Delete form_data_entries (CASCADE will handle this automatically)
    const { error } = await supabase
      .from('form_instances')
      .delete()
      .eq('id', formId);

    if (error) {
      console.error('[deleteFormInstance] Error deleting form:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('[deleteFormInstance] Unexpected error:', error);
    return false;
  }
}

/**
 * Updates form instance metadata (title, description, status, etc.)
 */
export async function updateFormInstance(
  formId: string,
  updates: Partial<{
    title: string;
    description: string;
    status: string;
    form_date: string;
    submitted_at: string;
  }>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('form_instances')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', formId);

    if (error) {
      console.error('[updateFormInstance] Error updating form:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('[updateFormInstance] Unexpected error:', error);
    return false;
  }
} 