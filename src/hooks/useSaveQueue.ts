import { useRef, useState, useCallback, useEffect } from "react";
import { useDebouncedSave } from "./useDebouncedSave";
import { SaveFormModuleDataParams } from "../types/formTypes";
import { useToast } from "./useToast";

const STORAGE_KEY = "flra_save_queue";

interface QueuedSave {
  id: string;
  params: SaveFormModuleDataParams<any>;
  timestamp: number;
  retryCount: number;
}

interface SaveQueueState {
  isOnline: boolean;
  queueLength: number;
  isProcessing: boolean;
  lastError: Error | null;
}

interface SaveQueueReturn {
  addToQueue: (params: SaveFormModuleDataParams<any>) => void;
  clearQueue: () => void;
  retryFailed: () => void;
  state: SaveQueueState;
}

export function useSaveQueue(): SaveQueueReturn {
  const [state, setState] = useState<SaveQueueState>({
    isOnline: navigator.onLine,
    queueLength: 0,
    isProcessing: false,
    lastError: null,
  });
  const queue = useRef<QueuedSave[]>([]);
  const { save } = useDebouncedSave();
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

  const saveQueueToStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.current));
    } catch (error) {
      console.error("Failed to save queue to localStorage:", error);
    }
  }, []);

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

  const processQueue = useCallback(async (): Promise<void> => {
    if (state.isProcessing || !state.isOnline || queue.current.length === 0) {
      return;
    }

    setState((prev) => ({ ...prev, isProcessing: true }));

    while (queue.current.length > 0 && state.isOnline) {
      const item = queue.current[0];

      try {
        await save(item.params);
        queue.current.shift(); // Remove processed item
        saveQueueToStorage(); // Save updated queue
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
          saveQueueToStorage(); // Save updated queue
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
  }, [state.isOnline, state.isProcessing, save, showToast, saveQueueToStorage]);

  const addToQueue = useCallback(
    (params: SaveFormModuleDataParams<any>): void => {
      const id = `${params.formId}_${params.moduleKey}_${Date.now()}`;
      const queuedSave: QueuedSave = {
        id,
        params,
        timestamp: Date.now(),
        retryCount: 0,
      };

      queue.current.push(queuedSave);
      saveQueueToStorage(); // Save updated queue
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
    [state.isOnline, processQueue, showToast, saveQueueToStorage]
  );

  const clearQueue = useCallback((): void => {
    queue.current = [];
    saveQueueToStorage(); // Save empty queue
    setState((prev) => ({
      ...prev,
      queueLength: 0,
      lastError: null,
    }));
  }, [saveQueueToStorage]);

  const retryFailed = useCallback((): void => {
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
