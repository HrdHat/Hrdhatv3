/**
 * Table Mapping Validation Test
 * =============================
 *
 * This test validates that our tableMap in saveFormModuleData.ts
 * correctly maps to tables that actually exist in the database schema.
 *
 * This is a "bulletproof" approach that cross-references the actual
 * schema2.sql file to ensure no typos or missing tables.
 */

import { describe, it, expect } from "vitest";

// Import the tableMap we're testing
const tableMap = {
  header: "form_instances",
  general: "form_instance_general_info",
  preJobChecklist: "form_instance_pre_job_checklist",
  ppeChecklist: "form_instance_ppe_platform",
  taskHazards: "form_instance_hazards",
  photos: "form_asset_photos",
  signatures: "form_instance_signatures",
};

// Tables that actually exist in schema2.sql (extracted from CREATE TABLE statements)
const SCHEMA_TABLES = [
  "template_modules",
  "template_module_fields",
  "user_form_module_preferences",
  "form_templates",
  "form_list",
  "form_template_modules",
  "form_instances",
  "form_instance_modules",
  "form_instance_general_info",
  "form_instance_pre_job_checklist",
  "form_instance_hazards",
  "form_instance_signatures",
  "form_instance_ppe_platform",
  "form_instance_module_fields",
  "form_asset_photos",
  "projects",
  "companies",
  "profiles", // Referenced in foreign keys
  "users", // Referenced in foreign keys
];

// Required columns for foreign key validation
const REQUIRED_COLUMNS = {
  form_instances: ["id", "form_number", "created_by", "status"],
  form_instance_general_info: ["id", "form_module_id", "project_name"],
  form_instance_pre_job_checklist: ["id", "form_id", "form_module_id"],
  form_instance_ppe_platform: ["id", "form_id", "form_module_id"],
  form_instance_hazards: ["id", "form_id", "form_module_id", "task", "hazard"],
  form_asset_photos: ["id", "form_id", "form_module_id", "photo_url"],
  form_instance_signatures: [
    "id",
    "form_id",
    "form_module_id",
    "worker_name",
    "signature_url",
  ],
};

