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
export const generalInfoSchema = z
  .object(generalInfoShape)
  .partial()
  .nullable();

// Pre-Job Checklist Schema
export const preJobChecklistSchema = z
  .object(preJobChecklistShape)
  .partial()
  .nullable();

// PPE Checklist Schema
export const ppeChecklistSchema = z
  .object(ppeChecklistShape)
  .partial()
  .nullable();

// Form Instance Schema
export const formInstanceSchema = z
  .object(formInstanceShape)
  .partial()
  .nullable();

// Task Hazard Control Schema
export const taskHazardControlSchema = z
  .object(taskHazardControlShape)
  .partial()
  .nullable();

// Form Asset Photo Schema
export const formAssetPhotoSchema = z.object({
  ...formAssetPhotoShape,
  description: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().nullable().optional(),
  tag: z.string().max(50).nullable().optional(),
  source: z.enum(["mobile", "web", "imported"]).nullable().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  photo_hash: z.string().max(64).nullable().optional(),
});

// Signature Schema
export const signatureSchema = z.object({
  ...signatureShape,
  worker_name: z
    .string()
    .min(2, "Worker name must be at least 2 characters")
    .max(100, "Worker name must be less than 100 characters")
    .nullable()
    .optional(),
});

// Combined Module Data Schema
export const moduleDataSchema = z.object({
  header: formInstanceSchema.default({}),
  general: generalInfoSchema.default({}),
  preJobChecklist: preJobChecklistSchema.default({}),
  ppeChecklist: ppeChecklistSchema.default({}),
  taskHazards: z.array(taskHazardControlSchema).default([]),
  photos: z.array(formAssetPhotoSchema).default([]),
  signatures: z.array(signatureSchema).default([]),
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
