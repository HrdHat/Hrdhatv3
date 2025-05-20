import { supabase } from "../../db/supabaseClient";
import { TABLES, FORM_INSTANCE_MODULES } from "../../constants/database";

export type CompletionState =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";

export interface CreateFormModuleInput {
  formId: string;
  moduleId: string;
  moduleOrder: number;
  isRequired?: boolean;
  completionState?: string;
}

export interface FormModule {
  id: string;
  form_id: string;
  module_id: string;
  module_order: number;
  is_required: boolean;
  completion_state: string;
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
  completionState = "not_started",
}: CreateFormModuleInput): Promise<{
  formModule: FormModule | null;
  error: SupabaseError | null;
}> {
  try {
    // TODO: The 'module_list' table has been dropped. Update logic to use the new module source.
    // This check is now non-functional and must be migrated to the new architecture.
    // throw new Error("Module existence check is deprecated: 'module_list' table has been dropped. Update to new module source.");

    // 2. Create form module
    console.log(
      `[createFormModule] Creating form module for formId=${formId}, moduleId=${moduleId}, order=${moduleOrder}, isRequired=${isRequired}, completionState=${completionState}`
    );
    const { data, error } = await supabase
      .from(TABLES.formInstanceModules)
      .insert([
        {
          [FORM_INSTANCE_MODULES.formId]: formId,
          [FORM_INSTANCE_MODULES.moduleId]: moduleId,
          [FORM_INSTANCE_MODULES.moduleOrder]: moduleOrder,
          [FORM_INSTANCE_MODULES.isRequired]: isRequired,
          [FORM_INSTANCE_MODULES.completionState]: completionState,
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
      console.error(
        `[createFormModule] Invalid form_module response from Supabase`,
        data
      );
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
