import {
  createFormSchema,
  formModuleFieldSchema,
} from "../../../types/formValidationSchemas";
import { z } from "zod";
import { describe, it, expect, vi } from "vitest";

describe("Form Validation Schemas", () => {
  describe("createFormSchema", () => {
    it("should validate a valid form creation payload", () => {
      const validPayload = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        companyId: "123e4567-e89b-12d3-a456-426614174001",
        projectId: "123e4567-e89b-12d3-a456-426614174002",
        title: "Test Form",
        description: "Test Description",
        status: "draft",
        submittedAt: null,
      };

      const result = createFormSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should reject an invalid form creation payload", () => {
      const invalidPayload = {
        userId: "invalid-uuid",
        companyId: "123e4567-e89b-12d3-a456-426614174001",
        projectId: "123e4567-e89b-12d3-a456-426614174002",
        title: "", // Empty title
        status: "invalid-status",
      };

      const result = createFormSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Now expecting 4 errors: Invalid UUID, empty title, invalid status, and missing submittedAt
        expect(result.error.errors).toHaveLength(4);
      }
    });
  });

  describe("formModuleFieldSchema", () => {
    it("should validate a valid field creation payload", () => {
      const validPayload = {
        formId: "123e4567-e89b-12d3-a456-426614174000",
        formModuleId: "123e4567-e89b-12d3-a456-426614174001",
        moduleFieldId: "123e4567-e89b-12d3-a456-426614174002",
        name: "test_field",
        label: "Test Field",
        type: "text",
        required: true,
        fieldOrder: 1,
        version: 1,
      };

      const result = formModuleFieldSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should reject an invalid field creation payload", () => {
      const invalidPayload = {
        formId: "invalid-uuid",
        formModuleId: "123e4567-e89b-12d3-a456-426614174001",
        moduleFieldId: "123e4567-e89b-12d3-a456-426614174002",
        name: "invalid name", // Contains space
        label: "", // Empty label
        type: "invalid-type",
        fieldOrder: -1, // Negative order
      };

      const result = formModuleFieldSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Now expecting 7 errors: Invalid UUID, invalid name format, empty label, invalid type, negative order, missing required, missing version
        expect(result.error.errors).toHaveLength(7);
      }
    });
  });
});
