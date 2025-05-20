// Module renderer types
export type RendererKey =
  | "GenericModuleRenderer"
  | "FlraHeaderModule"
  | "PhotoModuleRenderer"
  | "SignatureModuleRenderer"
  | "TaskHazardControlModule";

// Module with renderer interface
export interface ModuleWithRenderer {
  id: string;
  form_id: string;
  module_id: string;
  module_order: number;
  is_required: boolean;
  completion_state: string;
  name?: string;
  template_modules?: {
    name: string;
    label: string;
    renderer_key: RendererKey;
    uses_fields: boolean;
    version: number;
    layout_style?: "tight" | "loose" | "default";
  };
  fields?: any[];
  renderer_key?: RendererKey;
}

// Used only if rendering fails and fallback is needed
export interface MissingRendererProps {
  moduleName: string;
  rendererKey?: string;
}
