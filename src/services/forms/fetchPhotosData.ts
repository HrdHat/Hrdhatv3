import { supabase } from "../../db/supabaseClient";
import { TABLES } from "../../constants/database";
import { FormAssetPhoto } from "../../types/formValidationSchemas";
import { formAssetPhotoSchema } from "../../types/formValidationSchemas";

export interface FetchPhotosResult {
  data: FormAssetPhoto[] | null;
  error: string | null;
}

/**
 * Fetches existing Photos data for a form module
 * @param formModuleId - The form module ID to fetch data for
 * @returns Promise with data and error
 */
export async function fetchPhotosData(
  formModuleId: string
): Promise<FetchPhotosResult> {
  try {
    if (import.meta.env.DEV) {
      console.log(`[fetchPhotosData] Fetching data for module ${formModuleId}`);
    }

    const { data, error } = await supabase
      .from(TABLES.formAssetPhotos)
      .select("*")
      .eq("form_module_id", formModuleId)
      .order("uploaded_at", { ascending: true });

    if (error) {
      if (import.meta.env.DEV) {
        console.error(`[fetchPhotosData] Database error:`, error);
      }
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      if (import.meta.env.DEV) {
        console.log(
          `[fetchPhotosData] No data returned for module ${formModuleId}`
        );
      }
      return { data: [], error: null };
    }

    // Validate each item against your Zod schema
    const validatedData: FormAssetPhoto[] = [];
    for (const item of data) {
      const validationResult = formAssetPhotoSchema.safeParse(item);
      if (!validationResult.success) {
        if (import.meta.env.DEV) {
          console.warn(
            "Invalid photo data from database:",
            validationResult.error
          );
        }
        continue; // Skip invalid items
      }
      validatedData.push(validationResult.data);
    }

    if (import.meta.env.DEV) {
      console.log(
        `[fetchPhotosData] Successfully fetched ${validatedData.length} items for module ${formModuleId}`
      );
    }

    return { data: validatedData, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`[fetchPhotosData] Exception occurred:`, err);
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
