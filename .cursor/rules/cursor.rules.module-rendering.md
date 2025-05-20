# Cursor AI Rules – Module Renderer Architecture (HrdHat App)

## 🔁 Rendering Control

- ✅ ALL module rendering MUST route through `ModuleRenderer.tsx`.
- ✅ `ModuleRenderer.tsx` MUST use `renderer_key` from the backend to determine which React component to render.
- ✅ Renderer selection MUST go through `rendererMap`. NO switch-case or name-based if/else logic is allowed.

```tsx
const Renderer = rendererMap[module.renderer_key] || GenericModuleRenderer;
return <Renderer {...props} layoutStyle={module.layout_style} />;
```

## 🚫 Renderer Restrictions

- ❌ DO NOT create or import hardcoded renderer files like:
  - `GeneralInformationModule.tsx`
  - `PpeChecklistModule.tsx`
  - `PreJobTaskChecklistModule.tsx`
- ✅ These modules must be handled through `GenericModuleRenderer.tsx` if they use standard fields.

## 🧠 Renderer Map

- ✅ `rendererMap` must contain **only approved keys**, matching `template_modules.renderer_key` exactly:

  - `GenericModuleRenderer`
  - `FlraHeaderModule`
  - `FlraPhotosModule`
  - `SignaturesModule`
  - `TaskHazardControlModule`

- ❌ DO NOT define custom logic outside this map.

## 🎨 Layout Logic

- ✅ `layoutStyle` must be passed from the backend (via `template_modules.layout_style`) into the renderer.
- ✅ It should control visual layout (tight, loose, default) via CSS class or prop.
- ❌ DO NOT hardcode layout styles in JSX or separate field metadata.

## 📦 Folder Structure Enforcement

- ✅ All renderers must live in:
  - `src/modules/` or `src/modules/formmodules/`
- ✅ `ModuleRenderer.tsx` must live in `src/components/`

## 📁 File Preservation

- ✅ The only approved renderers to keep are:
  - `GenericModuleRenderer.tsx`
  - `FlraHeaderModule.tsx`
  - `FlraPhotosModule.tsx`
  - `SignaturesModule.tsx`
  - `TaskHazardControlModule.tsx`

## ⚠️ Legacy Enforcement

- ❌ If a module file was deleted (e.g., `SignatureModule.tsx`, `GeneralInformationModule.tsx`), it MUST NOT be recreated.
- ✅ All deleted renderer files are obsolete and replaced by generic or mapped logic.

## 🛠 Props to Preserve

Every renderer must receive:

- `layoutStyle`
- `fields`
- `moduleId`
- `formId`
- `onChange`, if applicable

Ensure these props are forwarded correctly from the parent form logic.
