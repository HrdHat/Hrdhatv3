@description Enforces strict HRDHAT architecture rules (React + TypeScript + Supabase)

@rule FileStructure
- All files must live inside `src/`
- Do not create files directly in `src/`; use predefined folders only

@rule FolderPurpose
- `src/config/`: Only static values (tokens, routes, constants). No logic.
- `src/utils/`: Only pure functions, no JSX, no imports from components/modules/layout.
- `src/db/`: Supabase queries only. Do not import UI or hooks.
- `src/services/`: API logic (auth, PDF, external). May import from `db/` but not `components/`
- `src/hooks/`: Generic reusable hooks only. No module-specific logic.
- `src/layout/`: AppShell, Sidebar, ContentRegion. No business logic or DB queries.
- `src/components/`: Stateless, visual UI parts. No Supabase, routing, or logic allowed.
- `src/modules/`: FLRA and other app features. Contains forms, hooks, services, and feature-specific components.
- `src/views/mobile|desktop/`: Top-level page views for each platform. Use layout and modules only.
- `src/pages/`: Route entry points only (e.g. `index.tsx`). Nothing else.
- `src/types/`: Shared TypeScript types. No logic, no imports from `src/` folders.
- `src/styles/`: Organized via ITCSS.

@rule ITCSS
- Enforce these subfolders in `src/styles/`: `settings/`, `tools/`, `generic/`, `base/`, `objects/`, `components/`, `utilities/`
- Only `:root` allowed in `settings/`
- No class/ID selectors in `generic/`
- Only tag selectors allowed in `base/`
- No raw hex values anywhere (use CSS vars)
- No `!important`
- No type-qualified selectors (e.g. `input[type=checkbox]`)
- No duplicate selectors across layers

@rule React
- Components must be PascalCase
- Component files must match their folder name
- Avoid default exports
- Only `components/` can define visual JSX
- `layout/` and `views/` are for structure, not logic
- Use `.tsx` for any file containing JSX
- `App.tsx` handles routing only
- `main.tsx` bootstraps the app only

@rule Supabase
- Only `src/db/` and `src/services/` may contain Supabase code
- Do not use Supabase directly in views, components, or layout

@rule FormArchitecture
- All FLRA form builders live in `modules/flra/forms/`
- Each form must be in its own file/module
- Use shared form types from `types/formTypes.ts`

@rule PlatformSeparation
- Use `src/views/desktop/` for desktop-specific pages
- Use `src/views/mobile/` for mobile-specific pages
- Do not share layout or component files unless they live in `src/layout/` or `src/components/shared/`

@rule CursorAI
- Do not generate or modify `AppShell.tsx`, `main.tsx`, or files in `.cursorignore`
- Obey all `.mdc` rules strictly — no code outside these boundaries
- Do not generate logic in `.md` or `.css` files
- If a violation is needed to "make it work", flag it for review instead of fixing silently
