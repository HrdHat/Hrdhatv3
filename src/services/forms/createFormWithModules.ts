import { createForm, FlraForm, SupabaseError as FormError } from './createForm';
import { createFormModule, FormModule, SupabaseError as ModuleError } from './createFormModule';

export interface CreateFormWithModulesInput {
  companyId: string;
  projectId?: string;
  title: string;
  description?: string;
  moduleIds: string[];
}

export interface CreateFormWithModulesResult {
  form: FlraForm | null;
  modules: FormModule[];
  error: string | null;
}

export async function createFormWithModules({
  companyId,
  projectId,
  title,
  description,
  moduleIds,
}: CreateFormWithModulesInput): Promise<CreateFormWithModulesResult> {
  // 1. Create the form
  const { form, error: formError } = await createForm({ companyId, projectId, title, description });
  if (formError || !form) {
    return { form: null, modules: [], error: formError?.message || 'Failed to create form' };
  }

  // 2. Create all modules in order
  const modules: FormModule[] = [];
  for (let i = 0; i < moduleIds.length; i++) {
    const moduleId = moduleIds[i];
    const { formModule, error: moduleError } = await createFormModule({
      formId: form.id,
      moduleId,
      moduleOrder: i + 1,
    });
    if (moduleError || !formModule) {
      // Rollback not possible in Supabase client, so warn and return partial result
      return {
        form,
        modules,
        error: `Failed to add module ${moduleId}: ${moduleError?.message || 'Unknown error'}`,
      };
    }
    modules.push(formModule);
  }

  return { form, modules, error: null };
} 