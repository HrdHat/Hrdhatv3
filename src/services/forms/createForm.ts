import { supabase } from "../../db/supabaseClient";

export interface CreateFormInput {
  user_id?: string;
  status?: "draft" | "submitted" | "archived";
  company_id?: string;
  project_id?: string;
  title?: string;
  description?: string;
}

export interface FlraForm {
  id: string;
  user_id: string;
  company_id?: string;
  project_id?: string;
  title?: string;
  description?: string;
  status: "draft" | "submitted" | "archived";
  created_at: string;
  submitted_at?: string | null;
}

export interface SupabaseError {
  message: string;
  details?: string;
}

export async function createForm({
  user_id,
  status = "draft",
  company_id,
  project_id,
  title,
  description,
}: CreateFormInput): Promise<{
  form: FlraForm | null;
  error: SupabaseError | null;
}> {
  try {
    // Get authenticated user if user_id not provided
    if (!user_id) {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return {
          form: null,
          error: { message: "User not authenticated" },
        };
      }
      user_id = userData.user.id;
    }

    // Insert new form
    const { data, error } = await supabase
      .from("forms")
      .insert([
        {
          user_id,
          company_id,
          project_id,
          title,
          description,
          status,
          submitted_at:
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