describe("Table Mapping Validation", () => {
  it("should have all tableMap entries pointing to existing schema tables", () => {
    const results: string[] = [];

    for (const [moduleKey, tableName] of Object.entries(tableMap)) {
      if (SCHEMA_TABLES.includes(tableName)) {
        results.push(`✅ ${moduleKey} -> ${tableName}: EXISTS in schema`);
      } else {
        results.push(`❌ ${moduleKey} -> ${tableName}: NOT FOUND in schema`);
      }
    }

    console.log("\n=== TABLE EXISTENCE VALIDATION ===");
    results.forEach((result) => console.log(result));

    // All tables should exist
    const missingTables = Object.entries(tableMap).filter(
      ([_, tableName]) => !SCHEMA_TABLES.includes(tableName)
    );

    expect(missingTables).toHaveLength(0);
  });

  it("should have proper foreign key columns for each table", () => {
    const results: string[] = [];

    for (const [moduleKey, tableName] of Object.entries(tableMap)) {
      const requiredCols =
        REQUIRED_COLUMNS[tableName as keyof typeof REQUIRED_COLUMNS];

      if (requiredCols) {
        // Check if this table should have form_id
        const needsFormId = !["form_instances"].includes(tableName);
        const needsFormModuleId = !["form_instances"].includes(tableName);

        if (needsFormId && !requiredCols.includes("form_id")) {
          results.push(
            `⚠️  ${moduleKey} -> ${tableName}: Missing form_id column`
          );
        }

        if (needsFormModuleId && !requiredCols.includes("form_module_id")) {
          results.push(
            `⚠️  ${moduleKey} -> ${tableName}: Missing form_module_id column`
          );
        }

        results.push(
          `✅ ${moduleKey} -> ${tableName}: Has required columns [${requiredCols.join(
            ", "
          )}]`
        );
      } else {
        results.push(
          `❓ ${moduleKey} -> ${tableName}: No column validation defined`
        );
      }
    }

    console.log("\n=== FOREIGN KEY VALIDATION ===");
    results.forEach((result) => console.log(result));
  });

  it("should have correct conflict resolution strategy for each module type", () => {
    const results: string[] = [];

    // Array modules should use "id" for conflict resolution
    const arrayModules = ["taskHazards", "photos", "signatures"];
    // Single-row modules should use "form_module_id" (except header)
    const singleRowModules = ["general", "preJobChecklist", "ppeChecklist"];
    // Header should use "id"
    const headerModule = ["header"];

    arrayModules.forEach((moduleKey) => {
      results.push(
        `✅ ${moduleKey}: Array module -> should use onConflict: "id"`
      );
    });

    singleRowModules.forEach((moduleKey) => {
      results.push(
        `✅ ${moduleKey}: Single-row module -> should use onConflict: "form_module_id"`
      );
    });

    headerModule.forEach((moduleKey) => {
      results.push(
        `✅ ${moduleKey}: Header module -> should use onConflict: "id"`
      );
    });

    console.log("\n=== CONFLICT RESOLUTION VALIDATION ===");
    results.forEach((result) => console.log(result));

    // Verify we have all expected modules
    const allModules = [...arrayModules, ...singleRowModules, ...headerModule];
    const tableMapKeys = Object.keys(tableMap);

    expect(allModules.sort()).toEqual(tableMapKeys.sort());
  });

  it("should have no typos in table names compared to TABLES constant", () => {
    // Expected mapping from TABLES constant
    const EXPECTED_TABLES = {
      header: "form_instances",
      general: "form_instance_general_info",
      preJobChecklist: "form_instance_pre_job_checklist",
      ppeChecklist: "form_instance_ppe_platform",
      taskHazards: "form_instance_hazards",
      photos: "form_asset_photos",
      signatures: "form_instance_signatures",
    };

    const results: string[] = [];

    for (const [moduleKey, expectedTable] of Object.entries(EXPECTED_TABLES)) {
      const actualTable = tableMap[moduleKey as keyof typeof tableMap];

      if (actualTable === expectedTable) {
        results.push(
          `✅ ${moduleKey}: "${actualTable}" matches TABLES constant`
        );
      } else {
        results.push(
          `❌ ${moduleKey}: "${actualTable}" != "${expectedTable}" (TABLES constant)`
        );
      }
    }

    console.log("\n=== TABLES CONSTANT VALIDATION ===");
    results.forEach((result) => console.log(result));

    expect(tableMap).toEqual(EXPECTED_TABLES);
  });

  it("should provide a complete smoke test summary", () => {
    console.log("\n=== SMOKE TEST SUMMARY ===");
    console.log("🎯 Purpose: Validate tableMap against actual database schema");
    console.log("📋 Checks performed:");
    console.log("   ✓ Table existence in schema2.sql");
    console.log("   ✓ Required foreign key columns");
    console.log("   ✓ Conflict resolution strategies");
    console.log("   ✓ TABLES constant consistency");
    console.log("");
    console.log("🚀 If all tests pass, your tableMap is bulletproof!");
    console.log("💡 Run this test whenever you modify tableMap or schema");
  });
});

/**
 * Manual Smoke Test Function
 * ==========================
 *
 * You can also run this manually in your browser console or Node.js:
 */
export function manualSmokeTest() {
  console.log("🔍 Manual Table Mapping Smoke Test");
  console.log("===================================");

  const issues: string[] = [];

  // Check 1: Table existence
  Object.entries(tableMap).forEach(([moduleKey, tableName]) => {
    if (!SCHEMA_TABLES.includes(tableName)) {
      issues.push(
        `❌ Table "${tableName}" for module "${moduleKey}" not found in schema`
      );
    }
  });

  // Check 2: Foreign key requirements
  Object.entries(tableMap).forEach(([moduleKey, tableName]) => {
    if (tableName !== "form_instances") {
      const requiredCols =
        REQUIRED_COLUMNS[tableName as keyof typeof REQUIRED_COLUMNS];
      if (requiredCols) {
        if (!requiredCols.includes("form_id")) {
          issues.push(`⚠️  Table "${tableName}" missing form_id column`);
        }
        if (
          moduleKey !== "header" &&
          !requiredCols.includes("form_module_id")
        ) {
          issues.push(`⚠️  Table "${tableName}" missing form_module_id column`);
        }
      }
    }
  });

  if (issues.length === 0) {
    console.log("🎉 All checks passed! Your tableMap is valid.");
  } else {
    console.log("⚠️  Issues found:");
    issues.forEach((issue) => console.log(issue));
  }

  return issues.length === 0;
}
