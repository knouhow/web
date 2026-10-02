"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Toast, ToastViewport, type ToastVariant } from "@/components/ui/toast";
import { Toast as ToastPrimitive } from "radix-ui";

interface ToastInput {
  title: string;
  description?: string;
}

interface ToastItem extends ToastInput {
  id: number;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (variant: ToastVariant, input: ToastInput) => void;
  success: (input: ToastInput) => void;
  error: (input: ToastInput) => void;
  info: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function AppToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((variant: ToastVariant, input: ToastInput) => {
    const nextToast: ToastItem = {
      ...input,
      id: nextId.current++,
      variant,
    };
    setToasts((current) => [...current.slice(-2), nextToast]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (input) => toast("success", input),
      error: (input) => toast("error", input),
      info: (input) => toast("info", input),
    }),
    [toast],
  );

  return (
    <ToastPrimitive.Provider label="알림" swipeDirection="right">
      <ToastContext.Provider value={value}>
        {children}
        {toasts.map((item) => (
          <Toast
            key={item.id}
            variant={item.variant}
            title={item.title}
            description={item.description}
            onOpenChange={(open) => {
              if (!open) dismiss(item.id);
            }}
          />
        ))}
        <ToastViewport />
      </ToastContext.Provider>
    </ToastPrimitive.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("AppToastProvider가 필요합니다.");
  return context;
}
