# FLRA Form State Management & Submission Plan

## New State (2024)
- All form state is managed in React state in `FlraFormBuilder`.
- Only one form is "open" at a time (tracked by `currentFormId`).
- **All field changes are saved directly to Supabase immediately.**
- No localStorage, no drafts, no debounce, no autosave.
- When starting a new form, a new row is created in the `forms` table and a fresh `formId` is used for all subsequent saves.
- Data is always persisted in Supabase; nothing is lost on reload/navigation.
- `ActiveFlraDrawer` will fetch and manage active forms from Supabase.

---

## Status Field Usage
- The `forms` table includes a `status` field (`text NOT NULL DEFAULT 'draft'`).
- This field tracks the lifecycle of a form: `'draft'`, `'submitted'`, or `'archived'`.

### Workflow Example
- **On field change:** Data is upserted to Supabase with `status = 'draft'` (default).
- **On submission:** Set `status = 'submitted'`.
- **On archive:** Set `status = 'archived'`.

### Validation Note
- Only required fields (per schema) must be validated on submission.
- Drafts (in-progress forms) can be saved with incomplete/partial data.

### Migration Note
- The migration to add the `status` field to the `forms` table has been applied and is now part of the schema.

---

## Schema Field Requirements (from `schema.sql`)

### FLRA Header
| Field         | Type   | Required/Nullable |
|-------------- |--------|------------------|
| form_module_id| uuid   | Nullable         |
| form_number   | text   | Nullable         |
| form_name     | text   | Nullable         |
| form_date     | date   | Nullable         |
| created_at    | timestamp | Required (auto) |

### General Information
| Field               | Type    | Required/Nullable |
|---------------------|---------|------------------|
| form_module_id      | uuid    | Nullable         |
| project_name        | text    | Nullable         |
| project_address     | text    | Nullable         |
| task_location       | text    | Nullable         |
| supervisor_name     | text    | Nullable         |
| supervisor_contact  | text    | Nullable         |
| date                | date    | Nullable         |
| crew_members_count  | integer | Nullable         |
| task_description    | text    | Nullable         |
| start_time          | time    | Nullable         |
| end_time            | time    | Nullable         |
| created_at          | timestamp | Required (auto) |

### Pre Job Task Checklist
| Field                                 | Type    | Required/Nullable |
|---------------------------------------|---------|------------------|
| form_id                               | uuid    | Required         |
| form_module_id                        | uuid    | Nullable         |
| is_fit_for_duty                       | boolean | Nullable         |
| reviewed_work_area_for_hazards        | boolean | Nullable         |
| required_ppe_for_today                | boolean | Nullable         |
| equipment_inspection_up_to_date       | boolean | Nullable         |
| completed_flra_hazard_assessment      | boolean | Nullable         |
| safety_signage_installed_and_checked  | boolean | Nullable         |
| working_alone_today                   | boolean | Nullable         |
| required_permits_for_tasks            | boolean | Nullable         |
| barricades_signage_barriers_installed_good | boolean | Nullable   |
| clear_access_to_emergency_exits       | boolean | Nullable         |
| trained_and_competent_for_tasks       | boolean | Nullable         |
| inspected_tools_and_equipment         | boolean | Nullable         |
| reviewed_control_measures_needed      | boolean | Nullable         |
| reviewed_emergency_procedures         | boolean | Nullable         |
| all_required_permits_in_place         | boolean | Nullable         |
| communicated_with_crew_about_plan     | boolean | Nullable         |
| need_for_spotters_barricades_special_controls | boolean | Nullable |
| weather_suitable_for_work             | boolean | Nullable         |
| know_designated_first_aid_attendant   | boolean | Nullable         |
| aware_of_site_notices_or_bulletins    | boolean | Nullable         |
| created_at                            | timestamp | Required (auto) |

