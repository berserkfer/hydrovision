export default function Loading() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-slate-50"
      role="status"
      aria-live="polite"
      aria-label="Cargando HydroVision"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
      <p className="text-sm text-slate-500">Cargando…</p>
    </div>
  );
}
