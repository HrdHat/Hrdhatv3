/**
 * Template Service - Phase 2 Enhanced Validation
 * ==============================================
 * 
 * Provides business logic for template loading, caching, and enhanced field validation.
 * Replaces basic field validation with schema-based validation using database definitions.
 */

import { getFlraTemplate, getTemplateModules, getModuleFieldDefinitions, getTemplateCacheKey } from '../../db/templates';
import type { ModuleDef, FieldDefinition, TemplateLoadResult, FieldValidationResult } from '../../types/formTypes';

/**
 * Load FLRA template with caching
 * Uses sessionStorage to cache templates since they rarely change
 */
export async function loadFlraTemplate(): Promise<TemplateLoadResult> {
  try {
    // Check cache first
    const cacheKey = getTemplateCacheKey('flra');
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const modules = JSON.parse(cached);
        console.log('[loadFlraTemplate] Loaded from cache');
        return { success: true, modules };
      } catch (error) {
        console.warn('[loadFlraTemplate] Cache parse error, loading fresh:', error);
        sessionStorage.removeItem(cacheKey);
      }
    }
    
    // Load from database
    console.log('[loadFlraTemplate] Loading from database');
    const modules = await getFlraTemplate();
    
    if (modules.length === 0) {
      return {
        success: false,
        error: 'No FLRA template modules found in database'
      };
    }
    
    // Cache for session
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(modules));
    } catch (error) {
      console.warn('[loadFlraTemplate] Failed to cache template:', error);
      // Continue without caching
    }
    
    console.log(`[loadFlraTemplate] Loaded ${modules.length} modules from database`);
    return { success: true, modules };
    
  } catch (error) {
    console.error('[loadFlraTemplate] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load template'
    };
  }
}

/**
 * Enhanced field validation using schema definitions
 * Replaces the basic validateField() function with schema-aware validation
 */
export function validateFieldAgainstSchema(
  value: unknown,
  fieldDef: FieldDefinition
): FieldValidationResult {
  
  // Required check
  if (fieldDef.required && (value === null || value === undefined || value === '')) {
    return { isValid: false, error: `${fieldDef.label} is required` };
  }
  
  // Skip validation for empty optional fields
  if (!fieldDef.required && (value === null || value === undefined || value === '')) {
    return { isValid: true };
  }
  
  // Type validation
  switch (fieldDef.type) {
    case 'text':
    case 'textarea':
      if (typeof value !== 'string') {
        return { isValid: false, error: `${fieldDef.label} must be text` };
      }
      break;
      
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { isValid: false, error: `${fieldDef.label} must be true or false` };
      }
      break;
      
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return { isValid: false, error: `${fieldDef.label} must be a number` };
      }
      break;
      
    case 'date':
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (typeof value !== 'string' || !dateRegex.test(value)) {
        return { isValid: false, error: `${fieldDef.label} must be a valid date (YYYY-MM-DD)` };
      }
      break;
      
    case 'time':
      const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
      if (typeof value !== 'string' || !timeRegex.test(value)) {
        return { isValid: false, error: `${fieldDef.label} must be a valid time (HH:MM)` };
      }
      break;
      
    default:
      // For other types (select, multiselect, file, signature), accept any non-empty value
      break;
  }
  
  return { isValid: true };
}

/**
 * Validate an entire data object against field definitions
 */
export function validateModuleData(
  data: Record<string, unknown>,
  fieldDefinitions: FieldDefinition[]
): {
  isValid: boolean;
  errors: Array<{field: string; message: string}>;
} {
  const errors: Array<{field: string; message: string}> = [];
  
  for (const [fieldName, value] of Object.entries(data)) {
    const fieldDef = fieldDefinitions.find(field => field.name === fieldName);
    
    if (fieldDef) {
      const result = validateFieldAgainstSchema(value, fieldDef);
      if (!result.isValid) {
        errors.push({
          field: fieldName,
          message: result.error || 'Invalid value'
        });
      }
    }
    // Note: We don't validate fields that aren't in the schema - 
    // this allows for flexibility with additional data
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Clear template cache (useful for development or when templates are updated)
 */
export function clearTemplateCache(): void {
  try {
    const cacheKey = getTemplateCacheKey('flra');
    sessionStorage.removeItem(cacheKey);
    console.log('[clearTemplateCache] Template cache cleared');
  } catch (error) {
    console.warn('[clearTemplateCache] Failed to clear cache:', error);
  }
}

/**
 * Get default values for a module based on field definitions
 */
export function getModuleDefaultValues(fieldDefinitions: FieldDefinition[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  
  for (const field of fieldDefinitions) {
    if (field.defaultValue !== undefined) {
      // Parse default value based on field type
      switch (field.type) {
        case 'boolean':
          defaults[field.name] = field.defaultValue === 'true';
          break;
        case 'number':
          defaults[field.name] = parseFloat(field.defaultValue);
          break;
        default:
          defaults[field.name] = field.defaultValue;
      }
    }
  }
  
  return defaults;
}

/**
 * Get field definition by name from a module
 */
export function getFieldDefinition(
  fieldName: string, 
  fieldDefinitions: FieldDefinition[]
): FieldDefinition | undefined {
  return fieldDefinitions.find(field => field.name === fieldName);
} 