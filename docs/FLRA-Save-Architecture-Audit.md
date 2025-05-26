# FLRA Save Architecture Audit Report

**Date**: December 19, 2024  
**Auditor**: AI Assistant  
**Scope**: HrdHat FLRA Form Save System

## 🎯 **EXECUTIVE SUMMARY**

The FLRA save architecture has a solid foundation with good validation practices and error handling, but contains **7 critical issues** that will cause runtime failures. The most severe problems are schema mismatches between validation schemas and database structure, incorrect conflict resolution keys, and potential race conditions in debounced saves.

**Risk Level**: 🔴 **HIGH** - Save operations will fail in production

---

## 🔍 **AUDIT SCOPE**

### Files Audited:

- ✅ `src/services/forms/saveFormModuleData.ts` (Client-side service)
- ✅ `supabase/functions/saveFormModuleData/index.ts` (Edge function)
- ✅ `src/components/GeneralInfoForm.tsx` (Form component)
- ✅ `src/types/formValidationSchemas.ts` (Zod schemas)
- ✅ `src/hooks/useDebouncedSave.ts` (Debounce logic)
- ✅ `src/constants/database.ts` (Table mappings)
- ✅ `src/db/schema2.sql` (Database schema)

### Verification Points:

1. ✅ Conflict keys alignment with database constraints
2. ✅ Server defaults handling (IDs, timestamps)
3. ✅ Payload shape validation (snake_case consistency)
4. ✅ Zod validation strictness
5. ✅ Debounce timing and race conditions
6. ✅ Error handling and user feedback
7. ✅ Array module bulk upsert logic
8. ✅ Schema consistency across client/server

---

## ❌ **CRITICAL ISSUES FOUND**

### 1. **SCHEMA DESIGN BUG: General Info Missing Foreign Key**

**Severity**: 🔴 **CRITICAL**  
**Impact**: General info data is orphaned - no way to link back to form instances

**Problem**: The `form_instance_general_info` table lacks a foreign key to `form_instances`:

```sql
-- ❌ CURRENT: form_instance_general_info table
CREATE TABLE form_instance_general_info (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_module_id uuid,  -- Links to form_instance_modules only
    -- ❌ MISSING: form_id uuid NOT NULL REFERENCES form_instances(id)
    project_name text,
    -- ... other fields
);
```

**Database Reality Check**: ALL other module tables have `form_id`:

- ✅ `form_instance_pre_job_checklist` has `form_id uuid NOT NULL`
- ✅ `form_instance_ppe_platform` has `form_id uuid NOT NULL`
- ✅ `form_instance_hazards` has `form_id uuid NOT NULL`
- ✅ `form_instance_signatures` has `form_id uuid NOT NULL`
- ✅ `form_asset_photos` has `form_id uuid NOT NULL`
- ❌ `form_instance_general_info` has NO `form_id` column

**Root Cause**: Schema design inconsistency - general info can't be queried by form.

**Fix Required**:

```sql
-- Add missing foreign key to general info table
ALTER TABLE form_instance_general_info
ADD COLUMN form_id uuid NOT NULL REFERENCES form_instances(id);

-- Add index for performance
CREATE INDEX idx_form_instance_general_info_form_id
ON form_instance_general_info(form_id);
```

**Code Impact**: Update validation schema to include `form_id`:

```typescript
export const generalInfoSchema = z
  .object({
    id: z.string().uuid("Invalid UUID format"),
    form_id: z.string().uuid("Invalid form ID format"), // ✅ Add this
    form_module_id: z.string().uuid("Invalid module ID format").nullable(),
    project_name: z.string().min(1, "Required"),
    // ... rest of fields
  })
  .strict();
```

---

### 2. **CONFLICT RESOLUTION: Missing Composite Unique Constraints**

**Severity**: 🔴 **CRITICAL**  
**Impact**: Multiple rows can be created for the same form+module combination

**Problem**: Current conflict resolution uses wrong strategy:

```typescript
// src/services/forms/saveFormModuleData.ts - Line 178
{
  onConflict: moduleKey === "header" ? "id" : "form_module_id";
}
```

**Database Reality**: NO unique constraints exist on `form_module_id`:

