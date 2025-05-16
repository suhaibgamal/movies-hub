"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/app/components/ui/toast";
import {
  useToast,
  ToastContext,
  useToastProvider,
} from "@/app/components/ui/use-toast"; // Ensure this path is correct
import * as React from "react";

export function Toaster() {
  const { toasts, ...toastContextValue } = useToastProvider(); // Get the full context value

  return (
    <ToastContext.Provider value={toastContextValue}>
      {" "}
      {/* Provide the context */}
      <ToastProvider>
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          );
        })}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}
