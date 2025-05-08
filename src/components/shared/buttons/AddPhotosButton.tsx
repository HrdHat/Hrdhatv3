/**
 * AddPhotosButton Component
 *
 * A modular button component that triggers photo uploads and displays thumbnails.
 * Features:
 * - Opens native file picker on click
 * - Handles batch uploads to Supabase Storage
 * - Inserts metadata into form_data_photos
 * - Displays upload progress and thumbnails
 * - Enforces upload limits
 * - Supports soft delete
 * - Shows loading state during uploads
 * - Displays photo count badge
 *
 * Designed to work within any dynamic FLRA module, with all data
 * scoped to form_id + form_module_id.
 */

import React, { useState } from "react";
import { ImageUploaderBase } from "../ImageUploaderBase";
import { FormPhoto } from "../../../services/forms/uploadImageToFormModule";
import "../../../styles/components/image-uploader.css";

export type AddPhotosButtonProps = {
  formId: string;
  formModuleId: string;
  uploadedBy: string;
  tag?: string;
  maxPhotos?: number;
  onUploadSuccess?: (photo: FormPhoto) => void;
  onUploadError?: (error: Error) => void;
  buttonText?: string;
  buttonClassName?: string;
};

export const AddPhotosButton: React.FC<AddPhotosButtonProps> = ({
  formId,
  formModuleId,
  uploadedBy,
  tag,
  maxPhotos = 10,
  onUploadSuccess,
  onUploadError,
  buttonText = "Add Photos",
  buttonClassName,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);

  return (
    <div className="image-uploader">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`image-uploader__button ${buttonClassName || ""}`}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : buttonText}
        {photoCount > 0 && (
          <span
            style={{
              backgroundColor: "red",
              borderRadius: "999px",
              padding: "2px 6px",
              color: "white",
              fontSize: "12px",
              marginLeft: "6px",
            }}
          >
            {photoCount}/{maxPhotos}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="image-uploader__container">
          <ImageUploaderBase
            formId={formId}
            formModuleId={formModuleId}
            uploadedBy={uploadedBy}
            tag={tag}
            maxPhotos={maxPhotos}
            onUploadSuccess={onUploadSuccess}
            onUploadError={onUploadError}
            onStateChange={({ isUploading, photoCount }) => {
              setIsUploading(isUploading);
              setPhotoCount(photoCount);
            }}
          />
        </div>
      )}
    </div>
  );
};
