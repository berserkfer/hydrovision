"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[HydroVision]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/15 text-red-600">
        <AlertTriangle className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Error inesperado</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Ocurrió un problema al cargar esta vista. Puede reintentar o regresar al inicio.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
