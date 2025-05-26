import { supabase } from "../../db/supabaseClient";
import { TABLES, FORM_INSTANCE_FIELDS } from "../../constants/database";
import { FlraForm } from "../../types/formTypes";
import { createFormSchema } from "../../types/formValidationSchemas";
import { formatZodErrors, ValidationError } from "../../utils/validation";

export interface CreateFormInput {
  userId?: string;
  companyId: string | null;
  projectId: string | null;
  title: string;
  description?: string;
  status?: "draft" | "submitted" | "approved" | "rejected";
}

export interface CreateFormResult {
  form: FlraForm | null;
  error?: {
    message: string;
    details?: string;
  };
  validationErrors?: ValidationError[];
}

export async function createForm({
  userId,
  status = "draft",
  companyId,
  projectId,
  title,
  description,
}: CreateFormInput): Promise<CreateFormResult> {
  try {
    /**
     * VALIDATION RULE: All form data must pass Zod validation before save.
     * This prevents invalid data from being persisted to the database.
     * Any validation failure must be shown to the user and block the save.
     */
    const validationResult = createFormSchema.safeParse({
      userId,
      companyId,
      projectId,
      title,
      description,
      status,
      submittedAt: status === "submitted" ? new Date().toISOString() : null,
    });

    if (!validationResult.success) {
      return {
        form: null,
        error: { message: "Invalid form data" },
        validationErrors: formatZodErrors(validationResult.error),
      };
    }

    // Get authenticated user if userId not provided
    if (!userId) {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return {
          form: null,
          error: { message: "User not authenticated" },
        };
      }
      userId = userData.user.id;
    }

    // Insert new form
    const { data, error } = await supabase
      .from(TABLES.formInstances)
      .insert([
        {
          [FORM_INSTANCE_FIELDS.userId]: userId,
          [FORM_INSTANCE_FIELDS.companyId]: companyId,
          [FORM_INSTANCE_FIELDS.projectId]: projectId,
          [FORM_INSTANCE_FIELDS.title]: title,
          [FORM_INSTANCE_FIELDS.description]: description,
          [FORM_INSTANCE_FIELDS.status]: status,
          [FORM_INSTANCE_FIELDS.submittedAt]:
            status === "submitted" ? new Date().toISOString() : null,
        },
      ])
      .select()
      .single();

    if (error) {
      return {
        form: null,
        error: { message: error.message, details: error.details },
      };
    }

    return { form: data };
  } catch (error: any) {
    console.error("Create form error:", error);
    return {
      form: null,
      error: {
        message: "Failed to create form",
        details: error.message,
      },
    };
  }
}
