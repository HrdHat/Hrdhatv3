import { supabase } from '../../db/supabaseClient';

export interface CreateFormInput {
  companyId: string;
  projectId?: string;
  title: string;
  description?: string;
}

export interface FlraForm {
  id: string;
  company_id: string;
  project_id?: string;
  title: string;
  description?: string;
  version: number;
  created_by: string;
  status: string;
  created_at: string;
  submitted_at?: string | null;
}

export interface SupabaseError {
  message: string;
  details?: string;
}

export async function createForm({
  companyId,
  projectId,
  title,
  description,
}: CreateFormInput): Promise<{ form: FlraForm | null; error: SupabaseError | null }> {
  // Validate title is not empty
  if (!title || title.trim() === '') {
    return { form: null, error: { message: 'Title is required' } };
  }

  // 1. Get authenticated user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return { form: null, error: { message: 'User not authenticated' } };
  }
  const createdBy = userData.user.id;

  // 2. Determine next version number for this company/project
  let version = 1;
  let versionQuery = supabase
    .from('forms')
    .select('version')
    .eq('company_id', companyId);
  if (projectId) {
    versionQuery = versionQuery.eq('project_id', projectId);
  }
  const { data: versionData, error: versionError } = await versionQuery
    .order('version', { ascending: false })
    .limit(1);
  if (versionError) {
    return { form: null, error: { message: versionError.message, details: versionError.details } };
  }
  if (versionData && versionData.length > 0 && versionData[0].version) {
    version = versionData[0].version + 1;
    if (import.meta.env.DEV) {
      console.debug(`[createForm] Version bump for companyId=${companyId}, projectId=${projectId}: ${version}`);
    }
  }

  // 3. Insert new form
  const { data, error } = await supabase
    .from('forms')
    .insert([
      {
        company_id: companyId,
        project_id: projectId ?? null,
        title,
        description,
        version,
        created_by: createdBy,
        status: 'draft',
        submitted_at: null, // for future-proofing
      },
    ])
    .select()
    .single();

  if (error) {
    return { form: null, error: { message: error.message, details: error.details } };
  }

  // Runtime guard for returned data
  if (!data || !data.id) {
    return { form: null, error: { message: 'Invalid form response from Supabase' } };
  }

  return { form: data as FlraForm, error: null };
} 