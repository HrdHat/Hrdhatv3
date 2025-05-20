import { supabase } from "../db/supabaseClient";
import {
  TABLES,
  FORM_TEMPLATES,
  FORM_TEMPLATE_MODULES,
  USER_FORM_MODULE_PREFERENCES,
} from "../constants/database";

/**
 * Assigns all default modules to a user for a given form type (by form name, e.g. 'FLRA').
 * Inserts into user_form_module_preferences if not already present.
 * Now uses template_module_id referencing template_modules.
 */
export async function assignDefaultModulesToUser(
  userId: string,
  formName: string
) {
  // 1. Get the form_templates id for the given form name
  const { data: formTemplate, error: formTemplateError } = await supabase
    .from(TABLES.formTemplates)
    .select(FORM_TEMPLATES.id)
    .eq(FORM_TEMPLATES.name, formName)
    .single();
  if (formTemplateError || !formTemplate)
    throw new Error("Could not find form_templates for " + formName);
  const formTemplateId = formTemplate.id;

  // 2. Get all modules assigned to this template (preserving order and required flag)
  const { data: modules, error: modulesError } = await supabase
    .from(TABLES.formTemplateModules)
    .select(
      `${FORM_TEMPLATE_MODULES.templateModuleId}, ${FORM_TEMPLATE_MODULES.moduleOrder}, ${FORM_TEMPLATE_MODULES.isRequired}`
    )
    .eq(FORM_TEMPLATE_MODULES.formListId, formTemplateId)
    .order(FORM_TEMPLATE_MODULES.moduleOrder, { ascending: true });
  if (modulesError || !modules)
    throw new Error("Could not fetch template modules for this form template");

  // 3. Prepare preferences rows
  const preferences = modules.map(
    (m: {
      template_module_id: string;
      module_order: number;
      is_required: boolean;
    }) => ({
      [USER_FORM_MODULE_PREFERENCES.userId]: userId,
      [USER_FORM_MODULE_PREFERENCES.formListId]: formTemplateId,
      [USER_FORM_MODULE_PREFERENCES.templateModuleId]: m.template_module_id,
      [USER_FORM_MODULE_PREFERENCES.moduleOrder]: m.module_order,
      [USER_FORM_MODULE_PREFERENCES.isRequired]: m.is_required,
    })
  );

  // Deduplicate preferences before upsert
  // This prevents unique constraint violations on (userId, form_list_id, template_module_id)
  const seen = new Set();
  const uniquePrefs = preferences.filter((p: any) => {
    const key = `${p[USER_FORM_MODULE_PREFERENCES.userId]}_${
      p[USER_FORM_MODULE_PREFERENCES.formListId]
    }_${p[USER_FORM_MODULE_PREFERENCES.templateModuleId]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 4. Insert preferences (ignore duplicates)
  const { error: insertError } = await supabase
    .from(TABLES.userFormModulePreferences)
    .upsert(uniquePrefs, {
      onConflict: `${USER_FORM_MODULE_PREFERENCES.userId},${USER_FORM_MODULE_PREFERENCES.formListId},${USER_FORM_MODULE_PREFERENCES.templateModuleId}`,
    });
  if (insertError) throw insertError;
}

/**
 * Fallback logic:
 * If no rows in user_form_module_preferences for userId:
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
    .from(TABLES.formTemplates)
    .select(FORM_TEMPLATES.id)
    .eq(FORM_TEMPLATES.name, "FLRA")
    .single();
  if (formTemplateError || !formTemplate)
    throw new Error("FLRA form_templates not found");
  const flraFormTemplateId = formTemplate.id;

  // 2. Query for existing preferences (joined with template_modules)
  let { data: prefs, error: prefsError } = await supabase
    .from(TABLES.userFormModulePreferences)
    .select("*, template_modules:template_module_id(*)")
    .eq(USER_FORM_MODULE_PREFERENCES.userId, userId)
    .eq(USER_FORM_MODULE_PREFERENCES.formListId, flraFormTemplateId)
    .order(USER_FORM_MODULE_PREFERENCES.moduleOrder, { ascending: true });

  if (prefsError) throw prefsError;

  // 3. If none, assign defaults and re-query
  if (!prefs || prefs.length === 0) {
    await assignDefaultModulesToUser(userId, "FLRA");
    // Query again
    const { data: newPrefs, error: newPrefsError } = await supabase
      .from(TABLES.userFormModulePreferences)
      .select("*, template_modules:template_module_id(*)")
      .eq(USER_FORM_MODULE_PREFERENCES.userId, userId)
      .eq(USER_FORM_MODULE_PREFERENCES.formListId, flraFormTemplateId)
      .order(USER_FORM_MODULE_PREFERENCES.moduleOrder, { ascending: true });
    if (newPrefsError) throw newPrefsError;
    prefs = newPrefs;
  }

  return prefs;
}
