import { supabase } from '../../db/supabaseClient';
import { TABLES, FORM_INSTANCE_GENERAL_INFO } from "../../constants/database";
import { GeneralInfo } from "../../types/formValidationSchemas";
import { generalInfoSchema } from "../../types/formValidationSchemas";

export interface FetchGeneralInfoResult {
  data: GeneralInfo | null;
  error: string | null;
}

/**
 * Fetches existing General Info data for a form module
 * @param formModuleId - The form module ID to fetch data for
 * @returns Promise with data and error
 */
export async function fetchGeneralInfoData(
  formModuleId: string
): Promise<FetchGeneralInfoResult> {
  try {
    if (import.meta.env.DEV) {
      console.log(
        `[fetchGeneralInfoData] Fetching data for module ${formModuleId}`
      );
    }

    const { data, error } = await supabase
      .from(TABLES.formInstanceGeneralInfo)
      .select("*")
      .eq(FORM_INSTANCE_GENERAL_INFO.formModuleId, formModuleId)
      .single();

    if (error) {
      // PGRST116 = no rows found, which is OK for new forms
      if (error.code === "PGRST116") {
        if (import.meta.env.DEV) {
          console.log(
            `[fetchGeneralInfoData] No existing data found for module ${formModuleId}`
          );
        }
        return { data: null, error: null };
      }

      if (import.meta.env.DEV) {
        console.error(`[fetchGeneralInfoData] Database error:`, error);
      }
      return { data: null, error: error.message };
    }

    if (!data) {
      if (import.meta.env.DEV) {
        console.log(
          `[fetchGeneralInfoData] No data returned for module ${formModuleId}`
        );
      }
      return { data: null, error: null };
    }

    // Validate the data against your Zod schema
    const validationResult = generalInfoSchema.safeParse(data);
    if (!validationResult.success) {
      if (import.meta.env.DEV) {
        console.warn(
          "Invalid general info data from database:",
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
        `[fetchGeneralInfoData] Successfully fetched data for module ${formModuleId}`
      );
    }

    return { data: validationResult.data, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`[fetchGeneralInfoData] Exception occurred:`, err);
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
