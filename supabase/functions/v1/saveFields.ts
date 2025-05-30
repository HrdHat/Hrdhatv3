/*
LEGACY FILE - DECOMMISSIONED
============================

This file was part of the old per-table approach that has been replaced by the new JSONB system.
According to the NEW SAVING PLAN, this has been phased out during implementation.

🔴 Replace: supabase/functions/v1/saveFields.ts (per-table approach)

Do not use this file - it has been superseded by:
- saveFormModuleDataV2 (new JSONB approach)  
- formInstanceCRUD (unified CRUD operations)

Original implementation: ~300 lines of per-table save logic removed.
*/

// This function is deprecated and should not be used
export function saveFields() {
  throw new Error("LEGACY: This function has been replaced by saveFormModuleDataV2");
} 