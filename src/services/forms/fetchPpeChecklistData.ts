import { supabase } from "../../db/supabaseClient";
import { TABLES, FORM_INSTANCE_PPE_PLATFORM } from "../../constants/database";
import { PpeChecklist } from "../../types/formSchemas";
import { ppeChecklistSchema } from "../../types/formSchemas";

export interface FetchPpeChecklistResult {
  data: PpeChecklist | null;
  error: string | null;
}

/**
 * Fetches existing PPE Checklist data for a form module
 * @param formModuleId - The form module ID to fetch data for
 * @returns Promise with data and error
 */
export async function fetchPpeChecklistData(
  formModuleId: string
): Promise<FetchPpeChecklistResult> {
  try {
    if (import.meta.env.DEV) {
      console.log(
        `[fetchPpeChecklistData] Fetching data for module ${formModuleId}`
      );
    }

    const { data, error } = await supabase
      .from(TABLES.formInstancePpePlatform)
      .select("*")
      .eq(FORM_INSTANCE_PPE_PLATFORM.formModuleId, formModuleId)
      .single();

    if (error) {
      // PGRST116 = no rows found, which is OK for new forms
      if (error.code === "PGRST116") {
        if (import.meta.env.DEV) {
          console.log(
            `[fetchPpeChecklistData] No existing data found for module ${formModuleId}`
          );
        }
        return { data: null, error: null };
      }

      if (import.meta.env.DEV) {
        console.error(`[fetchPpeChecklistData] Database error:`, error);
      }
      return { data: null, error: error.message };
    }

    if (!data) {
      if (import.meta.env.DEV) {
        console.log(
          `[fetchPpeChecklistData] No data returned for module ${formModuleId}`
        );
      }
      return { data: null, error: null };
    }

    // Validate the data against your Zod schema
    const validationResult = ppeChecklistSchema.safeParse(data);
    if (!validationResult.success) {
      if (import.meta.env.DEV) {
        console.warn(
          "Invalid PPE checklist data from database:",
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
        `[fetchPpeChecklistData] Successfully fetched data for module ${formModuleId}`
      );
    }

    return { data: validationResult.data, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`[fetchPpeChecklistData] Exception occurred:`, err);
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
