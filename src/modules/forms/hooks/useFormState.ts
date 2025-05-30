import { useState, useCallback, useMemo, useEffect } from 'react';
import { useFormData } from '../../../hooks/useFormData';
import { useFormTemplates } from '../../../hooks/useFormTemplates';
import { validateFieldAgainstSchema } from '../../../services/forms/templateService';
import { saveFormModuleData, getFormModuleData } from '../../../services/forms/instanceService';
import { 
  ValidationResult, 
  FieldValidationResult,
  FormProgress,
  ModuleProgress,
  SaveOperation,
} from '../../../types/formStateTypes';
import { ModuleDef, FieldDefinition, SaveModuleDataResult } from '../../../types/formTypes';
import { FormDataConfig } from '../../../hooks/useFormData';

// Core form data configuration (only properties that exist in FormDataConfig)
const CORE_FORM_DATA_CONFIG: Partial<FormDataConfig> = {
  enableOptimisticUpdates: true,
  conflictResolutionStrategy: 'manual',
  stateHistoryLimit: 10,
  performanceTracking: false,
  persistState: true,
};

// FLRA-specific configuration for features not in FormDataConfig
interface FlraSpecificConfig {
  enableAutoSave: boolean;
  autoSaveDelay: number;
  enableStateValidation: boolean;
  validateOnChange: boolean;
}

const DEFAULT_FLRA_CONFIG: FlraSpecificConfig = {
  enableAutoSave: true,
  autoSaveDelay: 3000, // 3 seconds for FLRA forms
  enableStateValidation: true,
  validateOnChange: true,
};

export interface FlraFormStateOptions {
  enableAutoSave?: boolean;
  autoSaveDelay?: number;
  validateOnChange?: boolean;
  loadInitialData?: boolean;
  enableStateValidation?: boolean;
  config?: Partial<FormDataConfig>;
}

export interface SaveResult {
  success: boolean;
  moduleId: string;
  entryId?: string;
  error?: string;
  validationErrors?: Array<{ field: string; message: string }>;
}

