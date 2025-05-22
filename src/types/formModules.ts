/**
 * ⚠️ CRITICAL NOTICE: Field Shape Contracts for Dynamic Form Modules
 *
 * This file defines the structure for dynamic fields rendered in generic modules
 * (e.g., custom checklists or flexible modules).
 *
 * - `ModuleField` is consumed by:
 *     • GenericModuleRenderer.tsx
 *     • fetchModuleFields.ts
 *     • Any module that renders flexible field layouts
 *
 * - Field `type` MUST match UI renderer + Supabase-compatible types:
 *     "text", "boolean", "date", "time", "number", "textarea"
 *     → Adding new types requires UI + DB updates — DO NOT change casually.
 *
 * - Field `label` must be user-friendly, and match Zod schema expectations if present.
 *
 * - `required` enforces **frontend validation only**. DB must still enforce `NOT NULL` as needed.
 *     → Desync between this flag and DB constraints may cause silent failures.
 *
 * - `options.severity` and `options.category` are optional metadata for specialized UIs
 *     (e.g., hazard control visualizations).
 *     → Only use where UI expects it. Avoid polluting unrelated modules with extra metadata.
 *
 * WARNING:
 * - This file does **not** guarantee field storage — only layout + validation.
 * - Adding or removing fields here affects dynamic rendering. Audit all dependencies when updating.
 */

export interface ModuleField {
  id: string;
  type: "text" | "boolean" | "date" | "time" | "number" | "textarea";
  label: string;
  required: boolean;
  options?: {
    severity?: "low" | "medium" | "high";
    category?: string;
  };
}

export interface TaskHazardData {
  task: string;
  hazards: HazardState[];
  validation: ValidationState;
}

export interface HazardState {
  id: string;
  hazard: string;
  risk_level_before: number;
  control: string;
  risk_level_after: number;
  acknowledged: boolean;
}

export interface ValidationState {
  task: boolean;
  hazards: {
    [key: string]: {
      hazard: boolean;
      control: boolean;
      riskLevelAfter: boolean;
    };
  };
}

export interface ValidationResult {
  isValid: boolean;
  validationState: ValidationState;
  errors: {
    task?: string;
    hazards?: {
      [key: string]: {
        hazard?: string;
        control?: string;
        riskLevelAfter?: string;
      };
    };
  };
}
