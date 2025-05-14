# Module Migration Analysis

## Current Database State

### Modules Table

```sql
| id                                   | name                    | label                       | description                                        | is_active | renderer_key          | uses_fields |
| ------------------------------------ | ----------------------- | --------------------------- | -------------------------------------------------- | --------- | --------------------- | ----------- |
| 8aff26cd-32f6-4186-b0ea-430fede805f6 | general_information     | General Information         | null                                               | true      | GenericModuleRenderer | true        |
| 61f47ce2-563b-4545-bd8d-6d54c413133c | general_info            | General Information         | General info section for FLRA forms                | true      | GenericModuleRenderer | true        |
| 872d19a1-32aa-4e2e-b9a8-bb101e907890 | ppe_platform_inspection | PPE and Platform Inspection | PPE and platform inspection section for FLRA forms | true      | GenericModuleRenderer | true        |
| c77e0ad9-6162-495c-919b-d250670621bd | pre_job_task_checklist  | Pre-Job Task Checklist      | Pre-job task checklist section for FLRA forms      | true      | GenericModuleRenderer | true        |
| a417e8f4-1c0f-4782-b6de-dd9073f60c49 | task_hazard_control     | Task Hazard Control         | Task hazard control section for FLRA forms         | true      | task_hazard_control   | true        |
```

### Form Modules

```sql
| form_module_id                       | module_name         | field_count |
| ------------------------------------ | ------------------- | ----------- |
| db520680-55fe-4e43-8686-0d8579ad7905 | general_information | 0           |
| 5be8d33c-7070-45a5-a55b-324e6a14d616 | general_information | 0           |
| 6e0597e7-19c0-45da-a5dc-30c4d871a60a | general_information | 0           |
```

### Module Fields

```sql
| module_id                            | module_name             | field_count |
| ------------------------------------ | ----------------------- | ----------- |
| c77e0ad9-6162-495c-919b-d250670621bd | pre_job_task_checklist  | 20          |
| 872d19a1-32aa-4e2e-b9a8-bb101e907890 | ppe_platform_inspection | 17          |
| 61f47ce2-563b-4545-bd8d-6d54c413133c | general_info            | 7           |
| 8ec1ce90-8e51-45d6-9c40-778b00cfedde | header                  | 3           |
| a417e8f4-1c0f-4782-b6de-dd9073f60c49 | task_hazard_control     | 1           |
```

## The Issue

### Root Cause

The issue stems from a mismatch between module IDs in the form creation process. Specifically:

1. **Module Duplication**:

   - `general_information` (8aff26cd-32f6-4186-b0ea-430fede805f6) is used in forms
   - `general_info` (61f47ce2-563b-4545-bd8d-6d54c413133c) contains the field definitions

2. **Form Creation Process** (from `createFormWithModules.ts`):

   ```typescript
   // The code uses general_information ID
   const { data: moduleMeta } = await supabase
     .from("modules")
     .select("uses_fields, renderer_key")
     .eq("id", moduleId); // moduleId is general_information

   if (usesFields) {
     // Tries to clone fields from general_information
     // but fields are in general_info
     await cloneFieldsFromModule({
       moduleId, // This is general_information
       formId: form.id,
       formModuleId: formModule.id,
     });
   }
   ```

3. **Result**:
   - Form modules are created with `general_information` ID
   - Field cloning fails because it looks for fields in the wrong module
   - Forms end up with modules but no fields

## Proposed Fix

### Option 1: Update Form Creation to Use Correct Module ID

1. Modify `createFormWithModules.ts` to use `general_info` instead of `general_information`
2. Update any existing form modules to reference the correct module ID

```sql
-- Update existing form modules
UPDATE form_modules
SET module_id = '61f47ce2-563b-4545-bd8d-6d54c413133c'  -- general_info
WHERE module_id = '8aff26cd-32f6-4186-b0ea-430fede805f6';  -- general_information

-- Update user preferences
UPDATE user_form_module_preferences
SET module_list_id = '61f47ce2-563b-4545-bd8d-6d54c413133c'  -- general_info
WHERE module_list_id = '8aff26cd-32f6-4186-b0ea-430fede805f6';  -- general_information
```

### Option 2: Merge Modules and Move Fields

1. Move field definitions from `general_info` to `general_information`
2. Clean up the duplicate module

```sql
-- Move field definitions
INSERT INTO module_fields (
    module_id,
    name,
    label,
    type,
    required,
    options,
    validation,
    sort_order,
    created_at
)
SELECT
    '8aff26cd-32f6-4186-b0ea-430fede805f6' as module_id,  -- general_information
    name,
    label,
    type,
    required,
    options,
    validation,
    sort_order,
    created_at
FROM module_fields
WHERE module_id = '61f47ce2-563b-4545-bd8d-6d54c413133c'  -- general_info
ON CONFLICT (module_id, name) DO NOTHING;

-- Clean up old module
DELETE FROM modules
WHERE id = '61f47ce2-563b-4545-bd8d-6d54c413133c';  -- general_info
```

## Recommendation

Based on the FLRA creation steps in `createnewflrasteps_indented.txt`, I recommend **Option 2** because:

1. It follows the documented flow:

   ```
   2.5. Clone Field Definitions for Each Module
       - For each new form_module:
           - Query the module_fields table for all fields belonging to that module
   ```

2. It maintains data integrity:

   - Preserves existing form modules
   - Moves field definitions to the correct module
   - Follows the single source of truth principle

3. It's less disruptive:
   - No need to update existing form modules
   - No need to modify the form creation code
   - Maintains backward compatibility

## Implementation Steps

1. **Backup**:

   ```sql
   -- Create backup of current state
   CREATE TABLE module_fields_backup AS SELECT * FROM module_fields;
   CREATE TABLE modules_backup AS SELECT * FROM modules;
   ```

2. **Move Fields**:

   ```sql
   -- Move field definitions
   INSERT INTO module_fields (
       module_id,
       name,
       label,
       type,
       required,
       options,
       validation,
       sort_order,
       created_at
   )
   SELECT
       '8aff26cd-32f6-4186-b0ea-430fede805f6' as module_id,
       name,
       label,
       type,
       required,
       options,
       validation,
       sort_order,
       created_at
   FROM module_fields
   WHERE module_id = '61f47ce2-563b-4545-bd8d-6d54c413133c'
   ON CONFLICT (module_id, name) DO NOTHING;
   ```

3. **Verify**:

   ```sql
   -- Check field counts
   SELECT
       m.id,
       m.name,
       COUNT(mf.id) as field_count
   FROM modules m
   LEFT JOIN module_fields mf ON m.id = mf.module_id
   WHERE m.id IN (
       '8aff26cd-32f6-4186-b0ea-430fede805f6',
       '61f47ce2-563b-4545-bd8d-6d54c413133c'
   )
   GROUP BY m.id, m.name;
   ```

4. **Cleanup**:

   ```sql
   -- Remove old module
   DELETE FROM modules
   WHERE id = '61f47ce2-563b-4545-bd8d-6d54c413133c';
   ```

5. **Test**:
   - Create a new FLRA form
   - Verify fields are cloned correctly
   - Check existing forms still work