### Task Hazard Control
| Field             | Type    | Required/Nullable |
|-------------------|---------|------------------|
| form_id           | uuid    | Required         |
| form_module_id    | uuid    | Nullable         |
| task              | text    | Required         |
| hazard            | text    | Required         |
| risk_level_before | integer | Nullable         |
| control           | text    | Required         |
| risk_level_after  | integer | Nullable         |
| created_at        | timestamp | Required (auto) |

### FLRA Photos
| Field         | Type    | Required/Nullable |
|---------------|---------|------------------|
| form_id       | uuid    | Required         |
| form_module_id| uuid    | Nullable         |
| photo_url     | text    | Required         |
| description   | text    | Nullable         |
| uploaded_at   | timestamp | Required (auto) |

### Signatures
| Field         | Type    | Required/Nullable |
|---------------|---------|------------------|
| form_id       | uuid    | Required         |
| form_module_id| uuid    | Nullable         |
| worker_name   | text    | Required         |
| signature_url | text    | Required         |
| signed_at     | timestamp | Required        |

### PPE Platform Inspection
| Field                  | Type    | Required/Nullable |
|------------------------|---------|------------------|
| form_id                | uuid    | Required         |
| form_module_id         | uuid    | Nullable         |
| ppe_hardhat            | boolean | Nullable         |
| ppe_safety_vest        | boolean | Nullable         |
| ppe_safety_glasses     | boolean | Nullable         |
| ppe_fall_protection    | boolean | Nullable         |
| ppe_coveralls          | boolean | Nullable         |
| ppe_gloves             | boolean | Nullable         |
| ppe_mask               | boolean | Nullable         |
| ppe_respirator         | boolean | Nullable         |
| platform_ladder        | boolean | Nullable         |
| platform_step_bench    | boolean | Nullable         |
| platform_sawhorses     | boolean | Nullable         |
| platform_baker_scaffold| boolean | Nullable         |
| platform_scaffold      | boolean | Nullable         |
| platform_scissor_lift  | boolean | Nullable         |
| platform_boom_lift     | boolean | Nullable         |
| platform_swing_stage   | boolean | Nullable         |
| platform_hydro_lift    | boolean | Nullable         |
| created_at             | timestamp | Required (auto) |

---

## Plan Overview

### 1. Centralize Form State
- Manage the entire FLRA form state in `FlraFormBuilder`.
- Pass state and setters to each module as props.
- Enables saving/loading, validation, and submission.

### 2. Direct Supabase Save
- On every field change, immediately upsert the relevant data to Supabase under the current `formId`.
- No debounce, no localStorage, no drafts.

### 3. Start New Form
- Clear all UI state.
- Insert a new row in the `forms` table in Supabase.
- Set the new `formId` in state.
- All subsequent saves use this new `formId`.

### 4. Submission Logic
- On submit, validate the state, update the form's `status` to `'submitted'` in Supabase.

### 5. Active Form Management
- `ActiveFlraDrawer` fetches the list of forms from Supabase.
- Switching, deleting, and listing forms is managed via Supabase queries/mutations.

---

## Implementation Steps

### A. Centralized State in `FlraFormBuilder`
- Define a single state object for the entire FLRA form.
- Pass relevant slices and setters to each module.

### B. Supabase Integration
- On every field change, upsert the changed data to Supabase (no debounce).
- On mount, fetch the current form data from Supabase if a `formId` is present.

### C. Submission
- Add a submit button in `FlraFormBuilder`.
- On submit, validate the state, update the form's `status` to `'submitted'` in Supabase.

### D. Active Form Management
- `ActiveFlraDrawer` fetches, switches, and deletes forms using Supabase as the source of truth.

---

## Next Steps
1. Refactor `FlraFormBuilder` to remove all localStorage and debounce logic.
2. Implement direct Supabase upsert on every field change.
3. Add logic to create a new form row in Supabase when starting a new form.
4. Update `ActiveFlraDrawer` to fetch and manage forms from Supabase.
5. Add a submit button and wire up submission logic to update status in Supabase. 