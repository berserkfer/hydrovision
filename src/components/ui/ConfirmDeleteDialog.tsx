"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ConfirmDeleteDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  title = "Eliminar registro",
  description = "Esta acción marcará el registro como eliminado. ¿Desea continuar?",
  onConfirm,
  onCancel,
  loading,
}: ConfirmDeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title={title}
      message={description}
      confirmLabel={loading ? "Eliminando…" : "Eliminar"}
      cancelLabel="Cancelar"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
