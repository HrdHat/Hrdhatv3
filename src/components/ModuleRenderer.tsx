import React from "react";
import {
  getRenderer,
  hasValidRenderer,
  ModuleWithRenderer,
} from "@/modules/rendererRegistry";

interface ModuleRendererProps {
  module: ModuleWithRenderer;
  [key: string]: any;
}

export const ModuleRenderer: React.FC<ModuleRendererProps> = ({
  module,
  ...props
}) => {
  if (!hasValidRenderer(module)) {
    console.error("Module missing valid renderer_key:", module);
    return null;
  }

  const Renderer = getRenderer(module.renderer_key);
  return <Renderer module={module} {...props} />;
};
