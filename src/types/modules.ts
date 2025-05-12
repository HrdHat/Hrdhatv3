// Module renderer types
export type RendererKey = "TaskHazardModule" | "GenericModuleRenderer";

// Module with renderer interface
export interface ModuleWithRenderer {
  renderer_key: RendererKey;
  [key: string]: any;
}

// Missing renderer component props
export interface MissingRendererProps {
  moduleName: string;
  rendererKey?: string;
}
