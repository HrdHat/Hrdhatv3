/**
 * Form Module Data Save Service - CRITICAL SYSTEM FILE
 * ====================================================
 *
 * This file handles all form module data persistence with validation.
 * DO NOT MODIFY without understanding the full impact on the save system.
 *
 * All data MUST pass Zod validation before being saved to the database.
 * This service is the primary entry point for all form data saves.
 */

/**
 * Form Module Data Save Service
 *
 * Purpose:
 * This service handles saving form module data to Supabase, providing a unified interface
 * for saving different types of form modules (header, general info, checklists, etc.).
 * It ensures data integrity through validation and proper database operations.
 *
 * Key Features:
 * - Validates input parameters and module data using Zod schemas
 * - Handles both single-record and bulk (array) upserts
 * - Maintains proper timestamps (created_at, updated_at)
 * - Maps module keys to correct database tables
 * - Provides detailed error reporting
 *
 * Module Types:
 * - Single Record Modules:
 *   - header (form_instances)
 *   - general (form_instance_general_info)
 *   - preJobChecklist (form_instance_pre_job_checklist)
 *   - ppeChecklist (form_instance_ppe_platform)
 *
 * - Bulk/Array Modules:
 *   - taskHazards (form_instance_hazards)
 *   - photos (form_asset_photos)
 *   - signatures (form_instance_signatures)
 *
 * Usage:
 * ```typescript
 * const result = await saveFormModuleData({
 *   formId: "form_123",
 *   moduleKey: "general",
 *   data: generalInfoData,
 *   moduleId: "module_456"
 * });
 * ```
 *
 * Error Handling:
 * - Returns { success: boolean, error?: string, validationErrors?: ValidationError[] }
 * - Validation errors include detailed field-level issues
 * - Database errors are caught and reported
 *
 * Security:
 * - Relies on Supabase RLS for data access control
 * - Validates all input data before database operations
 *
 * @module saveFormModuleData
 */

import { supabase } from "../../db/supabaseClient";
import {
  FormInstance,
  GeneralInformation,
  PreJobTaskChecklist,
  TaskHazardControl,
  FormAssetPhoto,
  Signature,
  PpeEquipmentChecklist,
  SaveFormModuleDataParams,
} from "../../types/formTypes";
import { TABLES, FORM_DATA_ENTRIES } from "../../constants/database";
import {
  schemaMap,
  saveFormModuleDataParamsSchema,
} from "../../types/formValidationSchemas";
import { z } from "zod";
import {
  formatZodErrors,
  formatZodErrorsWithContext,
  ValidationError,
} from "../../utils/validation";

// Supported module keys for typed tables
export type ModuleKey =
  | "header"
  | "general"
  | "preJobChecklist"
  | "ppeChecklist"
  | "taskHazards"
  | "photos"
  | "signatures";

// Data type mapping for each module
export type ModuleData =
  | FormInstance
  | GeneralInformation
  | PreJobTaskChecklist
  | PpeEquipmentChecklist
  | TaskHazardControl[]
  | FormAssetPhoto[]
  | Signature[];

// Map module keys to their corresponding tables
export const tableMap: Record<ModuleKey, string> = {
  header: TABLES.formInstances,
  general: TABLES.formInstanceGeneralInfo,
  preJobChecklist: TABLES.formInstancePreJobChecklist,
  ppeChecklist: TABLES.formInstancePpePlatform,
  taskHazards: TABLES.formInstanceHazards,
  photos: TABLES.formAssetPhotos,
  signatures: TABLES.formInstanceSignatures,
};

export interface SaveFormModuleDataResult {
  success: boolean;
  error?: string;
  validationErrors?: ValidationError[];
}

export async function saveFormModuleData({
  formId,
  moduleKey,
  data,
  moduleId,
  version,
  updated_at,
}: SaveFormModuleDataParams): Promise<SaveFormModuleDataResult> {
  // First validate the save parameters
  const paramsResult = saveFormModuleDataParamsSchema.safeParse({
    formId,
    moduleKey,
    data,
    moduleId,
    version,
    updated_at,
  });

  if (!paramsResult.success) {
    return {
      success: false,
      error: "Invalid save parameters",
      validationErrors: formatZodErrors(paramsResult.error),
    };
  }

  /**   * VALIDATION RULE: All module data must pass Zod validation before save.   * This prevents invalid data from being persisted to the database.   * Any validation failure must be shown to the user and block the save.   */ const schema =
    schemaMap[moduleKey];
  if (!schema) {
    return {
      success: false,
      error: `No validation schema found for module key: ${moduleKey}`,
    };
  }
  const dataResult = schema.safeParse(data);
  if (!dataResult.success) {
    return {
      success: false,
      error: "Invalid module data",
      validationErrors: formatZodErrorsWithContext(dataResult.error, moduleKey),
    };
  }

  const table = tableMap[moduleKey];
  if (!table) {
    return {
      success: false,
      error: `Invalid module key: ${moduleKey}. No table mapping found.`,
    };
  }

  let payload: Record<string, any>;

  // Handle array (bulk) upserts
  if (Array.isArray(data)) {
    const { error } = await supabase.from(table).upsert(
      data.map((row) => ({
        ...row,
        [FORM_DATA_ENTRIES.formId]: formId,
        ...(moduleId && { form_module_id: moduleId }),
      })),
      { onConflict: "id" } // Array modules use id as primary key
    );
    if (import.meta.env.DEV) {
      if (error) {
        console.error(
          `[saveFormModuleData] Error in bulk upsert to ${table}:`,
          error.message
        );
      }
      console.debug(`[saveFormModuleData] Bulk upsert to ${table}`, {
        formId,
        moduleKey,
        data,
      });
    }
    return { success: !error, error: error?.message };
  }

  // Handle single object upsert
  const { error } = await supabase.from(table).upsert(
    {
      ...data,
      [FORM_DATA_ENTRIES.formId]: formId,
      ...(moduleId && moduleKey !== "header" && { form_module_id: moduleId }),
    },
    { onConflict: moduleKey === "header" ? "id" : "form_module_id" } // Header uses id, others use form_module_id
  );
  if (import.meta.env.DEV) {
    if (error) {
      console.error(
        `[saveFormModuleData] Error in single upsert to ${table}:`,
        error.message
      );
    }
    console.debug(`[saveFormModuleData] Single upsert to ${table}`, {
      formId,
      moduleKey,
      data,
    });
  }
  return { success: !error, error: error?.message };
}
