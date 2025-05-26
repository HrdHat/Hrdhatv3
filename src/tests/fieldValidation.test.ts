/**
 * Field Validation Tests
 *
 * Tests the field validation system to ensure field constants
 * stay in sync with database schema.
 */

import { describe, it, expect } from "vitest";
import {
  validateFieldConstants,
  validateFieldNamingConventions,
  fieldConstantMap,
  fieldConstants,
} from "../utils/fieldMapValidation";

describe("Field Validation System", () => {
  describe("Field Constant Structure", () => {
    it("should validate all field constants are properly defined", () => {
      const result = validateFieldConstants();

      console.log("🔍 Field Validation Results:");
      console.log(`📊 Total constants: ${result.summary.totalConstants}`);
      console.log(`✅ Valid constants: ${result.summary.validConstants}`);
      console.log(`❌ Invalid constants: ${result.summary.invalidConstants}`);

      if (result.errors.length > 0) {
        console.log("\n❌ Field validation errors:");
        result.errors.forEach((error) => {
          console.log(`  ${error.constantName} (${error.tableName}):`);
          if (error.missingFields.length > 0) {
            console.log(`    Missing: ${error.missingFields.join(", ")}`);
          }
          if (error.extraFields.length > 0) {
            console.log(`    Issues: ${error.extraFields.join(", ")}`);
          }
        });
      } else {
        console.log("✅ All field constants are valid!");
      }

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should have all expected field constants defined", () => {
      const expectedConstants = [
        "FORM_INSTANCE_FIELDS",
        "FORM_INSTANCE_GENERAL_INFO",
        "FORM_INSTANCE_HAZARDS",
        "FORM_INSTANCE_PPE_PLATFORM",
        "FORM_INSTANCE_PRE_JOB_CHECKLIST",
        "FORM_INSTANCE_SIGNATURES",
        "FORM_ASSET_PHOTOS",
        "FORM_DATA_ENTRIES",
        "FORM_TEMPLATES",
        "FORM_TEMPLATE_MODULES",
        "TEMPLATE_MODULES",
        "TEMPLATE_MODULE_FIELDS",
        "COMPANIES",
        "PROFILES",
        "PROJECTS",
        "USER_FORM_MODULE_PREFERENCES",
      ];

      expectedConstants.forEach((constantName) => {
        expect(fieldConstantMap).toHaveProperty(constantName);
        expect(fieldConstants).toHaveProperty(constantName);
      });
    });
  });

  describe("Field Naming Conventions", () => {
    it("should validate field naming conventions", () => {
      const result = validateFieldNamingConventions();

      console.log("\n🔤 Naming Convention Results:");
      if (result.errors.length > 0) {
        console.log("❌ Naming convention errors:");
        result.errors.forEach((error) => {
          console.log(`  ${error}`);
        });
      } else {
        console.log("✅ All field names follow proper conventions!");
      }

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Field Constant Content", () => {
    it("should have non-empty field constants", () => {
      Object.entries(fieldConstants).forEach(
        ([constantName, fieldConstant]) => {
          const fieldCount = Object.keys(fieldConstant).length;
          console.log(`📋 ${constantName}: ${fieldCount} fields`);
          expect(fieldCount).toBeGreaterThan(0);
        }
      );
    });

    it("should not have duplicate field values", () => {
      Object.entries(fieldConstants).forEach(
        ([constantName, fieldConstant]) => {
          const fieldValues = Object.values(fieldConstant);
          const uniqueValues = [...new Set(fieldValues)];

          if (fieldValues.length !== uniqueValues.length) {
            const duplicates = fieldValues.filter(
              (value, index) => fieldValues.indexOf(value) !== index
            );
            console.error(
              `❌ ${constantName} has duplicate values: ${duplicates.join(
                ", "
              )}`
            );
          }

          expect(fieldValues.length).toBe(uniqueValues.length);
        }
      );
    });
  });
});
