Preface & Goal

This implementation adds robust CRUD (Create, Read, Delete) functionality for Field Level Risk Assessment (FLRA) form instances in the HrdHat app. The goal is to enable authenticated users to:

    List up to 5 active FLRA forms (not archived) in their account

    Create new FLRA form instances (limited to a maximum of 5 active at a time)

    Delete FLRA form instances and all associated module data (if not archived)

    Prevent exceeding the 5-form limit (enforced in backend)

    Enforce full ownership and security rules (users can only view, create, or delete their own forms; archived forms are protected from deletion)

    Wire the frontend “Active Forms” drawer to these backend operations for seamless, secure user interaction

All business logic—including user limits, data ownership, and cascading deletions—will be enforced in Supabase Edge Functions, not just in the UI. This structure guarantees data integrity, security, and future scalability for FLRA workflows.
FLRA “Form Instance” CRUD Implementation Plan

1.  Function to Create FLRA Form Instance

    Yes, you have a function for creating a new FLRA form instance.

    How is it called?

        Your code uses the Supabase client library (JavaScript/TypeScript SDK), not an Edge Function.

        It inserts directly into the form_instances table from the frontend.

2.  Save Functionality (Module Data)

    You have an Edge Function (saveFormModuleData) for saving module data.

    Status:

        The frontend is partially wired to call this function.

        It is not yet fully tested or fully integrated across all modules (incomplete, but in progress).

3.  Active Forms List

    How is it populated?

        Your Active Forms drawer/component uses placeholder data or mock values.

        It does not yet fetch real forms from the database or via API.

4.  database.ts / Schema2.sql

    Where is your schema defined?

        You use a file named schema2.sql for your live database definition.

        This is the closest to your live DB structure and should be referenced for all backend logic, field names, and types.

        If you have a database.ts file in your codebase, it may only define frontend types/interfaces—not the actual DB schema. schema2.sql is definitive.

Schema/Type Definitions

    Is database.ts actually defining schema/types?

        If present, database.ts only reflects types/interfaces for use in frontend/backend TypeScript code. This has been tested. And verified as accurate.

        The actual schema is defined in your SQL migration file (schema2.sql) on Supabase. Although not perfect. PLEASE PROMPT USER TO RUN A SQL QUERY TO DOUBLE CHECK WHAT IS ON THE LIVE DB. STOP*** TO ASK ****

        For accuracy its best to always reference schema2.sql as your database “source of truth” for table structure, column types, constraints, etc. DON"T MODIFY UNLESS A PASTED RESULT OF QRY WAS PROVIDED BY A USER

Step 1: Write the listActiveForms Edge Function

Goal: List up to 5 active forms for the current user (not archived).

    Create a new Edge Function:

        File: /supabase/functions/listActiveForms/index.ts

    Inside, set up Supabase admin client with service role key.

    Parse the user from the JWT in the request.

    Query the form_instances table for:

        created_by = user ID

        archived = false

        Order by created_at DESC

        Limit 5

    Return the forms as JSON.

Step 2: Write the formInstanceCRUD Edge Function

Goal: Create and delete form instances with full business logic and module cascade.

A. POST (Create New Form)

    Parse user from JWT in request.

    Count the user’s active forms (archived = false).

    If count >= 5, return error.

    Insert new row into form_instances.

    For this new form, insert rows into form_instance_modules (default module list).

    Return new form ID.

B. DELETE (Delete Form)

    Parse user from JWT in request.

    Validate user owns the form (created_by matches).

    Confirm form is not archived.

    Delete all related form_instance_modules and their dependent rows (fields, etc.).

    Delete the form row from form_instances.

Step 3: Update React: Create useActiveForms Hook

Goal: Hook fetches active forms from backend, exposes state and refresh.

    Create a useActiveForms hook:

        Calls /functions/listActiveForms

        Returns [forms, isLoading, error, refresh()]

    Expose refresh() so UI can reload after create/delete.

Step 4: Wire Up Drawer UI to Real Data

Goal: Make Active Forms drawer use real data and backend actions.

    Replace placeholder data in ActiveFormsPanel with useActiveForms.

    For each form in the list:

        “Open” → navigate("/forms/:formId")

        “Delete” → Call formInstanceCRUD DELETE, then refresh()

    “New Form” button:

        Disabled if forms.length >= 5

        On click, call formInstanceCRUD POST, then refresh() and navigate to new form

        Show error if user hits the max

Step 5: Enforce Business Logic in Backend

Goal: Security, data integrity.

    Never trust frontend:

        Edge Function must check max-5 rule on create

        Must check ownership before deleting

        Must check archived = false before deleting

Step 6: Error Handling & UX

Goal: Inform the user of issues (e.g., max reached, can’t delete archived, etc.).

    Display errors from backend in UI as needed (inline, toast, etc.)

    Block/disable buttons as appropriate (but always enforce in backend too).

Checklist/Recap

Write /functions/listActiveForms (GET)

Write /functions/formInstanceCRUD (POST=create, DELETE=delete)

