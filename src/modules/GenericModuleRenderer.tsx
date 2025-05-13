import React, { useState } from "react";
import { ModuleWithRenderer } from "./rendererRegistry";

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
    (module.fields || []).map((field: any) => [
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
  const showError = (field: any) => touched[field.name] && isFieldEmpty(field);

  const renderInput = (field: any) => {
    // Fallback logic for textarea/select types
    const type =
      field.type === "text_area" ? "textarea" :
      field.type === "dropdown" ? "select" :
      field.type;
    const id = `field_${field.name}`;
    const errorId = `error_${field.name}`;
    const isRequired = !!field.required;
    const isInvalid = showError(field);
    switch (type) {
      case "boolean":
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
            {(field.options || []).map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      // No file case here
      default:
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
    }
  };

  const isFieldEmpty = (field: any) => {
    const value = values[field.name];
    if (field.type === "boolean") return false;
    // Remove file logic
    return field.required && (value === undefined || value === null || value === "");
  };

  return (
    <div className={className}>
      <h3>{module.label}</h3>
      <div>
        {module.fields?.map((field: any) => {
          const id = `field_${field.name}`;
          const errorId = `error_${field.name}`;
          // Skip file fields
          if (
            field.type === "file" ||
            field.type === "file_upload" // in case DB uses a different name
          ) {
            return null;
          }
          return (
            <div key={field.id}>
              <label htmlFor={id}>
                {field.label}
                {field.required && <span>*</span>}
              </label>
              {renderInput(field)}
              {showError(field) && (
                <div
                  id={errorId}
                  style={{ color: "red", fontSize: 12 }}
                  role="alert"
                >
                  This field is required
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenericModuleRenderer;
