# Form Save Rules

## When to Use `saveFormModuleData`

`saveFormModuleData` is the primary service for saving form data. It provides:

- Runtime validation using Zod schemas
- Consistent error handling
- Safe database writes
- Version tracking
- Timestamp management

Use `saveFormModuleData` for:

1. All form module data saves (header, general info, checklists, etc.)
2. Any user-editable form data
3. Any data that needs validation before saving
4. Any data that should be versioned

## When to Bypass `saveFormModuleData`

Some operations should bypass `saveFormModuleData` due to their specialized nature:

### 1. File Operations

- **Photos**: `uploadPhotoToSupabase`, `uploadImageToFormModule`

  - Handle file validation
  - Manage storage buckets
  - Generate signed URLs
  - Handle concurrent uploads
  - Provide preview URLs

- **Signatures**: `uploadSignatureToSupabase`
  - Generate cryptographic hashes
  - Handle secure storage
  - Manage role-based metadata
  - Generate signed URLs

### 2. Form Creation/Setup

- `createForm`
- `createFormModule`
- `createFormModuleField`
- `createFormWithModules`
  - These are initialization operations
  - They set up the form structure
  - They're not user-editable data

### 3. Admin Operations

- User preferences
- Authentication
- Migration scripts
- One-off data fixes

### 4. Read-Only Operations

- Data fetching
- Cache updates
- UI state management

## Best Practices

1. **Always Validate**: Even when bypassing `saveFormModuleData`, ensure proper validation
2. **Document Bypasses**: Add comments explaining why a service bypasses `saveFormModuleData`
3. **Consistent Error Handling**: Follow the same error format as `saveFormModuleData`
4. **Security**: Ensure RLS policies are properly configured for all database operations
5. **Testing**: Include validation in tests for both direct and `saveFormModuleData` saves

## Example Usage

```typescript
// ✅ Correct: Using saveFormModuleData for form data
const result = await saveFormModuleData({
  formId,
  moduleKey: "header",
  data: formData,
});

// ✅ Correct: Bypassing for file operations
const photoResult = await uploadPhotoToSupabase({
  formId,
  file,
  metadata,
});

// ❌ Incorrect: Direct Supabase write for form data
const { error } = await supabase.from(TABLES.formInstances).upsert(formData);
```
