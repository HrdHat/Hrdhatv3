# 🚀 PHASE 2 MIGRATION NOTES - Template & Metadata Loading

**📅 Created:** December 2024  
**🎯 Objective:** Implement dynamic template loading and enhanced field validation  
**📊 Current Status:** Phase 1 Complete, Phase 2 Ready to Start  

## 📋 CONTEXT SUMMARY

### ✅ PHASE 1 COMPLETED (JSONB Form System)
We successfully implemented a JSONB-based form saving system that replaces the old per-table approach:

**✅ Completed Files:**
- `src/types/formTypes.ts` - JSONB system types added
- `src/db/formInstances.ts` - Database operations layer 
- `src/services/forms/instanceService.ts` - Business logic service layer
- `src/services/forms/README-JSONB-Usage.md` - Usage documentation

**✅ Working Functionality:**
```typescript
// Create forms with JSONB storage
const result = await createFlraForm({ userId: 'user-123', title: 'Safety Check' });

// Save any JSON structure to modules  
await saveFormModuleData({
  formId: result.formId!,
  moduleId: 'module-uuid',
  data: { project_name: 'Site Alpha', supervisor_name: 'John' }
});

// Retrieve saved data
const data = await getFormModuleData('form-123', 'module-uuid');
```

## 🔴 CRITICAL ISSUE TO FIX FIRST

**❌ Problem:** Hardcoded module IDs in `instanceService.ts`
```typescript
// Lines 30-38 in src/services/forms/instanceService.ts
const DEFAULT_FLRA_MODULE_IDS = [
  'header-module-id',        // ❌ Placeholder strings
  'general-module-id',       // ❌ Need real UUIDs
  'prejob-module-id',        // ❌ Will break Phase 2
  // ... more placeholders
];
```

**✅ Solution:** Replace with dynamic database lookup before Phase 2 implementation.

## 🎯 PHASE 2 IMPLEMENTATION PLAN

### 📁 NEW FILES TO CREATE

1. **`src/db/templates.ts`** - Template and module database queries
2. **`src/services/forms/templateService.ts`** - Template business logic
3. **`src/hooks/useFormTemplates.ts`** - Client-side template state management
4. **`src/types/formTypes.ts`** - Add new interfaces (ModuleDef, FieldDefinition)

### 🏗️ ARCHITECTURE OVERVIEW

```
Phase 2 Data Flow:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  template_      │    │ template_module_ │    │ form_data_      │
│  modules        │───▶│ fields           │───▶│ entries         │
│                 │    │                  │    │ (JSONB)         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
      │                         │                        │
      ▼                         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Module Config   │    │ Field Schemas    │    │ User Data       │
│ (name, label,   │    │ (type, required, │    │ (validated      │
│  renderer)      │    │  options)        │    │  against schema)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 🔧 STEP 1: Fix Hardcoded Module IDs

**Create:** `src/db/templates.ts`
```typescript
import { supabase } from './supabaseClient';

/**
 * Get FLRA template module IDs from database
 * Replaces hardcoded DEFAULT_FLRA_MODULE_IDS
 */
export async function getFlraModuleIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('form_template_modules')
    .select(`
      template_module_id,
      module_order
    `)
    .eq('form_list_id', 'FLRA_TEMPLATE_UUID') // Get actual UUID
    .order('module_order');
    
  if (error) throw error;
  return data.map(item => item.template_module_id);
}

/**
 * Get template modules with field definitions
 */
export async function getTemplateModules(moduleIds: string[]): Promise<ModuleDef[]> {
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
    
  if (error) throw error;
  return data.map(module => ({
    id: module.id,
    name: module.name,
    label: module.label,
    rendererKey: module.renderer_key,
    usesFields: module.uses_fields,
    layoutStyle: module.layout_style,
    fieldDefinitions: module.template_module_fields
  }));
}
```

**Update:** `src/services/forms/instanceService.ts`
```typescript
// Replace hardcoded array with dynamic lookup
import { getFlraModuleIds } from '../../db/templates';

export async function createFlraForm(input: CreateFormInput): Promise<CreateFormInstanceResult> {
  // ... validation ...
  
  // 🔄 NEW: Get module IDs from database
  const templateModuleIds = await getFlraModuleIds();
  
  const createInput: CreateFormInstanceInput = {
    ...input,
    templateModuleIds  // ✅ Now uses real UUIDs
  };
  
  // ... rest of function ...
}
```

### 🔧 STEP 2: Add Template Types

**Update:** `src/types/formTypes.ts`
```typescript
// Add to existing types
export interface ModuleDef {
  id: string;                           // template_modules.id (UUID)
  name: string;                         // template_modules.name  
  label: string;                        // template_modules.label
  rendererKey: string;                  // template_modules.renderer_key
  usesFields: boolean;                  // template_modules.uses_fields
  layoutStyle?: string;                 // template_modules.layout_style
  fieldDefinitions?: FieldDefinition[]; // From template_module_fields
  moduleOrder: number;                  // For ordering
  isRequired: boolean;                  // Default requirement
}

export interface FieldDefinition {
  id: string;           // template_module_fields.id
  moduleId: string;     // template_module_fields.module_id
  name: string;         // template_module_fields.name
  label: string;        // template_module_fields.label
  type: FieldType;      // template_module_fields.type
  required: boolean;    // template_module_fields.required
  fieldOrder: number;   // template_module_fields.field_order
  defaultValue?: string; // template_module_fields.default_value
}

export type FieldType = 
  | 'text' | 'boolean' | 'number' | 'date' | 'time' 
  | 'textarea' | 'select' | 'multiselect' | 'file' | 'signature';

