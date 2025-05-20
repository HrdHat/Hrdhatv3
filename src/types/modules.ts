// Module renderer types
export type RendererKey =
  | "GenericModuleRenderer"
  | "FlraHeaderModule"
  | "FlraPhotosModule"
  | "SignaturesModule"
  | "TaskHazardControlModule";

// Module with renderer interface
export interface ModuleWithRenderer {
  renderer_key?: RendererKey;
  template_modules?: {
    renderer_key?: RendererKey;
  };
  [key: string]: any;
}

// Missing renderer component props
export interface MissingRendererProps {
  moduleName: string;
  rendererKey?: string;
}
