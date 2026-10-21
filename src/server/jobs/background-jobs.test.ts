import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getJobState, getLatestResult, startJob, waitForJob } from "./background-jobs";
import { dataPath, readJson, writeJson } from "@/server/storage/file-store";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "hv-jobs-"));
  vi.stubEnv("HV_DATA_DIR", dir);
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });
});

describe("almacén en archivos", () => {
  it("escribe y lee JSON; rechaza rutas fuera del directorio", async () => {
    await writeJson("a/b.json", { ok: 1 });
    expect(await readJson("a/b.json", null)).toEqual({ ok: 1 });
    expect(await readJson("no-existe.json", "def")).toBe("def");
    expect(() => dataPath("../fuera.json")).toThrow(/fuera/);
  });
});

describe("trabajos en segundo plano", () => {
  it("sin cálculo previo: estado idle y sin resultado (no calcula al leer)", async () => {
    expect((await getJobState("demo")).status).toBe("idle");
    expect(await getLatestResult("demo")).toBeNull();
  });

  it("corre sin bloquear, guarda el resultado y el progreso", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const { started, state } = await startJob("demo", async (report) => {
      report({ done: 1, total: 2, message: "mitad" });
      await gate;
      return { filas: 3 };
    });
    expect(started).toBe(true);
    expect(state.status).toBe("running");

    // Mientras corre, un segundo pedido no lanza otro trabajo.
    expect((await startJob("demo", async () => ({ filas: 0 }))).started).toBe(false);

    release();
    await waitForJob("demo");
    const latest = await getLatestResult<{ filas: number }>("demo");
    expect(latest?.result).toEqual({ filas: 3 });
    expect((await getJobState("demo")).status).toBe("done");
  });

  it("un fallo queda registrado y no borra el último resultado correcto", async () => {
    await startJob("demo", async () => ({ v: 1 }));
    await waitForJob("demo");
    await startJob("demo", async () => {
      throw new Error("Planetary no respondió");
    });
    await waitForJob("demo");
    const state = await getJobState("demo");
    expect(state.status).toBe("failed");
    expect(state.error).toMatch(/Planetary/);
    expect((await getLatestResult<{ v: number }>("demo"))?.result).toEqual({ v: 1 });
  });

  it("un trabajo 'running' que este proceso no ejecuta se informa como interrumpido", async () => {
    await writeJson("jobs/huerfano/status.json", {
      type: "huerfano",
      id: "x",
      status: "running",
      startedAt: new Date().toISOString(),
      finishedAt: null,
      error: null,
      progress: null,
      requestedBy: null,
    });
    expect((await getJobState("huerfano")).status).toBe("interrupted");
  });
});
