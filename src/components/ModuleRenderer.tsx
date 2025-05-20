import React from "react";
import GenericModuleRenderer from "../modules/GenericModuleRenderer";
import FlraHeaderModule from "../modules/formmodules/FlraHeaderModule";
import PhotoModuleRenderer from "../modules/formmodules/PhotoModuleRenderer";
import SignatureModuleRenderer from "../modules/formmodules/SignatureModuleRenderer";
import TaskHazardControlModule from "../modules/formmodules/TaskHazardControlModule";
import { RendererKey, ModuleWithRenderer } from "../types/renderer.types";
import { MissingRenderer } from "./MissingRenderer";

export const rendererMap: Record<RendererKey, React.ComponentType<any>> = {
  GenericModuleRenderer,
  FlraHeaderModule,
  PhotoModuleRenderer,
  SignatureModuleRenderer,
  TaskHazardControlModule,
};

interface ModuleRendererProps {
  module: ModuleWithRenderer;
  formId: string;
  formModuleId: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
  [key: string]: any;
}

export const ModuleRenderer: React.FC<ModuleRendererProps> = ({
  module,
  formId,
  formModuleId,
  ...props
}) => {
  const rendererKey =
    module.template_modules?.renderer_key || module.renderer_key;
  if (!rendererKey) {
    console.warn("Module missing renderer_key:", module);
    return null;
  }

  const Renderer = rendererMap[rendererKey];
  if (!Renderer) {
    console.warn(`Renderer "${rendererKey}" not found for module:`, module);
    return (
      <MissingRenderer
        moduleName={module?.name ?? "Unknown"}
        rendererKey={rendererKey}
      />
    );
  }

  // Ensure formModuleId is passed to all modules that need it
  const commonProps = {
    module,
    formId,
    formModuleId,
    layoutStyle: module.template_modules?.layout_style || "default",
    ...props,
  };

  return <Renderer {...commonProps} />;
};
