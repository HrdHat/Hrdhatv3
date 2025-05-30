1. Centralize Active Forms State

    Create a single useActiveForms custom hook or a React Context (FormsProvider) that holds your active forms list and exposes a refetch() method.

    Make all components that need the list (drawer, editor, etc.) use this centralized source—do not keep separate local lists in each component.

2. Auto-Refresh List on Create/Delete

    After creating or deleting a form, always call refetch() from useActiveForms (or equivalent) so the latest forms are loaded everywhere.

    Do not rely on local array mutations or optimistic updates—fetch the real backend list after every change.

3. Fetch Latest When Drawer Opens

    When the active forms drawer opens (or when it regains focus), trigger refetch() so the drawer always shows the latest data.

    Use a useEffect that runs refetch() every time the drawer’s open state switches to true.

4. Auto-Open New Forms

    After creating a form, immediately open it in the editor and clear any “selected” state in the drawer to avoid conflicting UI.

    Suppress “close open FLRA” prompts if no form is actually open (check for real loaded state before prompting).

5. Avoid Stale Closures & Race Conditions

    Make sure all handlers (onDelete, onCreate, etc.) always reference the latest forms list and state—use correct dependencies or functional state updates.

    Use cleanup logic in useEffect (like an “active” flag or AbortController) to prevent race conditions on rapid UI toggles.

6. Minimize Re-renders & Remove Redundancy

    Only call setState/update drawer UI if the forms list actually changes.

    Wrap drawer and list components in React.memo to avoid unnecessary re-renders on unrelated state changes.

7. Clean Up Unused Effects & Duplicate State

    Remove any duplicate or unused useEffects, hooks, or local state that maintain separate copies of active forms.

    All components should rely only on the single source of truth (useActiveForms or context).