```sql
-- ❌ Current constraints (PRIMARY KEY only):
CREATE UNIQUE INDEX form_instance_general_info_pkey ON form_instance_general_info(id);
CREATE UNIQUE INDEX form_instance_pre_job_checklist_pkey ON form_instance_pre_job_checklist(id);
CREATE UNIQUE INDEX form_instance_ppe_platform_pkey ON form_instance_ppe_platform(id);

-- ❌ NO constraints prevent duplicate form+module combinations
```

**Risk**: Users can create multiple "general" or "preJobChecklist" rows for the same form.

**Better Strategy**: Add composite unique constraints for single-row modules:

```sql
-- Prevent duplicate modules per form
ALTER TABLE form_instance_general_info
ADD CONSTRAINT uk_general_info_form_module
UNIQUE (form_id, form_module_id);

ALTER TABLE form_instance_pre_job_checklist
ADD CONSTRAINT uk_pre_job_form_module
UNIQUE (form_id, form_module_id);

ALTER TABLE form_instance_ppe_platform
ADD CONSTRAINT uk_ppe_platform_form_module
UNIQUE (form_id, form_module_id);
```

**Code Fix**: Use composite conflict resolution:

```typescript
// Define modules that need form-level uniqueness
const modulesWithFormId = new Set([
  "preJobChecklist",
  "ppeChecklist",
  "taskHazards",
  "photos",
  "signatures",
]);

const conflictColumns =
  moduleKey === "header"
    ? "id"
    : modulesWithFormId.has(moduleKey)
    ? ["form_id", "form_module_id"] // ✅ Composite key
    : "id"; // Fallback for general (after schema fix)
```

---

### 3. **PAYLOAD CONSTRUCTION: Hardcoded Field Logic**

**Severity**: 🟡 **MEDIUM**  
**Impact**: Brittle code that breaks when schema changes

**Problem**: Ad-hoc conditions for field addition:

```typescript
// src/services/forms/saveFormModuleData.ts - Line 158
data.map((row) => ({
  ...row,
  [FORM_DATA_ENTRIES.formId]: formId, // Adds "form_id" to ALL arrays
  ...(moduleId && { form_module_id: moduleId }),
}))

// Single modules - Line 172
{
  ...data,
  [FORM_DATA_ENTRIES.formId]: formId, // Adds "form_id" to general (wrong!)
  ...(moduleId && moduleKey !== "header" && { form_module_id: moduleId }),
}
```

**Issue**: Current logic ties field addition to `moduleKey !== "general"`, but what about future modules?

**Better Approach**: Use explicit lookup sets:

```typescript
// Define which modules have which foreign keys
const modulesWithFormId = new Set([
  "preJobChecklist",
  "ppeChecklist",
  "taskHazards",
  "photos",
  "signatures",
]);

const modulesWithModuleId = new Set([
  "general",
  "preJobChecklist",
  "ppeChecklist",
  "taskHazards",
  "photos",
  "signatures",
]);

// Clean payload construction
const payload = Array.isArray(data)
  ? data.map((row) => ({
      ...row,
      ...(modulesWithFormId.has(moduleKey) && { form_id: formId }),
      ...(moduleId &&
        modulesWithModuleId.has(moduleKey) && { form_module_id: moduleId }),
    }))
  : {
      ...data,
      ...(modulesWithFormId.has(moduleKey) && { form_id: formId }),
      ...(moduleId &&
        modulesWithModuleId.has(moduleKey) && { form_module_id: moduleId }),
    };
```

**Benefits**:

- ✅ Explicit about which modules get which fields
- ✅ Easy to update when adding new modules
- ✅ Self-documenting code

---

### 4. **SERVER DEFAULTS: Manual ID/Timestamp Generation**

**Severity**: 🟡 **MEDIUM**  
**Impact**: Bypasses database defaults, potential UUID collisions

**Problem**:

```typescript
// supabase/functions/saveFormModuleData/index.ts - Line 89
if (!toValidate.id) {
  toValidate.id = crypto.randomUUID(); // ❌ Should let DB handle
}

const now = new Date().toISOString();
if (!toValidate.created_at) {
  toValidate.created_at = now; // ❌ Should let DB handle
}
```

**Issue**: Postgres has proper defaults that should be used:

