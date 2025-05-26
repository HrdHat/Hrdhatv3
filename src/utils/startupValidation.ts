/**
 * Startup Validation
 * ==================
 *
 * This file contains all validation checks that should run at application startup.
 * Import and call runStartupValidation() at the top of your main.tsx or App.tsx
 * to ensure all critical mappings and configurations are valid before the app starts.
 */

import { validateTableMap } from "./tableMapValidation";
import { validateFields } from "./fieldMapValidation";

/**
 * Runs all startup validation checks
 * Throws an error if any validation fails, preventing app startup
 */
export function runStartupValidation(): void {
  console.log("🚀 Running startup validation checks...");

  try {
    // Validate tableMap against TABLES constant
    validateTableMap();

    // Validate field constants structure and naming
    validateFields();

    // Add other validation checks here as needed
    // validateSchemaMap();
    // validateRendererMap();
    // etc.

    console.log("✅ All startup validation checks passed!");
  } catch (error) {
    console.error("💥 Startup validation failed:", error);
    throw error; // Re-throw to prevent app startup
  }
}

/**
 * Runs validation checks in development mode only
 * Use this if you only want validation in development
 */
export function runDevValidation(): void {
  if (import.meta.env.DEV) {
    runStartupValidation();
  }
}
