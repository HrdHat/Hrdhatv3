import React, { useState } from "react";
import { ModuleWithRenderer } from "../types/renderer.types";

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
  onDataChange?: (values: Record<string, any>) => void;
  layoutStyle?: "tight" | "loose" | "default";
}

export const GenericModuleRenderer: React.FC<GenericModuleRendererProps> = ({
  module,
  onDataChange,
  layoutStyle = "default",
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
  const showError = (field: Field) =>
    touched[field.name] && isFieldEmpty(field);

  const renderInput = (field: Field) => {
    // Normalize type to lowercase and handle textarea/select aliases
    const type =
      field.type === "text_area"
        ? "textarea"
        : field.type === "dropdown"
        ? "select"
        : field.type ?? "";
    const normalizedType = type.toLowerCase();
    const id = `field_${field.name}`;
    const errorId = `error_${field.name}`;
    const isRequired = !!field.required;
    const isInvalid = showError(field);
    switch (normalizedType) {
      case "boolean":
      case "checkbox":
        return (
          <div>
            <label htmlFor={id}>{field.label}</label>
            <input
              type="checkbox"
              name={field.name}
              id={id}
              checked={!!values[field.name]}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              onBlur={() => handleBlur(field.name)}
              required={isRequired}
              aria-required={isRequired}
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? errorId : undefined}
            />
          </div>
        );
      case "number":
        return (
          <div>
            <label htmlFor={id}>{field.label}</label>
            <input
              type="number"
              name={field.name}
              id={id}
              value={values[field.name]}
              onChange={(e) => handleChange(field.name, e.target.valueAsNumber)}
              onBlur={() => handleBlur(field.name)}
              required={isRequired}
              aria-required={isRequired}
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? errorId : undefined}
            />
          </div>
        );
      case "date":
        return (
          <div>
            <label htmlFor={id}>{field.label}</label>
            <input
              type="date"
              name={field.name}
              id={id}
              value={values[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
              required={isRequired}
              aria-required={isRequired}
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? errorId : undefined}
            />
          </div>
        );
      case "time":
        return (
          <div>
            <label htmlFor={id}>{field.label}</label>
            <input
              type="time"
              name={field.name}
              id={id}
              value={values[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
              required={isRequired}
              aria-required={isRequired}
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? errorId : undefined}
            />
          </div>
        );
      case "textarea":
        return (
          <div>
            <label htmlFor={id}>{field.label}</label>
            <textarea
              name={field.name}
              id={id}
              value={values[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
              required={isRequired}
              aria-required={isRequired}
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? errorId : undefined}
            />
          </div>
        );
      case "select":
        return (
          <div>
            <label htmlFor={id}>{field.label}</label>
            <select
              name={field.name}
              id={id}
              value={values[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
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
          </div>
        );
      case "text":
        return (
          <div>
            <label htmlFor={id}>{field.label}</label>
            <input
              type="text"
              name={field.name}
              id={id}
              value={values[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
              required={isRequired}
              aria-required={isRequired}
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? errorId : undefined}
            />
          </div>
        );
      // No file case here
      default:
        console.warn("Unknown field type:", normalizedType, field);
        return <div>Unsupported field type: {normalizedType}</div>;
    }
  };

  const isFieldEmpty = (field: Field) => {
    const value = values[field.name];
    if (field.type === "boolean") return false;
    // Remove file logic
    return (
      field.required && (value === undefined || value === null || value === "")
    );
  };

  return (
    <div className={`module-wrapper layout-${layoutStyle}`}>
      <h2>{module.label}</h2>
      {module.fields?.map((field: Field) => {
        // File and signature fields are handled by specialized modules (not rendered here)
        if (
          ["file", "file_upload", "signature", "signature_pad"].includes(
            field.type
          )
        ) {
          console.warn("Skipping field type (handled elsewhere):", field.type);
          return null;
        }
        return <div key={field.name}>{renderInput(field)}</div>;
      })}
    </div>
  );
};

export default GenericModuleRenderer;
