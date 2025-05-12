import React from "react";
import { ModuleWithRenderer } from "./rendererRegistry";

interface GenericModuleRendererProps {
  module: ModuleWithRenderer;
  className?: string;
}

export const GenericModuleRenderer: React.FC<GenericModuleRendererProps> = ({
  module,
  className = "",
}) => {
  return (
    <div className={className}>
      <h3>{module.label}</h3>
      <div>
        {module.fields?.map((field: any) => (
          <div key={field.id}>
            <label>
              {field.label}
              {field.required && <span>*</span>}
            </label>
            <input
              type={field.type === "boolean" ? "checkbox" : "text"}
              required={field.required}
              defaultValue={field.default_value}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GenericModuleRenderer;
