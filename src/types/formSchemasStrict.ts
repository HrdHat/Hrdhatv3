import { z } from "zod";
import {
  generalInfoShape,
  preJobChecklistShape,
  ppeChecklistShape,
  formInstanceShape,
  taskHazardControlShape,
  formAssetPhotoShape,
  signatureShape,
} from "./formSchemaShapes";

// Base schemas for common field types
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// General Information Schema
export const generalInfoSchemaStrict = z.object(generalInfoShape);

// Pre-Job Checklist Schema
export const preJobChecklistSchemaStrict = z.object(preJobChecklistShape);

// PPE Checklist Schema
export const ppeChecklistSchemaStrict = z.object(ppeChecklistShape);

// Form Instance Schema
export const formInstanceSchemaStrict = z.object(formInstanceShape);

// Task Hazard Control Schema
export const taskHazardControlSchemaStrict = z.object(taskHazardControlShape);

// Form Asset Photo Schema
export const formAssetPhotoSchemaStrict = z.object(formAssetPhotoShape);

// Signature Schema
export const signatureSchemaStrict = z.object(signatureShape);

// Combined Module Data Schema
export const moduleDataSchemaStrict = z.object({
  header: formInstanceSchemaStrict,
  general: generalInfoSchemaStrict,
  preJobChecklist: preJobChecklistSchemaStrict,
  ppeChecklist: ppeChecklistSchemaStrict,
  taskHazards: z.array(taskHazardControlSchemaStrict),
  photos: z.array(formAssetPhotoSchemaStrict),
  signatures: z.array(signatureSchemaStrict),
});

// Export types inferred from schemas
export type StrictGeneralInfo = z.infer<typeof generalInfoSchemaStrict>;
export type StrictPreJobChecklist = z.infer<typeof preJobChecklistSchemaStrict>;
export type StrictPpeChecklist = z.infer<typeof ppeChecklistSchemaStrict>;
export type StrictFormInstance = z.infer<typeof formInstanceSchemaStrict>;
export type StrictTaskHazardControl = z.infer<
  typeof taskHazardControlSchemaStrict
>;
export type StrictFormAssetPhoto = z.infer<typeof formAssetPhotoSchemaStrict>;
export type StrictSignature = z.infer<typeof signatureSchemaStrict>;
export type StrictModuleData = z.infer<typeof moduleDataSchemaStrict>;
