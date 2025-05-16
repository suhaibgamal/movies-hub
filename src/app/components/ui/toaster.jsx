"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as ShadcnToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/app/components/ui/toast";
import {
  useToast,
  ToastContext,
  useToastProvider,
} from "@/app/components/ui/use-toast";
import * as React from "react";

export function Toaster() {
  const toastContextValue = useToastProvider();

  return (
    <ToastContext.Provider value={toastContextValue}>
      <ShadcnToastProvider>
        {toastContextValue.toasts.map(function ({
          id,
          title,
          description,
          action,
          ...props
        }) {
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
      </ShadcnToastProvider>
    </ToastContext.Provider>
  );
}
