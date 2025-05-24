import React from "react";
import { useValidation } from "../../contexts/ValidationContext";

interface FormFieldProps {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "email" | "tel";
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  required = false,
  disabled = false,
  placeholder,
  className = "",
}) => {
  const { hasFieldError, getFieldErrors, clearFieldError } = useValidation();

  const fieldHasError = hasFieldError(name);
  const fieldErrors = getFieldErrors(name);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue =
      type === "number" ? e.target.valueAsNumber : e.target.value;
    onChange(newValue);

    // Clear field error when user starts typing
    if (fieldHasError) {
      clearFieldError(name);
    }
  };

  const handleBlur = () => {
    onBlur?.();
  };

  return (
    <div className={`form-field ${className}`} style={{ marginBottom: "16px" }}>
      <label
        htmlFor={name}
        style={{
          display: "block",
          marginBottom: "4px",
          fontWeight: 500,
          color: "#374151",
        }}
      >
        {label}
        {required && <span style={{ color: "#dc2626" }}> *</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value || ""}
        onChange={handleChange}
        onBlur={handleBlur}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: fieldHasError ? "1px solid #dc2626" : "1px solid #d1d5db",
          borderRadius: "6px",
          fontSize: "14px",
          transition: "border-color 0.2s, box-shadow 0.2s",
          backgroundColor: disabled ? "#f9fafb" : "white",
          color: disabled ? "#6b7280" : "inherit",
          cursor: disabled ? "not-allowed" : "text",
          boxShadow: fieldHasError
            ? "0 0 0 3px rgba(220, 38, 38, 0.1)"
            : "none",
        }}
        aria-invalid={fieldHasError}
        aria-describedby={fieldHasError ? `${name}-error` : undefined}
        onFocus={(e) => {
          if (!fieldHasError) {
            e.target.style.borderColor = "#3b82f6";
            e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
          }
        }}
        onBlurCapture={(e) => {
          if (!fieldHasError) {
            e.target.style.borderColor = "#d1d5db";
            e.target.style.boxShadow = "none";
          }
        }}
      />

      {fieldHasError && (
        <div id={`${name}-error`} style={{ marginTop: "4px" }}>
          {fieldErrors.map((error, index) => (
            <div
              key={index}
              style={{
                color: "#dc2626",
                fontSize: "0.875rem",
                marginBottom: index === fieldErrors.length - 1 ? "0" : "2px",
              }}
            >
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
