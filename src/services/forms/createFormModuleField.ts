import { supabase } from '../../db/supabaseClient';

// TODO: Move to src/types/forms.ts if not present
export interface CreateFormModuleFieldInput {
  formId: string;
  formModuleId: string;
  moduleFieldId: string;
  name: string;
  label: string;
  type: string;
  fieldOrder: number;
  required?: boolean;
  defaultValue?: string;
  version?: number;
}

export interface FormModuleField {
  id: string;
  form_id: string;
  form_module_id: string;
  module_field_id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  field_order: number;
  default_value?: string;
  version: number;
  created_at: string;
}

export interface SupabaseError {
  message: string;
  details?: string;
}

export interface FormModuleFieldResult {
  field: FormModuleField | null;
  error: SupabaseError | null;
}

const allowedTypes = [
  'text',
  'boolean',
  'number',
  'date',
  'select',
  'multiselect',
  'file',
  'signature',
];

export async function createFormModuleField({
  formId,
  formModuleId,
  moduleFieldId,
  name,
  label,
  type,
  fieldOrder,
  required = false,
  defaultValue,
  version = 1,
}: CreateFormModuleFieldInput): Promise<FormModuleFieldResult> {
  // Validate type
  if (!allowedTypes.includes(type)) {
    return { field: null, error: { message: 'Invalid field type' } };
  }

  // Check for uniqueness (form_module_id, name)
  const { data: existing, error: existingError } = await supabase
    .from('form_module_fields')
    .select('id')
    .eq('form_module_id', formModuleId)
    .eq('name', name)
    .maybeSingle();
  if (existingError) {
    return { field: null, error: { message: existingError.message, details: existingError.details } };
  }
  if (existing) {
    return { field: null, error: { message: 'Field name already exists in this module.' } };
  }

  // Insert new form module field
  const { data, error } = await supabase
    .from('form_module_fields')
    .insert([
      {
        form_id: formId,
        form_module_id: formModuleId,
        module_field_id: moduleFieldId,
        name,
        label,
        type,
        required,
        field_order: fieldOrder,
        default_value: defaultValue,
        version,
      },
    ])
    .select()
    .single();

  if (error) {
    return { field: null, error: { message: error.message, details: error.details } };
  }

  // Runtime guard for returned data
  if (!data || !data.id) {
    return { field: null, error: { message: 'Invalid response from Supabase' } };
  }

  return { field: data as FormModuleField, error: null };
} 