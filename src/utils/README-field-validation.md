# Field Validation System 🔍

A comprehensive validation system to ensure your field constants in `database.ts` stay in sync with your actual database schema.

## 📁 Files Overview

- **`fieldMapValidation.ts`** - Core field validation logic
- **`fieldComparisonHelper.ts`** - Database comparison utilities
- **`field-validation-queries.sql`** - SQL queries for schema validation
- **`startupValidation.ts`** - Runs field validation at app startup

## 🚀 Quick Start

The field validation runs automatically when your app starts. If there are any issues, you'll see clear error messages in the console.

## 🔧 What It Validates

### 1. **Field Constant Structure**

- Ensures all field constants are properly defined
- Checks for empty field constants
- Detects duplicate field values (common copy-paste errors)

### 2. **Naming Conventions**

- **Field names**: Must follow `snake_case` (e.g., `form_id`, `created_at`)
- **Constant keys**: Must follow `camelCase` (e.g., `formId`, `createdAt`)

### 3. **Database Schema Sync** (Manual)

- Compare field constants with live database schema
- Identify missing or extra fields
- Ensure perfect synchronization

## 📊 Current Field Constants

The system validates these 16 field constants:

| Constant                          | Table                             | Fields    |
| --------------------------------- | --------------------------------- | --------- |
| `FORM_INSTANCE_FIELDS`            | `form_instances`                  | 17 fields |
| `FORM_INSTANCE_GENERAL_INFO`      | `form_instance_general_info`      | 13 fields |
| `FORM_INSTANCE_HAZARDS`           | `form_instance_hazards`           | 9 fields  |
| `FORM_INSTANCE_PPE_PLATFORM`      | `form_instance_ppe_platform`      | 21 fields |
| `FORM_INSTANCE_PRE_JOB_CHECKLIST` | `form_instance_pre_job_checklist` | 22 fields |
| `FORM_INSTANCE_SIGNATURES`        | `form_instance_signatures`        | 10 fields |
| `FORM_ASSET_PHOTOS`               | `form_asset_photos`               | 12 fields |
| `FORM_DATA_ENTRIES`               | `form_data_entries`               | 6 fields  |
| `FORM_TEMPLATES`                  | `form_templates`                  | 7 fields  |
| `FORM_TEMPLATE_MODULES`           | `form_template_modules`           | 5 fields  |
| `TEMPLATE_MODULES`                | `template_modules`                | 11 fields |
| `TEMPLATE_MODULE_FIELDS`          | `template_module_fields`          | 12 fields |
| `COMPANIES`                       | `companies`                       | 3 fields  |
| `PROFILES`                        | `profiles`                        | 11 fields |
| `PROJECTS`                        | `projects`                        | 4 fields  |
| `USER_FORM_MODULE_PREFERENCES`    | `user_form_module_preferences`    | 7 fields  |

## 🛠️ Manual Database Validation

### Step 1: Run SQL Queries

Use the queries in `field-validation-queries.sql` to get your database schema:

```sql
-- Example: Get form_instances columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'form_instances'
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

### Step 2: Compare with Constants

```typescript
import {
  generateFieldComparisonReport,
  printFieldComparisonReport,
  DatabaseColumn,
} from "./utils/fieldComparisonHelper";

// Your database query results
const databaseResults = {
  FORM_INSTANCE_FIELDS: [
    { column_name: "id", data_type: "uuid", is_nullable: "NO" },
    { column_name: "form_number", data_type: "text", is_nullable: "YES" },
    // ... more columns from your database
  ],
  // ... more tables
};

// Generate comparison report
const results = generateFieldComparisonReport(databaseResults);
printFieldComparisonReport(results);
```

### Step 3: Fix Any Issues

The report will show you exactly what needs to be fixed:

```
❌ FORM_INSTANCE_FIELDS (form_instances)
   Missing in constant: new_column_name
   Missing in database: old_column_name
   Matching fields: 15
```

## 🎯 Example Validation Output

### ✅ Success

```
🚀 Running startup validation checks...
🔍 Validating table mappings...
✅ Table validation passed! All 7 table mappings are valid
🔍 Validating field constants...
✅ Field validation passed! Validated 16 field constants
✅ All startup validation checks passed!
```

### ❌ Failure Examples

**Structure Error:**

```
❌ Field constant structure validation failed:
  FORM_INSTANCE_FIELDS (form_instances):
    Issues: Duplicate field values: id, created_at
```

**Naming Convention Error:**

```
❌ Field naming convention validation failed:
  FORM_INSTANCE_FIELDS.formId: "form-id" doesn't follow snake_case convention
  FORM_INSTANCE_FIELDS.form_id: constant key doesn't follow camelCase convention
```

## 🔄 Integration

### Automatic Validation

Field validation runs automatically at app startup via `main.tsx`:

```typescript
import { runStartupValidation } from "./utils/startupValidation";

// Runs table + field validation
runStartupValidation();
```

### Manual Validation

```typescript
import { validateFields } from "./utils/fieldMapValidation";

// Run field validation only
validateFields();
```

### Development Only

```typescript
import { runDevValidation } from "./utils/startupValidation";

// Only runs in development mode
runDevValidation();
```

## 🚨 Error Prevention

This system prevents common issues:

1. **Typos in field names** - Catches `form_id` vs `form_idd`
2. **Missing fields** - Alerts when database has new columns
3. **Orphaned constants** - Finds constants for non-existent fields
4. **Naming inconsistencies** - Enforces snake_case/camelCase conventions
5. **Duplicate mappings** - Prevents copy-paste errors

## 🔧 Customization

### Add New Field Constants

1. **Add to `database.ts`:**

```typescript
export const NEW_TABLE_FIELDS = {
  id: "id",
  name: "name",
  createdAt: "created_at",
} as const;
```

2. **Update `fieldMapValidation.ts`:**

```typescript
// Add to fieldConstantMap
NEW_TABLE_FIELDS: TABLES.newTable,

// Add to fieldConstants
NEW_TABLE_FIELDS,
```

3. **Add SQL query to `field-validation-queries.sql`**

### Modify Validation Rules

Edit `validateFieldNamingConventions()` in `fieldMapValidation.ts` to customize naming rules.

## 📈 Benefits

- **🛡️ Prevents runtime errors** from field mismatches
- **⚡ Fast feedback** - catches issues at startup
- **📝 Clear error messages** - tells you exactly what to fix
- **🔄 Automated checks** - no manual validation needed
- **📊 Comprehensive coverage** - validates all 16 field constants
- **🎯 TypeScript safe** - maintains type safety

## 🤝 Working with Database Changes

### When you add a new database column:

1. Run the SQL queries to get updated schema
2. Add the new field to your constant
3. Restart your app - validation will confirm it's correct

### When you remove a database column:

1. Remove the field from your constant
2. Update any code that references it
3. Validation will confirm the constant is clean

This system ensures your field constants never drift from your actual database schema! 🎉
