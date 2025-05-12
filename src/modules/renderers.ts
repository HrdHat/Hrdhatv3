import TaskHazardModule from "@/modules/TaskHazardModule";
import GenericModuleRenderer from "@/modules/GenericModuleRenderer";

// Define valid renderer keys as a type
export type RendererKey = "TaskHazardModule" | "GenericModuleRenderer";

// Registry of available renderers
export const rendererRegistry: Record<RendererKey, React.ComponentType<any>> = {
  TaskHazardModule,
  GenericModuleRenderer,
};

// Helper to validate renderer key
export function validateRendererKey(key: string): key is RendererKey {
  return key in rendererRegistry;
}

// Helper to get renderer with fallback
export function getRenderer(key: string): React.ComponentType<any> {
  if (!validateRendererKey(key)) {
    console.error(
      `Unknown renderer key: ${key}. Falling back to GenericModuleRenderer`
    );
    return GenericModuleRenderer;
  }
  return rendererRegistry[key];
}

// Type guard for module with renderer key
export interface ModuleWithRenderer {
  renderer_key: RendererKey;
  [key: string]: any;
}

export function hasValidRenderer(module: any): module is ModuleWithRenderer {
  return module?.renderer_key && validateRendererKey(module.renderer_key);
}
