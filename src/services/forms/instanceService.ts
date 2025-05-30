/**
 * Form Instance Service - New JSONB System (Phase 1)
 * ==================================================
 * 
 * This service provides high-level operations for the new JSONB-based form system.
 * It wraps database operations with business logic, validation, and error handling.
 * 
 * This replaces the old per-table saving approach with a unified JSONB system.
 */

import { 
  createFormInstance as dbCreateFormInstance,
  saveModuleData as dbSaveModuleData,
  getModuleData as dbGetModuleData,
  getFormData as dbGetFormData,
  updateFormInstance as dbUpdateFormInstance,
  deleteFormInstance as dbDeleteFormInstance
} from '../../db/formInstances';
import { getFlraModuleIds } from '../../db/templates';
import { validateModuleData } from '../forms/templateService';
import { validateField } from '../../utils/validation';
import type {
  CreateFormInstanceInput,
  CreateFormInstanceResult,
  SaveModuleDataInput,
  SaveModuleDataResult,
  FormDataEntry,
  FieldDefinition
} from '../../types/formTypes';

/**
 * Creates a new FLRA form instance with all default modules
 */
export async function createFlraForm(input: {
  userId: string;
  title?: string;
  description?: string;
  companyId?: string;
  projectId?: string;
  formDate?: string;
}): Promise<CreateFormInstanceResult> {
  
  // Validate required fields
  if (!input.userId) {
    return {
      success: false,
      error: 'User ID is required'
    };
  }

  try {
    // 🔄 NEW: Get module IDs from database instead of hardcoded array
    const templateModuleIds = await getFlraModuleIds();
    
    if (templateModuleIds.length === 0) {
      return {
        success: false,
        error: 'No FLRA template modules found in database. Please ensure the template is properly configured.'
      };
    }

    console.log(`[createFlraForm] Using ${templateModuleIds.length} modules from database`);

    const createInput: CreateFormInstanceInput = {
      ...input,
      templateModuleIds  // ✅ Now uses real UUIDs from database
    };

    const result = await dbCreateFormInstance(createInput);
    
    if (!result.success) {
      console.error('[createFlraForm] Failed to create form:', result.error);
      return result;
    }

    console.log(`[createFlraForm] Successfully created form ${result.formId} with ${Object.keys(result.entryIds || {}).length} modules`);
    
    return result;

  } catch (error) {
    console.error('[createFlraForm] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create form'
    };
  }
}

/**
 * Saves module data with validation (Enhanced Phase 2)
 */
export async function saveFormModuleData(input: {
  formId: string;
  moduleId: string;
  data: Record<string, unknown>;
  userId?: string;
  validateData?: boolean;
  fieldDefinitions?: FieldDefinition[]; // 🔄 NEW: Field schemas for enhanced validation
}): Promise<SaveModuleDataResult> {
  
  // Validate required fields
  if (!input.formId || !input.moduleId) {
    return {
      success: false,
      error: 'Form ID and Module ID are required'
    };
  }

  if (!input.data || Object.keys(input.data).length === 0) {
    return {
      success: false,
      error: 'Data is required'
    };
  }

  // Enhanced validation
  let validationErrors: Array<{field: string; message: string}> = [];
  
  if (input.validateData !== false) {
    if (input.fieldDefinitions && input.fieldDefinitions.length > 0) {
      // 🔄 NEW: Use schema-based validation when field definitions are available
      const validation = validateModuleData(input.data, input.fieldDefinitions);
      if (!validation.isValid) {
        validationErrors = validation.errors;
      }
    } else {
      // Fallback to basic field validation
      for (const [key, value] of Object.entries(input.data)) {
        try {
          const fieldType = typeof value === 'boolean' ? 'boolean' : 
                           typeof value === 'number' ? 'number' : 'string';
          
          const isValid = validateField(fieldType, value, false);
          if (!isValid) {
            validationErrors.push({
              field: key,
              message: `Invalid ${fieldType} value`
            });
          }
        } catch (error) {
          console.warn(`[saveFormModuleData] Validation error for field ${key}:`, error);
        }
      }
    }
  }

  // Return early if validation failed
  if (validationErrors.length > 0) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors
    };
  }

  // Save to database
  const saveInput: SaveModuleDataInput = {
    formId: input.formId,
    moduleId: input.moduleId,
    data: input.data,
    userId: input.userId,
    version: 1
  };

  try {
    const result = await dbSaveModuleData(saveInput);
    
    if (result.success) {
      console.log(`[saveFormModuleData] Successfully saved data for module ${input.moduleId} in form ${input.formId}`);
    }
    
    return result;

  } catch (error) {
    console.error('[saveFormModuleData] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save module data'
    };
  }
}

