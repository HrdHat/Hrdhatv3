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

      <style jsx>{`
        .save-queue-status {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          padding: 12px 16px;
          z-index: 1000;
        }

        .offline-warning {
          color: #f59e0b;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .queue-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .error-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ef4444;
        }

        .icon {
          font-size: 1.2em;
        }

        .retry-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9em;
        }

        .retry-button:hover {
          background: #2563eb;
        }

        .clear-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9em;
          margin-left: 8px;
        }

        .clear-button:hover {
          background: #dc2626;
        }
      `}</style>
    </div>
  );
}