Create useActiveForms React hook

Wire drawer UI to real data (open/delete/create)

Backend: enforce max 5, only owner can mutate, block deletes for archived

Fix Active Forms Hook Logic and Drawer Sync in FLRA App
Refactoring FLRA Form Management for Reliability

A robust form-management system requires a single source of truth for active forms and clear update patterns. The key strategy is to centralize form state (e.g. via a React Context or a custom useActiveForms hook) and trigger data refreshes whenever forms change. In practice, this means using a global provider or hook that fetches the list of active forms and exposes a refetch() method. This centralized store is then consumed by any component (drawer, editor, etc.) that needs to know about active forms. By using a Context or singleton hook, we avoid prop drilling and keep form data in sync across the app
dev.to
dev.to
.
Centralize Active Forms State

    Use Context or a Singleton Hook: Create a FormsProvider (using React Context) or a custom hook like useActiveForms. The provider holds the active-forms list and a refetch function to update it. Any component (drawer, editor, etc.) can consume this context or hook to get the latest forms and call refetch() when needed. This central store keeps the data consistent; React Context is explicitly intended for sharing state across components without prop drilling
    dev.to
    .

    Expose Refresh Control: The hook/context should return both the form list and a refetch (or invalidate) function. For example, if using a data-fetching library (e.g. React Query), the hook can wrap a useQuery call that returns data and refetch. In a manual implementation, you can include a method like fetchActiveForms() and expose it. This way, anywhere in the app you can trigger the latest fetch.

Auto-Refresh After Create/Delete

    Invalidate or Re-fetch on Mutation Success: Whenever a form is created or deleted, we must immediately refresh the form list. A common pattern is to use mutation callbacks (e.g. React Query’s onSuccess) to invalidate or re-fetch the relevant query. For instance, after a successful “create form” or “delete form” API call, call queryClient.invalidateQueries(['activeForms']) or simply refetch(). This ensures the drawer (and any other consumer) sees the new list reflecting the change
    tanstack.com
    .

    Auto-Update Drawer: Once we re-fetch, the centralized state updates and propagates to the drawer component. The drawer should subscribe to this context/hook, so that when the list changes, it re-renders with the new data. In practice, using a shared hook means the drawer’s state will update automatically after creation/deletion without manual prop updates.

    Example (React Query): If using React Query, you might do:

    const queryClient = useQueryClient();
    const createFormMutation = useMutation(createFormAPI, {
      onSuccess: () => queryClient.invalidateQueries(['activeForms'])
    });

    Here, React Query’s invalidation triggers a refetch of the ['activeForms'] query
    tanstack.com
    .

Fetch Data on Drawer Open

    Refetch on Mount/Show: When the drawer component is opened (mounted or its isOpen prop changes to true), immediately fetch the latest forms. For example, in a useEffect inside the drawer:

    useEffect(() => {
      if (isOpen) refetch();
    }, [isOpen]);

    This guarantees that even if a form was just created/deleted elsewhere, opening the drawer fetches up-to-date data. If using React Query, note that by default refetchOnMount: true (when data is stale) will automatically re-fetch when the component mounts
    tanstack.com
    . You can rely on that behavior or explicitly call refetch() on open.

    Always Fetch Fresh Data: Do not assume stale data is acceptable. A simple check like if (!data) is insufficient – even if the drawer was open, a new creation elsewhere should trigger a fresh fetch. Tying the data-fetching logic to the drawer’s visible state ensures freshness. In effect, the drawer either calls the context’s refetch() on open, or its consumer effect triggers a new fetch whenever the open state changes.

Auto-Open Newly Created Form

    Open Editor on Create: After a form is created successfully, immediately navigate to or open that new form in the editor. For instance, in the creation callback (onSuccess), use your routing or context logic to set the current form ID to the new form’s ID. This makes the editor show the new form right away.

    Clear Stale Selection: Ensure that any previous selectedFormId is cleared or updated. If the drawer had a selected item, reset it before focusing on the new form. This avoids conflicts where the old selection might cause confusion. In practice, you might call something like setSelectedFormId(newFormId) and closeDrawer(), or otherwise transition the UI state to editing. The goal is that after creation, the user sees the new form without extra prompts or outdated selection.

Conditional Close-Prompt Logic

    Suppress Unnecessary Prompts: If you have a “close open FLRA” confirmation (e.g. unsaved changes alert), only show it when a form is actually open and has unsaved changes. In other words, don’t prompt if there is no form loaded. Concretely, check if the current form ID is set (and perhaps a “dirty” flag) before showing the dialog. If nothing is open, simply close without asking. This logic usually means guarding the prompt by if (currentFormId != null) showPrompt(). This simple conditional ensures the user isn’t annoyed by irrelevant pop-ups when they haven’t actually opened a form.

