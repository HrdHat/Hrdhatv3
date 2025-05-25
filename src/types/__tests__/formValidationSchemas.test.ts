import { describe, it, expect } from "vitest";
import {
  schemaMap,
  validateModuleData,
  validateFieldDefinition,
  moduleFieldSchemaStrict,
  moduleFieldSchemaLoose,
} from "../formValidationSchemas";
import type { ModuleKey } from "../formTypes";
import { z } from "zod";
import { saveFormModuleDataParamsSchema } from "../formValidationSchemas";
import { formatZodErrors } from "../../utils/validation";

// Example valid payloads for each module
const validPayloads: Record<ModuleKey, any> = {
  header: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    form_number: "FLRA-2024-001",
    created_by: "123e4567-e89b-12d3-a456-426614174001",
    status: "draft",
    last_modified: "2024-03-20T12:00:00Z",
    created_at: "2024-03-20T12:00:00Z",
    auto_archived: false,
    data: {},
    company_id: "123e4567-e89b-12d3-a456-426614174002",
    project_id: "123e4567-e89b-12d3-a456-426614174003",
    title: "Test Form",
    description: "Test Description",
    version: 1,
    submitted_at: null,
    user_id: "123e4567-e89b-12d3-a456-426614174004",
    form_date: "2024-03-20",
  },
  general: {
    id: "123e4567-e89b-12d3-a456-426614174005",
    form_module_id: "123e4567-e89b-12d3-a456-426614174006",
    project_name: "Test Project",
    project_address: "123 Test St",
    task_location: "Site A",
    supervisor_name: "John Doe",
    supervisor_contact: "+1234567890",
    date: "2024-03-20",
    crew_members_count: 5,
    task_description: "Test task description",
    start_time: "09:00",
    end_time: "17:00",
    created_at: "2024-03-20T12:00:00Z",
  },
  preJobChecklist: {
    id: "123e4567-e89b-12d3-a456-426614174007",
    form_id: "123e4567-e89b-12d3-a456-426614174008",
    form_module_id: "123e4567-e89b-12d3-a456-426614174009",
    is_fit_for_duty: true,
    reviewed_work_area_for_hazards: true,
    required_ppe_for_today: true,
    equipment_inspection_up_to_date: true,
    completed_flra_hazard_assessment: true,
    safety_signage_installed_and_checked: true,
    working_alone_today: false,
    required_permits_for_tasks: true,
    barricades_signage_barriers_installed_good: true,
    clear_access_to_emergency_exits: true,
    trained_and_competent_for_tasks: true,
    inspected_tools_and_equipment: true,
    reviewed_control_measures_needed: true,
    reviewed_emergency_procedures: true,
    all_required_permits_in_place: true,
    communicated_with_crew_about_plan: true,
    need_for_spotters_barricades_special_controls: false,
    weather_suitable_for_work: true,
    know_designated_first_aid_attendant: true,
    aware_of_site_notices_or_bulletins: true,
    created_at: "2024-03-20T12:00:00Z",
  },
  ppeChecklist: {
    id: "123e4567-e89b-12d3-a456-426614174010",
    form_id: "123e4567-e89b-12d3-a456-426614174011",
    form_module_id: "123e4567-e89b-12d3-a456-426614174012",
    ppe_hardhat: true,
    ppe_safety_vest: true,
    ppe_safety_glasses: true,
    ppe_fall_protection: false,
    ppe_coveralls: true,
    ppe_gloves: true,
    ppe_mask: false,
    ppe_respirator: false,
    platform_ladder: true,
    platform_step_bench: false,
    platform_sawhorses: false,
    platform_baker_scaffold: false,
    platform_scaffold: false,
    platform_scissor_lift: false,
    platform_boom_lift: false,
    platform_swing_stage: false,
    platform_hydro_lift: false,
    created_at: "2024-03-20T12:00:00Z",
  },
  taskHazards: [
    {
      id: "123e4567-e89b-12d3-a456-426614174013",
      form_id: "123e4567-e89b-12d3-a456-426614174014",
      form_module_id: "123e4567-e89b-12d3-a456-426614174015",
      task: "Test Task",
      hazard: "Test Hazard",
      risk_level_before: 3,
      control: "Test Control",
      risk_level_after: 1,
      created_at: "2024-03-20T12:00:00Z",
    },
  ],
  photos: [
    {
      id: "123e4567-e89b-12d3-a456-426614174016",
      form_id: "123e4567-e89b-12d3-a456-426614174017",
      form_module_id: "123e4567-e89b-12d3-a456-426614174018",
      photo_url: "https://example.com/photo.jpg",
      photo_description: "Test photo",
      uploaded_at: "2024-03-20T12:00:00Z",
    },
  ],
  signatures: [
    {
      id: "123e4567-e89b-12d3-a456-426614174019",
      form_id: "123e4567-e89b-12d3-a456-426614174020",
      form_module_id: "123e4567-e89b-12d3-a456-426614174021",
      worker_name: "John Doe",
      signature_url: "https://example.com/signature.jpg",
      signed_at: "2024-03-20T12:00:00Z",
      signature_hash: null,
      role: "Supervisor",
      metadata: null,
      signed_by: "123e4567-e89b-12d3-a456-426614174022",
      is_deleted: false,
      deleted_at: null,
    },
  ],
};

