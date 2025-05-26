/**
 * Module Configuration - CRITICAL SYSTEM FILE
 * ===========================================
 *
 * This file is the single source of truth for all module configuration rules.
 * DO NOT MODIFY without understanding the full impact on the save system.
 *
 * All save paths (client, edge function, hooks) MUST import from this file
 * to ensure consistent behavior across the entire application.
 */

// Supported module keys for typed tables
export type ModuleKey =
  | "header"
  | "general"
  | "preJobChecklist"
  | "ppeChecklist"
  | "taskHazards"
  | "photos"
  | "signatures";

// Which modules need a form_module_id foreign key (ALL modules except header)
export const modulesWithModuleId = new Set<ModuleKey>([
  "general",
  "preJobChecklist",
  "ppeChecklist",
  "taskHazards",
  "photos",
  "signatures",
]);

// Which modules use form_module_id for conflict resolution (single-row modules)
export const modulesWithCompositeConflict = new Set<ModuleKey>([
  "general",
  "preJobChecklist",
  "ppeChecklist",
]);

// Which modules are single-row modules (one row per form_module_id)
export const singleRowModules = new Set<ModuleKey>([
  "header",
  "general",
  "preJobChecklist",
  "ppeChecklist",
]);

// Which modules are multi-row modules (multiple rows per form_module_id)
export const multiRowModules = new Set<ModuleKey>([
  "taskHazards",
  "photos",
  "signatures",
]);

/**
 * Get the appropriate conflict resolution column for a module
 * @param moduleKey - The module to get conflict resolution for
 * @param isArray - Whether the data being saved is an array
 * @returns The column name to use for conflict resolution
 */
export const getConflictColumn = (
  moduleKey: ModuleKey,
  isArray: boolean
): string => {
  if (moduleKey === "header") {
    return "id"; // Header uses primary key only
  }

  // Single-row modules use form_module_id for form-level uniqueness
  // Note: Once composite unique constraints are added to DB, this will work properly
  if (modulesWithCompositeConflict.has(moduleKey) && !isArray) {
    return "form_module_id"; // Will use composite constraint when available
  }

  // Array modules use primary key (allows multiple rows per form)
  return "id";
};

/**
 * Build payload with appropriate foreign keys based on module configuration
 * @param data - The data to build payload for
 * @param moduleKey - The module key
 * @param formId - The form ID to add if needed
 * @param moduleId - The module ID to add if needed
 * @returns The payload with appropriate foreign keys
 */
export const buildModulePayload = (
  data: any,
  moduleKey: ModuleKey,
  formId: string,
  moduleId?: string
): any => {
  const addFormId = modulesWithModuleId.has(moduleKey);
  const addModuleId = moduleId && modulesWithModuleId.has(moduleKey);

  if (Array.isArray(data)) {
    return data.map((row) => ({
      ...row,
      ...(addFormId && { form_id: formId }),
      ...(addModuleId && { form_module_id: moduleId }),
    }));
  }

  return {
    ...data,
    ...(addFormId && { form_id: formId }),
    ...(addModuleId && { form_module_id: moduleId }),
  };
};

/**
 * Check if a module is an array/bulk module
 * @param moduleKey - The module key to check
 * @returns True if the module supports multiple rows per form
 */
export const isArrayModule = (moduleKey: ModuleKey): boolean => {
  return multiRowModules.has(moduleKey);
};

/**
 * Check if a module is a single-row module
 * @param moduleKey - The module key to check
 * @returns True if the module should have only one row per form
 */
export const isSingleRowModule = (moduleKey: ModuleKey): boolean => {
  return singleRowModules.has(moduleKey);
};

/**
 * Validate module configuration consistency
 * This function ensures our configuration sets don't have conflicts
 */
export const validateModuleConfig = (): void => {
  // Ensure no module is in both single and array sets
  const intersection = new Set(
    [...singleRowModules].filter((x) => multiRowModules.has(x))
  );
  if (intersection.size > 0) {
    throw new Error(
      `Module configuration error: Modules cannot be both single and array: ${Array.from(
        intersection
      ).join(", ")}`
    );
  }

  // Ensure all modules are categorized
  const allModules: ModuleKey[] = [
    "header",
    "general",
    "preJobChecklist",
    "ppeChecklist",
    "taskHazards",
    "photos",
    "signatures",
  ];
  const categorized = new Set([...singleRowModules, ...multiRowModules]);
  const uncategorized = allModules.filter((m) => !categorized.has(m));
  if (uncategorized.length > 0) {
    throw new Error(
      `Module configuration error: Uncategorized modules: ${uncategorized.join(
        ", "
      )}`
    );
  }
};

// Validate configuration on import
validateModuleConfig();
