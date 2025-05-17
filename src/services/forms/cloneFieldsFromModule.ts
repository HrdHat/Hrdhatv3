import { supabase } from '../../db/supabaseClient';

export interface CloneFieldsFromModuleParams {
  moduleId: string;
  formId: string;
  formModuleId: string;
}

/**
 * Clones all fields from module_fields (template) to form_instance_module_fields (instance) for a given module.
 * Logs warnings for any failed insert but continues processing all fields.
 * @param log - Set to false to suppress console logs (default: true)
 */
export async function cloneFieldsFromModule(
  { moduleId, formId, formModuleId }: CloneFieldsFromModuleParams,
  log = true
): Promise<void> {
  // 1. Fetch all fields for the module
  const { data: moduleFields, error: fetchError } = await supabase
    .from('module_fields')
    .select('*')
    .eq('module_id', moduleId);

  if (fetchError) {
    if (log) console.warn('Failed to fetch module_fields:', fetchError.message);
    return;
  }
  if (!moduleFields || moduleFields.length === 0) {
    if (log) console.info(`No fields to clone for module_id=${moduleId}`);
    return;
  }

  // 2. Bulk insert all fields into form_instance_module_fields
  const insertPayload = moduleFields.map((field: any) => ({
    form_id: formId,
    form_module_id: formModuleId,
    name: field.name,
    label: field.label,
    type: field.type,
    required: field.required,
    field_order: field.field_order,
    default_value: field.default_value,
    version: field.version,
    // add any other fields you want to clone
  }));

  const { error: insertError } = await supabase
    .from('form_instance_module_fields')
    .insert(insertPayload);

  if (insertError) {
    if (log) console.warn(`Bulk insert failed for module_id=${moduleId}:`, insertError.message);
    return;
  }

  if (log) console.info(`Cloned ${moduleFields.length} fields from module_id=${moduleId} to form_module_id=${formModuleId}`);
} 