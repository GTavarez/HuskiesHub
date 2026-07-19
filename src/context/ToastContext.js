import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const ToastContext = createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast) => {
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextToast = {
      id,
      type: toast.type || "info",
      message: toast.message || "",
      durationMs: toast.durationMs ?? 3000,
    };
    setToasts((prev) => [...prev, nextToast]);
    if (nextToast.durationMs > 0) {
      setTimeout(() => removeToast(id), nextToast.durationMs);
    }
  }, [removeToast]);

  const value = useMemo(
    () => ({ toasts, pushToast, removeToast }),
    [toasts, pushToast, removeToast]
  );

  return React.createElement(ToastContext.Provider, { value }, children);
};

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export { ToastProvider, useToast };
