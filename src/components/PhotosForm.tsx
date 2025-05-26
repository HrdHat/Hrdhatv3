import React, { useState, useRef } from "react";
import { FormAssetPhoto } from "../types/formSchemas";
import { supabase } from "../db/supabaseClient";

// Props: formId + data loaded by your useFlraFormData hook
type Props = {
  formId: string;
  formModuleId: string;
  initialData: FormAssetPhoto[] | null;
};

const PhotosForm: React.FC<Props> = ({ formId, formModuleId, initialData }) => {
  // Local state - initialize with existing data or empty array
  const [photos, setPhotos] = useState<Partial<FormAssetPhoto>[]>(
    initialData || []
  );

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add a new photo entry
  const addPhoto = () => {
    const newPhoto: Partial<FormAssetPhoto> = {
      photo_description: "",
      photo_url: "",
    };
    setPhotos((prev) => [...prev, newPhoto]);
  };

  // Remove a photo entry
  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Update photo description
  const updatePhotoDescription = (index: number, description: string) => {
    setPhotos((prev) =>
      prev.map((photo, i) =>
        i === index ? { ...photo, photo_description: description } : photo
      )
    );
  };

  // Handle file upload
  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setErrorMessage("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setStatus("error");
      setErrorMessage("File size must be less than 5MB");
      return;
    }

    setUploadingIndex(index);
    setStatus("saving");
    setErrorMessage("");

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${formId}/${formModuleId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("form-photos")
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("form-photos")
        .getPublicUrl(fileName);

      const photoUrl = urlData.publicUrl;

      // Update local state
      setPhotos((prev) =>
        prev.map((photo, i) =>
          i === index ? { ...photo, photo_url: photoUrl } : photo
        )
      );

      // Save to database
      const payload = {
        formId,
        moduleKey: "photos" as const,
        data: {
          ...photos[index],
          photo_url: photoUrl,
          form_id: formId,
          form_module_id: formModuleId,
          uploaded_at: new Date().toISOString(),
        },
        moduleId: formModuleId,
      };

      const { error: saveError } = await supabase.functions.invoke(
        "saveFormModuleData",
        {
          body: payload,
        }
      );

      if (saveError) {
        throw saveError;
      }

      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error("Upload error:", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingIndex(null);
    }
  };

  // Save photo description
  const savePhotoDescription = async (index: number) => {
    const photo = photos[index];

    if (!photo.photo_url) {
      return; // Don't save without a photo
    }

    setStatus("saving");
    setErrorMessage("");

    try {
      const payload = {
        formId,
        moduleKey: "photos" as const,
        data: {
          ...photo,
          form_id: formId,
          form_module_id: formModuleId,
          uploaded_at: new Date().toISOString(),
        },
        moduleId: formModuleId,
      };

      const { error } = await supabase.functions.invoke("saveFormModuleData", {
        body: payload,
      });

      if (error) {
        throw error;
      }

      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error("Save error:", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <div className="photos-form">
      <h2>Photos</h2>

      {/* Status indicator */}
      <div className="save-status">
        {status === "saving" && <div className="status saving">💾 Saving…</div>}
        {status === "success" && <div className="status success">✅ Saved</div>}
        {status === "error" && (
          <div className="status error">
            ❌ {errorMessage || "Error occurred"}
          </div>
        )}
      </div>

      <div className="photos-list">
        {photos.map((photo, index) => (
          <div key={index} className="photo-entry">
            <div className="photo-header">
              <h3>Photo {index + 1}</h3>
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="remove-button"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>

            <div className="photo-content">
              {/* Photo upload area */}
              <div className="photo-upload">
                {photo.photo_url ? (
                  <div className="photo-preview">
                    <img
                      src={photo.photo_url}
                      alt={photo.photo_description || `Photo ${index + 1}`}
                      className="uploaded-photo"
                    />
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(index, file);
                        }
                      }}
                      className="file-input"
                      disabled={uploadingIndex === index}
                    />
                    {uploadingIndex === index ? (
                      <div className="uploading">Uploading...</div>
                    ) : (
                      <div className="upload-text">
                        Click to upload photo
                        <br />
                        <small>Max 5MB, JPG/PNG</small>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Photo description */}
              <div className="field-group">
                <label htmlFor={`description-${index}`}>
                  Description
                  <textarea
                    id={`description-${index}`}
                    value={photo.photo_description || ""}
                    onChange={(e) =>
                      updatePhotoDescription(index, e.target.value)
                    }
                    onBlur={() => savePhotoDescription(index)}
                    placeholder="Describe this photo"
                    rows={3}
                  />
                </label>
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={addPhoto} className="add-button">
          + Add Photo
        </button>
      </div>
    </div>
  );
};

export default PhotosForm;
