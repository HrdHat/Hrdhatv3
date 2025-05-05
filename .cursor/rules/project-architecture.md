# HrdHat Code Architecture Rules for Cursor AI

These are strict rules that Cursor must follow when modifying or generating code. Violations of these rules are considered boundary breaks and should be blocked or flagged.

---

## 📁 Folder Responsibilities

| Folder       | Purpose                                                  |
|--------------|----------------------------------------------------------|
| `assets/`    | Static files (images, icons, fonts)                      |
| `components/`| Visual building blocks (e.g., Button, Input). No logic. |
| `config/`    | Static configuration (env, tokens, constants). No imports allowed. |
| `db/`        | Direct Supabase queries only. No app logic here.        |
| `guards/`    | Route guards and auth wrappers.                         |
| `layout/`    | AppShell, Sidebar, content wrappers. No form logic.     |
| `modules/`   | Business logic + scoped services (e.g., FLRA module).   |
| `pages/`     | Route entry points. No logic here.                      |
| `services/`  | App-wide logic: auth, pdf, sync. May use db + utils.    |
| `session/`   | Memory/localStorage/session state handlers              |
| `styles/`    | Global ITCSS styles only                                |
| `util/`      | Pure functions with zero side effects. No network, no DOM. |

---

## ✅ Allowed Imports

Only the following folder relationships are allowed:

```txt
pages        → modules, layout, components, services, session
modules      → services, db, session, components, util
services     → db, util
layout       → components
guards       → config, util
components   → util
session      → util
util         → (can be imported by anyone)
config       → (can be imported by anyone, but must import nothing)
