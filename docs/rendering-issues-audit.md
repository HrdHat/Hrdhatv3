# Rendering Structure Audit: Issues & Findings

## 1. Infinite Render Loop in `FlraHeaderModule.tsx`
**Issue:**
- Maximum update depth exceeded (infinite render loop).

**Root Cause:**
- `useEffect` depends on a function (e.g., `saveInstanceData`) that is re-created every render, often because it depends on `instance` or is defined inline.
- This causes the effect to re-run on every render, creating a loop.

**Recommended Fix:**
- Use `useCallback` to memoize callbacks and minimize dependencies.
- Depend on the actual data (`instance`), not the callback, in `useEffect`.
- Example:
  ```tsx
  const saveInstanceData = useCallback(() => { /* ... */ }, [instance]);
  useEffect(() => { saveInstanceData(); }, [instance]);
  ```

---

## 2. Renderer Registry Mismatch (Vite MIME/case errors)
**Issue:**
- Files like `FlraHeaderModule` are present, but Vite throws MIME or case errors.

**Root Cause:**
- Import paths must match file names exactly (including case).
- On case-sensitive file systems, mismatched casing causes import failures.
- Vite hot reload can get confused if files are renamed with only a case change.

**Recommended Fix:**
- Audit all imports and filenames for case consistency.
- Restart Vite after renaming files.
- Never mix case in imports and filenames.
- Check for duplicate files with different casing.

---

## 3. GenericModuleRenderer: Labels Not Displayed
**Issue:**
- All fields render, but no labels are visible.

**Root Cause:**
- Inputs are rendered without `<label>` elements.
- If `field.label` is missing or empty, nothing shows.

**Recommended Fix:**
- Wrap every input in a `<label>` or add a `<label htmlFor={id}>` before the input.
- Ensure `field.label` is always present (fallback to `field.name` if needed).

---

## 4. Supabase Queries: `form_module_id=undefined`
**Issue:**
- Supabase queries are sent with `form_module_id=undefined`, causing 400 errors.

**Root Cause:**
- The prop `formModuleId` is not being passed or is undefined when used in a query.

**Recommended Fix:**
- Add debug logging for all critical props.
- Trace prop propagation from parent to child.
- Use TypeScript to enforce required props.
- Add error handling for missing/undefined values.

---

## 5. "Unknown field type: text" Warning Spam
**Issue:**
- Console is spammed with warnings for "Unknown field type: text" even though the case is handled.

**Root Cause:**
- Field type is not normalized (e.g., "Text" vs "text").
- Switch/case logic may not be correct.

**Recommended Fix:**
- Normalize all field types to lowercase before the switch.
- Only warn for truly unknown types.
- Remove or silence the warning for "text" if it is handled.

---

## Full Project Audit Checklist
- Audit all `useEffect` and callback dependencies.
- Add logging for all critical props.
- Check all import paths for case sensitivity.
- Ensure all fields have visible labels.
- Log all query parameters and add error handling.
- Normalize all field types and only warn for unknown types. 