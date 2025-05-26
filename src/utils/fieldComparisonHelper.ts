/**
 * Field Comparison Helper
 * ======================
 *
 * This utility helps compare your field constants with actual database schema.
 * Use this after running the SQL queries from field-validation-queries.sql
 */

import { fieldConstants, fieldConstantMap } from "./fieldMapValidation";

export interface DatabaseColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
}

export interface FieldComparisonResult {
  constantName: string;
  tableName: string;
  missingInConstant: string[];
  missingInDatabase: string[];
  matches: string[];
  isValid: boolean;
}

/**
 * Compare a field constant with database columns
 */
export function compareFieldConstant(
  constantName: keyof typeof fieldConstants,
  databaseColumns: DatabaseColumn[]
): FieldComparisonResult {
  const fieldConstant = fieldConstants[constantName];
  const tableName = fieldConstantMap[constantName];

  // Get field names from constant (the values, not keys)
  const constantFields = Object.values(fieldConstant) as string[];

  // Get column names from database
  const databaseFields = databaseColumns.map((col) => col.column_name);

  // Find missing fields
  const missingInConstant = databaseFields.filter(
    (dbField) => !constantFields.includes(dbField)
  );

  const missingInDatabase = constantFields.filter(
    (constField) => !databaseFields.includes(constField)
  );

  const matches = constantFields.filter((constField) =>
    databaseFields.includes(constField)
  );

  return {
    constantName,
    tableName,
    missingInConstant,
    missingInDatabase,
    matches,
    isValid: missingInConstant.length === 0 && missingInDatabase.length === 0,
  };
}

/**
 * Generate a comparison report for all field constants
 */
export function generateFieldComparisonReport(
  databaseResults: Record<string, DatabaseColumn[]>
): FieldComparisonResult[] {
  const results: FieldComparisonResult[] = [];

  Object.keys(fieldConstants).forEach((constantName) => {
    const typedConstantName = constantName as keyof typeof fieldConstants;
    const databaseColumns = databaseResults[constantName] || [];

    const result = compareFieldConstant(typedConstantName, databaseColumns);
    results.push(result);
  });

  return results;
}

/**
 * Print a detailed comparison report
 */
export function printFieldComparisonReport(
  results: FieldComparisonResult[]
): void {
  console.log("\n📊 Field Constant vs Database Schema Comparison Report");
  console.log("=".repeat(60));

  let totalValid = 0;
  let totalInvalid = 0;

  results.forEach((result) => {
    if (result.isValid) {
      totalValid++;
      console.log(`\n✅ ${result.constantName} (${result.tableName})`);
      console.log(`   ${result.matches.length} fields match perfectly`);
    } else {
      totalInvalid++;
      console.log(`\n❌ ${result.constantName} (${result.tableName})`);

      if (result.missingInConstant.length > 0) {
        console.log(
          `   Missing in constant: ${result.missingInConstant.join(", ")}`
        );
      }

      if (result.missingInDatabase.length > 0) {
        console.log(
          `   Missing in database: ${result.missingInDatabase.join(", ")}`
        );
      }

      if (result.matches.length > 0) {
        console.log(`   Matching fields: ${result.matches.length}`);
      }
    }
  });

  console.log("\n📈 Summary:");
  console.log(`   ✅ Valid constants: ${totalValid}`);
  console.log(`   ❌ Invalid constants: ${totalInvalid}`);
  console.log(`   📊 Total constants: ${results.length}`);

  if (totalInvalid === 0) {
    console.log(
      "\n🎉 All field constants are in perfect sync with your database!"
    );
  } else {
    console.log(
      "\n⚠️  Some field constants need attention. Update your constants or database schema."
    );
  }
}

/**
 * Example usage with database query results
 */
export function exampleUsage(): void {
  console.log(`
📖 How to use Field Comparison:

1. Run the SQL queries from field-validation-queries.sql on your database
2. Copy the results into this format:

const databaseResults = {
  FORM_INSTANCE_FIELDS: [
    { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
    { column_name: 'form_number', data_type: 'text', is_nullable: 'YES' },
    // ... more columns
  ],
  FORM_INSTANCE_GENERAL_INFO: [
    { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
    // ... more columns
  ],
  // ... more tables
};

3. Generate and print the comparison report:

const results = generateFieldComparisonReport(databaseResults);
printFieldComparisonReport(results);

This will show you exactly which fields are missing or extra in your constants.
  `);
}

/**
 * Quick validation for a single table
 */
export function validateSingleTable(
  constantName: keyof typeof fieldConstants,
  databaseColumns: DatabaseColumn[]
): void {
  const result = compareFieldConstant(constantName, databaseColumns);

  console.log(`\n🔍 Validating ${constantName}:`);

  if (result.isValid) {
    console.log(`✅ Perfect match! ${result.matches.length} fields validated.`);
  } else {
    console.log(`❌ Validation failed:`);

    if (result.missingInConstant.length > 0) {
      console.log(`   Add to constant: ${result.missingInConstant.join(", ")}`);
    }

    if (result.missingInDatabase.length > 0) {
      console.log(
        `   Remove from constant: ${result.missingInDatabase.join(", ")}`
      );
    }
  }
}
