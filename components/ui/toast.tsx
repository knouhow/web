"use client";

import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "cn";
import { Toast as ToastPrimitive } from "radix-ui";

const toastVariants = ["success", "error", "info"] as const;

type ToastVariant = (typeof toastVariants)[number];

interface ToastProps {
  variant: ToastVariant;
  title: string;
  description?: string;
  onOpenChange: (open: boolean) => void;
}

const variantStyles: Record<
  ToastVariant,
  { icon: typeof CircleCheck; container: string; iconContainer: string }
> = {
  success: {
    icon: CircleCheck,
    container: "border-primary/20 bg-primary/7",
    iconContainer: "bg-primary/12 text-primary",
  },
  error: {
    icon: CircleAlert,
    container: "border-destructive/20 bg-destructive/5",
    iconContainer: "bg-destructive/10 text-destructive",
  },
  info: {
    icon: Info,
    container: "border-sky-200 bg-sky-50",
    iconContainer: "bg-sky-100 text-sky-700",
  },
};

function Toast({ variant, title, description, onOpenChange }: ToastProps) {
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <ToastPrimitive.Root
      open
      duration={variant === "error" ? 6000 : 4000}
      onOpenChange={onOpenChange}
      className={cn(
        "pointer-events-auto grid w-full grid-cols-[auto_1fr_auto] gap-x-3 rounded-xl border p-4 shadow-lg outline-none transition-all data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-right-full",
        styles.container,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid size-6 place-items-center rounded-full",
          styles.iconContainer,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <ToastPrimitive.Title className="text-sm font-semibold">
          {title}
        </ToastPrimitive.Title>
        {description && (
          <ToastPrimitive.Description className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close
        aria-label="닫기"
        className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        <X className="size-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

function ToastViewport() {
  return (
    <ToastPrimitive.Viewport className="fixed top-20 right-4 z-60 grid w-[calc(100%-2rem)] max-w-sm gap-2 outline-none sm:right-6" />
  );
}

export { Toast, ToastViewport, toastVariants, type ToastVariant };
