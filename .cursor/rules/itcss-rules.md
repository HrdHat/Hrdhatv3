# ITCSS Layer Rules (HrdHat Project)

These rules define how styles are layered, scoped, and imported. Cursor must follow this layering strictly and reject any suggestions or imports that break the hierarchy.

---

## 📐 Layers (in this order)

1. `settings/`
   - Only `:root` and `:where()` selectors
   - CSS variables only (`--color-primary`, etc.)
   - No classes, no IDs, no properties other than `--vars`

2. `tools/`
   - Mixins, helper classes, font stacks
   - No output selectors (used by preprocessor logic)

3. `generic/`
   - Normalize.css, box-sizing, reset
   - Only use tag selectors (`html`, `body`, `*`)
   - No class or ID selectors

4. `base/`
   - Styling for `h1`, `p`, `a`, `ul`, etc.
   - No classes or IDs
   - No CSS variables (use raw CSS only)

5. `objects/`
   - Structural layout (e.g., `.o-container`, `.o-grid`)
   - Classes only — never use IDs or tags
   - Cannot use visual properties like `color`, `background`

6. `components/`
   - Visual building blocks (`.btn`, `.card`, `.modal`)
   - Class selectors only
   - No `#id`, no tag selectors (e.g., `button {}` is wrong)
   - Can use CSS variables

7. `utilities/`
   - One-property classes (`.text-left`, `.m-1`)
   - Use `!important` if necessary
   - Must not contain compound rules or nesting

---

## 🚫 Forbidden Globally

- No raw hex codes — only `var(--colors)`
- No `!important` except in `utilities/`
- No type-qualified selectors (e.g. `input[type=checkbox]`)
- No duplicate selectors across layers
- No overrides in `components/` — use `utilities/` or new class

---

## 📂 Layer Directory Mapping

```txt
src/styles/
├── settings/
├── tools/
├── generic/
├── base/
├── objects/
├── components/
├── utilities/