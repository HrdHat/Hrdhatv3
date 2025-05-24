/**
 * Example showing how to use the enhanced validation system
 * This demonstrates the complete implementation of plan 1.3.5 part C
 */

import React, { useState } from "react";
import {
  ValidationProvider,
  useValidation,
} from "../contexts/ValidationContext";
import { useValidatedSave } from "../hooks/useValidatedSave";
import { FormField } from "../components/shared/FormField";
import { ValidationErrorDisplay } from "../components/shared/ValidationErrorDisplay";
import { saveWithValidation } from "../services/forms/validatedSaveService";

// Example form component that uses the validation system
function ExampleFormModule({ formId }: { formId: string }) {
  const [formData, setFormData] = useState({
    project_name: "",
    task_location: "",
    supervisor_name: "",
    date: "",
  });

  const { validationErrors, setValidationErrors, clearValidationErrors } =
    useValidation();
  const { saveWithValidation: saveHook } = useValidatedSave({
    onSuccess: () => {
      console.log("Save successful!");
    },
    onError: (error) => {
      console.error("Save failed:", error);
    },
  });

  const handleSave = async () => {
    // This implements the error boundary pattern from the plan
    const result = await saveWithValidation({
      formId,
      moduleKey: "general",
      data: formData,
    });

    // The validation errors are automatically handled by the service
    // and will be displayed inline in the form fields
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className="form-module">
      <h2>General Information</h2>

      {/* Show validation summary if there are errors */}
      {Object.keys(validationErrors).length > 0 && (
        <ValidationErrorDisplay
          errors={Object.entries(validationErrors).flatMap(
            ([field, messages]) =>
              messages.map((message) => ({ field, message, userField: field }))
          )}
        />
      )}

      {/* Form fields with inline validation */}
      <FormField
        name="project_name"
        label="Project Name"
        value={formData.project_name}
        onChange={(value) => handleFieldChange("project_name", value)}
        required
      />

      <FormField
        name="task_location"
        label="Task Location"
        value={formData.task_location}
        onChange={(value) => handleFieldChange("task_location", value)}
      />

      <FormField
        name="supervisor_name"
        label="Supervisor Name"
        value={formData.supervisor_name}
        onChange={(value) => handleFieldChange("supervisor_name", value)}
      />

      <FormField
        name="date"
        label="Date"
        type="date"
        value={formData.date}
        onChange={(value) => handleFieldChange("date", value)}
        required
      />

      <button onClick={handleSave}>Save Module</button>
    </div>
  );
}

// Example of how to wrap your app with the validation provider
export function AppWithValidation() {
  return (
    <ValidationProvider>
      <ExampleFormModule formId="example-form-id" />
    </ValidationProvider>
  );
}
