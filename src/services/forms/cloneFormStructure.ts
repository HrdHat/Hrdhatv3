import { supabase } from "../../db/supabaseClient";
import {
  TABLES,
  TEMPLATE_MODULE_FIELDS,
  FORM_INSTANCE_MODULE_FIELDS,
} from "../../constants/database";

/**
 * Clones all fields from a module template (template_module_fields) into form_instance_module_fields for a new form_module instance.
 * @param moduleId - The module_id from the modules table (template source)
 * @param formId - The form_id for the new form
 * @param formModuleId - The id of the new form_module instance
 */
export async function cloneFieldsFromModule({
  moduleId,
  formId,
  formModuleId,
}: {
  moduleId: string;
  formId: string;
  formModuleId: string;
}) {
  const { data: moduleFields, error } = await supabase
    .from(TABLES.templateModuleFields)
    .select("*")
    .eq(TEMPLATE_MODULE_FIELDS.moduleId, moduleId)
    .order(TEMPLATE_MODULE_FIELDS.fieldOrder);

  if (error)
    throw new Error(`Error fetching template_module_fields: ${error.message}`);

  if (!moduleFields || moduleFields.length === 0) return; // Nothing to clone

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
      field[TEMPLATE_MODULE_FIELDS.defaultValue] ?? null,
  }));

  const { error: insertError } = await supabase
    .from(TABLES.formInstanceModuleFields)
    .insert(insertPayload);

  if (insertError)
    throw new Error(
      `Error inserting form_instance_module_fields: ${insertError.message}`
    );
}
