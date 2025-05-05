# ITCSS Layer Rules (HrdHat Project)

This project uses the [ITCSS](https://www.creativebloq.com/web-design/manage-large-css-projects-itcss-101517528) (Inverted Triangle CSS) methodology to organize and scale CSS. All contributors must follow these rules strictly. Stylelint is configured to help enforce these rules.

---

## 📐 Layers (in this order)

1. **settings/**
   - Only `:root` and `:where()` selectors
   - CSS variables only (`--color-primary`, etc.)
   - No classes, no IDs, no properties other than `--vars`

2. **tools/**
   - Mixins, helper classes, font stacks
   - No output selectors (used by preprocessor logic)

3. **generic/**
   - Normalize.css, box-sizing, reset
   - Only use tag selectors (`html`, `body`, `*`)
   - No class or ID selectors

4. **base/**
   - Styling for `h1`, `p`, `a`, `ul`, etc.
   - No classes or IDs
   - No CSS variables (use raw CSS only)

5. **objects/**
   - Structural layout (e.g., `.o-container`, `.o-grid`)
   - Classes only — never use IDs or tags
   - Cannot use visual properties like `color`, `background`

6. **components/**
   - Visual building blocks (`.btn`, `.card`, `.modal`)
   - Class selectors only
   - No `#id`, no tag selectors (e.g., `button {}` is wrong)
   - Can use CSS variables

7. **utilities/**
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

```
src/styles/
├── settings/
├── tools/
├── generic/
├── base/
├── objects/
├── components/
├── utilities/
```

---

## 🛠 Stylelint

Stylelint is configured in `.stylelintrc.json` to enforce as many ITCSS rules as possible, including:
- No hex codes (`color-no-hex`)
- Restrict `!important` to `utilities/`
- Restrict selector types per folder
- Enforce class naming patterns for `objects/` and `components/`

To lint your styles, run:

```
npm run lint:css
```

(See `package.json` for the script.)

---

## 📚 Resources
- [ITCSS: Scalable and Maintainable CSS Architecture](https://www.creativebloq.com/web-design/manage-large-css-projects-itcss-101517528)
- [Stylelint](https://stylelint.io/) 