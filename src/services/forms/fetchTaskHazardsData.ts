import { supabase } from "../../db/supabaseClient";
import { TABLES, FORM_INSTANCE_HAZARDS } from "../../constants/database";
import { TaskHazardControl } from "../../types/formValidationSchemas";
import { taskHazardControlSchema } from "../../types/formValidationSchemas";

export interface FetchTaskHazardsResult {
  data: TaskHazardControl[] | null;
  error: string | null;
}

/**
 * Fetches existing Task Hazards data for a form module
 * @param formModuleId - The form module ID to fetch data for
 * @returns Promise with data and error
 */
export async function fetchTaskHazardsData(
  formModuleId: string
): Promise<FetchTaskHazardsResult> {
  try {
    if (import.meta.env.DEV) {
      console.log(
        `[fetchTaskHazardsData] Fetching data for module ${formModuleId}`
      );
    }

    const { data, error } = await supabase
      .from(TABLES.formInstanceHazards)
      .select("*")
      .eq(FORM_INSTANCE_HAZARDS.formModuleId, formModuleId)
      .order("created_at", { ascending: true });

    if (error) {
      if (import.meta.env.DEV) {
        console.error(`[fetchTaskHazardsData] Database error:`, error);
      }
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      if (import.meta.env.DEV) {
        console.log(
          `[fetchTaskHazardsData] No data returned for module ${formModuleId}`
        );
      }
      return { data: [], error: null };
    }

    // Validate each item against your Zod schema
    const validatedData: TaskHazardControl[] = [];
    for (const item of data) {
      const validationResult = taskHazardControlSchema.safeParse(item);
      if (!validationResult.success) {
        if (import.meta.env.DEV) {
          console.warn(
            "Invalid task hazard data from database:",
            validationResult.error
          );
        }
        continue; // Skip invalid items
      }
      validatedData.push(validationResult.data);
    }

    if (import.meta.env.DEV) {
      console.log(
        `[fetchTaskHazardsData] Successfully fetched ${validatedData.length} items for module ${formModuleId}`
      );
    }

    return { data: validatedData, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`[fetchTaskHazardsData] Exception occurred:`, err);
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
