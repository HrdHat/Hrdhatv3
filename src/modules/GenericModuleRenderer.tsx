import React, { useState } from "react";
import { ModuleWithRenderer } from "../types/modules";

interface Field {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  default_value?: any;
  options?: { label: string; value: string }[];
}

interface GenericModuleRendererProps {
  module: ModuleWithRenderer;
  className?: string;
  onDataChange?: (values: Record<string, any>) => void;
}

export const GenericModuleRenderer: React.FC<GenericModuleRendererProps> = ({
  module,
  className = "",
  onDataChange,
}) => {
  // Initialize state with default values
  const initialValues = Object.fromEntries(
    (module.fields || []).map((field: Field) => [
      field.name,
      field.type === "boolean"
        ? Boolean(field.default_value)
        : field.default_value ?? "",
    ])
  );
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (name: string, value: any) => {
    const updated = { ...values, [name]: value };
    setValues(updated);
    if (onDataChange) onDataChange(updated);
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Utility for error state
  const showError = (field: Field) => touched[field.name] && isFieldEmpty(field);

  const renderInput = (field: Field) => {
    // Normalize type to lowercase and handle textarea/select aliases
    const type =
      field.type === "text_area" ? "textarea" :
      field.type === "dropdown" ? "select" :
      (field.type ?? "");
    const normalizedType = type.toLowerCase();
    const id = `field_${field.name}`;
    const errorId = `error_${field.name}`;
    const isRequired = !!field.required;
    const isInvalid = showError(field);
    switch (normalizedType) {
      case "boolean":
      case "checkbox":
        return (
          <input
            type="checkbox"
            name={field.name}
            id={id}
            checked={!!values[field.name]}
            onChange={e => handleChange(field.name, e.target.checked)}
            onBlur={() => handleBlur(field.name)}
            required={isRequired}
            aria-required={isRequired}
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? errorId : undefined}
          />
        );
      case "number":
        return (
          <input
            type="number"
            name={field.name}
            id={id}
            value={values[field.name]}
            onChange={e => handleChange(field.name, e.target.valueAsNumber)}
            onBlur={() => handleBlur(field.name)}
            required={isRequired}
            aria-required={isRequired}
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? errorId : undefined}
          />
        );
      case "date":
        return (
          <input
            type="date"
            name={field.name}
            id={id}
            value={values[field.name]}
            onChange={e => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            required={isRequired}
            aria-required={isRequired}
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? errorId : undefined}
          />
        );
      case "time":
        return (
          <input
            type="time"
            name={field.name}
            id={id}
            value={values[field.name]}
            onChange={e => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            required={isRequired}
            aria-required={isRequired}
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? errorId : undefined}
          />
        );
      case "textarea":
        return (
          <textarea
            name={field.name}
            id={id}
            value={values[field.name]}
            onChange={e => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            required={isRequired}
            aria-required={isRequired}
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? errorId : undefined}
          />
        );
      case "select":
        return (
          <select
            name={field.name}
            id={id}
            value={values[field.name]}
            onChange={e => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            required={isRequired}
            aria-required={isRequired}
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? errorId : undefined}
          >
            <option value="">Select...</option>
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case "text":
        return (
          <input
            type="text"
            name={field.name}
            id={id}
            value={values[field.name]}
            onChange={e => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            required={isRequired}
            aria-required={isRequired}
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? errorId : undefined}
          />
        );
      // No file case here
      default:
        console.warn("Unknown field type:", normalizedType, field);
        return (
          <div style={{ color: "red" }}>
            Unsupported field type: {normalizedType}
          </div>
        );
    }
  };

  const isFieldEmpty = (field: Field) => {
    const value = values[field.name];
    if (field.type === "boolean") return false;
    // Remove file logic
    return field.required && (value === undefined || value === null || value === "");
  };

  return (
    <>
      <h2>{module.label}</h2>
      {module.fields?.map((field: Field) => {
        // File and signature fields are handled by specialized modules (not rendered here)
        if (["file", "file_upload", "signature", "signature_pad"].includes(field.type)) {
          console.warn("Skipping field type (handled elsewhere):", field.type);
          return null;
        }
        return <div key={field.name}>{renderInput(field)}</div>;
      })}
    </>
  );
};

export default GenericModuleRenderer;
