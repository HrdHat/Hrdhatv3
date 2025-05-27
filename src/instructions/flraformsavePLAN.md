Condensed and Aligned Save Logic Plan for FLRA Form
FLRA Form Save Implementation Plan
[x]1.1 Sync ModuleKey Type

Define a ModuleKey union type that includes only actual, current modules:
"header" | "general" | "preJobChecklist" | "ppeChecklist" | "taskHazards" | "photos" | "signatures"

Search for any outdated keys (e.g. "generalInfo", "ppe") and replace them project-wide.

    Update getModuleKey() and MODULE_KEY_MAP constants to reflect the new set.

[x]1.2 Align Save Params Interface

Create or update a single SaveFormModuleDataParams type:

interface SaveFormModuleDataParams {
formId: string;
moduleKey: ModuleKey;
data: any;
moduleId?: string;
}

Ensure all calls to saveFormModuleData or similar use this type.

    Remove any alternate/duplicated types like SaveFieldsParams, SaveModuleDataArgs, etc.

[x]1.3 Verify Module Data Types Match DB

For each module, check that the payload keys use snake_case and align with the corresponding Supabase table schema.

    E.g. task_location in code matches task_location in form_instance_general_info.

If your frontend uses camelCase, map/transform it before save.

    Create module-specific payload types where needed (e.g., GeneralInfoData, PpeChecklistData).

    🔍 What You Need to Look Out For

✅ 1. Do field names match the database?

    Database: form_module_id

    Frontend: formModuleId ❌

    What to do: either rename it, or convert it before saving.

✅ 2. Are the data types correct?

    Database: risk_level_before is an integer

    Frontend: make sure it's a number, not a string like "3" ❌

✅ 3. Are required fields present and not null?

    If your schema says form_module_id is required but you're sending undefined, the save will fail.

✅ 4. Are keys like form_id or form_module_id included?

    These link the module data to the right form.

    If you forget to add them to your save payload, data gets orphaned and can't be retrieved later.

✅ 5. Does each module save to the right table?

    "ppeChecklist" should go to form_instance_ppe_platform

    "signatures" should go to form_instance_signatures

    You confirm this in your tableMap in saveFormModuleData.ts

✅ 6. Zod schemas match the database

    These schemas validate data before save.

    Make sure they match the field names and types in your DB.

        Example: if DB field is task_location, your Zod shape should be task_location: z.string(), not taskLocation.

✅ 7. No old keys or unused types

    You already removed SaveFieldsParams — good.

    Now make sure there aren't any leftover fields or types like generalInfo (old name for general).

Proposal: Add Step "1.3.5"

    1.3.5 Implement Runtime Validation for Form Data and Field Definitions

Objectives

    Guarantee all saved form data and field definitions are valid at runtime using Zod.

    Prevent any invalid, legacy, or malformed data from ever being saved or rendered.

Action Steps
A. Authoritative Zod Schemas

    [x]Define Zod schemas for every module's payload (in a shared file):

        Each module's data shape must match the DB column names, types, and nullability.

        Export each schema and its inferred TypeScript type.

    [x]Define Zod schemas for all dynamic field definitions:

        Use a discriminated union (z.discriminatedUnion) to ensure only select/multiselect fields have options.

        Provide both "strict" (DB-bound) and "loose" (builder/preview) field schemas as needed.

B. Validation Integration

    Integrate Zod validation into all data processing entry points:

        Before any save or upsert, validate the payload with the correct Zod schema (module or field).

            Use .safeParse() for user input; show clear errors if validation fails.

            Never save or upsert if validation fails—throw or reject with a user-facing error.

        Validate field definitions on load or before rendering in the dynamic form UI.

    Share all schemas between client and edge function/server:

        Move Zod schema files to a location both environments can import.

        Never duplicate validation logic or allow drift.

C. Error Handling and UX

    Handle validation errors proactively:

        Show error messages in the UI at the relevant field/module, not just in logs.

        Provide a clear way to fix invalid input.

        Block saves if data is not valid—fail fast, fail loud.

D. Documentation and Enforcement

    Document the validation rule:

        All module data and field definitions must pass Zod validation before being persisted or used.

        Add a comment block in every save or render entry point to reinforce this.

    (Optional but recommended) Add unit tests:

        Write tests to assert that invalid payloads/field definitions are always rejected.

        Write tests to ensure all schemas match DB structure and handle edge cases (nulls, required fields, etc).

