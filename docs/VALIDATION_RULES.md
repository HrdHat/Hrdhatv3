# Validation Rules and Enforcement Policy

## Core Validation Rule

**ALL module data and field definitions MUST pass Zod validation before being persisted or used.**

This is not optional. Any code path that skips or swallows validation errors is considered a defect.

## Enforcement Points

### 1. Save Operations

Every save operation MUST validate data before persistence:

```typescript
// REQUIRED: Validate before any save/upsert
const schema = schemaMap[moduleKey];
const result = schema.safeParse(data);
if (!result.success) {
  // REQUIRED: Show error, block save
  const errors = formatZodErrorsWithContext(result.error, moduleKey);
  showToast({
    type: "error",
    message: errors.map((e) => e.message).join("; "),
  });
  return { success: false, validationErrors: errors };
}
// Only proceed if validation passes
```

### 2. Field Definition Rendering

Every dynamic field render MUST validate field definitions:

```typescript
// REQUIRED: Validate field definition before render
const fieldResult = moduleFieldSchema.safeParse(fieldDef);
if (!fieldResult.success) {
  // REQUIRED: Block render, show config error
  console.error("Invalid field definition:", fieldResult.error);
  return <div>Configuration Error: Invalid field definition</div>;
}
// Only render if validation passes
```

### 3. Data Loading

When loading data from the database, validate it matches current schemas:

```typescript
// RECOMMENDED: Validate loaded data
const loadedData = await fetchModuleData(formId, moduleKey);
const validationResult = schemaMap[moduleKey].safeParse(loadedData);
if (!validationResult.success) {
  // Handle legacy/corrupted data
  console.warn("Loaded data failed validation:", validationResult.error);
  // Either migrate data or show user-friendly error
}
```

## Required Code Comments

Add these comment blocks at every validation entry point:

### Save Entry Points

```typescript
/**
 * VALIDATION RULE: All module data must pass Zod validation before save.
 * This prevents invalid data from being persisted to the database.
 * Any validation failure must be shown to the user and block the save.
 */
const result = schema.safeParse(data);
if (!result.success) {
  // Show errors, block save
}
```

### Render Entry Points

```typescript
/**
 * VALIDATION RULE: All field definitions must pass Zod validation before render.
 * This prevents invalid field configurations from breaking the UI.
 * Any validation failure must show a configuration error.
 */
const fieldResult = moduleFieldSchema.safeParse(fieldDef);
if (!fieldResult.success) {
  // Block render, show config error
}
```

## File-by-File Enforcement

### Core Save Services

#### `src/services/forms/saveFormModuleData.ts`

- ✅ **ENFORCED**: Validates all module data with `formatZodErrorsWithContext`
- ✅ **ENFORCED**: Returns validation errors to caller
- ✅ **ENFORCED**: Blocks save on validation failure

#### `src/services/forms/validatedSaveService.ts`

- ✅ **ENFORCED**: Implements error boundary pattern
- ✅ **ENFORCED**: Shows toast notifications for validation failures
- ✅ **ENFORCED**: Never saves invalid data

### Form Rendering Components

#### `src/modules/GenericModuleRenderer.tsx`

- ✅ **ENFORCED**: Integrates with ValidationContext
- ✅ **ENFORCED**: Shows inline validation errors
- ✅ **ENFORCED**: Validates field types before rendering

#### `src/components/shared/FormField.tsx`

- ✅ **ENFORCED**: Shows validation errors inline
- ✅ **ENFORCED**: Clears errors on user input
- ✅ **ENFORCED**: Proper ARIA attributes for accessibility

### Validation Context

#### `src/contexts/ValidationContext.tsx`

- ✅ **ENFORCED**: Centralized validation state management
- ✅ **ENFORCED**: Provides validation utilities to all components

## Validation Schema Requirements

### Module Schemas (`src/types/formValidationSchemas.ts`)

Each module schema MUST:

- ✅ Match database column names exactly (snake_case)
- ✅ Match database column types exactly
- ✅ Handle nullable fields correctly
- ✅ Include all required fields
- ✅ Use strict validation (`.strict()` where appropriate)

