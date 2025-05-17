import { supabase } from "../../db/supabaseClient";

/**
 * Clones all fields from a module template (module_fields) into form_instance_module_fields for a new form_module instance.
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
    .from("module_fields")
    .select("*")
    .eq("module_id", moduleId)
    .order("field_order");

  if (error) throw new Error(`Error fetching module_fields: ${error.message}`);

  if (!moduleFields || moduleFields.length === 0) return; // Nothing to clone

  const insertPayload = moduleFields.map((field: any) => ({
    form_id: formId,
    form_module_id: formModuleId,
    name: field.name,
    label: field.label,
    type: field.type,
    required: field.required,
    field_order: field.field_order,
    default_value: field.default_value ?? null,
  }));

  const { error: insertError } = await supabase
    .from("form_instance_module_fields")
    .insert(insertPayload);

  if (insertError) throw new Error(`Error inserting form_instance_module_fields: ${insertError.message}`);
} 