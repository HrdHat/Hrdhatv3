/**
 * GenericModuleRenderer.tsx
 * --------------------------
 * Renders generic form modules from a normalized, validated Field definition.
 *
 * RULES:
 * - Only normalized field types allowed (see FieldType union).
 * - `required` must be set, and matches DB NOT NULL status.
 * - `options` ONLY allowed for 'select' fields.
 * - All fields must match Zod schema, DB, and renderers.
 * - Aliases/legacy field types are forbidden in render logic.
 * - Validation (min/max) must be defined if required by DB/Zod.
 *
 * If any of the above is violated, THROW an error—do NOT fallback.
 *
 *
 * Future work: Implement a renderer for other fields types, like date, & time.
 */

import React, { useState } from "react";
import { ModuleWithRenderer } from "../types/renderer.types";
import { useValidation } from "../contexts/ValidationContext";

// Define allowed field types for clarity and safety
type FieldType =
  | "text"
  | "boolean"
  | "date"
  | "time"
  | "number"
  | "textarea"
  | "select";

/**
 * Field definition for dynamic form rendering.
 * - type: must match UI and DB types.
 * - label: user-friendly, matches Zod schema if present.
 * - required: should match DB NOT NULL constraint.
 * - options: only for "select" type.
 * - default_value: initial value for the field.
 * // To add min/max or other validation, extend this interface.
 */
interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  default_value?: any;
  options?: { label: string; value: string }[];
  // validation?: { min?: number; max?: number }; // Uncomment to support min/max
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
  const { hasFieldError, getFieldErrors } = useValidation();

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
    /**
     * VALIDATION RULE: All field definitions must pass Zod validation before render.
     * This prevents invalid field configurations from breaking the UI.
     * Any validation failure must show a configuration error.
     */

    // Strict type checking - no aliases allowed
    if (
      ![
        "text",
        "boolean",
        "date",
        "time",
        "number",
        "textarea",
        "select",
      ].includes(field.type)
    ) {
      throw new Error(
        `Invalid field type "${field.type}" for field "${field.name}". Only normalized types are allowed: text, boolean, date, time, number, textarea, select`
      );
    }

    const type = field.type;
    const id = `field_${field.name}`;
    const errorId = `error_${field.name}`;
    const isRequired = !!field.required;
    const isInvalid = showError(field);
    const fieldHasError = hasFieldError(field.name);
    const fieldErrors = getFieldErrors(field.name);

    switch (type) {
      case "boolean":
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
              aria-invalid={isInvalid || fieldHasError}
              aria-describedby={
                isInvalid || fieldHasError ? errorId : undefined
              }
              style={{
                borderColor: fieldHasError ? "#dc2626" : undefined,
              }}
            />
            {fieldHasError && (
              <div
                id={errorId}
                style={{
                  color: "#dc2626",
                  fontSize: "0.875rem",
                  marginTop: "4px",
                }}
              >
                {fieldErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
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
              aria-invalid={isInvalid || fieldHasError}
              aria-describedby={
                isInvalid || fieldHasError ? errorId : undefined
              }
              style={{
                borderColor: fieldHasError ? "#dc2626" : undefined,
              }}
            />
            {fieldHasError && (
              <div
                id={errorId}
                style={{
                  color: "#dc2626",
                  fontSize: "0.875rem",
                  marginTop: "4px",
                }}
              >
                {fieldErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
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
              aria-invalid={isInvalid || fieldHasError}
              aria-describedby={
                isInvalid || fieldHasError ? errorId : undefined
              }
              style={{
                borderColor: fieldHasError ? "#dc2626" : undefined,
              }}
            />
            {fieldHasError && (
              <div
                id={errorId}
                style={{
                  color: "#dc2626",
                  fontSize: "0.875rem",
                  marginTop: "4px",
                }}
              >
                {fieldErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
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
              aria-invalid={isInvalid || fieldHasError}
              aria-describedby={
                isInvalid || fieldHasError ? errorId : undefined
              }
              style={{
                borderColor: fieldHasError ? "#dc2626" : undefined,
              }}
            />
            {fieldHasError && (
              <div
                id={errorId}
                style={{
                  color: "#dc2626",
                  fontSize: "0.875rem",
                  marginTop: "4px",
                }}
              >
                {fieldErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
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
              aria-invalid={isInvalid || fieldHasError}
              aria-describedby={
                isInvalid || fieldHasError ? errorId : undefined
              }
              style={{
                borderColor: fieldHasError ? "#dc2626" : undefined,
              }}
            />
            {fieldHasError && (
              <div
                id={errorId}
                style={{
                  color: "#dc2626",
                  fontSize: "0.875rem",
                  marginTop: "4px",
                }}
              >
                {fieldErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
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
              aria-invalid={isInvalid || fieldHasError}
              aria-describedby={
                isInvalid || fieldHasError ? errorId : undefined
              }
              style={{
                borderColor: fieldHasError ? "#dc2626" : undefined,
              }}
            >
              <option value="">Select...</option>
              {(field.options || []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldHasError && (
              <div
                id={errorId}
                style={{
                  color: "#dc2626",
                  fontSize: "0.875rem",
                  marginTop: "4px",
                }}
              >
                {fieldErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
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
              aria-invalid={isInvalid || fieldHasError}
              aria-describedby={
                isInvalid || fieldHasError ? errorId : undefined
              }
              style={{
                borderColor: fieldHasError ? "#dc2626" : undefined,
              }}
            />
            {fieldHasError && (
              <div
                id={errorId}
                style={{
                  color: "#dc2626",
                  fontSize: "0.875rem",
                  marginTop: "4px",
                }}
              >
                {fieldErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
          </div>
        );
      // No file case here
      default:
        console.warn("Unknown field type:", type, field);
        return <div>Unsupported field type: {type}</div>;
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
      <h2>{module.name || "Form Module"}</h2>
      {module.fields?.map((field: Field) => {
        // File and signature fields are handled by specialized modules (not rendered here)
        if (
          ["file", "file_upload", "signature", "signature_pad"].includes(
            field.type as string
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
