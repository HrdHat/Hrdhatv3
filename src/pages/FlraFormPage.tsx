import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useFlraFormData } from "../hooks/useFlraFormData";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  value?: any;
  options?: string[]; // For select fields
}

interface FormSection {
  id: string;
  label: string;
  fields: FormField[];
}

interface FormState {
  [fieldId: string]: any;
}

const renderFieldByType = (
  field: FormField,
  value: any,
  onChange: (value: any) => void
) => {
  switch (field.type) {
    case "boolean":
      return (
        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case "date":
      return (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "select":
      return (
        <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select an option</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case "textarea":
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "file":
      return (
        <input type="file" onChange={(e) => onChange(e.target.files?.[0])} />
      );
    case "signature":
      // TODO: Implement signature pad component
      return <div>Signature pad not implemented yet</div>;
    default:
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
};

const FlraFormPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [formState, setFormState] = useState<FormState>({});

  const { formData, loading, error } = useFlraFormData(formId || null);

  // Initialize form state when data is loaded
  useEffect(() => {
    if (formData) {
      const initialState: FormState = {};
      formData.modules.forEach((module) => {
        module.fields.forEach((field) => {
          initialState[field.id] = field.value || "";
        });
      });
      setFormState(initialState);
    }
  }, [formData]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!formData) {
    return <div>No form data found</div>;
  }

  return (
    <div>
      <h1>{formData.title}</h1>
      {formData.modules.map((module: FormSection) => (
        <div key={module.id}>
          <h2>{module.label}</h2>
          <div>
            {module.fields.map((field) => (
              <div key={field.id}>
                <label>
                  {field.label}
                  {field.required && <span>*</span>}
                </label>
                {renderFieldByType(field, formState[field.id], (value) =>
                  handleFieldChange(field.id, value)
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FlraFormPage;
