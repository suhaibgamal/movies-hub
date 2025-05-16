// Inspired by react-hot-toast library
import * as React from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const ToastContext = React.createContext(undefined);

function useToastProvider() {
  const [toasts, setToasts] = React.useState([]);

  const toast = React.useCallback((props) => {
    const id = genId();
    const update = (props) =>
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...props } : t))
      );
    const dismiss = () => dismissToast(id);

    setToasts((prev) => [
      { ...props, id, open: true, onOpenChange: (open) => !open && dismiss() },
      ...prev.slice(0, TOAST_LIMIT - 1),
    ]);

    return {
      id: id,
      dismiss,
      update,
    };
  }, []);

  const dismissToast = React.useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  React.useEffect(() => {
    const timers = new Map();
    toasts.forEach((t) => {
      if (t.duration && !timers.has(t.id)) {
        const timer = setTimeout(() => dismissToast(t.id), t.duration);
        timers.set(t.id, timer);
      }
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, dismissToast]);

  return {
    toasts,
    toast,
    dismiss: dismissToast,
  };
}

const useToast = () => {
  const context = React.useContext(ToastContext);

  if (context === undefined) {
    throw new Error("useToast must be used within a Toaster provider");
  }

  return context;
};

export { useToast, ToastContext, useToastProvider };
