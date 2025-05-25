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

// General Information Schema - strict version for validation
export const generalInfoSchema = z.object(generalInfoShape);

// Pre-Job Checklist Schema - strict version for validation
export const preJobChecklistSchema = z.object(preJobChecklistShape);

// PPE Checklist Schema - strict version for validation
export const ppeChecklistSchema = z.object(ppeChecklistShape);

// Form Instance Schema - strict version for validation
export const formInstanceSchema = z.object(formInstanceShape);

// Task Hazard Control Schema - strict version for validation
export const taskHazardControlSchema = z.object(taskHazardControlShape);

// Form Asset Photo Schema - strict version for validation
export const formAssetPhotoSchema = z.object(formAssetPhotoShape);

// Signature Schema - strict version for validation
export const signatureSchema = z.object(signatureShape);

// Combined Module Data Schema for complete form validation
export const moduleDataSchema = z.object({
  header: formInstanceSchema,
  general: generalInfoSchema,
  preJobChecklist: preJobChecklistSchema,
  ppeChecklist: ppeChecklistSchema,
  taskHazards: z.array(taskHazardControlSchema),
  photos: z.array(formAssetPhotoSchema),
  signatures: z.array(signatureSchema),
});

// Export types inferred from schemas
export type GeneralInfo = z.infer<typeof generalInfoSchema>;
export type PreJobChecklist = z.infer<typeof preJobChecklistSchema>;
export type PpeChecklist = z.infer<typeof ppeChecklistSchema>;
export type FormInstance = z.infer<typeof formInstanceSchema>;
export type TaskHazardControl = z.infer<typeof taskHazardControlSchema>;
export type FormAssetPhoto = z.infer<typeof formAssetPhotoSchema>;
export type Signature = z.infer<typeof signatureSchema>;
export type ModuleData = z.infer<typeof moduleDataSchema>;
