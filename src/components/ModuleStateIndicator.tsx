import React from "react";
import { ModuleKey } from "../types/formTypes";
import { useModuleState } from "../hooks/useModuleState";

interface ModuleStateIndicatorProps {
  moduleKey: ModuleKey;
  className?: string;
}

export function ModuleStateIndicator({
  moduleKey,
  className = "",
}: ModuleStateIndicatorProps) {
  const { getModuleState } = useModuleState();
  const state = getModuleState(moduleKey);

  if (!state.isDirty && !state.isSaving && !state.hasError) {
    return null;
  }

  return (
    <div className={`module-state-indicator ${className}`}>
      {state.isSaving && (
        <span className="saving-indicator" title="Saving...">
          💾
        </span>
      )}
      {state.isDirty && !state.isSaving && (
        <span className="dirty-indicator" title="Unsaved changes">
          ✏️
        </span>
      )}
      {state.hasError && (
        <span className="error-indicator" title={state.error || "Error"}>
          ❌
        </span>
      )}
      {state.lastSavedAt && (
        <span
          className="last-saved-indicator"
          title={`Last saved at ${new Date(
            state.lastSavedAt
          ).toLocaleString()}`}
        >
          ✓
        </span>
      )}
    </div>
  );
}
