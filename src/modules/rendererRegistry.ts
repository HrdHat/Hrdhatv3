import React from "react";
import TaskHazardModule from "./TaskHazardModule";
import GenericModuleRenderer from "./GenericModuleRenderer";
import SignatureModule from "./SignatureModule";

// Define valid renderer keys as a type
export type RendererKey =
  | "TaskHazardModule"
  | "GenericModuleRenderer"
  | "SignatureModule";

// Registry of available renderers
export const rendererRegistry: Record<RendererKey, React.ComponentType<any>> = {
  TaskHazardModule,
  GenericModuleRenderer,
  SignatureModule,
};

// Logging helper with consistent prefix
const log = {
  info: (message: string) => console.info(`[RendererRegistry] ${message}`),
  warn: (message: string) => console.warn(`[RendererRegistry] ${message}`),
  error: (message: string) => console.error(`[RendererRegistry] ${message}`),
};

// Analytics tracking for fallbacks
const trackFallback = (reason: "missing" | "invalid", key?: string) => {
  if (import.meta.env.DEV) {
    log.warn(`Fallback triggered: ${reason}${key ? ` (key: ${key})` : ""}`);
  }
  // TODO: Add production analytics tracking here
  // Example: analytics.track('renderer_fallback', { reason, key });
};

// Helper to validate renderer key
export function validateRendererKey(key: string): key is RendererKey {
  return key in rendererRegistry;
}

// Helper to get renderer with fallback
export function getRenderer(
  key: string | undefined | null
): React.ComponentType<any> {
  if (key == null) {
    log.warn("Renderer key is missing. Falling back to GenericModuleRenderer");
    trackFallback("missing");
    return GenericModuleRenderer;
  }

  if (!validateRendererKey(key)) {
    log.error(
      `Invalid renderer key: "${key}". Falling back to GenericModuleRenderer`
    );
    trackFallback("invalid", key);
    return GenericModuleRenderer;
  }

  log.info(`Successfully resolved renderer: ${key}`);
  return rendererRegistry[key];
}

// Type guard for module with renderer key
export interface ModuleWithRenderer {
  renderer_key: RendererKey;
  [key: string]: any;
}

export function hasValidRenderer(module: any): module is ModuleWithRenderer {
  if (!module?.renderer_key) {
    log.warn("Module is missing renderer_key");
    return false;
  }
  if (!validateRendererKey(module.renderer_key)) {
    log.error(`Module has invalid renderer_key: "${module.renderer_key}"`);
    return false;
  }
  return true;
}
