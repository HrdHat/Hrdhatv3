# General Info Form Implementation

This document describes the implementation of the General Info form component following industry best practices and the FLRA form save plan.

## Architecture Overview

The implementation follows **Option A** (pass initialData prop) which is the industry standard approach for the following reasons:

### ✅ Benefits of Option A

1. **Single Responsibility Principle** - Components focus on rendering, not data fetching
2. **Performance** - Avoids duplicate API calls and reduces loading states
3. **Consistency** - Aligns with existing `useFlraFormData` hook pattern
4. **Testability** - Components with props are easier to unit test
5. **Clear Data Flow** - Explicit data dependencies make debugging simpler

## Implementation Components

### 1. Debounced Value Hook (`src/hooks/useDebouncedValue.ts`)

```typescript
export default function useDebouncedValue<T>(value: T, delay: number): T;
```

**Purpose**: Delays value updates to prevent excessive API calls during user input.

**Features**:

- Generic type support
- Configurable delay (500ms recommended)
- Automatic cleanup on unmount

### 2. General Info Data Fetcher (`src/services/forms/fetchGeneralInfoData.ts`)

```typescript
export async function fetchGeneralInfoData(
  formModuleId: string
): Promise<FetchGeneralInfoResult>;
```

**Purpose**: Fetches existing General Info data with validation and error handling.

**Features**:

- Zod schema validation
- Proper error handling for "no data found" scenarios
- Development logging
- Type-safe return values

### 3. General Info Form Component (`src/components/GeneralInfoForm.tsx`)

```typescript
type Props = {
  formId: string;
  formModuleId: string;
  initialData: Partial<GeneralInfo> | null;
};
```

**Purpose**: Renders the General Info form with auto-save functionality.

**Features**:

- All fields from `generalInfoShape` schema
- 500ms debounced auto-save
- Real-time save status indicators
- Proper form validation
- Responsive grid layout
- Snake_case field names (matches database)

### 4. Enhanced Form Data Hook (`src/hooks/useFlraFormData.ts`)

**Enhancement**: Added `savedData` property to modules that contains existing form data.

**Features**:

- Fetches saved data for each module type
- Extensible pattern for other module types
- Maintains backward compatibility

## Data Flow

```
1. FlraFormPage loads → useFlraFormData hook
2. Hook fetches form structure + saved data
3. GeneralInfoForm receives initialData prop
4. User types → debounced save → Edge Function
5. Success/error feedback to user
```

## Usage Example

```typescript
// In FlraFormPage.tsx
{
  formData.modules.map((module) => {
    const rendererKey = module.template_modules?.renderer_key;

    if (rendererKey === "general") {
      return (
        <GeneralInfoForm
          key={module.id}
          formId={formId}
          formModuleId={module.id}
          initialData={module.savedData}
        />
      );
    }

    // Other modules use default renderer...
  });
}
```

## Key Features

### ✅ Auto-Save with Debouncing

- 500ms delay after user stops typing
- Prevents API spam during active typing
- Clear visual feedback (saving/success/error)

### ✅ Validation Integration

- Uses existing Zod schemas
- Client-side validation before save
- Server-side validation in Edge Function

### ✅ Error Handling

- Network errors displayed to user
- Validation errors shown inline
- Retry capability on failures

### ✅ Performance Optimized

- Single data fetch at page level
- Debounced saves reduce server load
- Efficient re-renders with React state

### ✅ Type Safety

- Full TypeScript coverage
- Zod schema validation
- Type-safe props and state

## Field Mapping

All form fields use snake_case names that match the database schema:

| Form Field           | Database Column      | Type    | Required |
| -------------------- | -------------------- | ------- | -------- |
| `project_name`       | `project_name`       | text    | Yes      |
| `project_address`    | `project_address`    | text    | No       |
| `task_location`      | `task_location`      | text    | No       |
| `supervisor_name`    | `supervisor_name`    | text    | No       |
| `supervisor_contact` | `supervisor_contact` | text    | No       |
| `date`               | `date`               | date    | No       |
| `crew_members_count` | `crew_members_count` | integer | No       |
| `task_description`   | `task_description`   | text    | No       |
| `start_time`         | `start_time`         | time    | No       |
| `end_time`           | `end_time`           | time    | No       |

## Save Process

1. **User Input** → Local state update
2. **Debounce** → 500ms delay after last change
3. **Validation** → Client-side Zod validation
4. **API Call** → `supabase.functions.invoke("saveFormModuleData")`
5. **Server Validation** → Edge Function validates with Zod
6. **Database Save** → Upsert to `form_instance_general_info`
7. **User Feedback** → Success/error indicator

## Error Scenarios Handled

- **Network failures** - Retry option provided
- **Validation errors** - Field-level error display
- **Server errors** - Clear error messages
- **No existing data** - Graceful handling of new forms
- **Invalid data format** - Schema validation catches issues

## Extending to Other Modules

To add similar functionality for other modules:

1. Create a fetch service (e.g., `fetchPreJobChecklistData.ts`)
2. Add the fetch call to `useFlraFormData.ts`
3. Create a custom form component
4. Add conditional rendering in `FlraFormPage.tsx`

Example for Pre-Job Checklist:

```typescript
// In useFlraFormData.ts
if (rendererKey === "preJobChecklist") {
  const { data } = await fetchPreJobChecklistData(module.id);
  savedData = data;
}

// In FlraFormPage.tsx
if (rendererKey === "preJobChecklist") {
  return (
    <PreJobChecklistForm
      formId={formId}
      formModuleId={module.id}
      initialData={module.savedData}
    />
  );
}
```

## Testing Recommendations

### Unit Tests

- Test debounced value hook with different delays
- Test form component with various initial data states
- Test data fetcher with success/error scenarios

### Integration Tests

- Test complete save flow from form to database
- Test error handling and user feedback
- Test data loading and form initialization

### E2E Tests

- Test user typing and auto-save behavior
- Test form persistence across page reloads
- Test error recovery scenarios

## Performance Considerations

- **Debouncing** prevents excessive API calls
- **Memoization** can be added for expensive computations
- **Lazy loading** for large forms with many modules
- **Optimistic updates** for better perceived performance

## Security Notes

- Uses Supabase RLS for data access control
- All data validated server-side with Zod
- No sensitive data exposed in client code
- Proper error handling prevents information leakage

This implementation provides a solid foundation for the FLRA form system that can be extended to other modules while maintaining consistency and performance.
