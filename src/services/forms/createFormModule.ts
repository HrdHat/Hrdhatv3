import { supabase } from '../../db/supabaseClient';

export interface CreateFormModuleInput {
  formId: string;
  moduleId: string;
  moduleOrder: number;
}

export interface FormModule {
  id: string;
  form_id: string;
  module_id: string;
  module_order: number;
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
}: CreateFormModuleInput): Promise<{ formModule: FormModule | null; error: SupabaseError | null }> {
  const { data, error } = await supabase
    .from('form_modules')
    .insert([
      {
        form_id: formId,
        module_id: moduleId,
        module_order: moduleOrder,
      },
    ])
    .select()
    .single();

  if (error) {
    return { formModule: null, error: { message: error.message, details: error.details } };
  }

  if (!data || !data.id) {
    return { formModule: null, error: { message: 'Invalid form_module response from Supabase' } };
  }

  return { formModule: data as FormModule, error: null };
} 