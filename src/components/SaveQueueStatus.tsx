import React from "react";
import { useSaveQueue } from "../hooks/useSaveQueue";

export function SaveQueueStatus() {
  const { state, retryFailed, clearQueue } = useSaveQueue();

  if (state.queueLength === 0 && !state.lastError) {
    return null;
  }

  return (
    <div className="save-queue-status">
      {!state.isOnline && (
        <div className="offline-warning">
          <span className="icon">⚠️</span>
          <span>
            You are offline. Changes will be saved when you're back online.
          </span>
        </div>
      )}

      {state.queueLength > 0 && (
        <div className="queue-info">
          <span className="icon">💾</span>
          <span>
            {state.queueLength} change{state.queueLength !== 1 ? "s" : ""}{" "}
            pending
          </span>
          {state.isOnline && (
            <button onClick={retryFailed} className="retry-button">
              Retry Now
            </button>
          )}
        </div>
      )}

      {state.lastError && (
        <div className="error-info">
          <span className="icon">❌</span>
          <span>Failed to save some changes</span>
          <button onClick={retryFailed} className="retry-button">
            Retry Failed
          </button>
          <button onClick={clearQueue} className="clear-button">
            Clear Queue
          </button>
        </div>
      )}
    </div>
  );
}
