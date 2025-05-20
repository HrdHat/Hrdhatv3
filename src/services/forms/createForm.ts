import { supabase } from "../../db/supabaseClient";
import { TABLES, FORM_INSTANCE_FIELDS } from "../../constants/database";

export interface FlraForm {
  id: string;
  userId: string;
  companyId?: string;
  projectId?: string;
  title?: string;
  description?: string;
  status: "draft" | "submitted" | "archived";
  createdAt: string;
  submittedAt?: string | null;
}

export interface CreateFormInput {
  userId?: string;
  status?: "draft" | "submitted" | "archived";
  companyId?: string;
  projectId?: string;
  title?: string;
  description?: string;
}

export interface SupabaseError {
  message: string;
  details?: string;
}

/**
 * Validates that a field exists in the FlraForm type
 */
function validateFormField(field: keyof typeof FORM_INSTANCE_FIELDS): void {
  const formFields = Object.keys(FORM_INSTANCE_FIELDS);
  if (!formFields.includes(field)) {
    throw new Error(
      `Invalid form field: ${field}. Valid fields are: ${formFields.join(", ")}`
    );
  }
}

export async function createForm({
  userId,
  status = "draft",
  companyId,
  projectId,
  title,
  description,
}: CreateFormInput): Promise<{
  form: FlraForm | null;
  error: SupabaseError | null;
}> {
  try {
    // Validate all fields before database operations
    validateFormField("userId");
    validateFormField("companyId");
    validateFormField("projectId");
    validateFormField("title");
    validateFormField("description");
    validateFormField("status");
    validateFormField("submittedAt");

    // Get authenticated user if userId not provided
    if (!userId) {
      console.log("Supabase Query:", {
        operation: "auth.getUser",
        fullQuery: { auth: { getUser: true } },
      });
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
    console.log("Supabase Query:", {
      table: TABLES.formInstances,
      operation: "insert",
      data: {
        [FORM_INSTANCE_FIELDS.userId]: userId,
        [FORM_INSTANCE_FIELDS.companyId]: companyId,
        [FORM_INSTANCE_FIELDS.projectId]: projectId,
        [FORM_INSTANCE_FIELDS.title]: title,
        [FORM_INSTANCE_FIELDS.description]: description,
        [FORM_INSTANCE_FIELDS.status]: status,
        [FORM_INSTANCE_FIELDS.submittedAt]:
          status === "submitted" ? new Date().toISOString() : null,
      },
      fullQuery: {
        from: TABLES.formInstances,
        insert: [
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
        ],
        select: true,
        single: true,
      },
    });
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

    // Runtime guard for returned data
    if (!data || !data.id) {
      return {
        form: null,
        error: { message: "Invalid form response from Supabase" },
      };
    }

    return { form: data as FlraForm, error: null };
  } catch (error) {
    return {
      form: null,
      error: {
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        details: error instanceof Error ? error.stack : undefined,
      },
    };
  }
}
