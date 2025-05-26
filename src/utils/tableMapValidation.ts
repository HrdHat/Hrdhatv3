/**
 * Table Map Validation Utility
 * ============================
 *
 * This utility validates that the tableMap in saveFormModuleData.ts is in sync
 * with the TABLES constant from database.ts. It will throw an error at startup
 * if there are any mismatches, preventing deployment with invalid mappings.
 *
 * Usage: Import and call validateTableMap() at application startup
 */

import { TABLES } from "../constants/database";
import { ModuleKey, MODULE_KEYS } from "../types/formTypes";
import { tableMap } from "../services/forms/saveFormModuleData";

/**
 * Validates that the tableMap is in sync with the TABLES constant
 * Throws an error if any inconsistencies are found
 */
export function validateTableMap(): void {
  console.log("🔍 Validating tableMap against TABLES constant...");

  // Collect any mapped tables that aren't in your TABLES object
  const invalidTables = (Object.values(tableMap) as string[]).filter(
    (tblName) => !(tblName in TABLES)
  );

  if (invalidTables.length) {
    throw new Error(
      `❌ Invalid table name(s) in tableMap: ${invalidTables.join(", ")}. ` +
        `Check your database.ts TABLES constant for typos or missing entries.`
    );
  }

  // Verify that every ModuleKey has a mapping
  const missingKeys = MODULE_KEYS.filter((k) => !(k in tableMap));

  if (missingKeys.length) {
    throw new Error(
      `❌ Missing tableMap entries for moduleKey(s): ${missingKeys.join(", ")}.`
    );
  }

  // Additional check: Verify that all tableMap values are valid table names from TABLES
  const tableValues = Object.values(TABLES) as string[];
  const invalidMappings = Object.entries(tableMap).filter(
    ([moduleKey, tableName]) => !tableValues.includes(tableName)
  );

  if (invalidMappings.length) {
    const invalidEntries = invalidMappings.map(
      ([key, table]) => `${key} -> ${table}`
    );
    throw new Error(
      `❌ Invalid table mappings in tableMap: ${invalidEntries.join(", ")}. ` +
        `These table names don't exist in the TABLES constant.`
    );
  }

  // Success message
  console.log("✅ tableMap and TABLES are in sync");
  console.log(`✅ Validated ${Object.keys(tableMap).length} module mappings`);
  console.log(`✅ All mappings point to valid tables in TABLES constant`);
}

/**
 * Get a summary of the current tableMap for debugging
 */
export function getTableMapSummary(): Record<string, any> {
  return {
    moduleKeys: Object.keys(tableMap),
    tableMappings: tableMap,
    totalMappings: Object.keys(tableMap).length,
    allTablesExist: Object.values(tableMap).every((table) => table in TABLES),
  };
}

/**
 * Validate a specific module key mapping
 */
export function validateModuleMapping(moduleKey: ModuleKey): boolean {
  const tableName = tableMap[moduleKey];
  if (!tableName) {
    console.error(`❌ No table mapping found for module key: ${moduleKey}`);
    return false;
  }

  if (!(tableName in TABLES)) {
    console.error(
      `❌ Table '${tableName}' for module '${moduleKey}' not found in TABLES constant`
    );
    return false;
  }

  console.log(
    `✅ Module '${moduleKey}' correctly maps to table '${tableName}'`
  );
  return true;
}
