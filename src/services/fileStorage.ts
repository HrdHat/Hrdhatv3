import { supabase } from "../lib/supabase";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const ALLOWED_MIME_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
} as const;

export type AllowedMimeType = keyof typeof ALLOWED_MIME_TYPES;

export interface FileMetadata {
  id: string;
  originalName: string;
  mimeType: AllowedMimeType;
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
  [key: string]: unknown;
}

export interface UploadResult {
  signedUrl: string;
  storagePath: string;
  metadata: FileMetadata;
}

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileValidationError";
  }
}

export class FileStorageService {
  private static readonly PHOTOS_BUCKET = "photos";
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  private static validateFile(file: File): AllowedMimeType {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new FileValidationError(
        `File size exceeds maximum limit of ${
          this.MAX_FILE_SIZE / 1024 / 1024
        }MB`
      );
    }

    // Validate MIME type
    if (!Object.keys(ALLOWED_MIME_TYPES).includes(file.type)) {
      throw new FileValidationError(`Unsupported file type: ${file.type}`);
    }

    return file.type as AllowedMimeType;
  }

  private static getFileExtension(
    file: File,
    mimeType: AllowedMimeType
  ): string {
    // Use path.extname() for file extension safety
    const ext = path.extname(file.name).toLowerCase();
    if (
      ext &&
      Object.values(ALLOWED_MIME_TYPES).includes(
        ext as ".jpg" | ".png" | ".gif" | ".webp"
      )
    ) {
      return ext;
    }
    // Fallback to extension from MIME type
    return ALLOWED_MIME_TYPES[mimeType];
  }

  private static generateStoragePath(
    file: File,
    mimeType: AllowedMimeType,
    formId: string
  ): string {
    const timestamp = Date.now();
    const extension = this.getFileExtension(file, mimeType);
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/\s+/g, "_")
      .toLowerCase();
    const uniqueId = uuidv4();

    return `${this.PHOTOS_BUCKET}/${formId}/${uniqueId}${extension}`;
  }

  private static createMetadata(
    file: File,
    mimeType: AllowedMimeType,
    userId?: string
  ): FileMetadata {
    return {
      id: uuidv4(),
      originalName: file.name,
      mimeType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
    };
  }

  static async uploadFile(
    file: File,
    userId?: string,
    formId?: string
  ): Promise<UploadResult> {
    try {
      // Validate file
      const mimeType = this.validateFile(file);

      // Generate storage path
      const storagePath = this.generateStoragePath(
        file,
        mimeType,
        formId || "default"
      );

      // Create metadata
      const metadata = this.createMetadata(file, mimeType, userId);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(this.PHOTOS_BUCKET)
        .upload(storagePath, file, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Get signed URL
      const {
        data: { signedUrl },
        error: urlError,
      } = await supabase.storage
        .from(this.PHOTOS_BUCKET)
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

      if (urlError) {
        throw new Error(`Failed to generate signed URL: ${urlError.message}`);
      }

      return {
        signedUrl,
        storagePath,
        metadata,
      };
    } catch (error) {
      if (error instanceof FileValidationError) {
        throw error;
      }
      throw new Error(
        `File upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  static async deleteFile(storagePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.PHOTOS_BUCKET)
      .remove([storagePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  static async getSignedUrl(
    storagePath: string,
    expiresIn = 60 * 60 * 24 * 7
  ): Promise<string> {
    const {
      data: { signedUrl },
      error,
    } = await supabase.storage
      .from(this.PHOTOS_BUCKET)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return signedUrl;
  }
}
