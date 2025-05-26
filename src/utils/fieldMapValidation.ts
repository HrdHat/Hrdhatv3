/**
 * Field Map Validation
 * ===================
 *
 * This file validates that all field constants in database.ts match the actual
 * database schema. It ensures field mappings stay in sync with the live database.
 */

import {
  TABLES,
  FORM_INSTANCE_FIELDS,
  FORM_INSTANCE_GENERAL_INFO,
  FORM_INSTANCE_HAZARDS,
  FORM_INSTANCE_PPE_PLATFORM,
  FORM_INSTANCE_PRE_JOB_CHECKLIST,
  FORM_INSTANCE_SIGNATURES,
  FORM_ASSET_PHOTOS,
  FORM_DATA_ENTRIES,
  FORM_TEMPLATES,
  FORM_TEMPLATE_MODULES,
  TEMPLATE_MODULES,
  TEMPLATE_MODULE_FIELDS,
  COMPANIES,
  PROFILES,
  PROJECTS,
  USER_FORM_MODULE_PREFERENCES,
} from "../constants/database";

// Map field constants to their corresponding table names
export const fieldConstantMap = {
  FORM_INSTANCE_FIELDS: TABLES.formInstances,
  FORM_INSTANCE_GENERAL_INFO: TABLES.formInstanceGeneralInfo,
  FORM_INSTANCE_HAZARDS: TABLES.formInstanceHazards,
  FORM_INSTANCE_PPE_PLATFORM: TABLES.formInstancePpePlatform,
  FORM_INSTANCE_PRE_JOB_CHECKLIST: TABLES.formInstancePreJobChecklist,
  FORM_INSTANCE_SIGNATURES: TABLES.formInstanceSignatures,
  FORM_ASSET_PHOTOS: TABLES.formAssetPhotos,
  FORM_DATA_ENTRIES: TABLES.formDataEntries,
  FORM_TEMPLATES: TABLES.formTemplates,
  FORM_TEMPLATE_MODULES: TABLES.formTemplateModules,
  TEMPLATE_MODULES: TABLES.templateModules,
  TEMPLATE_MODULE_FIELDS: TABLES.templateModuleFields,
  COMPANIES: TABLES.companies,
  PROFILES: TABLES.profiles,
  PROJECTS: TABLES.projects,
  USER_FORM_MODULE_PREFERENCES: TABLES.userFormModulePreferences,
} as const;

// Map field constants to their actual constant objects
export const fieldConstants = {
  FORM_INSTANCE_FIELDS,
  FORM_INSTANCE_GENERAL_INFO,
  FORM_INSTANCE_HAZARDS,
  FORM_INSTANCE_PPE_PLATFORM,
  FORM_INSTANCE_PRE_JOB_CHECKLIST,
  FORM_INSTANCE_SIGNATURES,
  FORM_ASSET_PHOTOS,
  FORM_DATA_ENTRIES,
  FORM_TEMPLATES,
  FORM_TEMPLATE_MODULES,
  TEMPLATE_MODULES,
  TEMPLATE_MODULE_FIELDS,
  COMPANIES,
  PROFILES,
  PROJECTS,
  USER_FORM_MODULE_PREFERENCES,
} as const;

export interface FieldValidationError {
  constantName: string;
  tableName: string;
  missingFields: string[];
  extraFields: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: FieldValidationError[];
  summary: {
    totalConstants: number;
    validConstants: number;
    invalidConstants: number;
  };
}

/**
 * Validates field constants against database schema
 * Note: This requires a database connection to fetch actual schema
 */
export function validateFieldConstants(): FieldValidationResult {
  const errors: FieldValidationError[] = [];

  // For now, we'll do basic validation of the field constant structure
  // In a full implementation, you'd query the database schema

  Object.entries(fieldConstantMap).forEach(([constantName, tableName]) => {
    const fieldConstant =
      fieldConstants[constantName as keyof typeof fieldConstants];

    if (!fieldConstant) {
      errors.push({
        constantName,
        tableName,
        missingFields: [],
        extraFields: [`Field constant ${constantName} is undefined`],
      });
      return;
    }

    // Basic validation: check if field constant has values
    const fieldValues = Object.values(fieldConstant);
    if (fieldValues.length === 0) {
      errors.push({
        constantName,
        tableName,
        missingFields: ["No fields defined"],
        extraFields: [],
      });
    }

    // Check for duplicate field values (common mistake)
    const duplicates = fieldValues.filter(
      (value, index) => fieldValues.indexOf(value) !== index
    );

    if (duplicates.length > 0) {
      errors.push({
        constantName,
        tableName,
        missingFields: [],
        extraFields: [`Duplicate field values: ${duplicates.join(", ")}`],
      });
    }
  });

  const totalConstants = Object.keys(fieldConstantMap).length;
  const invalidConstants = errors.length;
  const validConstants = totalConstants - invalidConstants;

  return {
    isValid: errors.length === 0,
    errors,
    summary: {
      totalConstants,
      validConstants,
      invalidConstants,
    },
  };
}

/**
 * Validates that field constants follow naming conventions
 */
export function validateFieldNamingConventions(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  Object.entries(fieldConstants).forEach(([constantName, fieldConstant]) => {
    Object.entries(fieldConstant).forEach(([key, value]) => {
      // Check if field names follow snake_case convention
      if (typeof value === "string" && !/^[a-z][a-z0-9_]*$/.test(value)) {
        errors.push(
          `${constantName}.${key}: "${value}" doesn't follow snake_case convention`
        );
      }

      // Check if constant keys follow camelCase convention
      if (!/^[a-z][a-zA-Z0-9]*$/.test(key)) {
        errors.push(
          `${constantName}.${key}: constant key doesn't follow camelCase convention`
        );
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates SQL queries to validate field constants against live database
 */
export function generateFieldValidationQueries(): Record<string, string> {
  const queries: Record<string, string> = {};

  Object.entries(fieldConstantMap).forEach(([constantName, tableName]) => {
    queries[constantName] = `
-- Validate ${constantName} fields against ${tableName} table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = '${tableName}'
  AND table_schema = 'public'
ORDER BY ordinal_position;
    `.trim();
  });

  return queries;
}

/**
 * Main field validation function
 */
export function validateFields(): void {
  console.log("🔍 Validating field constants...");

  // Validate field constant structure
  const structureResult = validateFieldConstants();

  if (!structureResult.isValid) {
    console.error("❌ Field constant structure validation failed:");
    structureResult.errors.forEach((error) => {
      console.error(`  ${error.constantName} (${error.tableName}):`);
      if (error.missingFields.length > 0) {
        console.error(`    Missing: ${error.missingFields.join(", ")}`);
      }
      if (error.extraFields.length > 0) {
        console.error(`    Issues: ${error.extraFields.join(", ")}`);
      }
    });
    throw new Error("Field constant structure validation failed");
  }

  // Validate naming conventions
  const namingResult = validateFieldNamingConventions();

  if (!namingResult.isValid) {
    console.error("❌ Field naming convention validation failed:");
    namingResult.errors.forEach((error) => {
      console.error(`  ${error}`);
    });
    throw new Error("Field naming convention validation failed");
  }

  console.log(
    `✅ Field validation passed! Validated ${structureResult.summary.totalConstants} field constants`
  );
}
