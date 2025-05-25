import { supabase } from "../db/supabaseClient";
import { User } from "@supabase/supabase-js";
import { FlraForm } from "../types/formTypes";
import { TABLES, FORM_INSTANCE_FIELDS } from "../constants/database";

/**
 * Validates that a field exists in the FlraForm type
 */
function validateFormField(field: keyof typeof FORM_INSTANCE_FIELDS): void {
  const formFields = Object.keys(FORM_INSTANCE_FIELDS);
  if (!formFields.includes(field)) {
    throw new Error(
      `Invalid form field: ${field}. Valid fields are: ${formFields.join(", ")}`
    );
  }
}

/**
 * Generates a unique form number for a new FLRA form instance.
 * Ensures no collision in the form_instances table.
 */
export async function generateFormNumber(): Promise<string> {
  // Validate that form_number field exists
  validateFormField("formNumber");

  let unique = false;
  let formNumber = "";
  while (!unique) {
    // Example: FLRA-YYYYMMDD-XXXX (random 4-digit)
    const date = new Date();
    const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    formNumber = `FLRA-${ymd}-${random}`;

    // Check for collision
    console.log("Supabase Query:", {
      table: TABLES.formInstances,
      select: FORM_INSTANCE_FIELDS.id,
      filters: { [FORM_INSTANCE_FIELDS.formNumber]: formNumber },
      fullQuery: {
        from: TABLES.formInstances,
        select: FORM_INSTANCE_FIELDS.id,
        eq: { [FORM_INSTANCE_FIELDS.formNumber]: formNumber },
      },
    });
    const { data, error } = await supabase
      .from(TABLES.formInstances)
      .select(FORM_INSTANCE_FIELDS.id)
      .eq(FORM_INSTANCE_FIELDS.formNumber, formNumber)
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

  // Validate that required fields exist
  validateFormField("userFormId");
  validateFormField("formModuleId");

  console.log("Supabase Query:", {
    table: TABLES.formInstances,
    select: FORM_INSTANCE_FIELDS.id,
    filters: {
      [FORM_INSTANCE_FIELDS.userFormId]: userFormId,
      [FORM_INSTANCE_FIELDS.formModuleId]: formModuleId,
    },
    fullQuery: {
      from: TABLES.formInstances,
      select: FORM_INSTANCE_FIELDS.id,
      eq: {
        [FORM_INSTANCE_FIELDS.userFormId]: userFormId,
        [FORM_INSTANCE_FIELDS.formModuleId]: formModuleId,
      },
    },
  });
  const { data, error } = await supabase
    .from(TABLES.formInstances)
    .select(FORM_INSTANCE_FIELDS.id)
    .eq(FORM_INSTANCE_FIELDS.userFormId, userFormId)
    .eq(FORM_INSTANCE_FIELDS.formModuleId, formModuleId)
    .maybeSingle();
  return !!data;
}