// Example valid field definitions
const validFieldDefinitions = [
  {
    id: "123e4567-e89b-12d3-a456-426614174023",
    form_id: "123e4567-e89b-12d3-a456-426614174024",
    form_module_id: "123e4567-e89b-12d3-a456-426614174025",
    name: "test_field",
    label: "Test Field",
    type: "text",
    required: true,
    field_order: 0,
    default_value: null,
    version: 1,
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174026",
    form_id: "123e4567-e89b-12d3-a456-426614174027",
    form_module_id: "123e4567-e89b-12d3-a456-426614174028",
    name: "test_select",
    label: "Test Select",
    type: "select",
    required: true,
    field_order: 1,
    default_value: null,
    version: 1,
    options: [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
    ],
  },
];

describe("Form Validation Schemas", () => {
  // Test each module's schema with valid payload
  Object.entries(schemaMap).forEach(([moduleKey, schema]) => {
    it(`validates ${moduleKey} module data correctly`, () => {
      const result = validateModuleData(
        moduleKey as ModuleKey,
        validPayloads[moduleKey as ModuleKey]
      );
      expect(result.success).toBe(true);
    });
  });

  // Test field definition schema
  it("validates field definitions correctly", () => {
    validFieldDefinitions.forEach((fieldDef) => {
      const result = validateFieldDefinition(fieldDef);
      expect(result.success).toBe(true);
    });
  });

  // Test invalid data
  it("rejects invalid module data", () => {
    const invalidData = {
      id: "invalid-uuid",
      form_id: "invalid-uuid",
      form_module_id: "invalid-uuid",
      task: "", // Required field empty
      hazard: "", // Required field empty
      risk_level_before: 6, // Out of range
      control: "", // Required field empty
      risk_level_after: 0, // Out of range
      created_at: "invalid-date",
    };

    const result = validateModuleData("taskHazards", [invalidData]);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Zod will report all issues for a plain object schema
      expect(result.error.issues.length).toBeGreaterThanOrEqual(8);
    }
  });

  // Test invalid field definitions
  it("rejects invalid field definitions", () => {
    const invalidFieldDef = {
      id: "invalid-uuid",
      form_id: "invalid-uuid",
      form_module_id: "invalid-uuid",
      name: "", // Required field empty
      label: "", // Required field empty
      type: "invalid-type", // Invalid type
      required: "not-a-boolean", // Invalid boolean
      field_order: -1, // Invalid order
      version: 0, // Invalid version
    };

    const result = validateFieldDefinition(invalidFieldDef);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Discriminated union: only one error is reported
      expect(result.error.issues).toHaveLength(1);
    }
  });

  // Test select field without options
  it("rejects select field without options", () => {
    const invalidSelectField = {
      id: "123e4567-e89b-12d3-a456-426614174029",
      form_id: "123e4567-e89b-12d3-a456-426614174030",
      form_module_id: "123e4567-e89b-12d3-a456-426614174031",
      name: "test_select",
      label: "Test Select",
      type: "select",
      required: true,
      field_order: 0,
      default_value: null,
      version: 1,
      // Missing options array
    };

    const result = validateFieldDefinition(invalidSelectField);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Zod default error for missing required property is "Required"
      expect(result.error.issues[0].message).toBe("Required");
    }
  });

  // Test non-select field with options
  it("rejects non-select field with options", () => {
    const invalidTextField = {
      id: "123e4567-e89b-12d3-a456-426614174032",
      form_id: "123e4567-e89b-12d3-a456-426614174033",
      form_module_id: "123e4567-e89b-12d3-a456-426614174034",
      name: "test_text",
      label: "Test Text",
      type: "text",
      required: true,
      field_order: 0,
      default_value: null,
      version: 1,
      options: [], // Should not have options
    };

    const result = validateFieldDefinition(invalidTextField);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Zod default error for forbidden property is "Expected undefined, received array"
      expect(result.error.issues[0].message).toBe(
        "Expected undefined, received array"
      );
    }
  });

  // Test invalid parameters
  describe("Save Parameters Validation", () => {
    it("rejects invalid form ID", () => {
      const result = saveFormModuleDataParamsSchema.safeParse({
        formId: "not-a-uuid",
        moduleKey: "general",
        data: {},
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        expect(errors[0].message).toContain("Invalid ID format");
      }
    });

    it("rejects invalid module key", () => {
      const result = saveFormModuleDataParamsSchema.safeParse({
        formId: "123e4567-e89b-12d3-a456-426614174000",
        moduleKey: "invalidModule",
        data: {},
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid version number", () => {
      const result = saveFormModuleDataParamsSchema.safeParse({
        formId: "123e4567-e89b-12d3-a456-426614174000",
        moduleKey: "general",
        data: {},
        version: 0, // Must be >= 1
      });
      expect(result.success).toBe(false);
    });
  });

  // Test invalid module data
  describe("Module Data Validation", () => {
    it("rejects invalid general info data", () => {
      const result = schemaMap.general.safeParse({
        project_name: "", // Required
        supervisor_contact: "invalid-phone",
        date: "invalid-date",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        expect(errors).toContainEqual(
          expect.objectContaining({
            field: "project_name",
            message: expect.any(String),
          })
        );
      }
    });

    it("rejects invalid task hazard data", () => {
      const result = schemaMap.taskHazards.safeParse([
        {
          task: "", // Required
          hazard: "", // Required
          risk_level_before: 6, // Must be 1-5
          control: "", // Required
          risk_level_after: 0, // Must be 1-5
        },
      ]);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        expect(errors.length).toBeGreaterThanOrEqual(5);
      }
    });

    it("rejects invalid photo data", () => {
      const result = schemaMap.photos.safeParse([
        {
          photo_url: "not-a-url",
          photo_description: "A".repeat(501), // Max 500 chars
        },
      ]);
      expect(result.success).toBe(false);
    });
  });

  // Test array vs single object handling
  describe("Array vs Single Object Handling", () => {
    it("validates array data for task hazards", () => {
      const result = schemaMap.taskHazards.safeParse([
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          form_id: "123e4567-e89b-12d3-a456-426614174001",
          form_module_id: "123e4567-e89b-12d3-a456-426614174002",
          task: "Task 1",
          hazard: "Hazard 1",
          risk_level_before: 3,
          control: "Control 1",
          risk_level_after: 2,
          created_at: "2024-03-20T12:00:00Z",
        },
        {
          id: "123e4567-e89b-12d3-a456-426614174003",
          form_id: "123e4567-e89b-12d3-a456-426614174004",
          form_module_id: "123e4567-e89b-12d3-a456-426614174005",
          task: "Task 2",
          hazard: "Hazard 2",
          risk_level_before: 4,
          control: "Control 2",
          risk_level_after: 1,
          created_at: "2024-03-20T12:00:00Z",
        },
      ]);
      expect(result.success).toBe(true);
    });

    it("rejects single object for task hazards", () => {
      const result = schemaMap.taskHazards.safeParse({
        task: "Task 1",
        hazard: "Hazard 1",
        risk_level_before: 3,
        control: "Control 1",
        risk_level_after: 2,
      });
      expect(result.success).toBe(false);
    });
  });

  // Test error message formatting
  describe("Error Message Formatting", () => {
    it("formats array field errors correctly", () => {
      const result = schemaMap.taskHazards.safeParse([
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          form_id: "123e4567-e89b-12d3-a456-426614174001",
          form_module_id: "123e4567-e89b-12d3-a456-426614174002",
          task: "", // Will fail - required field empty
          hazard: "", // Will fail - required field empty
          risk_level_before: 6, // Will fail - out of range (1-5)
          control: "Valid control measure", // Valid
          risk_level_after: 2, // Valid
          created_at: "2024-03-20T12:00:00Z", // Valid
        },
      ]);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodErrors(result.error, "taskHazards");
        // Should have exactly 3 errors in predictable order
        expect(errors).toHaveLength(3);
        expect(errors[0].userField).toBe("Task #1");
        expect(errors[1].userField).toBe("Hazard #1");
        expect(errors[2].userField).toBe("Initial Risk Level #1");
      }
    });

    it("formats date/time errors correctly", () => {
      const result = schemaMap.general.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        form_module_id: null,
        project_name: "Test Project",
        project_address: null,
        task_location: null,
        supervisor_name: null,
        supervisor_contact: null,
        date: "invalid",
        crew_members_count: null,
        task_description: null,
        start_time: "25:00",
        end_time: null,
        created_at: "2024-03-20T12:00:00Z",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        const dateError = errors.find((e) => e.field === "date");
        const timeError = errors.find((e) => e.field === "start_time");
        expect(dateError?.message).toContain("valid date");
        expect(timeError?.message).toContain("valid time");
      }
    });
  });
});