Summary Table
Task Required? Who/Where Notes
Zod schemas for modules Yes Shared types file One per module
Zod schemas for fields Yes Shared types file Discriminated union
Validate before upsert Yes Client + Edge/Server Use .safeParse()
Handle errors in UI Yes Frontend Don't log and ignore
Share schemas (no drift) Yes All Never duplicate logic
Document rule everywhere Yes Code + README Policy for future devs
Audit/migrate legacy data Yes Once before rollout Clean all legacy records
Unit tests for validation Strongly Test suite Prevent regression
Don't:

    Don't ever save or render data/fields that fail Zod validation.

    Don't write duplicate schemas for client and server—DRY.

Sample Implementation Notes

At every save:

const schema = schemaMap[moduleKey];
const result = schema.safeParse(data);
if (!result.success) {
// Show error, block save
}

At every dynamic field render:

const fieldResult = moduleFieldSchema.safeParse(fieldDef);
if (!fieldResult.success) {
// Block render, show config error
}

Critical Note

    Validation is not optional. Any code path that skips or swallows validation errors is a defect.

This plan is industry standard, scalable, and will prevent 90% of silent data drift/bugs.
If you want a more step-by-step breakdown, let me know which file or flow you want implementation help with first.

[x]1.4 Normalize Field Definitions

Review all FieldDefinition objects (if used for rendering forms).

Confirm that each field's:

    type matches the expected input (text, boolean, etc.)

    label accurately describes the field

    required flag and validation match schema rules

Remove any unused or stale fields.

FOR EVERY FILE LISTED BELOW WE CHECK: ✅ What You Need to Check in These Files

For each field in the definitions above:

    Type

        Does type: "text" | "boolean" | "date" | "time" | "number" | "textarea" match the actual DB column type (from your schema2.sql or your live query)?

        For example, date: string → date, startTime: string → time without time zone, ppeHardhat: boolean → boolean.

    Label

        Does it clearly describe the field to a user? e.g., "Supervisor Contact" is acceptable; "Phone" might be unclear.

    Required

        If required: true, check if the DB column is NOT NULL. If the DB allows nulls (YES), then this may cause validation mismatch.

    Validation (Optional)

        If validation: { min, max } is defined, make sure it's:

            Reasonable

            Aligned with Supabase field constraints (if any)

            Backed by your Zod schema if used

    Remove Stale Fields

        Confirm that every field in the definitions actually appears in your:

            Zod schemas

            Module component renderers

            Database schema

So the complete final list is:
[x]src/types/formModules.ts
[x]src/services/forms/fetchModuleFields.ts
[x]src/modules/GenericModuleRenderer.tsx
[x]src/hooks/useFlraFormData.ts
[x]src/types/renderer.types.ts
[x]src/types/formTypes.ts
[x]src/services/forms/createFormModuleField.ts
[x]src/services/forms/createFormModule.ts
[x]src/modules/formmodules/FlraHeaderModule.tsx
[x]src/services/forms/cloneFieldsFromModule.ts
[x]src/services/forms/cloneFormStructure.ts
[x]src/utils/formNumberGenerator.ts
[x]src/services/forms/createForm.ts
[x]src/types/formSchemas.ts
[x]src/types/formSchemasStrict.ts
[x]src/services/forms/saveFormModuleData.ts
[x]src/services/forms/uploadImageToFormModule.ts
[x]src/services/forms/uploadPhotoToSupabase.ts
[x]docs/FORMSAVINGLOGIC.md
[x]src/pages/FlraFormPage.tsx
[x]src/types/formSchemaShapes.ts
[x]src/modules/formmodules/SignatureModuleRenderer.tsx
[x]src/modules/formmodules/PhotoModuleRenderer.tsx
[x]src/modules/formmodules/SignatureModule.tsx
[x]src/modules/formmodules/FormAssetPhotosModule.tsx
[x]src/modules/formmodules/TaskHazardControlModule.tsx
[x]src/modules/forms/flra/ActiveFlraDrawer.tsx
[x]src/modules/forms/flra/FLRAFormStatePlan.md
[x]src/components/ModuleStateIndicator.tsx
[x]src/components/SaveQueueStatus.tsx
[x]src/components/ModuleRenderer.tsx
[x]src/components/shared/ImageUploaderBase.tsx
[x]src/components/shared/SignatureCanvas.tsx
[x]src/hooks/useSaveQueue.ts
[x]src/hooks/useDebouncedSave.ts
[x]src/hooks/useModuleState.ts
[x]src/hooks/useCreateFlraForm.ts
[x]src/constants/storage.ts
[x]src/db/supabaseClient.ts

