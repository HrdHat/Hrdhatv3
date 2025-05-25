/**
 * Central Type Exports
 *
 * This barrel file provides a single source for all form-related types.
 * Always import types from this file rather than individual type files.
 */

// Form Types
export type {
  FormStatus,
  FormInstance,
  GeneralInformation,
  PreJobTaskChecklist,
  TaskHazardControl,
  FormAssetPhoto,
  Signature,
  PpeEquipmentChecklist,
  FlraFormState,
  FormInstanceModule,
  DatabaseResult,
  FormAssetPhotoResult,
  FormAssetPhotoListResult,
  SaveFormModuleDataParams,
  ModuleKey,
  ModuleData,
  FlraForm,
} from "./formTypes";

export {
  FORM_STATUSES,
  MODULE_KEYS,
  MODULE_KEY_MAP,
  MODULE_LABEL_MAP,
  getModuleKey,
  getModuleLabel,
  assertModuleKey,
  isModuleKey,
} from "./formTypes";

// Form Schemas
export {
  generalInfoSchema,
  preJobChecklistSchema,
  ppeChecklistSchema,
  formInstanceSchema,
  taskHazardControlSchema,
  formAssetPhotoSchema,
  signatureSchema,
  moduleDataSchema,
} from "./formSchemas";

export type {
  GeneralInfo,
  PreJobChecklist,
  PpeChecklist,
  FormInstance as FormInstanceSchema,
  TaskHazardControl as TaskHazardControlSchema,
  FormAssetPhoto as FormAssetPhotoSchema,
  Signature as SignatureSchema,
  ModuleData as ModuleDataSchema,
} from "./formSchemas";

// Module Types
export type {
  ModuleField,
  TaskHazardData,
  HazardState,
  ValidationState,
  ValidationResult,
} from "./formModules";

// Field Definitions
export type { FieldType, FieldDefinition } from "./formFieldDefinitions";

export {
  GENERAL_INFO_FIELDS,
  PRE_JOB_CHECKLIST_FIELDS,
  PPE_CHECKLIST_FIELDS,
  TASK_HAZARD_FIELDS,
  PHOTO_FIELDS,
  SIGNATURE_FIELDS,
  MODULE_FIELD_MAP,
  validateFieldDefinition,
  toModuleField,
} from "./formFieldDefinitions";

// Renderer Types
export type {
  RendererKey,
  ModuleWithRenderer,
  MissingRendererProps,
} from "./renderer.types";

// Validation Error Types
export type { ValidationError } from "../utils/validation";

// Re-export commonly used together
export * as FormConstants from "./formTypes";
