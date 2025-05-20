# ✅ HrdHat Module Renderer Logic – Implementation Checklist

---

## 📦 1. PROJECT STRUCTURE

- [x] Ensure the following renderer files exist:

  - [x] `src/modules/GenericModuleRenderer.tsx`
  - [x] `src/modules/formmodules/FlraHeaderModule.tsx`
  - [x] `src/modules/formmodules/FlraPhotosModule.tsx`
  - [x] `src/modules/formmodules/SignaturesModule.tsx`
  - [x] `src/modules/formmodules/TaskHazardControlModule.tsx`

- [x] Confirm `ModuleRenderer.tsx` exists at:
  - [x] `src/components/ModuleRenderer.tsx`

---

## 🗺️ 2. RENDERER MAP LOGIC

- [x] In `ModuleRenderer.tsx`, define a map:

```tsx
import GenericModuleRenderer from "@/modules/GenericModuleRenderer";
import FlraHeaderModule from "@/modules/formmodules/FlraHeaderModule";
import FlraPhotosModule from "@/modules/formmodules/FlraPhotosModule";
import SignaturesModule from "@/modules/formmodules/SignaturesModule";
import TaskHazardControlModule from "@/modules/formmodules/TaskHazardControlModule";

export const rendererMap = {
  GenericModuleRenderer,
  FlraHeaderModule,
  FlraPhotosModule,
  SignaturesModule,
  TaskHazardControlModule,
};
```

- [x] Ensure fallback logic is implemented:

```tsx
const Renderer = rendererMap[module.renderer_key] || GenericModuleRenderer;
return <Renderer {...props} layoutStyle={module.layout_style} />;
```

---

## 🎨 3. LAYOUT STYLES

- [ ] Pass `layoutStyle` prop into all renderers
- [ ] In each renderer, apply it as a CSS class:

```tsx
<div className={`module-wrapper layout-${layoutStyle}`}>
```

- [ ] Define base layout styles in CSS:

```css
.layout-tight {
  padding: 0.5rem;
  gap: 0.25rem;
}
.layout-loose {
  padding: 2rem;
  gap: 1rem;
}
.layout-default {
  padding: 1rem;
  gap: 0.5rem;
}
```

---

## 🧼 4. CLEANUP (HARD ENFORCEMENT)

- [x] Delete the following obsolete files if not already removed:

  - [ ] `GeneralInformationModule.tsx`
  - [ ] `PreJobTaskChecklistModule.tsx`
  - [ ] `PpeChecklistModule.tsx`
  - [ ] `TaskHazardModule.tsx`
  - [ ] `SignatureModule.tsx`

- [ x Search project for these **and delete any references**:

```txt
import ...GeneralInformationModule
import ...PpeChecklistModule
switch (module.name)
if (module.name === 'task_hazard_control')
```

---

## 🧪 5. TEST EACH MODULE RENDERING

For each module row in the DB, verify:

- [x] Correct renderer is selected from `renderer_key`
- [ ] `layout_style` is passed and applied visually
- [ ] Generic modules render fields from DB
- [ ] Special modules (`photos`, `signatures`, `task_hazard`) still function

---

## 🔒 6. ENFORCE WITH CURSOR AI

- [ ] Place `cursor.rules.module-rendering.md` in project root
- [ ] Run through Cursor and verify:
  - [ ] It does not suggest re-creating deleted module files
  - [ ] It uses `rendererMap` correctly in any generated logic

---

## 🧭 7. OPTIONAL: TIGHTEN LINTING OR `.cursorignore`

- [ ] Optionally protect `ModuleRenderer.tsx` from accidental edits:

```bash
# .cursorignore
src/components/ModuleRenderer.tsx
```

---

# ✅ You are now rendering modularly and cleanly with full backend control.
