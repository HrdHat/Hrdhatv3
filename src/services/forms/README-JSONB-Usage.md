# JSONB Form System - Phase 1 Usage Guide

This guide shows how to use the new JSONB-based form saving system that replaces the old per-table approach.

## Quick Start

```typescript
import { 
  createFlraForm, 
  saveFormModuleData, 
  getFormModuleData,
  getAllFormData 
} from '../services/forms/instanceService';

// 1. Create a new form
const result = await createFlraForm({
  userId: 'user-123',
  title: 'Site Safety Inspection',
  description: 'Morning safety check',
  companyId: 'company-456',
  formDate: '2024-01-15'
});

if (result.success) {
  const formId = result.formId;
  const moduleIds = result.entryIds; // { [moduleId]: entryId }
}

// 2. Save module data (any structure as JSONB)
await saveFormModuleData({
  formId: 'form-123',
  moduleId: 'general-module-id',
  data: {
    project_name: 'Site Alpha',
    supervisor_name: 'John Doe',
    crew_members_count: 5,
    start_time: '08:00'
  },
  userId: 'user-123'
});

// 3. Retrieve module data
const generalData = await getFormModuleData('form-123', 'general-module-id');
// Returns: { project_name: 'Site Alpha', supervisor_name: 'John Doe', ... }

// 4. Get all form data
const allData = await getAllFormData('form-123');
// Returns: { 'general-module-id': {...}, 'ppe-module-id': {...}, ... }
```

## Key Differences from Old System

### ✅ New JSONB System (Phase 1)
- **One table**: `form_data_entries` stores all module data as JSONB
- **Flexible**: Any data structure can be saved
- **Unified API**: Same functions for all module types
- **Better performance**: Single query to save/retrieve module data

### ❌ Old Per-Table System (Being Phased Out)
- **Multiple tables**: Each module type had its own table
- **Rigid**: Fixed schema for each module
- **Complex API**: Different functions for each module type
- **Performance**: Multiple queries needed

## Data Structure

The new system stores data in `form_data_entries`:

```sql
CREATE TABLE form_data_entries (
  id uuid PRIMARY KEY,
  form_id uuid NOT NULL,          -- Links to form_instances.id
  module_id uuid NOT NULL,        -- Links to template_modules.id  
  data jsonb NOT NULL,            -- The actual form data (flexible)
  tenant_id uuid,                 -- For multi-tenancy
  version integer DEFAULT 1,      -- For versioning
  last_saved_by uuid,            -- Who last saved this data
  created_at timestamptz,
  updated_at timestamptz
);
```

## Migration Strategy

The old tables still exist during the transition:
- `form_instance_general_info`
- `form_instance_pre_job_checklist`  
- `form_instance_ppe_platform`
- `form_instance_hazards`
- `form_instance_signatures`

They will be phased out once the new system is fully implemented and tested.

## Validation

Basic field validation is included:

```typescript
// Validation is enabled by default
await saveFormModuleData({
  formId: 'form-123',
  moduleId: 'module-456', 
  data: { name: 'John', age: 30 },
  validateData: true  // Default: true
});

// Skip validation (not recommended for production)
await saveFormModuleData({
  formId: 'form-123',
  moduleId: 'module-456',
  data: { name: 'John', age: 30 },
  validateData: false
});
```

## Error Handling

All functions return structured results:

```typescript
const result = await saveFormModuleData({...});

if (result.success) {
  console.log('Saved with entry ID:', result.entryId);
} else {
  console.error('Save failed:', result.error);
  
  // Show validation errors if any
  if (result.validationErrors) {
    result.validationErrors.forEach(error => {
      console.error(`${error.field}: ${error.message}`);
    });
  }
}
```

## Next Phases

- **Phase 2**: Enhanced validation using `template_modules.field_definitions`
- **Phase 3**: Migration from old tables to JSONB system
- **Phase 4**: Remove old per-table saving code 