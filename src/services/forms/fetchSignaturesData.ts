import { supabase } from "../../db/supabaseClient";
import { TABLES, FORM_INSTANCE_SIGNATURES } from "../../constants/database";
import { Signature } from "../../types/formSchemas";
import { signatureSchema } from "../../types/formSchemas";

export interface FetchSignaturesResult {
  data: Signature[] | null;
  error: string | null;
}

/**
 * Fetches existing Signatures data for a form module
 * @param formModuleId - The form module ID to fetch data for
 * @returns Promise with data and error
 */
export async function fetchSignaturesData(
  formModuleId: string
): Promise<FetchSignaturesResult> {
  try {
    if (import.meta.env.DEV) {
      console.log(
        `[fetchSignaturesData] Fetching data for module ${formModuleId}`
      );
    }

    const { data, error } = await supabase
      .from(TABLES.formInstanceSignatures)
      .select("*")
      .eq(FORM_INSTANCE_SIGNATURES.formModuleId, formModuleId)
      .eq(FORM_INSTANCE_SIGNATURES.isDeleted, false)
      .order("signed_at", { ascending: true });

    if (error) {
      if (import.meta.env.DEV) {
        console.error(`[fetchSignaturesData] Database error:`, error);
      }
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      if (import.meta.env.DEV) {
        console.log(
          `[fetchSignaturesData] No data returned for module ${formModuleId}`
        );
      }
      return { data: [], error: null };
    }

    // Validate each item against your Zod schema
    const validatedData: Signature[] = [];
    for (const item of data) {
      const validationResult = signatureSchema.safeParse(item);
      if (!validationResult.success) {
        if (import.meta.env.DEV) {
          console.warn(
            "Invalid signature data from database:",
            validationResult.error
          );
        }
        continue; // Skip invalid items
      }
      validatedData.push(validationResult.data);
    }

    if (import.meta.env.DEV) {
      console.log(
        `[fetchSignaturesData] Successfully fetched ${validatedData.length} items for module ${formModuleId}`
      );
    }

    return { data: validatedData, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`[fetchSignaturesData] Exception occurred:`, err);
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
