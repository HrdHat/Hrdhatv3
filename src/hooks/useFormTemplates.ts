/**
 * Form Templates Hook - Phase 2
 * ============================
 * 
 * React hook for managing form template state with loading, caching, and error handling.
 * Provides a clean interface for components to access template data.
 */

import { useState, useEffect } from 'react';
import { loadFlraTemplate } from '../services/forms/templateService';
import type { ModuleDef, FieldDefinition } from '../types/formTypes';

interface UseFormTemplatesReturn {
  modules: ModuleDef[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getModuleById: (moduleId: string) => ModuleDef | undefined;
  getFieldDefinitions: (moduleId: string) => FieldDefinition[];
  getModuleByName: (moduleName: string) => ModuleDef | undefined;
}

/**
 * Hook for accessing FLRA form template data
 * Handles loading, caching, and provides utility functions for template access
 */
export function useFormTemplates(): UseFormTemplatesReturn {
  const [modules, setModules] = useState<ModuleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load template data
  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await loadFlraTemplate();
      
      if (result.success && result.modules) {
        setModules(result.modules);
        console.log(`[useFormTemplates] Loaded ${result.modules.length} template modules`);
      } else {
        const errorMessage = result.error || 'Failed to load template';
        setError(errorMessage);
        console.error('[useFormTemplates]', errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[useFormTemplates] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load template on mount
  useEffect(() => {
    loadTemplate();
  }, []);

  // Utility function: Get module by ID
  const getModuleById = (moduleId: string): ModuleDef | undefined => {
    return modules.find(module => module.id === moduleId);
  };

  // Utility function: Get field definitions for a module
  const getFieldDefinitions = (moduleId: string): FieldDefinition[] => {
    const module = getModuleById(moduleId);
    return module?.fieldDefinitions || [];
  };

  // Utility function: Get module by name
  const getModuleByName = (moduleName: string): ModuleDef | undefined => {
    return modules.find(module => module.name === moduleName);
  };

  // Refetch function for manual refresh
  const refetch = async (): Promise<void> => {
    await loadTemplate();
  };

  return {
    modules,
    loading,
    error,
    refetch,
    getModuleById,
    getFieldDefinitions,
    getModuleByName
  };
}

/**
 * Hook specifically for getting field definitions of a module
 * Useful when you only need field information for a specific module
 */
export function useModuleFields(moduleId: string): {
  fieldDefinitions: FieldDefinition[];
  loading: boolean;
  error: string | null;
} {
  const { modules, loading, error, getFieldDefinitions } = useFormTemplates();
  
  return {
    fieldDefinitions: moduleId ? getFieldDefinitions(moduleId) : [],
    loading,
    error
  };
}

/**
 * Hook for getting a specific module by ID
 * Returns the module definition and loading state
 */
export function useModule(moduleId: string): {
  module: ModuleDef | undefined;
  loading: boolean;
  error: string | null;
} {
  const { modules, loading, error, getModuleById } = useFormTemplates();
  
  return {
    module: moduleId ? getModuleById(moduleId) : undefined,
    loading,
    error
  };
} 