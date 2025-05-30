/**
 * Template and Module Database Operations - Phase 2
 * =================================================
 * 
 * This file provides database operations for loading form templates and module definitions.
 * It replaces hardcoded module IDs with dynamic database lookups.
 */

import { supabase } from './supabaseClient';
import type { ModuleDef, FieldDefinition, TemplateLoadResult } from '../types/formTypes';

// FLRA Template UUID (from schema2.sql)
const FLRA_TEMPLATE_ID = '3f7556b4-0f72-4cd6-894f-c7fdb3b10a7b';

/**
 * Get FLRA template module IDs from database
 * Replaces hardcoded DEFAULT_FLRA_MODULE_IDS in instanceService.ts
 */
export async function getFlraModuleIds(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('form_template_modules')
      .select(`
        template_module_id,
        module_order
      `)
      .eq('form_list_id', FLRA_TEMPLATE_ID)
      .order('module_order');
      
    if (error) {
      console.error('[getFlraModuleIds] Database error:', error);
      throw new Error(`Failed to load FLRA module IDs: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('[getFlraModuleIds] No FLRA modules found in database');
      // Return empty array rather than fail - let calling code handle it
      return [];
    }

    const moduleIds = data
      .filter(item => item.template_module_id) // Filter out null values
      .map(item => item.template_module_id);

    console.log(`[getFlraModuleIds] Loaded ${moduleIds.length} FLRA module IDs`);
    return moduleIds;

  } catch (error) {
    console.error('[getFlraModuleIds] Unexpected error:', error);
    throw error;
  }
}

/**
 * Get template modules with field definitions
 */
export async function getTemplateModules(moduleIds: string[]): Promise<ModuleDef[]> {
  try {
    if (!moduleIds || moduleIds.length === 0) {
      console.warn('[getTemplateModules] No module IDs provided');
      return [];
    }

    const { data, error } = await supabase
      .from('template_modules')
      .select(`
        id,
        name,
        label,
        renderer_key,
        uses_fields,
        layout_style,
        template_module_fields (
          id,
          name,
          label,
          type,
          required,
          field_order,
          default_value
        )
      `)
      .in('id', moduleIds);
      
    if (error) {
      console.error('[getTemplateModules] Database error:', error);
      throw new Error(`Failed to load template modules: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Transform database results to ModuleDef interface
    const modules: ModuleDef[] = data.map((module, index) => ({
      id: module.id,
      name: module.name,
      label: module.label || module.name,
      rendererKey: module.renderer_key || 'GenericModuleRenderer',
      usesFields: module.uses_fields || false,
      layoutStyle: module.layout_style || 'default',
      fieldDefinitions: (module.template_module_fields || []).map((field: any) => ({
        id: field.id,
        moduleId: module.id,
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required || false,
        fieldOrder: field.field_order || 0,
        defaultValue: field.default_value || undefined
      })),
      moduleOrder: index, // Will be set correctly when used with getFlraModuleIds
      isRequired: true // Default - will be overridden by form_template_modules data
    }));

    console.log(`[getTemplateModules] Loaded ${modules.length} template modules`);
    return modules;

  } catch (error) {
    console.error('[getTemplateModules] Unexpected error:', error);
    throw error;
  }
}

/**
 * Get complete FLRA template with modules and field definitions
 */
export async function getFlraTemplate(): Promise<ModuleDef[]> {
  try {
    // Get the ordered module IDs for FLRA
    const moduleIds = await getFlraModuleIds();
    
    if (moduleIds.length === 0) {
      console.warn('[getFlraTemplate] No FLRA modules found');
      return [];
    }

    // Get the module definitions with field schemas
    const modules = await getTemplateModules(moduleIds);

    // Sort modules by the order from form_template_modules
    const sortedModules = modules.sort((a, b) => {
      const aIndex = moduleIds.indexOf(a.id);
      const bIndex = moduleIds.indexOf(b.id);
      return aIndex - bIndex;
    });

    // Set correct module order and return
    return sortedModules.map((module, index) => ({
      ...module,
      moduleOrder: index + 1
    }));

  } catch (error) {
    console.error('[getFlraTemplate] Failed to load FLRA template:', error);
    throw error;
  }
}

/**
 * Get field definitions for a specific module
 */
export async function getModuleFieldDefinitions(moduleId: string): Promise<FieldDefinition[]> {
  try {
    const { data, error } = await supabase
      .from('template_module_fields')
      .select(`
        id,
        module_id,
        name,
        label,
        type,
        required,
        field_order,
        default_value
      `)
      .eq('module_id', moduleId)
      .order('field_order');

    if (error) {
      console.error('[getModuleFieldDefinitions] Database error:', error);
      throw new Error(`Failed to load field definitions: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(field => ({
      id: field.id,
      moduleId: field.module_id,
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required || false,
      fieldOrder: field.field_order || 0,
      defaultValue: field.default_value || undefined
    }));

  } catch (error) {
    console.error('[getModuleFieldDefinitions] Unexpected error:', error);
    throw error;
  }
}

/**
 * Cache key for template data
 */
export function getTemplateCacheKey(templateId: string = 'flra'): string {
  return `template-${templateId}-v1`;
} 