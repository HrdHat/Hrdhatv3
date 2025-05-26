import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { supabase } from "../../../db/supabaseClient";
import { createFormWithModules } from "../createFormWithModules";
import { TABLES } from "../../../constants/database";
import {
  createFormSchema,
  formModuleFieldSchema,
} from "../../../types/formValidationSchemas";

// Test constants - Use undefined for function interface, expect null from DB
const TEST_USER_ID = "b883f6c3-945b-4ee5-9ad9-aef7183a5666"; // User with RLS enabled
const TEST_COMPANY_ID = undefined; // Function expects string | undefined, DB returns null
const TEST_PROJECT_ID = undefined; // Function expects string | undefined, DB returns null
const TEST_TITLE = "Test FLRA Form";
const TEST_DESCRIPTION = "Integration test form";

// UUID validation regex
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Helper function to get user's preferred modules
async function getUserPreferredModules(): Promise<string[]> {
  // Get user's form module preferences
  const { data: userPreferences, error: userPreferencesError } = await supabase
    .from(TABLES.userFormModulePreferences)
    .select("template_module_id")
    .eq("user_id", TEST_USER_ID)
    .order("module_order", { ascending: true });

  if (userPreferencesError) {
    console.error("Error fetching user preferences:", userPreferencesError);
    throw new Error(
      `Failed to fetch user preferences: ${userPreferencesError.message}`
    );
  }

  if (!userPreferences || userPreferences.length === 0) {
    throw new Error(
      `No user form module preferences found for user ${TEST_USER_ID}. Please set up user preferences.`
    );
  }

  console.log(`Found ${userPreferences.length} preferred modules for user`);
  return userPreferences.map((pref) => pref.template_module_id);
}

// Enhanced cleanup function for full isolation
async function cleanupTestData(formId?: string) {
  const tables = [
    TABLES.formInstanceSignatures,
    TABLES.formAssetPhotos,
    TABLES.formInstanceHazards,
    TABLES.formInstancePpePlatform,
    TABLES.formInstancePreJobChecklist,
    TABLES.formInstanceGeneralInfo,
    TABLES.formInstanceModuleFields,
    TABLES.formInstanceModules,
    TABLES.formInstances,
  ];

  for (const table of tables) {
    if (formId) {
      // Clean up specific form data
      await supabase.from(table).delete().eq("form_id", formId);
    } else {
      // Full cleanup - delete all test data for this user
      if (table === TABLES.formInstances) {
        // Clean up all forms for test user
        await supabase.from(table).delete().eq("user_id", TEST_USER_ID);
      } else {
        // For other tables, clean up all rows that might be related to test user's forms
        // First get all form IDs for the test user
        const { data: testForms } = await supabase
          .from(TABLES.formInstances)
          .select("id")
          .eq("user_id", TEST_USER_ID);

        if (testForms && testForms.length > 0) {
          const formIds = testForms.map((f) => f.id);
          await supabase.from(table).delete().in("form_id", formIds);
        }
      }
    }
  }
}

// Cleanup function that only removes old test data (older than 1 minute)
async function cleanupOldTestData() {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

  // Only clean up forms older than 1 minute for this test user
  const { data: oldForms } = await supabase
    .from(TABLES.formInstances)
    .select("id")
    .eq("user_id", TEST_USER_ID)
    .lt("created_at", oneMinuteAgo);

  if (oldForms && oldForms.length > 0) {
    const oldFormIds = oldForms.map((f) => f.id);

    // Clean up related data for old forms
    const tables = [
      TABLES.formInstanceSignatures,
      TABLES.formAssetPhotos,
      TABLES.formInstanceHazards,
      TABLES.formInstancePpePlatform,
      TABLES.formInstancePreJobChecklist,
      TABLES.formInstanceGeneralInfo,
      TABLES.formInstanceModuleFields,
      TABLES.formInstanceModules,
    ];

    for (const table of tables) {
      await supabase.from(table).delete().in("form_id", oldFormIds);
    }

    // Finally, delete the old forms themselves
    await supabase.from(TABLES.formInstances).delete().in("id", oldFormIds);
  }
}

