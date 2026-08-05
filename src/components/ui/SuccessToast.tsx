"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  durationMs?: number;
}

export function SuccessToast({
  message,
  visible,
  onDismiss,
  durationMs = 4000,
}: SuccessToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [visible, onDismiss, durationMs]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200",
        "bg-emerald-50 px-4 py-3 shadow-lg shadow-emerald-900/10 hv-animate-fade-in"
      )}
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-emerald-900">Registro exitoso</p>
        <p className="mt-0.5 text-xs text-emerald-700">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded p-1 text-emerald-600 hover:bg-emerald-100"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
