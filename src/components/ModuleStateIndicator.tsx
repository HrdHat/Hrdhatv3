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

      <style jsx>{`
        .module-state-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 1.2em;
          padding: 4px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.9);
        }

        .saving-indicator {
          animation: pulse 1.5s infinite;
        }

        .dirty-indicator {
          color: #f59e0b;
        }

        .error-indicator {
          color: #ef4444;
        }

        .last-saved-indicator {
          color: #10b981;
        }

        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
