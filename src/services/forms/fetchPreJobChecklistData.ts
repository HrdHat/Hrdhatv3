import { supabase } from "../../db/supabaseClient";
import {
  TABLES,
  FORM_INSTANCE_PRE_JOB_CHECKLIST,
} from "../../constants/database";
import { PreJobChecklist } from "../../types/formSchemas";
import { preJobChecklistSchema } from "../../types/formSchemas";

export interface FetchPreJobChecklistResult {
  data: PreJobChecklist | null;
  error: string | null;
}

/**
 * Fetches existing Pre-Job Checklist data for a form module
 * @param formModuleId - The form module ID to fetch data for
 * @returns Promise with data and error
 */
export async function fetchPreJobChecklistData(
  formModuleId: string
): Promise<FetchPreJobChecklistResult> {
  try {
    if (import.meta.env.DEV) {
      console.log(
        `[fetchPreJobChecklistData] Fetching data for module ${formModuleId}`
      );
    }

    const { data, error } = await supabase
      .from(TABLES.formInstancePreJobChecklist)
      .select("*")
      .eq(FORM_INSTANCE_PRE_JOB_CHECKLIST.formModuleId, formModuleId)
      .single();

    if (error) {
      // PGRST116 = no rows found, which is OK for new forms
      if (error.code === "PGRST116") {
        if (import.meta.env.DEV) {
          console.log(
            `[fetchPreJobChecklistData] No existing data found for module ${formModuleId}`
          );
        }
        return { data: null, error: null };
      }

      if (import.meta.env.DEV) {
        console.error(`[fetchPreJobChecklistData] Database error:`, error);
      }
      return { data: null, error: error.message };
    }

    if (!data) {
      if (import.meta.env.DEV) {
        console.log(
          `[fetchPreJobChecklistData] No data returned for module ${formModuleId}`
        );
      }
      return { data: null, error: null };
    }

    // Validate the data against your Zod schema
    const validationResult = preJobChecklistSchema.safeParse(data);
    if (!validationResult.success) {
      if (import.meta.env.DEV) {
        console.warn(
          "Invalid pre-job checklist data from database:",
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
        `[fetchPreJobChecklistData] Successfully fetched data for module ${formModuleId}`
      );
    }

    return { data: validationResult.data, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`[fetchPreJobChecklistData] Exception occurred:`, err);
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
