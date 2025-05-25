import React, { useEffect, useState } from "react";
import { FormAssetPhoto } from "../../types/formTypes";
import { AddPhotosButton } from "../../components/shared/buttons/AddPhotosButton";
import {
  uploadImageToFormModule,
  getFormModulePhotos,
} from "../../services/forms/uploadImageToFormModule";
import { softDeletePhoto } from "../../services/forms/uploadPhotoToSupabase";

type Props = {
  value: FormAssetPhoto[];
  onChange: (photos: FormAssetPhoto[]) => void;
  formId: string;
  formModuleId: string;
  uploadedBy: string;
  layoutStyle?: "tight" | "loose" | "default";
};

const FormAssetPhotosModule: React.FC<Props> = ({
  value,
  onChange,
  formId,
  formModuleId,
  uploadedBy,
  layoutStyle = "default",
}) => {
  const [photos, setPhotos] = useState<FormAssetPhoto[]>(value || []);

  // Fetch photos on mount and when formId/formModuleId changes
  useEffect(() => {
    const fetchPhotos = async () => {
      const result = await getFormModulePhotos(formId, formModuleId);
      if (result.data) {
        setPhotos(result.data);
        onChange(result.data);
      }
    };
    fetchPhotos();
  }, [formId, formModuleId, onChange]);

  const handleUploadSuccess = (photo: FormAssetPhoto) => {
    const newPhotos = [...photos, photo];
    setPhotos(newPhotos);
    onChange(newPhotos);
  };

  const handleUploadError = (error: Error) => {
    console.error("Photo upload failed:", error);
    // You might want to show a toast notification here
  };

  const removePhoto = async (photoId: string, idx: number) => {
    const result = await softDeletePhoto(photoId);
    if (result.success) {
      const newPhotos = photos.filter((_, i) => i !== idx);
      setPhotos(newPhotos);
      onChange(newPhotos);
    } else {
      console.error("Failed to remove photo:", result.error);
      // You might want to show a toast notification here
    }
  };

  return (
    <div className={`space-y-4 ${layoutStyle === "tight" ? "p-2" : "p-4"}`}>
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, idx) => (
          <div key={photo.id} className="relative group">
            <img
              src={photo.photo_url}
              alt={photo.photo_description || "Form photo"}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <button
              onClick={() => removePhoto(photo.id, idx)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <AddPhotosButton
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
        formId={formId}
        formModuleId={formModuleId}
        uploadedBy={uploadedBy}
      />
    </div>
  );
};

export default FormAssetPhotosModule;
