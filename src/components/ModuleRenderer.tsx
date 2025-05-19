import React from "react";
import { getRenderer } from "../modules/renderers";

interface ModuleRendererProps {
  module: any; // Accept any to support new structure
  [key: string]: any;
}

export const ModuleRenderer: React.FC<ModuleRendererProps> = ({
  module,
  ...props
}) => {
  // Prefer renderer_key from template_modules if present
  const rendererKey = module.template_modules?.renderer_key || module.renderer_key;
  if (!rendererKey) {
    console.warn("Module missing renderer_key:", module);
    return null;
  }
  const Renderer = getRenderer(rendererKey);
  return <Renderer module={module} {...props} />;
};