```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
```

**Fix Required**:

```typescript
// Remove manual generation - let Postgres handle defaults
const parsed = schema.parse(data); // Don't add IDs/timestamps
```

---

### 5. **ZOD VALIDATION: Missing .strict() on Some Schemas**

**Severity**: 🟡 **MEDIUM**  
**Impact**: Unknown fields pass validation, potential data corruption

**Problem**:

```typescript
// src/types/formValidationSchemas.ts - Line 295
export const formInstanceSchema = z.object({
  // ... fields
}); // ❌ Missing .strict()
```

**Fix Required**:

```typescript
export const formInstanceSchema = z
  .object({
    // ... fields
  })
  .strict(); // ✅ Reject unknown keys
```

---

### 6. **DEBOUNCE LOGIC: Race Condition in Save Queue**

**Severity**: 🟡 **MEDIUM**  
**Impact**: Rapid changes may overwrite each other, data loss

**Problem**: Queue overwrites instead of merging:

```typescript
// src/hooks/useDebouncedSave.ts - Line 142
const save = useCallback(
  (params: SaveFormModuleDataParams) => {
    const key = `${params.formId}-${params.moduleKey}`;
    saveQueueRef.current.set(key, params); // ❌ Overwrites previous saves
    setModuleDirty(params.moduleKey, true);
    debouncedProcessQueue();
  },
  [debouncedProcessQueue, setModuleDirty]
);
```

**Issue**: If user types rapidly in multiple fields, only the last field change is saved.

**Advanced Consideration**: For nested data (arrays), simple object merge isn't enough:

```typescript
// ❌ Simple merge loses array updates
const merged = { ...existing.data, ...params.data };

// ✅ Better: Queue field-level diffs
const save = useCallback(
  (params: SaveFormModuleDataParams) => {
    const key = `${params.formId}-${params.moduleKey}`;

    // For array modules, consider versioning
    if (Array.isArray(params.data)) {
      // Option 1: Replace entire array (current behavior)
      saveQueueRef.current.set(key, params);
    } else {
      // Option 2: Merge object fields
      const existing = saveQueueRef.current.get(key);
      const merged = existing
        ? { ...existing.data, ...params.data }
        : params.data;
      saveQueueRef.current.set(key, { ...params, data: merged });
    }

    setModuleDirty(params.moduleKey, true);
    debouncedProcessQueue();
  },
  [debouncedProcessQueue, setModuleDirty]
);
```

**Alternative**: Implement optimistic locking with version numbers to detect conflicts.

---

### 7. **RLS SECURITY: Missing Policies for Module Tables**

**Severity**: 🟡 **MEDIUM**  
**Impact**: Edge function bypasses RLS, but client-side access would fail

**Problem**: Only `form_instances` has RLS policies defined:

```sql
-- ✅ form_instances has complete RLS
ALTER TABLE form_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create their own forms" ON form_instances...

-- ❌ Module tables have NO RLS policies:
-- form_instance_general_info
-- form_instance_pre_job_checklist
-- form_instance_ppe_platform
-- form_instance_hazards
-- form_instance_signatures
-- form_asset_photos
```

**Current State**: Edge function uses service role key, so RLS is bypassed. But if you ever switch to anon key for direct client access, saves will fail.

**Fix Required**: Add RLS policies for all module tables:

```sql
-- Enable RLS on all module tables
ALTER TABLE form_instance_general_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_instance_pre_job_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_instance_ppe_platform ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_instance_hazards ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_instance_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_asset_photos ENABLE ROW LEVEL SECURITY;

-- Add policies (example for general info)
CREATE POLICY "Users can manage their form modules" ON form_instance_general_info
  FOR ALL TO authenticated
  USING (
    form_id IN (
      SELECT id FROM form_instances WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    form_id IN (
      SELECT id FROM form_instances WHERE user_id = auth.uid()
    )
  );
```

### 8. **ERROR HANDLING: Insufficient User Feedback**

**Severity**: 🟡 **LOW**  
**Impact**: Users don't understand why saves fail

**Problem**: Validation errors are logged but not always shown to users.

**Fix Required**: Ensure all validation errors surface in the UI with actionable messages.

---

## ✅ **WHAT'S WORKING WELL**