Avoid Stale Closures in Handlers

    Keep Callbacks Updated: In React hooks, event handlers or async callbacks can “capture” old state. To avoid this, always list the latest state values in your dependency arrays or use functional updates. For example, if a handler uses formsList, include formsList in its useCallback dependencies so it always sees the current list. Dmitri Pavlutin warns that “the stale closure problem occurs when a closure captures outdated variables”
    dmitripavlutin.com
    . The fix is to ensure hooks capture the freshest variables – either by specifying the variables in the dependency array or by using functional state updates (e.g. setList(list => [...list, newItem])).

    Example: If you have an onDeleteForm(formId) callback that filters the list, write it as:

    const handleDelete = useCallback((id) => {
      // use functional update to ensure latest `forms`
      setForms(prev => prev.filter(f => f.id !== id));
    }, []);

    Or if forms is external, include it in the deps: [forms]. This way, handleDelete always works on the current list.

Handle Race Conditions

    Cancel or Ignore Stale Requests: When multiple actions can trigger fetches (toggling drawer, creating/deleting, manual refresh), make sure that outdated async calls don’t overwrite fresh data. A proven solution is to use an “active” flag or AbortController inside a useEffect. As Max Rozen explains, by setting a flag active = false in the cleanup function of useEffect, any in-flight requests can be ignored on completion
    maxrozen.com
    . For example:

    useEffect(() => {
      let active = true;
      async function fetchData() {
        const res = await fetch(...);
        if (!active) return;       // skip if a newer effect ran
        setData(await res.json());
      }
      fetchData();
      return () => { active = false; };
    }, [dependency]);

    This ensures that if the drawer state toggles quickly (causing a re-render and a new effect), the old fetch won’t overwrite the new results.

    Sequential Updates: Also avoid starting a create/delete while a fetch is in progress, or vice versa, without proper coordination. For example, await the deletion API before refetching. Alternatively, use promise chains or async/await so that state updates happen in the intended order. The core idea is to avoid overlapping calls that race to update the same state. If using React Query, its built-in caching and queuing can help, but the concept remains: consider using effect clean-ups or abort signals to prevent stale updates
    maxrozen.com
    .

Minimize Unnecessary Re-renders

    Update Only on Real Changes: When setting state for the forms list or drawer data, do so only if the new list actually differs. React won’t re-render a component if you call setState with the same value, but if your fetch function always returns a new array (even if unchanged), you might get redundant renders. You can mitigate this by shallow-comparing the old and new lists before calling setState, or by using libraries (like React Query) that handle caching intelligently.

    Use Memoization: For components like the drawer that receive props (the form list), wrap them in React.memo. This prevents re-rendering unless their props actually change
    adevnadia.medium.com
    . For example:

    const FormDrawer = React.memo(function FormDrawer({ forms, onDelete }) {
      /* render list of forms */
    });

    Here, FormDrawer will skip re-rendering unless forms or onDelete references change. This way, simply toggling the drawer open/closed won’t re-render the list if the data is identical.

Decouple UI from Fetch Logic

    Data-Driven Updates: The drawer’s data should update purely in response to changes in the centralized form list – not just because the drawer opened. That is, treat the active-forms list as the “source of truth” and let React propagate changes to the UI. Avoid tying fetch logic directly to user toggles beyond the initial load. For example, don’t mix “toggle drawer” and “fetch data” in one state update. Instead, have one effect for fetching (based on data version) and one state for UI (open/closed).

    Reactive Fetching: Consider implementing “subscriptions” or data listeners. For example, if you use a state atom or a Redux store, have components select the active forms from it – then any change triggers a re-render. If using React Query, simply querying the list in the drawer component will keep it updated whenever the data cache invalidates. The key is that the drawer’s content should react to data updates, not manually poll or rely solely on the drawer’s toggle event.

Clean Up Redundant Logic

    Remove Duplicate State: Audit your code for any duplicate hooks or state atoms that track active forms in multiple places. All components should derive from the single useActiveForms source. If you find multiple calls to useQuery(['activeForms']) with independent state, unify them into one hook/context so that there’s one canonical cache of the data.

    Eliminate Unused Effects: Delete any useEffect hooks that fetch data unnecessarily or conflict with the new centralized logic. For example, if a child component was independently fetching forms, remove it and use the context data instead. Also, remove stale event listeners or effects that were meant to sync states before this refactor.

    Focus on Simplicity: As the guidelines note, prefer one clean source of truth. If using React Context, ensure only the provider manages form state. If using a custom hook, use a single instance (a singleton pattern or a Context-wrapped hook) rather than recreating state in each component. This eliminates complex prop drilling and synchronization problems
    dev.to
    dev.to
    .

In summary: Centralize the active-forms list in one shared hook or context, and always re-fetch it after any change. Trigger fresh fetches on drawer open and after mutations. Open the new form automatically and clear any old selection. Guard prompts based on actual open form state. Use React best practices (dependency arrays, functional state updates) to avoid stale closures. Mitigate race conditions by canceling/ignoring outdated async calls. Prevent needless re-renders by memoization and only updating state on genuine changes. Finally, remove any duplicate or unused code so that the entire UI reacts to the one source of truth, keeping the logic simple and consistent.
