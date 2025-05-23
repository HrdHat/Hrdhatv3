import { useState, useCallback } from "react";
import { ValidationError } from "../utils/validation";
import toast from "react-hot-toast";

interface ValidationState {
  errors: ValidationError[];
  hasErrors: boolean;
  clearErrors: () => void;
  setErrors: (errors: ValidationError[]) => void;
}

export function useFormValidation(): ValidationState {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const handleErrors = useCallback((errors: ValidationError[]) => {
    setErrors(errors);

    // Show toast for each error
    errors.forEach((error) => {
      toast.error(`${error.field}: ${error.message}`, {
        duration: 5000,
        position: "top-right",
      });
    });
  }, []);

  return {
    errors,
    hasErrors: errors.length > 0,
    clearErrors,
    setErrors: handleErrors,
  };
}
