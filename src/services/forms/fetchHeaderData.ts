import { supabase } from "../../db/supabaseClient";
import { TABLES, FORM_INSTANCE_FIELDS } from "../../constants/database";
import { FormInstance } from "../../types/formValidationSchemas";
import { formInstanceSchema } from "../../types/formValidationSchemas";

export interface FetchHeaderResult {
  data: FormInstance | null;
  error: string | null;
}

/**
 * Fetches existing Header (Form Instance) data for a form
 * @param formId - The form ID to fetch data for
 * @returns Promise with data and error
 */
export async function fetchHeaderData(
  formId: string
): Promise<FetchHeaderResult> {
  try {
    if (import.meta.env.DEV) {
      console.log(`[fetchHeaderData] Fetching data for form ${formId}`);
    }

    const { data, error } = await supabase
      .from(TABLES.formInstances)
      .select("*")
      .eq(FORM_INSTANCE_FIELDS.id, formId)
      .single();

    if (error) {
      // PGRST116 = no rows found, which is OK for new forms
      if (error.code === "PGRST116") {
        if (import.meta.env.DEV) {
          console.log(
            `[fetchHeaderData] No existing data found for form ${formId}`
          );
        }
        return { data: null, error: null };
      }

      if (import.meta.env.DEV) {
        console.error(`[fetchHeaderData] Database error:`, error);
      }
      return { data: null, error: error.message };
    }

    if (!data) {
      if (import.meta.env.DEV) {
        console.log(`[fetchHeaderData] No data returned for form ${formId}`);
      }
      return { data: null, error: null };
    }

    // Validate the data against your Zod schema
    const validationResult = formInstanceSchema.safeParse(data);
    if (!validationResult.success) {
      if (import.meta.env.DEV) {
        console.warn(
          "Invalid header data from database:",
          validationResult.error
        );
      }
      return {
        data: null,
        error: "Invalid data format from database",
      };
    }

    if (import.meta.env.DEV) {
      console.log(
        `[fetchHeaderData] Successfully fetched data for form ${formId}`
      );
    }

    return { data: validationResult.data, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`[fetchHeaderData] Exception occurred:`, err);
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
