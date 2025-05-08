import React from "react";
import { FlraPhoto } from "../../types/formTypes";
import { AddPhotosButton } from "../../components/shared/buttons/AddPhotosButton";
import { FormPhoto } from "../../services/forms/uploadImageToFormModule";

type Props = {
  value: FlraPhoto[];
  onChange: (photos: FlraPhoto[]) => void;
  formId: string;
  formModuleId: string;
  uploadedBy: string;
};

const FlraPhotosModule: React.FC<Props> = ({
  value,
  onChange,
  formId,
  formModuleId,
  uploadedBy,
}) => {
  const handleUploadSuccess = (photo: FormPhoto) => {
    // Convert FormPhoto to FlraPhoto format, preserving all Supabase fields
    const newPhoto: FlraPhoto = {
      id: photo.id,
      form_id: photo.form_id,
      form_module_id: photo.form_module_id,
      storage_path: photo.storage_path,
      public_url: photo.public_url,
      file_name: photo.file_name,
      file_size: photo.file_size,
      mime_type: photo.mime_type,
      description: photo.description || null,
      tag: photo.tag || null,
      source: photo.source,
      uploaded_by: photo.uploaded_by,
      uploaded_at: photo.uploaded_at,
      updated_at: photo.updated_at,
      is_deleted: photo.is_deleted,
      deleted_at: photo.deleted_at || null,
      // Optional fields not in FormPhoto
      sort_order: null,
    };
    onChange([...value, newPhoto]);
  };

  const handleUploadError = (error: Error) => {
    console.error("Photo upload failed:", error);
    // You might want to show a toast notification here
  };

  const removePhoto = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <section>
      <h2>FLRA Photos</h2>
      <div>
        {/* Display existing photos */}
        {value.map((photo, idx) => (
          <div key={photo.id || idx} className="image-uploader__thumbnail">
            {photo.public_url && (
              <img
                src={photo.public_url}
                alt={photo.description || "Uploaded image"}
                className="image-uploader__thumbnail-image"
              />
            )}
            <div className="image-uploader__thumbnail-overlay">
              {photo.description || "No description"}
            </div>
            <button
              onClick={() => removePhoto(idx)}
              className="image-uploader__button--delete"
              disabled={value.length === 1}
            >
              ×
            </button>
          </div>
        ))}

        {/* Add Photos Button */}
        <AddPhotosButton
          formId={formId}
          formModuleId={formModuleId}
          uploadedBy={uploadedBy}
          maxPhotos={10}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          buttonText="Add Photos"
        />
      </div>
    </section>
  );
};

export default FlraPhotosModule;
