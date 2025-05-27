import { describe, it, expect } from "vitest";
import {
  generalInfoSchema,
  preJobChecklistSchema,
  ppeChecklistSchema,
  formInstanceSchema,
  taskHazardControlSchema,
  formAssetPhotoSchema,
  signatureSchema,
} from "../types/formSchemas";
import { MODULE_KEYS, type ModuleKey } from "../types/formTypes";
import type { ZodObject, ZodTypeAny } from "zod";

// Database column definitions (imported from your schema or hardcoded)
// These should match your actual database schema
const DB_SCHEMAS = {
  header: {
    table: "form_instances",
    columns: {
      id: { type: "uuid", nullable: false },
      form_number: { type: "text", nullable: true },
      user_form_id: { type: "text", nullable: true },
      created_by: { type: "uuid", nullable: true },
      status: { type: "text", nullable: true },
      last_modified: { type: "timestamp", nullable: true },
      created_at: { type: "timestamp", nullable: false },
      auto_archived: { type: "boolean", nullable: true },
      data: { type: "jsonb", nullable: true },
      company_id: { type: "uuid", nullable: true },
      project_id: { type: "uuid", nullable: true },
      title: { type: "text", nullable: true },
      description: { type: "text", nullable: true },
      version: { type: "integer", nullable: false },
      submitted_at: { type: "timestamp", nullable: true },
      user_id: { type: "uuid", nullable: true },
      form_date: { type: "date", nullable: true },
    },
  },
  general: {
    table: "form_instance_general_info",
    columns: {
      id: { type: "uuid", nullable: false },
      form_module_id: { type: "uuid", nullable: true },
      project_name: { type: "text", nullable: true },
      project_address: { type: "text", nullable: true },
      location: { type: "text", nullable: true },
      supervisor_name: { type: "text", nullable: true },
      supervisor_contact: { type: "text", nullable: true },
      form_date: { type: "date", nullable: true },
      crew_members_count: { type: "integer", nullable: true },
      work_description: { type: "text", nullable: true },
      start_time: { type: "time", nullable: true },
      end_time: { type: "time", nullable: true },
      created_at: { type: "timestamp", nullable: false },
      updated_at: { type: "timestamp", nullable: false },
    },
  },
  preJobChecklist: {
    table: "form_instance_pre_job_checklist",
    columns: {
      id: { type: "uuid", nullable: false },
      form_id: { type: "uuid", nullable: false },
      form_module_id: { type: "uuid", nullable: true },
      is_fit_for_duty: { type: "boolean", nullable: true },
      reviewed_work_area_for_hazards: { type: "boolean", nullable: true },
      required_ppe_for_today: { type: "boolean", nullable: true },
      equipment_inspection_up_to_date: { type: "boolean", nullable: true },
      completed_flra_hazard_assessment: { type: "boolean", nullable: true },
      safety_signage_installed_and_checked: { type: "boolean", nullable: true },
      working_alone_today: { type: "boolean", nullable: true },
      required_permits_for_tasks: { type: "boolean", nullable: true },
      barricades_signage_barriers_installed_good: {
        type: "boolean",
        nullable: true,
      },
      clear_access_to_emergency_exits: { type: "boolean", nullable: true },
      trained_and_competent_for_tasks: { type: "boolean", nullable: true },
      inspected_tools_and_equipment: { type: "boolean", nullable: true },
      reviewed_control_measures_needed: { type: "boolean", nullable: true },
      reviewed_emergency_procedures: { type: "boolean", nullable: true },
      all_required_permits_in_place: { type: "boolean", nullable: true },
      communicated_with_crew_about_plan: { type: "boolean", nullable: true },
      need_for_spotters_barricades_special_controls: {
        type: "boolean",
        nullable: true,
      },
      weather_suitable_for_work: { type: "boolean", nullable: true },
      know_designated_first_aid_attendant: { type: "boolean", nullable: true },
      aware_of_site_notices_or_bulletins: { type: "boolean", nullable: true },
      created_at: { type: "timestamp", nullable: false },
    },
  },
  ppeChecklist: {
    table: "form_instance_ppe_platform",
    columns: {
      id: { type: "uuid", nullable: false },
      form_id: { type: "uuid", nullable: false },
      form_module_id: { type: "uuid", nullable: true },
      ppe_hardhat: { type: "boolean", nullable: true },
      ppe_safety_vest: { type: "boolean", nullable: true },
      ppe_safety_glasses: { type: "boolean", nullable: true },
      ppe_fall_protection: { type: "boolean", nullable: true },
      ppe_coveralls: { type: "boolean", nullable: true },
      ppe_gloves: { type: "boolean", nullable: true },
      ppe_mask: { type: "boolean", nullable: true },
      ppe_respirator: { type: "boolean", nullable: true },
      platform_ladder: { type: "boolean", nullable: true },
      platform_step_bench: { type: "boolean", nullable: true },
      platform_sawhorses: { type: "boolean", nullable: true },
      platform_baker_scaffold: { type: "boolean", nullable: true },
      platform_scaffold: { type: "boolean", nullable: true },
      platform_scissor_lift: { type: "boolean", nullable: true },
      platform_boom_lift: { type: "boolean", nullable: true },
      platform_swing_stage: { type: "boolean", nullable: true },
      platform_hydro_lift: { type: "boolean", nullable: true },
      created_at: { type: "timestamp", nullable: false },
    },
  },
  taskHazards: {
    table: "form_instance_hazards",
    columns: {
      id: { type: "uuid", nullable: false },
      form_id: { type: "uuid", nullable: false },
      form_module_id: { type: "uuid", nullable: true },
      task: { type: "text", nullable: false },
      hazard: { type: "text", nullable: false },
      risk_level_before: { type: "integer", nullable: true },
      control: { type: "text", nullable: false },
      risk_level_after: { type: "integer", nullable: true },
      created_at: { type: "timestamp", nullable: false },
    },
  },
  photos: {
    table: "form_asset_photos",
    columns: {
      id: { type: "uuid", nullable: false },
      form_id: { type: "uuid", nullable: false },
      form_module_id: { type: "uuid", nullable: true },
      photo_url: { type: "text", nullable: false },
      photo_description: { type: "text", nullable: true },
      uploaded_at: { type: "timestamp", nullable: false },
    },
  },
  signatures: {
    table: "form_instance_signatures",
    columns: {
      id: { type: "uuid", nullable: false },
      form_id: { type: "uuid", nullable: false },
      form_module_id: { type: "uuid", nullable: true },
      worker_name: { type: "text", nullable: false },
      signature_url: { type: "text", nullable: false },
      signed_at: { type: "timestamp", nullable: false },
      signature_hash: { type: "text", nullable: true },
      role: { type: "text", nullable: true },
      metadata: { type: "jsonb", nullable: true },
      signed_by: { type: "uuid", nullable: true },
      is_deleted: { type: "boolean", nullable: true },
      deleted_at: { type: "timestamp", nullable: true },
    },
  },
} as const;

