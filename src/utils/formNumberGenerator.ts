import { supabase } from "../db/supabaseClient";

/**
 * Generates a unique form number for a new FLRA form instance.
 * Ensures no collision in the form_instances table.
 */
export async function generateFormNumber(): Promise<string> {
  let unique = false;
  let formNumber = "";
  while (!unique) {
    // Example: FLRA-YYYYMMDD-XXXX (random 4-digit)
    const date = new Date();
    const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    formNumber = `FLRA-${ymd}-${random}`;
    // Check for collision
    const { data, error } = await supabase
      .from("form_instances")
      .select("id")
      .eq("form_number", formNumber)
      .maybeSingle();
    if (!data && !error) unique = true;
  }
  return formNumber;
}

/**
 * Checks if a user-supplied form ID is already taken for a given form module.
 */
export async function isUserFormIdTaken(
  userFormId: string,
  formModuleId: string
): Promise<boolean> {
  if (!userFormId) return false;
  const { data, error } = await supabase
    .from("form_instances")
    .select("id")
    .eq("user_form_id", userFormId)
    .maybeSingle();
  return !!data;
}
