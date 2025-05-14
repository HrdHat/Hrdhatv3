import React from "react";
import TaskHazardModule from "./TaskHazardModule";
import GenericModuleRenderer from "./GenericModuleRenderer";
import SignatureModule from "./SignatureModule";
import FlraHeaderModule from "./formmodules/FlraHeaderModule";

// Define valid renderer keys as a type
export type RendererKey =
  | "TaskHazardModule"
  | "GenericModuleRenderer"
  | "SignatureModule"
  | "FlraHeaderModule";

// Registry of available renderers
export const rendererRegistry: Record<RendererKey, React.ComponentType<any>> = {
  TaskHazardModule,
  GenericModuleRenderer,
  SignatureModule,
  FlraHeaderModule,
};

// Logging helper with consistent prefix
const log = {
  info: (message: string) => console.info(`[RendererRegistry] ${message}`),
  warn: (message: string) => console.warn(`[RendererRegistry] ${message}`