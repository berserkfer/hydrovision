"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { HydroVisionMark } from "@/components/layout/Sidebar";
import { InkFlow } from "@/components/ui/InkFlow";

/** Solo rutas internas: evita redirecciones abiertas a otros dominios. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        window.location.assign(safeNext(searchParams.get("next")));
        return;
      }
      const body = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      setError(body?.error?.message ?? "No se pudo iniciar sesión.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          maskImage: "linear-gradient(to right, transparent 15%, #000 70%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 15%, #000 70%)",
        }}
      >
        <InkFlow seed={2027} density={0.8} outlet={{ x: 0.78, y: 0.4 }} />
      </div>

      <section className="w-full max-w-[380px] rounded-[6px] border border-[var(--hv-border)] bg-[var(--hv-surface)] p-7">
        <div className="flex flex-col items-center gap-2 text-[var(--hv-ink)]">
          <HydroVisionMark className="h-11 w-11" />
          <p className="text-[12px] font-medium tracking-[0.42em]">HYDROVISION</p>
          <p className="text-[11px] tracking-[0.06em] text-[var(--hv-foreground-muted)]">
            Dren 4000 · Santa Rosa, Lambayeque
          </p>
        </div>

        <h1 className="mt-7 text-[24px] font-light tracking-[-0.02em] text-[var(--hv-ink)]">
          Iniciar sesión
        </h1>

        <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
          <label className="block">
            <span className="hv-eyebrow text-[9.5px]">Correo</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-[3px] border border-[var(--hv-border-subtle)] bg-[var(--hv-background)] px-3 py-2.5 text-[15px] text-[var(--hv-foreground)]"
            />
          </label>
          <label className="block">
            <span className="hv-eyebrow text-[9.5px]">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-[3px] border border-[var(--hv-border-subtle)] bg-[var(--hv-background)] px-3 py-2.5 text-[15px] text-[var(--hv-foreground)]"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-[3px] border border-red-500/35 bg-red-500/10 px-3 py-2 text-[13px] text-red-700 dark:text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="inline-flex w-full items-center justify-center gap-3 rounded-[3px] bg-[var(--hv-ink)] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--hv-primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Verificando…" : "Entrar"}
            {!submitting && <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />}
          </button>
        </form>

        <p className="mt-5 text-[11px] leading-relaxed text-[var(--hv-foreground-dim)]">
          Las cuentas las crea un administrador. Si no tiene acceso, pídalo al responsable del
          proyecto.
        </p>
      </section>
    </main>
  );
}
