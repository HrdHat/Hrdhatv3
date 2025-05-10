import { supabase } from "../../db/supabaseClient";

export interface CreateFormModuleInput {
  formId: string;
  moduleId: string;
  moduleOrder: number;
  isRequired?: boolean;
}

export interface FormModule {
  id: string;
  form_id: string;
  module_id: string;
  module_order: number;
  is_required: boolean;
  created_at: string;
}

export interface SupabaseError {
  message: string;
  details?: string;
}

export async function createFormModule({
  formId,
  moduleId,
  moduleOrder,
  isRequired = true,
}: CreateFormModuleInput): Promise<{
  formModule: FormModule | null;
  error: SupabaseError | null;
}> {
  try {
    // 1. Verify module exists and is active
    console.log(`[createFormModule] Checking if module ${moduleId} exists and is active...`);
    const { data: module, error: moduleError } = await supabase
      .from("module_list")
      .select("id")
      .eq("id", moduleId)
      .eq("is_active", true)
      .single();

    if (moduleError || !module) {
      console.error(`[createFormModule] Module not found or inactive: ${moduleId}`, moduleError);
      return {
        formModule: null,
        error: { message: "Module not found or inactive" },
      };
    }

    // 2. Create form module
    console.log(`[createFormModule] Creating form module for formId=${formId}, moduleId=${moduleId}, order=${moduleOrder}, isRequired=${isRequired}`);
    const { data, error } = await supabase
      .from("form_modules")
      .insert([
        {
          form_id: formId,
          module_id: moduleId,
          module_order: moduleOrder,
          is_required: isRequired,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(`[createFormModule] Error creating form module:`, error);
      return {
        formModule: null,
        error: { message: error.message, details: error.details },
      };
    }

    if (!data || !data.id) {
      console.error(`[createFormModule] Invalid form_module response from Supabase`, data);
      return {
        formModule: null,
        error: { message: "Invalid form_module response from Supabase" },
      };
    }

    console.log(`[createFormModule] Successfully created form module:`, data);
    return { formModule: data as FormModule, error: null };
  } catch (err) {
    console.error(`[createFormModule] Exception occurred:`, err);
    return {
      formModule: null,
      error: {
        message: err instanceof Error ? err.message : "Unknown error occurred",
        details: err instanceof Error ? err.stack : undefined,
      },
    };
  }
}
