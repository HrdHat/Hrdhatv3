import React from "react";
import TaskHazardModule from "./TaskHazardModule";
import GenericModuleRenderer from "./GenericModuleRenderer";
import SignatureModule from "./SignatureModule";
import FlraHeaderModule from "./formmodules/FlraHeaderModule";
import FlraPhotosModule from "./formmodules/FlraPhotosModule";
import SignaturesModule from "./formmodules/SignaturesModule";

// Define valid renderer keys as a type
export type RendererKey =
  | "TaskHazardModule"
  | "GenericModuleRenderer"
  | "SignatureModule"
  | "FormInstanceModule"
  | "FlraHeaderModule"
  | "PhotoModuleRenderer"
  | "SignatureModuleRenderer";

// Registry of available renderers
export const rendererRegistry: Record<RendererKey, React.ComponentType<any>> = {
  TaskHazardModule,
  GenericModuleRenderer,
  SignatureModule,
  FormInstanceModule: FlraHeaderModule,
  FlraHeaderModule,
  PhotoModuleRenderer: FlraPhotosModule,
  SignatureModuleRenderer: SignaturesModule,
};

// Logging helper with consistent prefix
const log = {
  info: (message: string) => console.info(`[RendererRegistry] ${message}`),
  warn: (message: string) => console.warn(`[RendererRegistry] ${message}`),
};