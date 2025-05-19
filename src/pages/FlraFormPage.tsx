import React from "react";
import { useParams } from "react-router-dom";
import { useFlraFormData } from "../hooks/useFlraFormData";
import { ModuleRenderer } from "../components/ModuleRenderer";

const FlraFormPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const { formData, loading, error } = useFlraFormData(formId || null);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!formData) return <div>No form data found</div>;

  return (
    <div>
      <h1>{formData.title}</h1>
      {formData.modules.map((module) => (
        <ModuleRenderer key={module.id} module={module} />
      ))}
    </div>
  );
};

export default FlraFormPage;