describe("Field Definition Validation", () => {
  const validStrictField = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    form_id: "123e4567-e89b-12d3-a456-426614174001",
    form_module_id: "123e4567-e89b-12d3-a456-426614174002",
    name: "test_field",
    label: "Test Field",
    type: "text",
    required: true,
    field_order: 0,
    default_value: null,
    version: 1,
  };

  const validLooseField = {
    name: "test_field",
    label: "Test Field",
    type: "text",
  };

  const validSelectField = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    form_id: "123e4567-e89b-12d3-a456-426614174001",
    form_module_id: "123e4567-e89b-12d3-a456-426614174002",
    name: "test_select",
    label: "Test Select",
    type: "select",
    required: true,
    field_order: 0,
    default_value: null,
    version: 1,
    options: [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
    ],
  };

  const validLooseSelectField = {
    name: "test_select",
    label: "Test Select",
    type: "select",
    options: [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
    ],
  };

  it("validates strict field definitions", () => {
    const result = validateFieldDefinition(validStrictField, true);
    expect(result.success).toBe(true);
  });

  it("validates loose field definitions", () => {
    const result = validateFieldDefinition(validLooseField, false);
    expect(result.success).toBe(true);
  });

  it("rejects loose field in strict mode", () => {
    const result = validateFieldDefinition(validLooseField, true);
    expect(result.success).toBe(false);
  });

  it("validates strict select field definitions", () => {
    const result = validateFieldDefinition(validSelectField, true);
    expect(result.success).toBe(true);
  });

  it("validates loose select field definitions", () => {
    const result = validateFieldDefinition(validLooseSelectField, false);
    expect(result.success).toBe(true);
  });

  it("rejects select field without options in strict mode", () => {
    const result = validateFieldDefinition(
      { ...validSelectField, options: undefined },
      true
    );
    expect(result.success).toBe(false);
  });

  it("accepts select field without options in loose mode", () => {
    const result = validateFieldDefinition(
      { ...validLooseSelectField, options: undefined },
      false
    );
    expect(result.success).toBe(true);
  });

  it("rejects non-select field with options", () => {
    const result = validateFieldDefinition(
      { ...validStrictField, options: [] },
      true
    );
    expect(result.success).toBe(false);
  });

  it("rejects non-select field with options in loose mode", () => {
    const result = validateFieldDefinition(
      { ...validLooseField, options: [] },
      false
    );
    expect(result.success).toBe(false);
  });
});