### Field Definition Schemas

Field schemas MUST:

- ✅ Use discriminated unions for type-specific validation
- ✅ Ensure only select/multiselect fields have options
- ✅ Validate field names, labels, and types
- ✅ Enforce proper field ordering

## Error Handling Standards

### User-Facing Errors

All validation errors MUST:

- ✅ Use user-friendly field names (e.g., "Task #1" not "0.task")
- ✅ Show clear, actionable error messages
- ✅ Appear inline at the relevant field/module
- ✅ Include toast notifications for immediate feedback

### Developer Errors

Configuration errors MUST:

- ✅ Log detailed error information to console
- ✅ Show "Configuration Error" message to users
- ✅ Prevent broken UI from rendering
- ✅ Include schema validation details in logs

## Testing Requirements

### Unit Tests

MUST test that:

- ✅ Invalid payloads are always rejected
- ✅ Valid payloads always pass validation
- ✅ Error messages are user-friendly
- ✅ Field definitions validate correctly

### Integration Tests

MUST test that:

- ✅ End-to-end save flows validate data
- ✅ UI shows validation errors correctly
- ✅ Users can fix validation errors
- ✅ Validation errors clear appropriately

## Migration and Legacy Data

### Data Migration

When schemas change:

1. **REQUIRED**: Update Zod schemas first
2. **REQUIRED**: Test with existing data
3. **REQUIRED**: Create migration scripts for invalid data
4. **REQUIRED**: Handle validation failures gracefully during transition

### Legacy Data Handling

For existing invalid data:

- ✅ Log validation failures
- ✅ Show user-friendly migration prompts
- ✅ Provide data correction tools
- ✅ Never silently ignore validation errors

## Monitoring and Alerts

### Production Monitoring

SHOULD monitor:

- Validation failure rates by module
- Common validation error patterns
- User impact of validation failures
- Performance impact of validation

### Development Alerts

MUST alert on:

- New validation failures in tests
- Schema drift between environments
- Missing validation in new code paths
- Performance regressions in validation

## Code Review Checklist

When reviewing code, verify:

- [ ] All save operations validate data before persistence
- [ ] All field renders validate definitions before display
- [ ] Validation errors are shown to users, not just logged
- [ ] Error messages are user-friendly and actionable
- [ ] Validation failures block the problematic operation
- [ ] Required comment blocks are present at validation points
- [ ] Tests cover both valid and invalid data scenarios
- [ ] No validation bypasses or silent error swallowing

## Common Anti-Patterns to Avoid

### ❌ DON'T: Skip validation for "trusted" data

```typescript
// WRONG: Never skip validation
if (isTrustedSource) {
  await saveDirectly(data); // ❌ DEFECT
}
```

### ❌ DON'T: Silently ignore validation errors

```typescript
// WRONG: Never ignore validation failures
const result = schema.safeParse(data);
if (!result.success) {
  console.log("Validation failed"); // ❌ DEFECT - should show user error
}
await save(data); // ❌ DEFECT - saving invalid data
```

### ❌ DON'T: Use .parse() instead of .safeParse()

```typescript
// WRONG: .parse() throws exceptions
const validData = schema.parse(data); // ❌ DEFECT - can crash app
```

### ✅ DO: Always use the validation pattern

```typescript
// CORRECT: Always validate and handle errors
const result = schema.safeParse(data);
if (!result.success) {
  const errors = formatZodErrorsWithContext(result.error, moduleKey);
  showToast({
    type: "error",
    message: errors.map((e) => e.message).join("; "),
  });
  return { success: false, validationErrors: errors };
}
// Proceed with valid data
```

## Implementation Status

- ✅ **Core validation rule documented**
- ✅ **Enforcement points identified**
- ✅ **Required comment blocks specified**
- ✅ **File-by-file enforcement documented**
- ✅ **Schema requirements defined**
- ✅ **Error handling standards established**
- ✅ **Testing requirements specified**
- ✅ **Migration guidelines provided**
- ✅ **Code review checklist created**
- ✅ **Anti-patterns documented**

This completes section 1.3.5 D (Documentation and Enforcement) of the validation implementation plan.