describe("createFormWithModules Integration Test", { timeout: 20000 }, () => {
  let moduleIds: string[] = [];
  let formId: string | undefined;

  beforeEach(async () => {
    // Only clean up old test data, not all data
    // This prevents interference with the current test
    await cleanupOldTestData();

    // Get user's preferred modules
    moduleIds = await getUserPreferredModules();

    // Reset formId tracking
    formId = undefined;
  });

  afterEach(async () => {
    // Consolidated cleanup - specific form cleanup if exists, then full cleanup
    if (formId) {
      await cleanupTestData(formId);
    }
    await cleanupTestData();
  });

  it("should create a complete FLRA form with all modules and verify data integrity", async () => {
    // Step 1: Call createFormWithModules
    const result = await createFormWithModules({
      userId: TEST_USER_ID,
      companyId: TEST_COMPANY_ID,
      projectId: TEST_PROJECT_ID,
      title: TEST_TITLE,
      description: TEST_DESCRIPTION,
      moduleIds,
    });

    // Step 2: Assert the result has no error and returns a valid id
    expect(result.error).toBeNull();
    expect(result.form).toBeTruthy();
    expect(result.form?.id).toBeTruthy();
    expect(typeof result.form?.id).toBe("string");

    // Track formId for cleanup
    formId = result.form!.id;

    // Validate UUID format
    expect(formId).toMatch(uuidRegex);

    expect(result.modules).toBeTruthy();
    expect(Array.isArray(result.modules)).toBe(true);
    expect(result.modules.length).toBeGreaterThan(0);

    // Step 3: Query form_instances and verify basic form data
    const { data: formInstance, error: formInstanceError } = await supabase
      .from(TABLES.formInstances)
      .select("*")
      .eq("id", formId)
      .single();

    expect(formInstanceError).toBeNull();
    expect(formInstance).toBeTruthy();
    expect(formInstance.title).toBe(TEST_TITLE);
    expect(formInstance.company_id).toBeNull();
    expect(formInstance.project_id).toBeNull();
    expect(formInstance.user_id).toBe(TEST_USER_ID);
    expect(formInstance.description).toBe(TEST_DESCRIPTION);
    expect(formInstance.status).toBe("draft");

    // Step 3.1: Validate form instance against Zod schema for round-trip integrity
    const formValidationResult = createFormSchema.safeParse({
      userId: formInstance.user_id,
      companyId: formInstance.company_id,
      projectId: formInstance.project_id,
      title: formInstance.title,
      description: formInstance.description,
      status: formInstance.status,
      submittedAt: formInstance.submitted_at,
    });
    expect(formValidationResult.success).toBe(true);
    if (!formValidationResult.success) {
      console.error(
        "Form validation errors:",
        formValidationResult.error.errors
      );
    }

    // Step 4: Verify form_instance_modules were created
    const { data: formModules, error: formModulesError } = await supabase
      .from(TABLES.formInstanceModules)
      .select("*")
      .eq("form_id", formId)
      .order("module_order", { ascending: true });

    expect(formModulesError).toBeNull();
    expect(formModules).toBeTruthy();
    expect(formModules).not.toBeNull();

    // Debug: Show which modules were found vs expected
    console.log("Expected moduleIds:", moduleIds);
    console.log(
      "Found modules:",
      formModules!.map((m) => ({
        id: m.id,
        module_id: m.module_id,
        order: m.module_order,
      }))
    );

    expect(formModules!.length).toBe(moduleIds.length);
    expect(formModules!.length).toBeGreaterThan(0);

    // Verify module order and properties
    formModules!.forEach((module, index) => {
      expect(module.form_id).toBe(formId);
      expect(module.module_order).toBe(index + 1);
      expect(module.is_required).toBe(true);
      expect(module.completion_state).toBe("not_started");
      expect(moduleIds).toContain(module.module_id);
      // Validate module ID is also a UUID
      expect(module.id).toMatch(uuidRegex);
      expect(module.module_id).toMatch(uuidRegex);
    });

    // Step 5: Verify form_instance_module_fields were created for modules that use fields
    const { data: moduleFields, error: moduleFieldsError } = await supabase
      .from(TABLES.formInstanceModuleFields)
      .select("*")
      .eq("form_id", formId);

    expect(moduleFieldsError).toBeNull();
    expect(moduleFields).toBeTruthy();

    // Should have fields for modules that use dynamic fields
    if (moduleFields && moduleFields.length > 0) {
      moduleFields.forEach((field) => {
        expect(field.form_id).toBe(formId);
        expect(field.form_module_id).toBeTruthy();
        expect(field.name).toBeTruthy();
        expect(field.label).toBeTruthy();
        expect(field.type).toBeTruthy();
        expect(typeof field.required).toBe("boolean");
        expect(typeof field.field_order).toBe("number");
        expect(field.field_order).toBeGreaterThan(0);
        // Validate field IDs are UUIDs
        expect(field.id).toMatch(uuidRegex);
        expect(field.form_module_id).toMatch(uuidRegex);
        if (field.module_field_id) {
          expect(field.module_field_id).toMatch(uuidRegex);
        }

        // Step 5.1: Validate each field against Zod schema for round-trip integrity
        const fieldValidationResult = formModuleFieldSchema.safeParse({
          formId: field.form_id,
          formModuleId: field.form_module_id,
          moduleFieldId:
            field.module_field_id || "00000000-0000-4000-8000-000000000000", // Fallback UUID for optional field
          name: field.name,
          label: field.label,
          type: field.type,
          required: field.required,
          fieldOrder: field.field_order,
          defaultValue: field.default_value,
          version: field.version,
        });

        if (!fieldValidationResult.success) {
          console.error(
            `Field validation failed for field: ${field.name}`,
            "Field data:",
            field,
            "Validation errors:",
            fieldValidationResult.error.errors
          );
        }

        expect(fieldValidationResult.success).toBe(true);
      });
    }

    // Step 6: Verify that module-specific tables are ready (should be accessible)
    const moduleSpecificTables = [
      TABLES.formInstanceGeneralInfo,
      TABLES.formInstancePreJobChecklist,
      TABLES.formInstancePpePlatform,
      TABLES.formInstanceHazards,
      TABLES.formAssetPhotos,
      TABLES.formInstanceSignatures,
    ];

    for (const table of moduleSpecificTables) {
      const { data, error } = await supabase.from(table).select("*").limit(1); // Just check if table is accessible, don't filter by form_id

      // Should not error (table should be accessible)
      expect(error).toBeNull();
      // Should return an array (even if empty)
      expect(Array.isArray(data)).toBe(true);
    }

    // Step 7: Verify warnings array (should be empty for successful creation)
    expect(Array.isArray(result.warnings)).toBe(true);
    // Warnings might exist but shouldn't prevent form creation
    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => {
        expect(warning.moduleId).toBeTruthy();
        expect(warning.message).toBeTruthy();
        expect(["FIELD_CREATION_ERROR", "MODULE_FIELDS_FETCH_ERROR"]).toContain(
          warning.code
        );
      });
    }
  });

  it("should handle missing moduleIds gracefully", async () => {
    const result = await createFormWithModules({
      userId: TEST_USER_ID,
      companyId: TEST_COMPANY_ID,
      projectId: TEST_PROJECT_ID,
      title: TEST_TITLE,
      description: TEST_DESCRIPTION,
      moduleIds: [],
    });

    expect(result.error).toBeTruthy();
    expect(result.error).toContain("moduleIds must be a non-empty array");
    expect(result.form).toBeNull();
    expect(result.modules).toEqual([]);
  });

  it("should handle invalid moduleIds gracefully", async () => {
    const invalidModuleIds = ["invalid-module-id-1", "invalid-module-id-2"];

    const result = await createFormWithModules({
      userId: TEST_USER_ID,
      companyId: TEST_COMPANY_ID,
      projectId: TEST_PROJECT_ID,
      title: TEST_TITLE,
      description: TEST_DESCRIPTION,
      moduleIds: invalidModuleIds,
    });

    // Should fail when trying to create modules with invalid IDs
    expect(result.error).toBeTruthy();
    expect(result.form).toBeTruthy(); // Form should be created
    expect(result.modules.length).toBeLessThan(invalidModuleIds.length); // Should fail to create modules

    // Track formId for cleanup
    formId = result.form?.id;

    // Validate form ID is still a proper UUID even when modules fail
    if (formId) {
      expect(formId).toMatch(uuidRegex);
    }
  });

  it("should create form with minimal required data", async () => {
    const result = await createFormWithModules({
      userId: TEST_USER_ID,
      companyId: undefined,
      projectId: undefined,
      title: "Minimal Test Form",
      moduleIds: moduleIds.slice(0, 1), // Just use first module
    });

    expect(result.error).toBeNull();
    expect(result.form).toBeTruthy();
    expect(result.form?.title).toBe("Minimal Test Form");
    expect(result.modules.length).toBe(1);

    // Track formId for cleanup
    formId = result.form?.id;

    // Validate UUID format
    if (formId) {
      expect(formId).toMatch(uuidRegex);
    }
  });
});
