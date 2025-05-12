import React from "react";
import { MissingRendererProps } from "@/types/modules";

export const MissingRenderer: React.FC<MissingRendererProps> = ({
  moduleName,
  rendererKey,
}) => {
  return (
    <div className="p-4 border-2 border-red-500 rounded bg-red-50">
      <h3 className="text-red-700 font-semibold">Missing Renderer</h3>
      <p className="text-red-600">Module: {moduleName}</p>
      {rendererKey && (
        <p className="text-red-600">Expected Renderer: {rendererKey}</p>
      )}
      <p className="text-sm text-red-500 mt-2">
        This module could not be rendered. Please check the console for details.
      </p>
    </div>
  );
};
