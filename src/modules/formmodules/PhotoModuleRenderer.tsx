import React from "react";
import { FormAssetPhoto } from "../../types/formTypes";
import { AddPhotosButton } from "../../components/shared/buttons/AddPhotosButton";
import { uploadImageToFormModule } from "../../services/forms/uploadImageToFormModule";

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
  if (!value) return null;

  const handleUploadSuccess = (result: {
    data: FormAssetPhoto | null;
    error: Error | null;
  }) => {
    if (result.error || !result.data) {
      console.error("Photo upload failed:", result.error);
      return;
    }
    onChange([...value, result.data]);
  };

  const handleUploadError = (error: Error) => {
    console.error("Photo upload failed:", error);
    // You might want to show a toast notification here
  };

  const removePhoto = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className={`space-y-4 ${layoutStyle === "tight" ? "p-2" : "p-4"}`}>
      <div className="flex flex-wrap gap-2">
        {value.map((photo, idx) => (
          <div key={photo.id} className="relative group">
            <img
              src={photo.photo_url}
              alt={photo.description || "Form photo"}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <button
              onClick={() => removePhoto(idx)}
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
