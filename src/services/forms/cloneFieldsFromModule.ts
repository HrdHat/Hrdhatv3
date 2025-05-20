import { supabase } from "../../db/supabaseClient";
import {
  TABLES,
  TEMPLATE_MODULE_FIELDS,
  FORM_INSTANCE_MODULE_FIELDS,
} from "../../constants/database";

export interface CloneFieldsFromModuleParams {
  moduleId: string;
  formId: string;
  formModuleId: string;
}

/**
 * Clones all fields from template_module_fields (template) to form_instance_module_fields (instance) for a given module.
 * Logs warnings for any failed insert but continues processing all fields.
 * @param log - Set to false to suppress console logs (default: true)
 */
export async function cloneFieldsFromModule(
  { moduleId, formId, formModuleId }: CloneFieldsFromModuleParams,
  log = true
): Promise<void> {
  // 1. Fetch all fields for the module
  const { data: moduleFields, error: fetchError } = await supabase
    .from(TABLES.templateModuleFields)
    .select("*")
    .eq(TEMPLATE_MODULE_FIELDS.moduleId, moduleId);

  if (fetchError) {
    if (log)
      console.warn(
        "Failed to fetch template_module_fields:",
        fetchError.message
      );
    return;
  }
  if (!moduleFields || moduleFields.length === 0) {
    if (log) console.info(`No fields to clone for module_id=${moduleId}`);
    return;
  }

  // 2. Bulk insert all fields into form_instance_module_fields
  const insertPayload = moduleFields.map((field: any) => ({
    [FORM_INSTANCE_MODULE_FIELDS.formId]: formId,
    [FORM_INSTANCE_MODULE_FIELDS.formModuleId]: formModuleId,
    [FORM_INSTANCE_MODULE_FIELDS.name]: field[TEMPLATE_MODULE_FIELDS.name],
    [FORM_INSTANCE_MODULE_FIELDS.label]: field[TEMPLATE_MODULE_FIELDS.label],
    [FORM_INSTANCE_MODULE_FIELDS.type]: field[TEMPLATE_MODULE_FIELDS.type],
    [FORM_INSTANCE_MODULE_FIELDS.required]:
      field[TEMPLATE_MODULE_FIELDS.required],
    [FORM_INSTANCE_MODULE_FIELDS.fieldOrder]:
      field[TEMPLATE_MODULE_FIELDS.fieldOrder],
    [FORM_INSTANCE_MODULE_FIELDS.defaultValue]:
      field[TEMPLATE_MODULE_FIELDS.defaultValue],
    [FORM_INSTANCE_MODULE_FIELDS.version]:
      field[TEMPLATE_MODULE_FIELDS.version],
  }));

  const { error: insertError } = await supabase
    .from(TABLES.formInstanceModuleFields)
    .insert(insertPayload);

  if (insertError) {
    if (log)
      console.warn(
        `Bulk insert failed for module_id=${moduleId}:`,
        insertError.message
      );
    return;
  }

  if (log)
    console.info(
      `Cloned ${moduleFields.length} fields from module_id=${moduleId} to form_module_id=${formModuleId}`
    );
}
