import { describe, it, expect } from "vitest";
import { saveFormHeader } from "./saveFormHeader";
import { vi } from "vitest";

vi.mock("./saveFormModuleData", () => ({
  saveFormModuleData: async () => ({ success: true }),
}));

// Valid input
const validInput = {
  formId: "123e4567-e89b-12d3-a456-426614174000",
  formNumber: "F-001",
  userFormId: "U-001",
  title: "Test Form",
  formDate: "2024-05-24",
};

// Invalid input (bad UUID and bad date)
const invalidInput = {
  formId: "not-a-uuid",
  formNumber: "F-001",
  userFormId: "U-001",
  title: "Test Form",
  formDate: "24-05-2024",
};

describe("saveFormHeader Zod validation", () => {
  it("returns success: true for valid input", async () => {
    const result = await saveFormHeader(validInput);
    expect(result.success).toBe(true);
  });

  it("returns validation errors for invalid input", async () => {
    const result = await saveFormHeader(invalidInput);
    expect(result.success).toBe(false);
    expect(result.validationErrors).toBeDefined();
    expect(result.validationErrors?.length).toBeGreaterThan(0);
  });
});
