import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useFlraFormData } from "../hooks/useFlraFormData";
import { ModuleRenderer } from "../components/ModuleRenderer";
import { TaskHazardControl } from "../types/formTypes";
import { ModuleWithRenderer } from "../types/renderer.types";

const FlraFormPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const { formData, loading, error } = useFlraFormData(formId || null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  const handleModuleChange = (moduleId: string, value: unknown) => {
    setFormValues((prev) => ({
      ...prev,
      [moduleId]: value,
    }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!formData) return <div>No form data found</div>;
  if (!formId) return <div>No form ID provided</div>;

  return (
    <div>
      <h1>{formData.title}</h1>
      {formData.modules.map((module) => {
        // Convert FormModule to ModuleWithRenderer
        const moduleWithRenderer: ModuleWithRenderer = {
          ...module,
          template_modules: {
            ...module.template_modules,
            renderer_key: module.template_modules.renderer_key as any,
          },
        };

        return (
          <ModuleRenderer
            key={module.id}
            module={moduleWithRenderer}
            formId={formId}
            formModuleId={module.id}
            value={formValues[module.id]}
            onChange={(value: unknown) => handleModuleChange(module.id, value)}
          />
        );
      })}
    </div>
  );
};

export default FlraFormPage;
