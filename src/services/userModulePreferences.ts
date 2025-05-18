import { supabase } from '../db/supabaseClient';

/**
 * Assigns all default modules to a user for a given form type (by form name, e.g. 'FLRA').
 * Inserts into user_form_module_preferences if not already present.
 * Now uses template_module_id referencing template_modules.
 */
export async function assignDefaultModulesToUser(userId: string, formName: string) {
  // 1. Get the form_templates id for the given form name
  const { data: formTemplate, error: formTemplateError } = await supabase
    .from('form_templates')
    .select('id')
    .eq('name', formName)
    .single();
  if (formTemplateError || !formTemplate) throw new Error('Could not find form_templates for ' + formName);
  const formTemplateId = formTemplate.id;

  // 2. Get all modules assigned to this template (preserving order and required flag)
  const { data: modules, error: modulesError } = await supabase
    .from('form_template_modules')
    .select('template_module_id, module_order, is_required')
    .eq('form_list_id', formTemplateId)
    .order('module_order', { ascending: true });
  if (modulesError || !modules) throw new Error('Could not fetch template modules for this form template');

  // 3. Prepare preferences rows
  const preferences = modules.map((m: { template_module_id: string; module_order: number; is_required: boolean }) => ({
    user_id: userId,
    form_list_id: formTemplateId,
    template_module_id: m.template_module_id,
    module_order: m.module_order,
    is_required: m.is_required,
  }));

  // Deduplicate preferences before upsert
  // This prevents unique constraint violations on (user_id, form_list_id, template_module_id)
  const seen = new Set();
  const uniquePrefs = preferences.filter((p: any) => {
    const key = `${p.user_id}_${p.form_list_id}_${p.template_module_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 4. Insert preferences (ignore duplicates)
  const { error: insertError } = await supabase
    .from('user_form_module_preferences')
    .upsert(uniquePrefs, { onConflict: 'user_id,form_list_id,template_module_id' });
  if (insertError) throw insertError;
}

/**
 * Fallback logic:
 * If no rows in user_form_module_preferences for user_id:
 *   → Load all module_list.id where is_default = true
 *   → Insert those as new preferences
 *   → Use them to create form_instance_modules
 */

/**
 * Ensures the user has module preferences for FLRA, and returns them joined with template_modules.
 * If none exist, assigns the stock template modules and returns those.
 * @param userId The user's UUID
 * @returns The user's module preferences for FLRA (ordered, joined with template_modules)
 */
export async function getOrCreateFlraModulePreferences(userId: string) {
  // 1. Get the FLRA form_templates id
  const { data: formTemplate, error: formTemplateError } = await supabase
    .from('form_templates')
    .select('id')
    .eq('name', 'FLRA')
    .single();
  if (formTemplateError || !formTemplate) throw new Error('FLRA form_templates not found');
  const flraFormTemplateId = formTemplate.id;

  // 2. Query for existing preferences (joined with template_modules)
  let { data: prefs, error: prefsError } = await supabase
    .from('user_form_module_preferences')
    .select('*, template_modules:template_module_id(*)')
    .eq('user_id', userId)
    .eq('form_list_id', flraFormTemplateId)
    .order('module_order', { ascending: true });

  if (prefsError) throw prefsError;

  // 3. If none, assign defaults and re-query
  if (!prefs || prefs.length === 0) {
    await assignDefaultModulesToUser(userId, 'FLRA');
    // Query again
    const { data: newPrefs, error: newPrefsError } = await supabase
      .from('user_form_module_preferences')
      .select('*, template_modules:template_module_id(*)')
      .eq('user_id', userId)
      .eq('form_list_id', flraFormTemplateId)
      .order('module_order', { ascending: true });
    if (newPrefsError) throw newPrefsError;
    prefs = newPrefs;
  }

  return prefs;
} 