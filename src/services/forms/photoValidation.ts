import { z } from "zod";

// Allowed MIME types for photos
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

// Base schema for photo metadata
export const photoMetadataSchema = z.object({
  id: z.string().uuid("Invalid photo ID format"),
  name: z.string().min(1, "Name is required"),
  type: z
    .string()
    .refine(
      (type) => ALLOWED_MIME_TYPES.includes(type as AllowedMimeType),
      "Unsupported file type"
    ),
  size: z.number().int().positive("File size must be positive"),
  timestamp: z.number().int().positive("Timestamp must be positive"),
  formId: z.string().uuid("Invalid form ID format"),
  moduleId: z.string().uuid("Invalid module ID format"),
});

// Schema for upload options
export const uploadPhotoOptionsSchema = z.object({
  formId: z.string().uuid("Invalid form ID format"),
  moduleId: z.string().uuid("Invalid module ID format"),
  file: z.instanceof(File, { message: "File is required" }),
  metadata: photoMetadataSchema,
  uploadedBy: z.string().min(1, "Uploader ID is required"),
  tag: z.string().optional(),
  source: z.enum(["mobile", "web", "imported"]).optional(),
  photo_description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isDeleted: z.boolean().optional(),
  deletedAt: z.string().datetime().optional(),
});

// Schema for photo metadata in database
const photoMetadataRecordSchema = z.object({
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  uploadedAt: z.string().datetime(),
  uploadedBy: z.string(),
  signedUrl: z.string().optional(),
  tag: z.string().optional(),
  source: z.enum(["mobile", "web", "imported"]).optional(),
  photo_description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isDeleted: z.boolean().optional(),
  deletedAt: z.string().datetime().optional(),
});

// Schema for photo record in database
export const photoRecordSchema = photoMetadataSchema.extend({
  photoUrl: z.string().min(1, "Photo URL is required"),
  uploadedAt: z.string().datetime(),
  uploadedBy: z.string().min(1, "Uploader ID is required"),
  tag: z.string().optional(),
  source: z.enum(["mobile", "web", "imported"]).optional(),
  photo_description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isDeleted: z.boolean().optional(),
  deletedAt: z.string().datetime().optional(),
  metadata: photoMetadataRecordSchema.optional(),
});

// Types
export type PhotoMetadata = z.infer<typeof photoMetadataSchema>;
export type UploadPhotoOptions = z.infer<typeof uploadPhotoOptionsSchema>;
export type PhotoRecord = z.infer<typeof photoRecordSchema>;
export type PhotoMetadataRecord = z.infer<typeof photoMetadataRecordSchema>;

// Result type for photo operations
export interface PhotoOperationResult {
  success: boolean;
  data?: PhotoRecord | PhotoRecord[];
  error?: {
    message: string;
    details?: string;
    validationErrors?: z.ZodError;
  };
}
