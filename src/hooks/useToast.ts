import { useCallback } from "react";

interface ToastOptions {
  type?: "success" | "error" | "warning" | "info";
  message: string;
}

export function useToast() {
  const showToast = useCallback((options: ToastOptions | string) => {
    const message = typeof options === "string" ? options : options.message;
    const type = typeof options === "string" ? "info" : options.type || "info";

    // TODO: Replace with actual toast implementation
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);

  return { showToast };
}
