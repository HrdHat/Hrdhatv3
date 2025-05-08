/**
 * Form Creation and Update Service
 *
 * This service handles the creation and updating of form records in the database.
 * It ensures that a form record exists for each FLRA session, maintaining data integrity
 * between forms and their associated photos/modules.
 *
 * Key Features:
 * - Creates form records with 'draft' status
 * - Uses upsert to handle both new and existing forms
 * - Maintains created_at and updated_at timestamps
 * - Ensures proper user association via created_by
 */

import { supabase } from "../../db/supabaseClient";

export async function ensureFormRowExists(formId: string, userId: string) {
  const { error } = await supabase
    .from("forms")
    .upsert([
      {
        id: formId,
        created_by: userId,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) {
    console.error("[❌ Form Insert Failed]", error);
  } else {
    console.log("[✅ Draft Form Created]");
  }
}
