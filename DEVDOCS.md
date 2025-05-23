# Form Validation Documentation

## Critical Rules

### Schema Map is Law

> **IMPORTANT**: All save logic and field rendering MUST use these schemas, and ONLY these schemas, for all runtime validation. Any bypass is a defect and subject to removal in code review.

- No duplicate validation logic
- No hand-written types
- No runtime type checks without schema validation
- No direct database saves without validation

### Location and Import Pattern

All validation logic is centralized in `src/types/formValidationSchemas.ts`. Import from here only—never duplicate or hand-write types/schemas elsewhere.

```typescript
// ✅ CORRECT: Import from central location
import { validateModuleData, validateFieldDefinition } from '../types/formValidationSchemas';

// ❌ INCORRECT: Don't duplicate schemas
import { z } from 'zod';
const mySchema = z.object({ ... }); // Don't do this!
```

### Legacy Data Notice

> **IMPORTANT**: No legacy form data exists as of this deployment. Full revalidation will be required on future schema changes once production data is present.

When updating schemas in the future:

1. Document all changes in Git
2. Create migration scripts
3. Test against existing data
4. Plan for data cleanup if needed

### Versioning and Migration

Schema versioning and migration must be tracked in Git. Always update schema versions and add migration notes for breaking changes.

```typescript
// Example of version tracking in schema
export const formInstanceSchema = z.object({
  // ... other fields ...
  version: z.number().int().min(1, "Version must be 1 or greater"),
  // Track schema version separately from form version
  schema_version: z.number().int().min(1).default(1),
});
```

## Form Validation Schemas

The form validation system uses Zod schemas to ensure type safety and data integrity across the application. This document outlines the available schemas, their usage patterns, and best practices.

### Core Principles

1. **Single Source of Truth**: All form data validation is defined in `src/types/formValidationSchemas.ts`
2. **Strict by Default**: Use strict validation for production data
3. **Fail Fast**: Validate early and show clear error messages
4. **Type Safety**: Leverage TypeScript types inferred from schemas

### Available Schemas

#### Module Data Schemas

- `generalInfoSchema`: General form information
- `preJobChecklistSchema`: Pre-job safety checklist
- `ppeChecklistSchema`: PPE and platform requirements
- `taskHazardControlSchema`: Task hazards and controls
- `formAssetPhotoSchema`: Form photos
- `signatureSchema`: Worker signatures
- `formInstanceSchema`: Form header/metadata

#### Field Definition Schemas

- `moduleFieldSchemaStrict`: Strict validation for saved fields
- `moduleFieldSchemaLoose`: Loose validation for form builder

### Usage Patterns

#### 1. Validating Module Data with Error Handling

```typescript
import { validateModuleData } from "../types/formValidationSchemas";
import { z } from "zod";

// Helper to flatten Zod errors for display
function formatZodErrors(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

// In your save function
const saveModuleData = async (moduleKey: ModuleKey, data: unknown) => {
  const result = validateModuleData(moduleKey, data);

  if (!result.success) {
    // Format errors for UI display
    const errors = formatZodErrors(result.error);
    showValidationErrors(errors);
    return;
  }

  // Data is valid, proceed with save
  const validData = result.data;
  await saveToDatabase(validData);
};
```

#### 2. Validating Field Definitions

```typescript
import { validateFieldDefinition } from "../types/formValidationSchemas";

// In form builder
const validateField = (fieldDef: unknown) => {
  // Use loose validation for form builder
  const result = validateFieldDefinition(fieldDef, false);

  if (!result.success) {
    // Show validation errors in UI
    const errors = formatZodErrors(result.error);
    return {
      isValid: false,
      errors,
    };
  }

  return { isValid: true, field: result.data };
};

// In save function
const saveField = async (fieldDef: unknown) => {
  // Use strict validation before saving
  const result = validateFieldDefinition(fieldDef, true);

  if (!result.success) {
    const errors = formatZodErrors(result.error);
    throw new Error(`Invalid field definition: ${JSON.stringify(errors)}`);
  }

  await saveFieldToDatabase(result.data);
};
```

#### 3. Type Safety with Inferred Types

```typescript
import type {
  ModuleData,
  ModuleFieldStrict,
} from "../types/formValidationSchemas";

// Type-safe module data
const moduleData: ModuleData = {
  header: {
    /* ... */
  },
  general: {
    /* ... */
  },
  // TypeScript will enforce correct structure
};

// Type-safe field definition
const fieldDef: ModuleFieldStrict = {
  id: "uuid",
  form_id: "uuid",
  // TypeScript will enforce correct structure
};
```

### Best Practices

1. **Always Use `.safeParse()`**

   - Never use `.parse()` in production code
   - Handle validation errors gracefully
   - Show user-friendly error messages

2. **Choose the Right Schema**

   - Use strict schemas for saved data
   - Use loose schemas for form builder/preview
   - Never bypass validation

3. **Error Handling**

   ```typescript
   const result = validateModuleData(moduleKey, data);
   if (!result.success) {
     // Show errors in UI
     const errors = formatZodErrors(result.error);
     showValidationErrors(errors);
     return;
   }
   ```

4. **Type Safety**
   - Use inferred types from schemas
   - Let TypeScript catch type errors at compile time
   - Avoid type assertions

### Common Patterns

#### Form Builder

```typescript
// Loose validation for form builder
const validateBuilderField = (field: unknown) => {
  return validateFieldDefinition(field, false);
};
```

#### Form Save

```typescript
// Strict validation for saved data
const validateSavedField = (field: unknown) => {
  return validateFieldDefinition(field, true);
};
```

#### Form Preview

```typescript
// Loose validation for preview
const validatePreviewData = (moduleKey: ModuleKey, data: unknown) => {
  // Use loose validation for preview
  const schema = schemaMap[moduleKey];
  return schema.safeParse(data);
};
```

### Testing

Always test both valid and invalid cases:

```typescript
describe("Form Validation", () => {
  it("validates correct data", () => {
    const result = validateModuleData("general", validData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid data", () => {
    const result = validateModuleData("general", invalidData);
    expect(result.success).toBe(false);
    expect(result.error.issues).toHaveLength(1);
  });
});
```

### Migration Guide

When updating schemas:

1. Update the schema definition
2. Update tests
3. Update type usage
4. Run validation on existing data
5. Update UI components if needed

### Troubleshooting

Common issues and solutions:

1. **Type Mismatch**

   - Check field names match DB columns
   - Verify data types match schema
   - Use TypeScript for compile-time checks

2. **Validation Errors**

   - Check error messages for specific issues
   - Verify required fields are present
   - Check data format (dates, UUIDs, etc.)

3. **Schema Updates**
   - Update both strict and loose schemas
   - Update tests
   - Update UI components
   - Validate existing data
