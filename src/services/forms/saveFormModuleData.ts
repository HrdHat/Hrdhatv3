/*
LEGACY SERVICE - DECOMMISSIONED  
===============================

This file used the old table mapping logic that has been replaced by the new JSONB system.
According to the NEW SAVING PLAN, this has been phased out during implementation.

🔴 Replace: src/services/forms/saveFormModuleData.ts (table mapping logic)

Do not use this service - it has been superseded by:
- instanceService.ts (new JSONB approach using form_data_entries)
- The new Phase 1-5 implementation

Original implementation: ~200 lines of table mapping logic removed.
*/

// Re-export types that might still be needed
export type { ModuleKey } from "../../types/formTypes";

// Legacy function - do not use
export function saveFormModuleData() {
  throw new Error("LEGACY: This service has been replaced by instanceService.ts");
} 