# Table Map Validation System

This validation system ensures that your `tableMap` in `saveFormModuleData.ts` stays in sync with your `TABLES` constant in `database.ts`. If there are any mismatches, your app will crash immediately at startup with a clear error message.

## How it works

The validation system checks:

1. **Invalid Tables**: Every value in `tableMap` must be a key in your `TABLES` object
2. **Missing Keys**: Every `ModuleKey` must have a corresponding entry in `tableMap`
3. **Invalid Mappings**: All `tableMap` values must point to valid table names from the `TABLES` constant

## Usage

### Option 1: Run validation at startup (Recommended)

Add this to the top of your `main.tsx` or `App.tsx`:

```typescript
import { runStartupValidation } from "./utils/startupValidation";

// Run validation before anything else
runStartupValidation();

// Rest of your app initialization...
```

### Option 2: Run validation in development only

```typescript
import { runDevValidation } from "./utils/startupValidation";

// Only runs in development mode
runDevValidation();
```

### Option 3: Manual validation

```typescript
import { validateTableMap } from "./utils/tableMapValidation";

try {
  validateTableMap();
  console.log("All good!");
} catch (error) {
  console.error("Validation failed:", error.message);
}
```

## Example Error Messages

If you have a typo or missing table, you'll see errors like:

```
❌ Invalid table name(s) in tableMap: form_instance_general_infoo.
Check your database.ts TABLES constant for typos or missing entries.
```

```
❌ Missing tableMap entries for moduleKey(s): newModule.
```

```
❌ Invalid table mappings in tableMap: photos -> wrong_table_name.
These table names don't exist in the TABLES constant.
```

## Success Output

When everything is in sync, you'll see:

```
🔍 Validating tableMap against TABLES constant...
✅ tableMap and TABLES are in sync
✅ Validated 7 module mappings
✅ All mappings point to valid tables in TABLES constant
```

## Current Mappings

The system validates these module-to-table mappings:

- `header` → `form_instances`
- `general` → `form_instance_general_info`
- `preJobChecklist` → `form_instance_pre_job_checklist`
- `ppeChecklist` → `form_instance_ppe_platform`
- `taskHazards` → `form_instance_hazards`
- `photos` → `form_asset_photos`
- `signatures` → `form_instance_signatures`

## Debugging

Use `getTableMapSummary()` to get a detailed view of the current mappings:

```typescript
import { getTableMapSummary } from "./utils/tableMapValidation";

console.log(getTableMapSummary());
// Output: { moduleKeys: [...], tableMappings: {...}, totalMappings: 7, allTablesExist: true }
```