[x]2. Database Mappings

Confirm table mappings. Each ModuleKey must map to the correct table in TABLES. For example:

const tableMap: Record<ModuleKey,string> = {
header: TABLES.formInstances,
general: TABLES.formInstanceGeneralInfo,
preJobChecklist: TABLES.formInstancePreJobChecklist,
ppeChecklist: TABLES.formInstancePpePlatform,
taskHazards: TABLES.formInstanceHazards,
photos: TABLES.formAssetPhotos,
signatures: TABLES.formInstanceSignatures,
};

Ensure these table names match the actual Supabase schema.

Include foreign keys. In every upsert, include the formId foreign key so rows link to the correct form instance. For array modules (taskHazards, photos, signatures), bulk-upsert each element with form_id added. For single-row modules (general, preJobChecklist, ppeChecklist, header), include form_instance_id.

    Index and constraints. Verify the database has appropriate indexes/unique constraints (e.g. on form_id) so that upserts do not create duplicate rows. If needed, specify the primary key or unique key in the upsert.

3. Save Service & API

Use a single save function. Consolidate saving logic into one service (e.g. saveFormModuleData) or edge function. This function should:

    Determine the target table via moduleKey (using the mapping above).

    Validate the payload (optionally using a runtime schema) before saving.

    Perform upsert on Supabase. For arrays, use .upsert(dataArray), for objects use .upsert(dataObject).

    Return a clear { success: boolean; error?: string } result. Catch and handle errors (network, permissions) and avoid uncaught exceptions.

Server-side validation. Before saving, check that required fields are present and of the correct type. Reject requests with missing formId, moduleKey, or invalid data. This prevents malformed data from reaching the DB.

Remove debug-only logs. The code currently logs debug info (console.debug) in development. Ensure these logs are disabled or minimal in production (or gated behind a flag). Do not log sensitive environment info.

    Environment security. Keep only the necessary Supabase keys on the client (the anon public key). Secret keys (service_role) must never be exposed in client code. If using an edge function or server API, it can use process.env.SUPABASE_KEY.

4. Client-side Integration

Debounced save hook. Implement or integrate a debounced save mechanism so that rapid changes queue up instead of firing many requests. For example, a useDebouncedSave hook that waits ~300ms after the last change before calling saveFormModuleData.

Use the save service correctly. On each module change (e.g. field blur or toggle), call the save function with { formId, moduleKey, data }. Do not send partial or unrelated data. For example:

await saveFormModuleData({ formId, moduleKey: "general", data: generalFormData });

Update form version if used. If the form uses a version counter (e.g. in form_instances.version), update the local formVersion state whenever a save succeeds. Skip this if versioning is not implemented.

    User feedback. Show clear save status in the UI. For example, display a spinner or "Saving..." when a save is in progress, and a success or error indicator when done. Use toasts or inline messages to inform the user of failures. Provide a retry option if a save fails.

Implementation Checklist

Synchronize types: Update all TypeScript types (ModuleKey, payload interfaces, save params) to match the actual schema and remove duplicates.

Field mapping: Verify field-to-column mappings; update any inconsistent naming (e.g. camelCase in code vs snake_case in DB).

Enhanced save service: Use saveFormModuleData (or API) to handle all modules. Consolidate bulk and single upserts as needed.

Debounce & queue: Implement a debounced save hook with retry and offline queuing. This ensures efficiency and reliability.

UI indicators: Add saving/error indicators in the form UI (toasts, banners, module headers) so users know the save status.

Security review: Audit Supabase usage: use only the anon key client-side, enforce RLS, and do not expose any secrets.

Lint/cleanup: Remove unused code, fix any lint errors, and ensure all environment variables have no debug logs or exposures.

    Documentation: Update code comments and README to reflect the new save logic and any setup needed (e.g. new RLS policies or edge function deployment).

This plan condenses the implementation steps, aligns them with the actual code and database schema, and highlights areas (types, mapping, error handling, security) where issues must be addressed. Following these steps will yield a clean, maintainable save flow for FLRA forms.
