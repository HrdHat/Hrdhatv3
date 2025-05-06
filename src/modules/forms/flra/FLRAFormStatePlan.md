# FLRA Form State Management & Submission Plan

## Current State
- No localStorage or DB save logic in FLRA modules.
- All modules use local React state only (`useState`).
- Data is lost on reload/navigation.
- `ActiveFlraDrawer` has TODOs for saving active form, but no implementation.

---

## Status Field Usage
- The `forms` table now includes a `status` field (`text NOT NULL DEFAULT 'draft'`).
- This field tracks the lifecycle of a form: `'draft'`, `'submitted'`, or `'archived'`.

### Workflow Example
- **On draft save:** Set `status = 'draft'` (default).
- **On submission:** Set `status = 'submitted'`.
- **On archive:** Set `status = 'archived'`.

### Validation Note
- Only required fields (per schema) must be validated on submission.
- Drafts can be saved with incomplete/partial data.

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

### 2. LocalStorage Autosave
- Persist form state to localStorage on every change (debounced).
- Prevents data loss on reload/navigation.

### 3. Load from LocalStorage
- On mount, check for a saved draft in localStorage and load it if present.
- Allows users to resume incomplete forms.

### 4. Submission Logic
- On submit, validate and send form data to Supabase (via a service in `src/services/`).
- Clears the local draft after successful submission.

### 5. Draft/Active Form Management
- Support multiple drafts, switching, and deletion (as suggested by `ActiveFlraDrawer`).
- Users may have more than one FLRA in progress.

---

## Implementation Steps

### A. Centralized State in `FlraFormBuilder`
- Define a single state object for the entire FLRA form.
- Pass relevant slices and setters to each module.

### B. LocalStorage Integration
- On every state change, serialize and save the form to localStorage (e.g., under a key like `flra_draft_{id}`).
- On mount, check for a draft and load it.

### C. Submission
- Add a submit button in `FlraFormBuilder`.
- On submit, validate the state, call a service to save to Supabase, and clear the local draft.

### D. Draft Management
- Store a list of draft IDs in localStorage.
- Update `ActiveFlraDrawer` to list, switch, and delete drafts.

---

## Next Steps
1. Refactor `FlraFormBuilder` to use a single state object for the whole form.
2. Implement localStorage autosave/load for the form.
3. Add a submit button and wire up submission logic.
4. Expand `ActiveFlraDrawer` to manage multiple drafts. 