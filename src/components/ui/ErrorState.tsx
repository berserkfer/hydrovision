import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "No se pudo cargar la información",
  message = "Verifique su conexión e intente nuevamente.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-red-100 bg-red-50/50 px-6 py-12 text-center",
        className
      )}
    >
      <AlertTriangle className="h-8 w-8 text-red-500" />
      <div>
        <p className="text-sm font-semibold text-red-800">{title}</p>
        <p className="mt-1 text-sm text-red-700">{message}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