export interface TemplateLoadResult {
  success: boolean;
  modules?: ModuleDef[];
  error?: string;
}
```

### 🔧 STEP 3: Enhanced Validation Service

**Create:** `src/services/forms/templateService.ts`
```typescript
import { getTemplateModules, getFlraModuleIds } from '../../db/templates';
import type { ModuleDef, FieldDefinition, TemplateLoadResult } from '../../types/formTypes';

/**
 * Load FLRA template with caching
 */
export async function loadFlraTemplate(): Promise<TemplateLoadResult> {
  try {
    // Check cache first
    const cached = sessionStorage.getItem('flra-template');
    if (cached) {
      return { success: true, modules: JSON.parse(cached) };
    }
    
    // Load from database
    const moduleIds = await getFlraModuleIds();
    const modules = await getTemplateModules(moduleIds);
    
    // Cache for session
    sessionStorage.setItem('flra-template', JSON.stringify(modules));
    
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
 */
export function validateFieldAgainstSchema(
  value: unknown,
  fieldDef: FieldDefinition
): { isValid: boolean; error?: string } {
  
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
  }
  
  return { isValid: true };
}
```

### 🔧 STEP 4: Template State Management

**Create:** `src/hooks/useFormTemplates.ts`
```typescript
import { useState, useEffect } from 'react';
import { loadFlraTemplate } from '../services/forms/templateService';
import type { ModuleDef } from '../types/formTypes';

export function useFormTemplates() {
  const [modules, setModules] = useState<ModuleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadFlraTemplate()
      .then(result => {
        if (result.success && result.modules) {
          setModules(result.modules);
        } else {
          setError(result.error || 'Failed to load template');
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  
  const getModuleById = (moduleId: string) => 
    modules.find(module => module.id === moduleId);
    
  const getFieldDefinitions = (moduleId: string) =>
    getModuleById(moduleId)?.fieldDefinitions || [];
  
  return {
    modules,
    loading,
    error,
    getModuleById,
    getFieldDefinitions
  };
}
```

### 🔧 STEP 5: Update Form Saving with Schema Validation

**Update:** `src/services/forms/instanceService.ts`
```typescript
import { validateFieldAgainstSchema } from './templateService';
import { useFormTemplates } from '../../hooks/useFormTemplates';

export async function saveFormModuleData(input: {
  formId: string;
  moduleId: string;
  data: Record<string, unknown>;
  userId?: string;
  validateData?: boolean;
  fieldDefinitions?: FieldDefinition[]; // 🔄 NEW: Pass field schemas
}): Promise<SaveModuleDataResult> {
  
  // ... existing validation ...
  
  // 🔄 ENHANCED: Schema-based validation
  if (input.validateData !== false && input.fieldDefinitions) {
    for (const [key, value] of Object.entries(input.data)) {
      const fieldDef = input.fieldDefinitions.find(field => field.name === key);
      
      if (fieldDef) {
        const result = validateFieldAgainstSchema(value, fieldDef);
        if (!result.isValid) {
          validationErrors.push({
            field: key,
            message: result.error || 'Invalid value'
          });
        }
      }
    }
  }
  
  // ... rest of function ...
}
```

## 🎯 IMPLEMENTATION CHECKLIST

### 🔧 Phase 2A: Fix Module IDs (URGENT)
- [ ] Create `src/db/templates.ts` with `getFlraModuleIds()`
- [ ] Update `instanceService.ts` to use dynamic module lookup
- [ ] Test form creation still works with real UUIDs

### 🔧 Phase 2B: Template Loading
- [ ] Add template types to `formTypes.ts`
- [ ] Create `templateService.ts` with caching
- [ ] Create `useFormTemplates.ts` hook
- [ ] Test template loading and caching

### 🔧 Phase 2C: Enhanced Validation
- [ ] Implement `validateFieldAgainstSchema()` 
- [ ] Update `saveFormModuleData()` to use field schemas
- [ ] Test validation with real field definitions
- [ ] Improve error messages with field labels

### 🔧 Phase 2D: Integration
- [ ] Integrate template loading into form creation flow
- [ ] Update form components to use template data
- [ ] Test complete flow: load template → create form → save with validation

## 🚨 PREREQUISITES

1. **Database Ready:** Ensure these SQL scripts have been run:
   - `src/db/ensure_json_metadata.sql` (✅ Done)
   - `src/db/add_flra_template_fields.sql` (❓ Verify)

2. **Get FLRA Template UUID:** Find the actual UUID for FLRA template:
   ```sql
   SELECT id FROM form_templates WHERE name = 'FLRA';
   ```

3. **Verify Module Data:** Ensure template_modules has FLRA modules:
   ```sql
   SELECT id, name, label FROM template_modules 
   WHERE name IN ('general_information', 'pre_job_checklist', 'ppe_platform_inspection');
   ```

## 🔄 MIGRATION PATH

1. **Start Here:** Fix hardcoded module IDs first (blocks everything else)
2. **Then:** Implement template loading (enables enhanced validation)  
3. **Finally:** Integrate schema-based validation (completes Phase 2)

## 📚 USEFUL REFERENCES

- **Current Working Code:** `src/services/forms/instanceService.ts`
- **Database Schema:** `src/db/schema2.sql`
- **Field Definitions:** `src/db/add_flra_template_fields.sql`
- **Usage Examples:** `src/services/forms/README-JSONB-Usage.md`

---
**🎯 Next Agent:** Start with Step 1 (Fix Module IDs) - it's blocking all other Phase 2 work! 