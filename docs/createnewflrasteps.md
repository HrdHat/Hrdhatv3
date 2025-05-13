✅ Create New FLRA Button — Step-by-Step Behavior (No Code)
Verify Authenticated Session

Check that the user is logged in (COMPLETE)


If not, show an error (e.g., “You must be logged in to create a form”) (COMPLETE)

Start Loading State (COMPLETE)

Visually disable the button (COMPLETE)

Optionally show a spinner or “Creating...” text (COMPLETE)

Call Form Creation Service (COMPLETE)

Call createFormWithModules() (COMPLETE)

Pass the following: (COMPLETE)

companyId: from authenticated user (COMPLETE)

title: default to "New FLRA" or use passed value (COMPLETE)

description: optional (COMPLETE)

check if user has list of modules if not generate stock modules for flra (COMPLETE)

moduleIds: array of module keys to scaffold (e.g., "header", "hazards", etc.) (COMPLETE)

Handle Service Result

If error is returned:

Log error for debugging

Show user-friendly error message (e.g., “Form creation failed”)

Stop loading state

Do not navigate

If formId is missing:

Log critical error

Stop loading state

Show “Unexpected response from server”

Navigate to New Form

Redirect user to /flra/:formId using the new form’s ID

Optional: store returned modules and fields in global context to avoid re-fetch

Stop Loading State

Re-enable the button once creation completes or fails

❗ Edge Case Considerations
If Supabase is unreachable or throws, display a generic network error

If the user double-clicks the button, debounce or disable

If createFormWithModules returns status = 'broken', optionally show a warning prompt before redirecting
Confirm that user.company_id exists



***************************************************
✅ createFormWithModules — Step-by-Step Behavior
Validate Required Inputs

Ensure companyId is present (COMPLETE)

Ensure title is non-empty (COMPLETE)

Ensure moduleIds or templateLabel is provided (COMPLETE)

If any required input is missing, return an error immediately (error: "Missing input") (COMPLETE)

Create a New Form Record (COMPLETE)

Include: company_id, optional project_id, title, description, default status = 'draft' (Complete)

Capture the returned formId (COMPLETE)

Loop Through Provided Modules (COMPLETE)

For each module key in moduleIds (COMPLETE)

Look up the module definition in the modules table by name (COMPLETE)

If the module is not found: (COMPLETE)

Optionally skip and log a warning (COMPLETE)

Or return an error (depending on implementation strictness) (COMPLETE)

Create Form Module Record

For each resolved module:

Insert into form_modules table with: (COMPLETE)

form_id, module_id, module_order, and default  (COMPLETE)

Fetch Field Definitions (COMPLETE)

For each module: (COMPLETE)

Query the module_fields table for all fields belonging to that module (COMPLETE)

Order by field_order (COMPLETE)

Create Form Module Fields  (COMPLETE)

For each field definition: 

Insert a row into form_module_fields with: 

form_id, form_module_id, name, label, type, required, default_value, etc.

If a field insert fails:

Log a warning and continue to next field

Do not abort the whole operation unless critical

Determine Completion Status

If all modules + fields are inserted successfully: return status: "complete"

If some fields fail but modules succeed: return status: "partial" with warnings

If module creation fails: return status: "broken" and do not continue

Return Result Object

Always return:

form: the newly created form (with ID)

modules and fields (if returnStructure = true)

status: "complete", "partial", or "broken"

error: null or an error message

⚠️ Critical Notes
All inserts must use Supabase .select().single() to validate responses

Foreign key relationships must be respected (form_id, module_id)

Must handle both module-based (moduleIds) and template-based (templateLabel) creation logic (if both are supported)

