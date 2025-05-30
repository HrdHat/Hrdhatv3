import React from 'react';

export interface AutoSaveControlsProps {
  isEnabled: boolean;
  isPaused: boolean;
  pauseReason?: 'conflict' | 'offline' | 'manual' | 'error';
  isAutoSaving: boolean;
  queuedSaves: number;
  failedSaves: number;
  lastAutoSave?: Date;
  onToggleEnabled: () => void;
  onPause: () => void;
  onResume: () => void;
  onForceSave: () => void;
  onRetryFailed: () => void;
  className?: string;
}

export function AutoSaveControls({
  isEnabled,
  isPaused,
  pauseReason,
  isAutoSaving,
  queuedSaves,
  failedSaves,
  lastAutoSave,
  onToggleEnabled,
  onPause,
  onResume,
  onForceSave,
  onRetryFailed,
  className = '',
}: AutoSaveControlsProps) {
  
  return (
    <div className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border ${className}`}>
      {/* Auto-save toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleEnabled}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
            ${isEnabled ? 'bg-blue-600' : 'bg-gray-200'}
          `}
          role="switch"
          aria-checked={isEnabled}
          aria-label="Toggle auto-save"
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
        <span className="text-sm font-medium text-gray-700">
          Auto-save {isEnabled ? 'On' : 'Off'}
        </span>
      </div>

      {/* Status indicator */}
      {isEnabled && (
        <div className="flex items-center gap-2 text-sm">
          {isPaused ? (
            <div className="flex items-center gap-1 text-yellow-600">
              <span role="img" aria-label="paused">⏸️</span>
              <span>
                Paused {pauseReason ? `(${pauseReason})` : ''}
              </span>
            </div>
          ) : isAutoSaving ? (
            <div className="flex items-center gap-1 text-blue-600">
              <span role="img" aria-label="saving" className="animate-spin">🔄</span>
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <span role="img" aria-label="active">✅</span>
              <span>Active</span>
            </div>
          )}
        </div>
      )}

      {/* Queue status */}
      {isEnabled && (queuedSaves > 0 || failedSaves > 0) && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {queuedSaves > 0 && (
            <span>📋 {queuedSaves} queued</span>
          )}
          {failedSaves > 0 && (
            <span className="text-red-600">❌ {failedSaves} failed</span>
          )}
        </div>
      )}

      {/* Last save time */}
      {lastAutoSave && (
        <div className="text-sm text-gray-500">
          Last saved: {lastAutoSave.toLocaleTimeString()}
        </div>
      )}

      {/* Control buttons */}
      {isEnabled && (
        <div className="flex items-center gap-1 ml-auto">
          {isPaused ? (
            <button
              onClick={onResume}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              title="Resume auto-save"
            >
              ▶️ Resume
            </button>
          ) : (
            <button
              onClick={onPause}
              className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
              title="Pause auto-save"
            >
              ⏸️ Pause
            </button>
          )}
          
          <button
            onClick={onForceSave}
            disabled={isAutoSaving}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Force save now"
          >
            💾 Save Now
          </button>

          {failedSaves > 0 && (
            <button
              onClick={onRetryFailed}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              title="Retry failed saves"
            >
              🔄 Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default AutoSaveControls; 