import React from "react";
import GenericModuleRenderer from "../modules/GenericModuleRenderer";
import FlraHeaderModule from "../modules/formmodules/FlraHeaderModule";
import PhotoModuleRenderer from "../modules/formmodules/PhotoModuleRenderer";
import SignatureModuleRenderer from "../modules/formmodules/SignatureModuleRenderer";
import TaskHazardControlModule from "../modules/formmodules/TaskHazardControlModule";
import { RendererKey, ModuleWithRenderer } from "../types/renderer.types";
import { MissingRenderer } from "./MissingRenderer";

// Import our form components with save logic
import GeneralInfoForm from "./GeneralInfoForm";
import PreJobChecklistForm from "./PreJobChecklistForm";
import PpeChecklistForm from "./PpeChecklistForm";

// ✅ FIXED: Map renderer_key to components with save logic
export const rendererMap: Record<RendererKey, React.ComponentType<any>> = {
  GenericModuleRenderer,
  FlraHeaderModule,
  PhotoModuleRenderer,
  SignatureModuleRenderer,
  TaskHazardControlModule,
};

// ✅ NEW: Map module names to specific form components with save logic
const moduleNameToComponent: Record<string, React.ComponentType<any>> = {
  general_information: GeneralInfoForm,
  pre_job_checklist: PreJobChecklistForm,
  ppe_platform_inspection: PpeChecklistForm,
  header: FlraHeaderModule,
  task_hazard_control: TaskHazardControlModule,
  photos: PhotoModuleRenderer,
  signatures: SignatureModuleRenderer,
};

interface ModuleRendererProps {
  module: ModuleWithRenderer;
  formModuleId: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
  [key: string]: any;
}

export const ModuleRenderer: React.FC<ModuleRendererProps> = ({
  module,
  formModuleId,
  ...props
}) => {
  // ✅ FIXED: First try to map by module name (for components with save logic)
  const moduleName = module.template_modules?.name || module.name;
  const ComponentByName = moduleName ? moduleNameToComponent[moduleName] : null;

  if (ComponentByName) {
    const commonProps = {
      module,
      formModuleId,
      layoutStyle: module.template_modules?.layout_style || "default",
      ...props,
    };
    return <ComponentByName {...commonProps} />;
  }

  // ✅ FALLBACK: Use renderer_key for legacy components
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

  const commonProps = {
    module,
    formModuleId,
    layoutStyle: module.template_modules?.layout_style || "default",
    ...props,
  };

  return <Renderer {...commonProps} />;
};
