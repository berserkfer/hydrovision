import Link from "next/link";
import { Droplets } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-600">
        <Droplets className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        El recurso solicitado no existe en HydroVision. Verifique la URL o regrese al dashboard.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