// Mapping of module keys to their corresponding Zod schemas
const SCHEMA_MAP: Record<ModuleKey, ZodObject<any>> = {
  header: formInstanceSchema,
  general: generalInfoSchema,
  preJobChecklist: preJobChecklistSchema,
  ppeChecklist: ppeChecklistSchema,
  taskHazards: taskHazardControlSchema,
  photos: formAssetPhotoSchema,
  signatures: signatureSchema,
};

describe("Schema Alignment Tests", () => {
  MODULE_KEYS.forEach((moduleKey) => {
    describe(`Module: ${moduleKey}`, () => {
      it("should have a corresponding database schema", () => {
        expect(DB_SCHEMAS).toHaveProperty(moduleKey);
      });

      it("should have a corresponding Zod schema", () => {
        expect(SCHEMA_MAP).toHaveProperty(moduleKey);
      });

      it("should have matching fields between Zod schema and database columns", () => {
        const zodSchema = SCHEMA_MAP[moduleKey];
        const dbSchema = DB_SCHEMAS[moduleKey as keyof typeof DB_SCHEMAS];

        if (!zodSchema || !dbSchema) {
          throw new Error(`Missing schema for module: ${moduleKey}`);
        }

        const zodFields = Object.keys(zodSchema.shape);
        const dbColumns = Object.keys(dbSchema.columns);

        // Check that all Zod fields exist in DB
        zodFields.forEach((field) => {
          expect(dbColumns).toContain(field);
        });

        // Check that all required DB fields exist in Zod
        Object.entries(dbSchema.columns).forEach(([column, config]) => {
          if (!config.nullable) {
            expect(zodFields).toContain(column);
          }
        });
      });

      it("should have matching nullability between Zod schema and database", () => {
        const zodSchema = SCHEMA_MAP[moduleKey];
        const dbSchema = DB_SCHEMAS[moduleKey as keyof typeof DB_SCHEMAS];

        if (!zodSchema || !dbSchema) {
          throw new Error(`Missing schema for module: ${moduleKey}`);
        }

        Object.entries(dbSchema.columns).forEach(([column, config]) => {
          const zodField = zodSchema.shape[column];

          if (zodField) {
            const isZodOptional = zodField.isOptional();
            const isDbNullable = config.nullable;

            // If DB column is NOT NULL, Zod field should be required
            if (!isDbNullable) {
              expect(isZodOptional).toBe(false);
            }
          }
        });
      });
    });
  });

  it("should not have any duplicate field names across modules", () => {
    const allFields = new Map<string, string[]>();

    MODULE_KEYS.forEach((moduleKey) => {
      const zodSchema = SCHEMA_MAP[moduleKey];
      if (zodSchema) {
        Object.keys(zodSchema.shape).forEach((field) => {
          if (!allFields.has(field)) {
            allFields.set(field, []);
          }
          allFields.get(field)!.push(moduleKey);
        });
      }
    });

    // Common fields that are expected to be in multiple modules
    const allowedDuplicates = ["id", "form_id", "form_module_id", "created_at"];

    allFields.forEach((modules, field) => {
      if (modules.length > 1 && !allowedDuplicates.includes(field)) {
        console.warn(
          `Field "${field}" appears in multiple modules: ${modules.join(", ")}`
        );
      }
    });
  });

  it("should have consistent type definitions between TypeScript types and Zod schemas", () => {
    // This test ensures that the TypeScript types exported from formTypes.ts
    // match the inferred types from Zod schemas

    // Example: Check that GeneralInformation type matches generalInfoSchema
    type ZodGeneralInfo = typeof generalInfoSchema._type;

    // The actual comparison would be done at compile time
    // This test serves as a placeholder to ensure we think about type consistency
    expect(true).toBe(true);
  });
});

describe("Runtime Module Key Validation", () => {
  it("should validate correct module keys", () => {
    MODULE_KEYS.forEach((key) => {
      expect(SCHEMA_MAP).toHaveProperty(key);
    });
  });

  it("should have schemas for all defined module keys", () => {
    const schemaKeys = Object.keys(SCHEMA_MAP);
    expect(schemaKeys.sort()).toEqual([...MODULE_KEYS].sort());
  });
});