describe("Array Module Validation", () => {
  it("validates taskHazards array", () => {
    const result = validateModuleData("taskHazards", validPayloads.taskHazards);
    expect(result.success).toBe(true);
  });

  it("validates photos array", () => {
    const result = validateModuleData("photos", validPayloads.photos);
    expect(result.success).toBe(true);
  });

  it("validates signatures array", () => {
    const result = validateModuleData("signatures", validPayloads.signatures);
    expect(result.success).toBe(true);
  });

  it("rejects single taskHazard object", () => {
    const result = validateModuleData(
      "taskHazards",
      (validPayloads.taskHazards as any[])[0]
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Expected array, received object"
      );
    }
  });

  it("rejects single photo object", () => {
    const result = validateModuleData("photos", validPayloads.photos[0]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Expected array, received object"
      );
    }
  });

  it("rejects single signature object", () => {
    const result = validateModuleData(
      "signatures",
      validPayloads.signatures[0]
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Expected array, received object"
      );
    }
  });

  it("validates empty arrays", () => {
    expect(validateModuleData("taskHazards", []).success).toBe(true);
    expect(validateModuleData("photos", []).success).toBe(true);
    expect(validateModuleData("signatures", []).success).toBe(true);
  });

  it("validates arrays with multiple items", () => {
    const multipleHazards = [
      validPayloads.taskHazards[0],
      {
        ...validPayloads.taskHazards[0],
        id: "123e4567-e89b-12d3-a456-426614174023",
        task: "Another Task",
        hazard: "Another Hazard",
        control: "Another Control",
      },
    ];
    const result = validateModuleData("taskHazards", multipleHazards);
    expect(result.success).toBe(true);
  });
});
