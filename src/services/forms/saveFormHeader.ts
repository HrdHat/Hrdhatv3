import { saveFormModuleData } from "./saveFormModuleData";
import { z } from "zod";
import { formatZodErrors, ValidationError } from "../../utils/validation";

// Validation schema for form header data
const formHeaderSchema = z.object({
  id: z.string().uuid("Invalid form ID format"),
  form_number: z.string().nullable(),
  user_form_id: z.string().nullable(),
  title: z.string().nullable(),
  form_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .nullable(),
});

export interface SaveFormHeaderInput {
  formId: string;
  formNumber: string | null;
  userFormId: string | null;
  title: string | null;
  formDate: string | null;
}

export interface SaveFormHeaderResult {
  success: boolean;
  error?: {
    message: string;
    details?: string;
  };
  validationErrors?: ValidationError[];
}

export async function saveFormHeader({
  formId,
  formNumber,
  userFormId,
  title,
  formDate,
}: SaveFormHeaderInput): Promise<SaveFormHeaderResult> {
  try {
    // Validate input using Zod schema
    const validationResult = formHeaderSchema.safeParse({
      id: formId,
      form_number: formNumber,
      user_form_id: userFormId,
      title,
      form_date: formDate,
    });

    if (!validationResult.success) {
      return {
        success: false,
        error: { message: "Invalid form header data" },
        validationErrors: formatZodErrors(validationResult.error),
      };
    }

    // Use saveFormModuleData for the actual save operation
    const result = await saveFormModuleData({
      formId,
      moduleKey: "header",
      data: {
        id: formId,
        form_number: formNumber,
        user_form_id: userFormId,
        title,
        form_date: formDate,
        version: 1, // Start with version 1 if not provided
      },
    });

    if (!result.success) {
      return {
        success: false,
        error: {
          message: result.error || "Failed to save form header",
          details: result.validationErrors?.map((e) => e.message).join(", "),
        },
        validationErrors: result.validationErrors,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Save form header error:", error);
    return {
      success: false,
      error: {
        message: "Failed to save form header",
        details: error.message,
      },
    };
  }
}