/**
 * Retrieves module data for a specific form and module
 */
export async function getFormModuleData(
  formId: string,
  moduleId: string
): Promise<Record<string, unknown> | null> {
  
  if (!formId || !moduleId) {
    console.error('[getFormModuleData] Form ID and Module ID are required');
    return null;
  }

  try {
    const entry = await dbGetModuleData(formId, moduleId);
    return entry?.data || null;

  } catch (error) {
    console.error('[getFormModuleData] Error retrieving module data:', error);
    return null;
  }
}

/**
 * Retrieves all module data for a form
 */
export async function getAllFormData(formId: string): Promise<Record<string, Record<string, unknown>>> {
  
  if (!formId) {
    console.error('[getAllFormData] Form ID is required');
    return {};
  }

  try {
    const entries = await dbGetFormData(formId);
    
    // Convert array to module ID -> data mapping
    const moduleData: Record<string, Record<string, unknown>> = {};
    entries.forEach(entry => {
      moduleData[entry.module_id] = entry.data;
    });
    
    return moduleData;

  } catch (error) {
    console.error('[getAllFormData] Error retrieving form data:', error);
    return {};
  }
}

/**
 * Updates form metadata (title, description, status, etc.)
 */
export async function updateFormMetadata(
  formId: string,
  updates: {
    title?: string;
    description?: string;
    status?: 'draft' | 'submitted' | 'archived';
    formDate?: string;
  }
): Promise<boolean> {
  
  if (!formId) {
    console.error('[updateFormMetadata] Form ID is required');
    return false;
  }

  try {
    // Convert status and add submitted_at if submitting
    const dbUpdates: any = {};
    
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.formDate !== undefined) dbUpdates.form_date = updates.formDate;
    if (updates.status !== undefined) {
      dbUpdates.status = updates.status;
      if (updates.status === 'submitted') {
        dbUpdates.submitted_at = new Date().toISOString();
      }
    }

    const success = await dbUpdateFormInstance(formId, dbUpdates);
    
    if (success) {
      console.log(`[updateFormMetadata] Successfully updated form ${formId}`);
    }
    
    return success;

  } catch (error) {
    console.error('[updateFormMetadata] Error updating form metadata:', error);
    return false;
  }
}

/**
 * Deletes a form instance and all associated data
 */
export async function deleteForm(formId: string): Promise<boolean> {
  
  if (!formId) {
    console.error('[deleteForm] Form ID is required');
    return false;
  }

  try {
    const success = await dbDeleteFormInstance(formId);
    
    if (success) {
      console.log(`[deleteForm] Successfully deleted form ${formId}`);
    }
    
    return success;

  } catch (error) {
    console.error('[deleteForm] Error deleting form:', error);
    return false;
  }
}

/**
 * Submits a form by updating its status and submission timestamp
 */
export async function submitForm(formId: string): Promise<boolean> {
  return updateFormMetadata(formId, { status: 'submitted' });
}

/**
 * Archives a form by updating its status
 */
export async function archiveForm(formId: string): Promise<boolean> {
  return updateFormMetadata(formId, { status: 'archived' });
}