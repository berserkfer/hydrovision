/**
 * Trabajos pesados en segundo plano con resultado guardado.
 *
 * Las páginas leen el último resultado guardado (instantáneo) y muestran su fecha; el cálculo
 * solo se lanza a pedido (POST) y corre en el mismo proceso de Node sin bloquear la respuesta.
 * Un solo trabajo por tipo a la vez. Estado y resultado se guardan en el almacén de archivos:
 *   jobs/<tipo>/status.json   estado del último trabajo (y progreso)
 *   jobs/<tipo>/latest.json   último resultado correcto
 *
 * Requiere un servidor Node persistente (`next start` / `next dev`). En una plataforma sin
 * proceso persistente habría que mover esto a una cola externa.
 */

import { randomUUID } from "node:crypto";
import { readJson, writeJson } from "@/server/storage/file-store";

export type JobStatus = "idle" | "running" | "done" | "failed" | "interrupted";

export interface JobProgress {
  done: number;
  total: number;
  message?: string;
}

export interface JobState {
  type: string;
  id: string | null;
  status: JobStatus;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  progress: JobProgress | null;
  requestedBy: string | null;
}

export interface StoredResult<T> {
  jobId: string;
  computedAt: string;
  result: T;
}

const running = new Map<string, Promise<void>>();

function statusPath(type: string) {
  return `jobs/${type}/status.json`;
}
function latestPath(type: string) {
  return `jobs/${type}/latest.json`;
}

const IDLE = (type: string): JobState => ({
  type,
  id: null,
  status: "idle",
  startedAt: null,
  finishedAt: null,
  error: null,
  progress: null,
  requestedBy: null,
});

export async function getJobState(type: string): Promise<JobState> {
  const state = await readJson<JobState>(statusPath(type), IDLE(type));
  // Si quedó "running" pero este proceso no lo está ejecutando (reinicio del servidor), se
  // informa como interrumpido en vez de prometer un resultado que nunca llegará.
  if (state.status === "running" && !running.has(type)) {
    return { ...state, status: "interrupted", error: state.error ?? "El servidor se reinició durante el cálculo." };
  }
  return state;
}

export async function getLatestResult<T>(type: string): Promise<StoredResult<T> | null> {
  return readJson<StoredResult<T> | null>(latestPath(type), null);
}

export interface StartJobOptions {
  requestedBy?: string | null;
}

/**
 * Lanza el trabajo si no hay otro del mismo tipo corriendo. Devuelve el estado inmediatamente;
 * `runner` corre después sin bloquear al llamador.
 */
export async function startJob<T>(
  type: string,
  runner: (report: (progress: JobProgress) => void) => Promise<T>,
  options: StartJobOptions = {}
): Promise<{ started: boolean; state: JobState }> {
  if (running.has(type)) {
    return { started: false, state: await getJobState(type) };
  }

  const state: JobState = {
    type,
    id: randomUUID(),
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    error: null,
    progress: null,
    requestedBy: options.requestedBy ?? null,
  };
  await writeJson(statusPath(type), state);

  let lastWrite = 0;
  const report = (progress: JobProgress) => {
    state.progress = progress;
    const now = Date.now();
    if (now - lastWrite > 1000 || progress.done === progress.total) {
      lastWrite = now;
      void writeJson(statusPath(type), state).catch(() => {});
    }
  };

  const execution = (async () => {
    try {
      const result = await runner(report);
      const finishedAt = new Date().toISOString();
      await writeJson(latestPath(type), { jobId: state.id ?? "", computedAt: finishedAt, result } satisfies StoredResult<T>);
      Object.assign(state, { status: "done", finishedAt });
    } catch (error) {
      Object.assign(state, {
        status: "failed",
        finishedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      await writeJson(statusPath(type), state).catch(() => {});
      running.delete(type);
    }
  })();

  running.set(type, execution);
  return { started: true, state: { ...state } };
}

/** Solo para pruebas: espera a que termine el trabajo en curso de un tipo. */
export async function waitForJob(type: string): Promise<void> {
  await running.get(type);
}
