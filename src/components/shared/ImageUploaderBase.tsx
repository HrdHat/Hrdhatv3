/**
 * ImageUploaderBase Component
 *
 * A core component that handles image file selection and upload functionality.
 * Features:
 * - Batch file selection and upload
 * - Progress tracking per file
 * - Gallery view of uploaded images with titles
 * - Individual image removal with soft delete
 * - Click to view full image
 * - Upload limits and validation
 * - Photo count tracking
 *
 * This component is designed to be extended by platform-specific versions
 * (desktop with camera, mobile with native camera) while maintaining
 * consistent upload behavior.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  uploadImageToFormModule,
  FormPhoto,
} from "../../services/forms/uploadImageToFormModule";
import { supabase } from "../../db/supabaseClient";
import "../styles/components/image-uploader.css";

export type ImageUploaderBaseProps = {
  formId: string;
  formModuleId: string;
  uploadedBy: string;
  tag?: string;
  maxPhotos?: number;
  onUploadSuccess?: (photo: FormPhoto) => void;
  onUploadError?: (error: Error) => void;
  onStateChange?: (info: { isUploading: boolean; photoCount: number }) => void;
  // Allow custom file input props to be passed through
  fileInputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

type UploadStatus = {
  file: File;
  progress: number;
  error?: Error;
  photo?: FormPhoto;
};

type UploadProgressProps = {
  statuses: UploadStatus[];
};

const UploadProgress: React.FC<UploadProgressProps> = ({ statuses }) => {
  if (statuses.length === 0) return null;

  return (
    <div className="image-uploader__progress">
      {statuses.map((status, index) => (
        <div key={index} className="image-uploader__progress-item">
          {status.file.name} - {status.progress}%
          {status.error && (
            <span className="image-uploader__progress-error">
              - Failed: {status.error.message}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export const ImageUploaderBase: React.FC<ImageUploaderBaseProps> = ({
  formId,
  formModuleId,
  uploadedBy,
  tag,
  maxPhotos = 10,
  onUploadSuccess,
  onUploadError,
  onStateChange,
  fileInputProps = {},
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<FormPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced state change notification
  useEffect(() => {
    const timeout = setTimeout(() => {
      onStateChange?.({
        isUploading,
        photoCount: uploadedPhotos.length,
      });
    }, 100);
    return () => clearTimeout(timeout);
  }, [isUploading, uploadedPhotos, onStateChange]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (uploadedPhotos.length + files.length > maxPhotos) {
      const error = new Error(`Maximum ${maxPhotos} photos allowed`);
      onUploadError?.(error);
      return;
    }

    setIsUploading(true);
    const newStatuses: UploadStatus[] = files.map((file) => ({
      file,
      progress: 0,
    }));
    setUploadStatuses((prev) => [...prev, ...newStatuses]);

    // Upload files sequentially to avoid overwhelming the server
    for (const status of newStatuses) {
      try {
        // Update progress
        setUploadStatuses((prev) =>
          prev.map((s) => (s.file === status.file ? { ...s, progress: 10 } : s))
        );

        const photo = await uploadImageToFormModule({
          formId,
          formModuleId,
          file: status.file,
          uploadedBy,
          tag,
          source: "web",
        });

        // Update status with success
        setUploadStatuses((prev) =>
          prev.map((s) =>
            s.file === status.file ? { ...s, progress: 100, photo } : s
          )
        );

        setUploadedPhotos((prev) => [...prev, photo]);
        onUploadSuccess?.(photo);
      } catch (error) {
        console.error("Upload failed:", error);
        // Update status with error
        setUploadStatuses((prev) =>
          prev.map((s) =>
            s.file === status.file ? { ...s, error: error as Error } : s
          )
        );
        onUploadError?.(error as Error);
      }
    }

    setIsUploading(false);
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handlePreviewClick = (photo: FormPhoto) => {
    if (photo.public_url) {
      window.open(photo.public_url, "_blank");
    }
  };

  const handleRemove = async (photoToRemove: FormPhoto) => {
    if (confirm("Remove this photo?")) {
      try {
        // Attempt soft delete in database
        const { error } = await supabase
          .from("form_data_photos")
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
          })
          .eq("id", photoToRemove.id);

        if (error) throw error;

        // Update UI on successful soft delete
        setUploadedPhotos((prev) =>
          prev.filter((p) => p.id !== photoToRemove.id)
        );
      } catch (error) {
        console.error("Failed to soft delete photo:", error);
        // Fall back to UI-only removal if database update fails
        setUploadedPhotos((prev) =>
          prev.filter((p) => p.id !== photoToRemove.id)
        );
      }
    }
  };

  return (
    <div className="image-uploader">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/heic,image/heif"
        onChange={handleFileSelect}
        className="image-uploader__input"
        {...fileInputProps}
      />

      <div className="image-uploader__header">
        <button
          onClick={handleClick}
          className={`image-uploader__button ${
            isUploading || uploadedPhotos.length >= maxPhotos
              ? "image-uploader__button--disabled"
              : ""
          }`}
        >
          {isUploading
            ? "Uploading..."
            : uploadedPhotos.length >= maxPhotos
            ? `Maximum ${maxPhotos} photos reached`
            : "Add Photos"}
        </button>
        <p className="image-uploader__status">
          {uploadedPhotos.length} of {maxPhotos} photos uploaded
        </p>
      </div>

      <UploadProgress statuses={uploadStatuses} />

      {/* Photo Gallery */}
      {uploadedPhotos.length > 0 && (
        <div className="image-uploader__grid">
          {uploadedPhotos.map((photo) => (
            <div key={photo.id} className="image-uploader__thumbnail">
              <img
                src={photo.public_url}
                alt={photo.description || "Uploaded image"}
                title={photo.file_name}
                onClick={() => handlePreviewClick(photo)}
                className="image-uploader__thumbnail-image"
              />
              <div className="image-uploader__thumbnail-overlay">
                {photo.file_name}
              </div>
              <button
                onClick={() => handleRemove(photo)}
                className="image-uploader__button--delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
