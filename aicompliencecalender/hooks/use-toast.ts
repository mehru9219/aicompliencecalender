/**
 * Toast hook for showing notifications.
 * A simple wrapper that can be enhanced with a toast library.
 */

"use client";

import { useState, useCallback } from "react";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).slice(2);
    const newToast: Toast = { ...options, id };

    setToasts((prev) => [...prev, newToast]);

    // Log to console for now (in production, would show UI toast)
    if (options.variant === "destructive") {
      console.error(`Toast: ${options.title} - ${options.description}`);
    } else {
      console.log(`Toast: ${options.title} - ${options.description}`);
    }

    // Auto-dismiss after duration
    const duration = options.duration || 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toast,
    toasts,
    dismiss,
  };
}
