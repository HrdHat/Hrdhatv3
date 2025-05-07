import React from "react";
import { FlraPhoto } from "../../types/formTypes";

type Props = {
  value: FlraPhoto[];
  onChange: (photos: FlraPhoto[]) => void;
};

const FlraPhotosModule: React.FC<Props> = ({ value, onChange }) => {
  // console.log("FlraPhotosModule value:", value);
  const handleChange = (idx: number, field: keyof FlraPhoto, val: string) => {
    onChange(value.map((photo, i) => i === idx ? { ...photo, [field]: val } : photo));
  };

  const addPhoto = () => {
    onChange([...value, { photo_url: "", description: "" }]);
  };

  const removePhoto = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <section>
      <h2>FLRA Photos</h2>
      <div>
        {value.map((photo, idx) => (
          <div key={idx}>
            <label>
              Photo URL:
              <input type="text" value={photo.photo_url} onChange={e => handleChange(idx, "photo_url", e.target.value)} />
            </label>
            <label>
              Description:
              <input type="text" value={photo.description || ""} onChange={e => handleChange(idx, "description", e.target.value)} />
            </label>
            <button type="button" onClick={() => removePhoto(idx)} disabled={value.length === 1}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addPhoto}>Add Photo</button>
      </div>
    </section>
  );
};

export default FlraPhotosModule; 