export function useFlraFormState(
  formId: string, 
  options: FlraFormStateOptions = {}
) {
  const {
    enableAutoSave = DEFAULT_FLRA_CONFIG.enableAutoSave,
    autoSaveDelay = DEFAULT_FLRA_CONFIG.autoSaveDelay,
    validateOnChange = DEFAULT_FLRA_CONFIG.validateOnChange,
    enableStateValidation = DEFAULT_FLRA_CONFIG.enableStateValidation,
    loadInitialData = true,
    config = {},
  } = options;

  // Combine core form data configuration
  const formDataConfig = useMemo(() => ({
    ...CORE_FORM_DATA_CONFIG,
    ...config,
  }), [config]);

  // FLRA-specific configuration
  const flraConfig = useMemo(() => ({
    enableAutoSave,
    autoSaveDelay,
    enableStateValidation,
    validateOnChange,
  }), [enableAutoSave, autoSaveDelay, enableStateValidation, validateOnChange]);

  // Phase 2: Template loading from existing system
  const { modules, loading: templatesLoading, error: templatesError, getFieldDefinitions } = useFormTemplates();

  // Phase 3: Core form data management
  const formData = useFormData(formId, formDataConfig);

  // Local state for save operations tracking
  const [saveOperations, setSaveOperations] = useState<Record<string, SaveOperation>>({});
  const [lastValidation, setLastValidation] = useState<Record<string, ValidationResult>>({});

  // Load initial form data when templates are ready
  useEffect(() => {
    if (!loadInitialData || templatesLoading || !modules.length) return;

    const loadFormData = async () => {
      try {
        for (const module of modules) {
          try {
            const moduleData = await getFormModuleData(formId, module.id);
            if (moduleData && Object.keys(moduleData).length > 0) {
              formData.actions.updateModuleData(module.id, moduleData, { skipDirty: true });
              // Note: version handling would need to be added to getFormModuleData return type
            }
          } catch (error) {
            console.warn(`Failed to load data for module ${module.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Failed to load initial form data:', error);
      }
    };

    loadFormData();
  }, [formId, modules, templatesLoading, loadInitialData, formData.actions]);

  // Enhanced field update with template-aware validation
  const updateField = useCallback(async (
    moduleId: string, 
    fieldName: string, 
    value: unknown,
    options: { validate?: boolean; optimistic?: boolean } = {}
  ) => {
    const { validate = flraConfig.validateOnChange, optimistic = formDataConfig.enableOptimisticUpdates } = options;

    // Update the field data
    const currentData = formData.selectors.getModuleData(moduleId);
    const updatedData = { ...currentData, [fieldName]: value };
    
    formData.actions.updateModuleData(moduleId, { [fieldName]: value }, { optimistic });

    // Perform field-level validation if enabled
    if (validate) {
      const fieldDefinitions = await getFieldDefinitions(moduleId);
      const fieldDef = fieldDefinitions?.find(f => f.name === fieldName);
      
      if (fieldDef) {
        try {
          const validationResult = validateFieldAgainstSchema(value, fieldDef);
          
          if (!validationResult.isValid && validationResult.error) {
            formData.actions.setErrors(moduleId, [validationResult.error]);
          } else {
            formData.actions.clearErrors(moduleId);
          }
        } catch (error) {
          console.warn(`Validation failed for field ${fieldName}:`, error);
        }
      }
    }
  }, [flraConfig.validateOnChange, formDataConfig.enableOptimisticUpdates, formData.actions, formData.selectors, getFieldDefinitions]);

  // Module-level validation using Phase 2 field definitions
  const validateModule = useCallback(async (moduleId: string): Promise<ValidationResult> => {
    const moduleData = formData.selectors.getModuleData(moduleId);
    const fieldDefinitions = await getFieldDefinitions(moduleId);
    
    if (!fieldDefinitions) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        validatedAt: new Date(),
        moduleId,
      };
    }

    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    // Validate each field against its definition
    for (const fieldDef of fieldDefinitions) {
      const value = moduleData[fieldDef.name];
      
      try {
        const fieldValidation = validateFieldAgainstSchema(value, fieldDef);
        
        if (!fieldValidation.isValid && fieldValidation.error) {
          errors.push({
            field: fieldDef.name,
            message: fieldValidation.error,
            severity: 'error',
          });
        }
      } catch (error) {
        console.warn(`Validation failed for field ${fieldDef.name}:`, error);
        errors.push({
          field: fieldDef.name,
          message: 'Validation error occurred',
          severity: 'error',
        });
      }
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date(),
      moduleId,
    };

    setLastValidation(prev => ({ ...prev, [moduleId]: result }));

    // Update form data errors
    if (errors.length > 0) {
      formData.actions.setErrors(moduleId, errors.map(e => e.message));
    } else {
      formData.actions.clearErrors(moduleId);
    }

    return result;
  }, [formData.selectors, formData.actions, getFieldDefinitions]);

  // Enhanced save with validation and conflict detection
  const saveModule = useCallback(async (moduleId: string): Promise<SaveResult> => {
    const moduleData = formData.selectors.getModuleData(moduleId);
    const currentVersion = formData.state.versions[moduleId] || 1;

    // Create save operation tracking
    const operationId = `${moduleId}_${Date.now()}`;
    const saveOperation: SaveOperation = {
      id: operationId,
      moduleId,
      status: 'pending',
      startedAt: new Date(),
      optimistic: formDataConfig.enableOptimisticUpdates || false,
    };

    setSaveOperations(prev => ({ ...prev, [operationId]: saveOperation }));
    formData.actions.markSaving(moduleId, true);

    try {
      // Validate before saving if validation is enabled
      if (flraConfig.enableStateValidation) {
        const validation = await validateModule(moduleId);
        if (!validation.isValid) {
          const result: SaveResult = {
            success: false,
            moduleId,
            error: 'Validation failed',
            validationErrors: validation.errors.map(e => ({ field: e.field, message: e.message })),
          };

          // Update save operation
          setSaveOperations(prev => ({
            ...prev,
            [operationId]: {
              ...prev[operationId],
              status: 'failed',
              completedAt: new Date(),
              error: {
                code: 'VALIDATION_FAILED',
                message: 'Module validation failed',
                retryable: true,
                timestamp: new Date(),
              },
            },
          }));

          formData.actions.markSaving(moduleId, false);
          return result;
        }
      }

      // Attempt to save (using current Phase 1/2 API signature)
      const saveResult: SaveModuleDataResult = await saveFormModuleData({
        formId,
        moduleId,
        data: moduleData,
        validateData: flraConfig.enableStateValidation,
        fieldDefinitions: await getFieldDefinitions(moduleId),
      });

      if (saveResult.success) {
        // Mark as saved
        formData.actions.markClean(moduleId);
        formData.actions.markSaving(moduleId, false);
        
        // Note: Version management would need to be added to the save result in future phases

        // Update save operation
        setSaveOperations(prev => ({
          ...prev,
          [operationId]: {
            ...prev[operationId],
            status: 'success',
            completedAt: new Date(),
            duration: Date.now() - prev[operationId].startedAt.getTime(),
          },
        }));

        return {
          success: true,
          moduleId,
          entryId: saveResult.entryId,
        };
      } else {
        // Handle save failure
        formData.actions.markSaving(moduleId, false);
        
        if (saveResult.error) {
          formData.actions.setErrors(moduleId, [saveResult.error]);
        }

        // Note: Conflict detection would be added in future phases

        // Update save operation
        setSaveOperations(prev => ({
          ...prev,
          [operationId]: {
            ...prev[operationId],
            status: 'failed',
            completedAt: new Date(),
            error: {
              code: 'SAVE_FAILED',
              message: saveResult.error || 'Save operation failed',
              retryable: true,
              timestamp: new Date(),
            },
          },
        }));

        return {
          success: false,
          moduleId,
          error: saveResult.error,
          validationErrors: saveResult.validationErrors,
        };
      }
    } catch (error) {
      // Handle unexpected errors
      formData.actions.markSaving(moduleId, false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      formData.actions.setErrors(moduleId, [errorMessage]);

      // Update save operation
      setSaveOperations(prev => ({
        ...prev,
        [operationId]: {
          ...prev[operationId],
          status: 'failed',
          completedAt: new Date(),
          error: {
            code: 'UNEXPECTED_ERROR',
            message: errorMessage,
            retryable: true,
            timestamp: new Date(),
          },
        },
      }));

      return {
        success: false,
        moduleId,
        error: errorMessage,
      };
    }
  }, [formId, formData, formDataConfig.enableOptimisticUpdates, flraConfig.enableStateValidation, validateModule, getFieldDefinitions]);

  // Load form data manually
  const loadFormData = useCallback(async () => {
    if (!modules.length) return;

    try {
      for (const module of modules) {
        const moduleData = await getFormModuleData(formId, module.id);
        if (moduleData && Object.keys(moduleData).length > 0) {
          formData.actions.updateModuleData(module.id, moduleData, { skipDirty: true });
        }
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  }, [formId, modules, formData.actions]);

  // Reset module to template defaults
  const resetModule = useCallback(async (moduleId: string) => {
    const fieldDefinitions = await getFieldDefinitions(moduleId);
    
    if (fieldDefinitions) {
      // Create default data from field definitions
      const defaultData = fieldDefinitions.reduce((acc, field) => {
        if (field.defaultValue !== undefined) {
          acc[field.name] = field.defaultValue;
        }
        return acc;
      }, {} as Record<string, unknown>);

      formData.actions.updateModuleData(moduleId, defaultData, { skipDirty: true });
    } else {
      formData.actions.resetModule(moduleId);
    }
  }, [formData.actions, getFieldDefinitions]);

  // Enhanced selectors with template awareness
  const getFieldValue = useCallback((moduleId: string, fieldName: string): unknown => {
    const moduleData = formData.selectors.getModuleData(moduleId);
    return moduleData[fieldName];
  }, [formData.selectors]);

  const getModuleValidation = useCallback((moduleId: string): ValidationResult | null => {
    return lastValidation[moduleId] || null;
  }, [lastValidation]);

  const getFormProgress = useCallback((): FormProgress => {
    const moduleProgress: Record<string, ModuleProgress> = {};
    let totalRequired = 0;
    let completedRequired = 0;
    let totalOptional = 0;
    let completedOptional = 0;
    let validationErrors = 0;
    let validationWarnings = 0;

    modules.forEach(module => {
      const moduleData = formData.selectors.getModuleData(module.id);
      const validation = lastValidation[module.id];
      const hasErrors = formData.selectors.getModuleErrors(module.id).length > 0;
      const isDirty = formData.selectors.isModuleDirty(module.id);
      
      // Calculate field completion (simplified - would need field definitions for accurate count)
      const fieldCount = Object.keys(moduleData).length;
      const completedFields = Object.values(moduleData).filter(value => 
        value !== null && value !== undefined && value !== ''
      ).length;
      
      const completion = fieldCount > 0 ? Math.round((completedFields / fieldCount) * 100) : 0;
      
      moduleProgress[module.id] = {
        moduleId: module.id,
        moduleName: module.label,
        completion,
        requiredFieldsCompleted: completedFields, // Simplified
        totalRequiredFields: fieldCount, // Simplified
        optionalFieldsCompleted: 0,
        totalOptionalFields: 0,
        hasErrors,
        hasWarnings: validation?.warnings.length > 0 || false,
        lastModified: isDirty ? new Date() : undefined,
        isValid: !hasErrors && (!validation || validation.isValid),
      };

      totalRequired += fieldCount;
      completedRequired += completedFields;
      
      if (validation) {
        validationErrors += validation.errors.length;
        validationWarnings += validation.warnings.length;
      }
    });

    const overallCompletion = totalRequired > 0 
      ? Math.round((completedRequired / totalRequired) * 100) 
      : 0;

    return {
      moduleProgress,
      overallCompletion,
      requiredFieldsCompleted: completedRequired,
      totalRequiredFields: totalRequired,
      optionalFieldsCompleted: completedOptional,
      totalOptionalFields: totalOptional,
      validationErrors,
      validationWarnings,
      lastUpdated: new Date(),
    };
  }, [modules, formData.selectors, lastValidation]);

  const canSubmitForm = useCallback((): boolean => {
    // Check if all required modules are valid and have no unsaved changes
    const hasUnsavedChanges = formData.selectors.hasUnsavedChanges();
    const hasErrors = modules.some(module => 
      formData.selectors.getModuleErrors(module.id).length > 0
    );
    const hasValidationErrors = Object.values(lastValidation).some(
      validation => !validation.isValid
    );

    return !hasUnsavedChanges && !hasErrors && !hasValidationErrors;
  }, [formData.selectors, modules, lastValidation]);

  return {
    // Template data from Phase 2
    template: {
      modules,
      loading: templatesLoading,
      error: templatesError,
    },
    
    // Form data state from Phase 3
    formData: formData.state,
    
    // Save operations tracking
    saveOperations,
    
    // Enhanced actions with template awareness
    actions: {
      updateField,
      validateModule,
      saveModule,
      loadFormData,
      resetModule,
      // Re-export core actions
      updateModuleData: formData.actions.updateModuleData,
      markClean: formData.actions.markClean,
      markSaving: formData.actions.markSaving,
      setErrors: formData.actions.setErrors,
      clearErrors: formData.actions.clearErrors,
      handleConflict: formData.actions.handleConflict,
      resolveConflict: formData.actions.resolveConflict,
    },
    
    // Enhanced selectors
    selectors: {
      getFieldValue,
      getModuleValidation,
      getFormProgress,
      canSubmitForm,
      // Re-export core selectors
      getModuleData: formData.selectors.getModuleData,
      isModuleDirty: formData.selectors.isModuleDirty,
      isModuleSaving: formData.selectors.isModuleSaving,
      getModuleErrors: formData.selectors.getModuleErrors,
      hasModuleConflict: formData.selectors.hasModuleConflict,
      getModuleConflict: formData.selectors.getModuleConflict,
      hasUnsavedChanges: formData.selectors.hasUnsavedChanges,
      getPerformanceMetrics: formData.selectors.getPerformanceMetrics,
    },
    
    // Configuration
    config: {
      formData: formDataConfig,
      flra: flraConfig,
    },
  };
}

export default useFlraFormState; 