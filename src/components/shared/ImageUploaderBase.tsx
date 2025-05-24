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
  getFormModulePhotos,
} from "../../services/forms/uploadImageToFormModule";
import { softDeletePhoto } from "../../services/forms/uploadPhotoToSupabase";
import { FormAssetPhoto } from "../../types/formTypes";
import { supabase } from "../../db/supabaseClient";
import { TABLES, FORM_ASSET_PHOTOS } from "../../constants/database";
import { toast } from "react-hot-toast";
// import "../styles/components/image-uploader.css"; // commented out as per request

export type ImageUploaderBaseProps = {
  formId: string;
  formModuleId: string;
  uploadedBy: string;
  tag?: string;
  maxPhotos?: number;
  onUploadSuccess?: (photo: FormAssetPhoto) => void;
  onUploadError?: (error: Error) => void;
  onStateChange?: (info: { isUploading: boolean; photoCount: number }) => void;
  // Allow custom file input props to be passed through
  fileInputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

type UploadStatus = {
  file: File;
  progress: number;
  error?: Error;
  photo?: FormAssetPhoto;
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
  const [uploadedPhotos, setUploadedPhotos] = useState<FormAssetPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch photos on mount and when formId/formModuleId changes
  useEffect(() => {
    const fetchPhotos = async () => {
      const result = await getFormModulePhotos(formId, formModuleId);
      if (result.data) {
        setUploadedPhotos(result.data);
      } else if (result.error) {
        console.error("Failed to fetch photos:", result.error);
        onUploadError?.(result.error);
      }
    };
    fetchPhotos();
  }, [formId, formModuleId, onUploadError]);

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
    const files = event.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    const newStatuses: UploadStatus[] = Array.from(files).map((file) => ({
      file,
      progress: 0,
    }));
    setUploadStatuses((prev) => [...prev, ...newStatuses]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await uploadImageToFormModule({
          formId,
          formModuleId,
          file,
          uploadedBy,
          tag,
        });

        if (result.error) {
          toast.error(result.error.message);
          throw result.error;
        }

        setUploadStatuses((prev) =>
          prev.map((status, index) =>
            index === i
              ? { ...status, progress: 100, photo: result.data || undefined }
              : status
          )
        );

        if (result.data) {
          const photo = result.data;
          setUploadedPhotos((prev) => [...prev, photo]);
          onUploadSuccess?.(photo);
          toast.success("Photo uploaded successfully");
        }
      } catch (error) {
        console.error("Upload failed:", error);
        setUploadStatuses((prev) =>
          prev.map((status, index) =>
            index === i
              ? { ...status, progress: 0, error: error as Error }
              : status
          )
        );
        onUploadError?.(error as Error);
        toast.error((error as Error).message || "Failed to upload photo");
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePreviewClick = (photo: FormAssetPhoto) => {
    if (photo.photo_url) {
      window.open(photo.photo_url, "_blank");
    }
  };

  const handleRemove = async (photoToRemove: FormAssetPhoto) => {
    if (confirm("Remove this photo?")) {
      const result = await softDeletePhoto(photoToRemove.id);
      if (result.success) {
        setUploadedPhotos((prev) =>
          prev.filter((p) => p.id !== photoToRemove.id)
        );
        toast.success("Photo removed successfully");
      } else {
        console.error("Failed to soft delete photo:", result.error);
        toast.error(result.error?.message || "Failed to remove photo");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {uploadedPhotos.map((photo) => (
          <div key={photo.id} className="relative group">
            <img
              src={photo.photo_url}
              alt={photo.description || "Form photo"}
              className="w-24 h-24 object-cover rounded-lg cursor-pointer"
              onClick={() => handlePreviewClick(photo)}
            />
            <button
              onClick={() => handleRemove(photo)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        className="hidden"
        {...fileInputProps}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || uploadedPhotos.length >= maxPhotos}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isUploading ? "Uploading..." : "Add Photos"}
      </button>

      {uploadStatuses.map((status, index) => (
        <div key={index} className="mt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm truncate">{status.file.name}</span>
            <span className="text-sm">{status.progress}%</span>
          </div>
          {status.error && (
            <div className="text-red-500 text-sm">{status.error.message}</div>
          )}
        </div>
      ))}
    </div>
  );
};
