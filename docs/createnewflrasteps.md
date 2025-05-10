✅ Create New FLRA Button — Step-by-Step Behavior (No Code)
Verify Authenticated Session

Check that the user is logged in


If not, show an error (e.g., “You must be logged in to create a form”)

Start Loading State

Visually disable the button

Optionally show a spinner or “Creating...” text

Call Form Creation Service

Call createFormWithModules()

Pass the following:

companyId: from authenticated user

title: default to "New FLRA" or use passed value

description: optional

moduleIds: array of module keys to scaffold (e.g., "header", "hazards", etc.)

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