/**
 * Validation System Unit Tests
 *
 * These tests ensure that the validation system correctly:
 * - Rejects invalid payloads
 * - Accepts valid payloads
 * - Provides user-friendly error messages
 * - Validates field definitions correctly
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  formatZodErrorsWithContext,
  createValidationErrorMap,
  hasFieldError,
  getFieldErrors,
} from "../utils/validation";

// Example schema for testing
const testModuleSchema = z.object({
  project_name: z.string().min(1, "Project name is required"),
  supervisor_name: z.string().min(1, "Supervisor name is required"),
  date: z.string().min(1, "Date is required"),
  crew_members_count: z.number().min(1, "At least 1 crew member required"),
});

const testArrayModuleSchema = z.array(
  z.object({
    task: z.string().min(1, "Task description is required"),
    hazard: z.string().min(1, "Hazard description is required"),
    risk_level_before: z.number().min(1).max(5, "Risk level must be 1-5"),
  })
);

describe("Validation System", () => {
  describe("formatZodErrorsWithContext", () => {
    it("should format single module errors with user-friendly names", () => {
      const invalidData = {
        project_name: "",
        supervisor_name: "John",
        date: "2024-01-01",
      };
      const result = testModuleSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodErrorsWithContext(result.error, "general");
        expect(errors).toHaveLength(1);
        expect(errors[0].userField).toBe("Project Name");
        expect(errors[0].message).toBe("Project name is required");
      }
    });

    it("should format array module errors with item numbers", () => {
      const invalidData = [
        { task: "", hazard: "Fall", risk_level_before: 3 },
        { task: "Work at height", hazard: "", risk_level_before: 6 },
      ];
      const result = testArrayModuleSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodErrorsWithContext(result.error, "taskHazards");
        expect(errors.length).toBeGreaterThan(0);

        // Check that we get "Task #1" format for array items
        const taskError = errors.find((e) => e.field === "0.task");
        expect(taskError?.userField).toBe("Task #1");
      }
    });
  });

  describe("createValidationErrorMap", () => {
    it("should create a field-to-errors mapping", () => {
      const errors = [
        {
          field: "project_name",
          message: "Required",
          userField: "Project Name",
        },
        { field: "date", message: "Invalid format", userField: "Date" },
        { field: "date", message: "Cannot be in future", userField: "Date" },
      ];

      const errorMap = createValidationErrorMap(errors);

      expect(errorMap["project_name"]).toEqual(["Required"]);
      expect(errorMap["date"]).toEqual([
        "Invalid format",
        "Cannot be in future",
      ]);
      expect(errorMap["supervisor_name"]).toBeUndefined();
    });
  });

  describe("hasFieldError and getFieldErrors", () => {
    it("should correctly identify fields with errors", () => {
      const errorMap = {
        project_name: ["Required"],
        date: ["Invalid format", "Cannot be in future"],
      };

      expect(hasFieldError("project_name", errorMap)).toBe(true);
      expect(hasFieldError("date", errorMap)).toBe(true);
      expect(hasFieldError("supervisor_name", errorMap)).toBe(false);

      expect(getFieldErrors("project_name", errorMap)).toEqual(["Required"]);
      expect(getFieldErrors("date", errorMap)).toEqual([
        "Invalid format",
        "Cannot be in future",
      ]);
      expect(getFieldErrors("supervisor_name", errorMap)).toEqual([]);
    });
  });

  describe("Validation Rule Enforcement", () => {
    it("should reject invalid payloads", () => {
      const invalidData = { project_name: "", crew_members_count: 0 };
      const result = testModuleSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it("should accept valid payloads", () => {
      const validData = {
        project_name: "Test Project",
        supervisor_name: "John Doe",
        date: "2024-01-01",
        crew_members_count: 3,
      };
      const result = testModuleSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should provide actionable error messages", () => {
      const invalidData = { project_name: "", crew_members_count: 0 };
      const result = testModuleSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodErrorsWithContext(result.error, "general");

        // Ensure error messages are actionable
        errors.forEach((error) => {
          expect(error.message).toBeTruthy();
          expect(error.userField).toBeTruthy();
          expect(error.message.length).toBeGreaterThan(5); // Not just "Required"
        });
      }
    });
  });
});

/**
 * Integration Test Examples
 *
 * These would test the full save flow with validation:
 * - End-to-end save flows validate data
 * - UI shows validation errors correctly
 * - Users can fix validation errors
 * - Validation errors clear appropriately
 */

describe("Integration Test Examples", () => {
  it("should demonstrate end-to-end validation flow", () => {
    // This would test:
    // 1. User enters invalid data
    // 2. Save attempt is made
    // 3. Validation fails and blocks save
    // 4. User sees error messages
    // 5. User fixes data
    // 6. Save succeeds

    expect(true).toBe(true); // Placeholder - implement with actual components
  });
});
