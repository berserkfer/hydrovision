"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} description={message}>
      <div className="px-5 pb-5">
        {variant === "danger" && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Esta acción no se puede deshacer.
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              variant === "danger"
                ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                : "rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