### Strengths:

1. **🎯 Comprehensive Validation**: Good use of Zod schemas for type safety
2. **🔄 Debounced Saves**: Prevents excessive API calls
3. **📊 Error Tracking**: Detailed error capture and logging
4. **🏗️ Modular Design**: Clean separation between client/server logic
5. **🔒 Security**: Proper use of RLS and service role keys
6. **📱 User Experience**: Loading states and save indicators

### Architecture Highlights:

- Single source of truth for validation schemas
- Consistent table mapping across client/server
- Proper TypeScript integration
- Offline queue support

---

## 🔧 **IMPLEMENTATION PLAN**

### Phase 1: Schema Fixes (Immediate - 4 hours)

1. **Add form_id to general info table**:

   ```sql
   ALTER TABLE form_instance_general_info
   ADD COLUMN form_id uuid NOT NULL REFERENCES form_instances(id);
   ```

2. **Add composite unique constraints**:

   ```sql
   ALTER TABLE form_instance_general_info
   ADD CONSTRAINT uk_general_info_form_module UNIQUE (form_id, form_module_id);

   ALTER TABLE form_instance_pre_job_checklist
   ADD CONSTRAINT uk_pre_job_form_module UNIQUE (form_id, form_module_id);

   ALTER TABLE form_instance_ppe_platform
   ADD CONSTRAINT uk_ppe_platform_form_module UNIQUE (form_id, form_module_id);
   ```

3. **Update validation schemas** to include form_id for general info

### Phase 2: Code Alignment (1 day)

1. **Implement lookup-based payload construction** using `modulesWithFormId` sets
2. **Update conflict resolution** to use composite keys
3. **Add .strict()** to remaining schemas
4. **Remove manual ID generation** from edge function

### Phase 3: Security & Robustness (1 day)

1. **Add RLS policies** for all module tables
2. **Implement merge logic** for debounced saves
3. **Add optimistic locking** with version numbers
4. **Improve error messaging** in UI

### Phase 4: E2E Testing (1 day)

1. **Create new FLRA form** and fill all modules
2. **Query each table** to verify exactly one row per single module
3. **Test rapid typing** scenarios for race conditions
4. **Verify proper foreign key relationships**

---

## 🚨 **IMMEDIATE ACTIONS REQUIRED**

### 1. Stop Production Deployments

**Risk**: Current code will fail in production

### 2. Apply Critical Fixes

```bash
# Priority order:
1. Fix conflict resolution keys
2. Remove form_id from general info
3. Remove manual ID generation
4. Test with real database
```

### 3. Database Schema Verification

```sql
-- Run this query to verify actual constraints:
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name LIKE 'form_instance%'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE');
```

---

## 📋 **TESTING CHECKLIST**

### Before Deployment:

- [ ] All modules save successfully
- [ ] Conflict resolution works for updates
- [ ] Validation errors show in UI
- [ ] Debounce timing works as expected
- [ ] Array modules bulk upsert correctly
- [ ] No race conditions in rapid saves
- [ ] Offline queue functions properly
- [ ] Error recovery works

### Test Scenarios:

- [ ] Create new form with all modules
- [ ] Update existing form data
- [ ] Rapid typing in text fields
- [ ] Network interruption during save
- [ ] Invalid data submission
- [ ] Concurrent user edits
- [ ] **E2E Scenario**: Create FLRA → Fill all modules → Query tables to verify:
  - Exactly one `form_instance_general_info` row with correct `form_id`
  - Exactly one `form_instance_pre_job_checklist` row
  - Exactly one `form_instance_ppe_platform` row
  - Multiple `form_instance_hazards` rows (if added)
  - Multiple `form_asset_photos` rows (if added)
  - Multiple `form_instance_signatures` rows (if added)
  - All foreign keys properly linked

---

## 📚 **REFERENCES**

- [Database Schema](src/db/schema2.sql)
- [Validation Schemas](src/types/formValidationSchemas.ts)
- [Save Service](src/services/forms/saveFormModuleData.ts)
- [Edge Function](supabase/functions/saveFormModuleData/index.ts)

---

**Report Generated**: December 19, 2024  
**Next Review**: After critical fixes implementation  
**Contact**: Development Team Lead
