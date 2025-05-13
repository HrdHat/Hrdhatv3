import React from "react";

interface ToastProps {
  message: string;
  type?: "info" | "error" | "success";
  onClose: () => void;
}

const typeStyles = {
  info: {
    background: "#2196f3",
    color: "#fff"
  },
  error: {
    background: "#f44336",
    color: "#fff"
  },
  success: {
    background: "#4caf50",
    color: "#fff"
  }
};

export const Toast: React.FC<ToastProps> = ({ message, type = "info", onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      padding: "12px 24px",
      borderRadius: 4,
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      zIndex: 1000,
      ...typeStyles[type]
    }}>
      {message}
      <button onClick={onClose} style={{
        marginLeft: 16,
        background: "transparent",
        border: "none",
        color: "#fff",
        fontWeight: "bold",
        cursor: "pointer"
      }}>×</button>
    </div>
  );
}; 