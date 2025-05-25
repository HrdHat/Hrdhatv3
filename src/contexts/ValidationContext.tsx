/**
 * Validation Context - CRITICAL SYSTEM FILE
 * =========================================
 *
 * This file provides centralized validation state management for the entire application.
 * DO NOT MODIFY without understanding the full impact on validation UX.
 *
 * This context manages validation errors and provides utilities for field-level error display.
 * Used by all form components to show inline validation feedback.
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import { ValidationError, createValidationErrorMap } from "../utils/validation";

interface ValidationContextType {
  validationErrors: Record<string, string[]>;
  setValidationErrors: (errors: ValidationError[]) => void;
  clearValidationErrors: () => void;
  clearFieldError: (fieldName: string) => void;
  hasFieldError: (fieldName: string) => boolean;
  getFieldErrors: (fieldName: string) => string[];
}

const ValidationContext = createContext<ValidationContextType | undefined>(
  undefined
);

export function ValidationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [validationErrors, setValidationErrorsState] = useState<
    Record<string, string[]>
  >({});

  const setValidationErrors = useCallback((errors: ValidationError[]) => {
    const errorMap = createValidationErrorMap(errors);
    setValidationErrorsState(errorMap);
  }, []);

  const clearValidationErrors = useCallback(() => {
    setValidationErrorsState({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setValidationErrorsState((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const hasFieldError = useCallback(
    (fieldName: string) => {
      return !!(
        validationErrors[fieldName] && validationErrors[fieldName].length > 0
      );
    },
    [validationErrors]
  );

  const getFieldErrors = useCallback(
    (fieldName: string) => {
      return validationErrors[fieldName] || [];
    },
    [validationErrors]
  );

  return (
    <ValidationContext.Provider
      value={{
        validationErrors,
        setValidationErrors,
        clearValidationErrors,
        clearFieldError,
        hasFieldError,
        getFieldErrors,
      }}
    >
      {children}
    </ValidationContext.Provider>
  );
}

export function useValidation() {
  const context = useContext(ValidationContext);
  if (context === undefined) {
    throw new Error("useValidation must be used within a ValidationProvider");
  }
  return context;
}
