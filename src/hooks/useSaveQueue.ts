import { useRef, useState, useCallback, useEffect } from "react";
import { useDebouncedSave } from "./useDebouncedSave";
import { SaveFieldsParams } from "../types/formTypes";
import { useToast } from "./useToast";

const STORAGE_KEY = "flra_save_queue";

interface QueuedSave {
  id: string;
  params: SaveFieldsParams<any>;
  timestamp: number;
  retryCount: number;
}

interface SaveQueueState {
  isOnline: boolean;
  queueLength: number;
  isProcessing: boolean;
  lastError: Error | null;
}

export function useSaveQueue() {
  const [state, setState] = useState<SaveQueueState>({
    isOnline: navigator.onLine,
    queueLength: 0,
    isProcessing: false,
    lastError: null,
  });
  const queue = useRef<QueuedSave[]>([]);
  const { save, status } = useDebouncedSave();
  const { showToast } = useToast();

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem(STORAGE_KEY);
      if (savedQueue) {
        queue.current = JSON.parse(savedQueue);
        setState((prev) => ({ ...prev, queueLength: queue.current.length }));
      }
    } catch (error) {
      console.error("Failed to load save queue from localStorage:", error);
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.current));
    } catch (error) {
      console.error("Failed to save queue to localStorage:", error);
    }
  }, [queue.current]);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      processQueue();
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const processQueue = useCallback(async () => {
    if (state.isProcessing || !state.isOnline || queue.current.length === 0) {
      return;
    }

    setState((prev) => ({ ...prev, isProcessing: true }));

    while (queue.current.length > 0 && state.isOnline) {
      const item = queue.current[0];

      try {
        await save(item.params);
        queue.current.shift(); // Remove processed item
        setState((prev) => ({
          ...prev,
          queueLength: queue.current.length,
          lastError: null,
        }));
      } catch (error) {
        // If save fails, increment retry count and move to end of queue
        item.retryCount++;
        queue.current.shift();

        if (item.retryCount < 3) {
          queue.current.push(item);
        } else {
          setState((prev) => ({
            ...prev,
            lastError: error as Error,
            queueLength: queue.current.length,
          }));
          showToast({
            type: "error",
            message:
              "Failed to save changes after multiple attempts. Please try again.",
          });
        }
        break; // Stop processing on first error
      }
    }

    setState((prev) => ({ ...prev, isProcessing: false }));
  }, [state.isOnline, state.isProcessing, save, showToast]);

  const addToQueue = useCallback(
    (params: SaveFieldsParams<any>) => {
      const id = `${params.moduleKey}_${Date.now()}`;
      const queuedSave: QueuedSave = {
        id,
        params,
        timestamp: Date.now(),
        retryCount: 0,
      };

      queue.current.push(queuedSave);
      setState((prev) => ({
        ...prev,
        queueLength: queue.current.length,
      }));

      if (state.isOnline) {
        processQueue();
      } else {
        showToast({
          type: "warning",
          message:
            "You are offline. Changes will be saved when you're back online.",
        });
      }
    },
    [state.isOnline, processQueue, showToast]
  );

  const clearQueue = useCallback(() => {
    queue.current = [];
    setState((prev) => ({
      ...prev,
      queueLength: 0,
      lastError: null,
    }));
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const retryFailed = useCallback(() => {
    if (state.isOnline) {
      processQueue();
    } else {
      showToast({
        type: "error",
        message: "Cannot retry while offline. Please check your connection.",
      });
    }
  }, [state.isOnline, processQueue, showToast]);

  return {
    addToQueue,
    clearQueue,
    retryFailed,
    state,
  };
}
