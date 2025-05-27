import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFlraFormData } from "../hooks/useFlraFormData";
import { ModuleRenderer } from "../components/ModuleRenderer";
import { TaskHazardControl } from "../types/formTypes";
import { ModuleWithRenderer } from "../types/renderer.types";
import { ValidationProvider } from "../contexts/ValidationContext";
import { Toaster } from "react-hot-toast";

const FlraFormPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const { formData, loading, error } = useFlraFormData(formId || null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const navigate = useNavigate();

  const handleModuleChange = (moduleId: string, value: unknown) => {
    setFormValues((prev) => ({
      ...prev,
      [moduleId]: value,
    }));
  };

  useEffect(() => {
    if (!loading && (!formData || error)) {
      // If the form is missing (deleted), redirect to dashboard or forms list
      navigate("/", { replace: true });
    }
  }, [loading, formData, error, navigate]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!formData) return <div>No form data found</div>;
  if (!formId) return <div>No form ID provided</div>;

  return (
    <div>
      <h1>{formData.title}</h1>
      <ValidationProvider>
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
              formModuleId={module.id}
              value={formValues[module.id]}
              onChange={(value: unknown) =>
                handleModuleChange(module.id, value)
              }
            />
          );
        })}
      </ValidationProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#4aed88",
              secondary: "#fff",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#ff4b4b",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
};

export default FlraFormPage;
