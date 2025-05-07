import { supabase } from '../db/supabaseClient';

/**
 * Assigns all default modules to a user for a given form type (by form name, e.g. 'FLRA').
 * Inserts into user_form_module_preferences if not already present.
 */
export async function assignDefaultModulesToUser(userId: string, formName: string) {
  // 1. Get the form_list id for the given form name
  const { data: formList, error: formListError } = await supabase
    .from('form_list')
    .select('id')
    .eq('name', formName)
    .single();
  if (formListError || !formList) throw new Error('Could not find form_list for ' + formName);
  const formListId = formList.id;

  // 2. Get all default modules
  const { data: modules, error: modulesError } = await supabase
    .from('module_list')
    .select('id')
    .eq('is_default', true)
    .eq('is_active', true);
  if (modulesError || !modules) throw new Error('Could not fetch default modules');

  // 3. Prepare preferences rows
  const preferences = modules.map((mod, idx) => ({
    user_id: userId,
    form_list_id: formListId,
    module_list_id: mod.id,
    module_order: idx,
    is_required: true,
  }));

  // 4. Insert preferences (ignore duplicates)
  const { error: insertError } = await supabase
    .from('user_form_module_preferences')
    .upsert(preferences, { onConflict: 'user_id,form_list_id,module_list_id' });
  if (insertError) throw insertError;
}

/**
 * Ensures the user has module preferences for FLRA, and returns them.
 * If none exist, assigns the stock FLRA modules and returns those.
 * @param userId The user's UUID
 * @returns The user's module preferences for FLRA (ordered)
 */
export async function getOrCreateFlraModulePreferences(userId: string) {
  // 1. Get the FLRA form_list id
  const { data: formList, error: formListError } = await supabase
    .from('form_list')
    .select('id')
    .eq('name', 'FLRA')
    .single();
  if (formListError || !formList) throw new Error('FLRA form_list not found');
  const flraFormListId = formList.id;

  // 2. Query for existing preferences
  let { data: prefs, error: prefsError } = await supabase
    .from('user_form_module_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('form_list_id', flraFormListId)
    .order('module_order', { ascending: true });

  if (prefsError) throw prefsError;

  // 3. If none, assign defaults and re-query
  if (!prefs || prefs.length === 0) {
    await assignDefaultModulesToUser(userId, 'FLRA');
    // Query again
    const { data: newPrefs, error: newPrefsError } = await supabase
      .from('user_form_module_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('form_list_id', flraFormListId)
      .order('module_order', { ascending: true });
    if (newPrefsError) throw newPrefsError;
    prefs = newPrefs;
  }

  return prefs;
} 