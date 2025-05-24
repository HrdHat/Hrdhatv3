import React from "react";
import { ValidationError } from "../../utils/validation";

interface ValidationErrorDisplayProps {
  errors: ValidationError[];
  className?: string;
}

export const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  errors,
  className = "",
}) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div
      className={`validation-errors ${className}`}
      style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "6px",
        padding: "12px",
        margin: "8px 0",
      }}
    >
      {errors.map((error, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: index === errors.length - 1 ? "0" : "4px",
            fontSize: "0.875rem",
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: "#dc2626",
            }}
          >
            {error.userField || error.field}:
          </span>
          <span
            style={{
              color: "#991b1b",
            }}
          >
            {error.message}
          </span>
        </div>
      ))}
    </div>
  );
};
