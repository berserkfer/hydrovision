/**
 * Planificador de campañas — lógica pura.
 *
 * Sentinel-2 no publica una efeméride de pasadas futuras en el catálogo STAC.
 * Lo que sí se puede hacer, sin inventar, es observar el patrón reciente de
 * adquisiciones sobre el punto y proyectarlo con el ciclo de revisita.
 */

export interface OverpassProjectionOptions {
  /** Fecha de referencia en formato YYYY-MM-DD. */
  today: string;
  /** Horizonte en días hacia adelante. */
  horizonDays: number;
  /** Ciclo de revisita en días (Sentinel-2A/2B combinados ≈ 5). */
  cycleDays?: number;
  /** Máximo de días de historial a proyectar. */
  maxProjectionsPerDate?: number;
}

export interface ProjectedOverpass {
  date: string;
  /** Días desde hoy. */
  daysFromToday: number;
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/**
 * Proyecta pasadas futuras a partir de fechas de adquisición observadas.
 * Cada fecha histórica se avanza en múltiplos del ciclo hasta el horizonte.
 * Devuelve fechas únicas y ordenadas.
 */
export function projectFutureOverpasses(
  acquisitionDates: string[],
  options: OverpassProjectionOptions
): ProjectedOverpass[] {
  const cycle = options.cycleDays ?? 5;
  const horizon = options.horizonDays;
  const maxProjections = options.maxProjectionsPerDate ?? 12;

  const uniqueDates = [...new Set(acquisitionDates.map((d) => d.slice(0, 10)))];
  const projected = new Set<string>();

  for (const date of uniqueDates) {
    for (let step = 1; step <= maxProjections; step += 1) {
      const candidate = addDays(date, step * cycle);
      const offset = daysBetween(options.today, candidate);
      if (offset < 0) continue;
      if (offset > horizon) break;
      projected.add(candidate);
    }
  }

  return [...projected]
    .sort()
    .map((date) => ({ date, daysFromToday: daysBetween(options.today, date) }));
}

export type CloudSuitability = "good" | "acceptable" | "poor" | "unknown";

/** Clasifica la nubosidad pronosticada para decidir si vale la pena muestrear. */
export function classifyCloudCover(cloudPercent: number | null | undefined): CloudSuitability {
  if (cloudPercent === null || cloudPercent === undefined || !Number.isFinite(cloudPercent)) {
    return "unknown";
  }
  if (cloudPercent <= 20) return "good";
  if (cloudPercent <= 40) return "acceptable";
  return "poor";
}

export interface SamplingWindow {
  from: string;
  to: string;
}

/**
 * Ventana de muestreo alrededor de la pasada: la muestra debe caer dentro de
 * ±windowDays de la adquisición para que el par sea comparable.
 */
export function samplingWindow(date: string, windowDays = 3): SamplingWindow {
  return {
    from: addDays(date, -windowDays),
    to: addDays(date, windowDays),
  };
}

export interface OpportunityCandidate {
  date: string;
  daysFromToday: number;
  cloudCoverPercent: number | null;
  suitability: CloudSuitability;
  window: SamplingWindow;
  recommended: boolean;
}

/**
 * Combina una pasada proyectada con el pronóstico de nubosidad.
 * Recomendada si la nubosidad es buena o aceptable; sin pronóstico no se
 * recomienda, pero se muestra como "por confirmar".
 */
export function buildOpportunity(
  overpass: ProjectedOverpass,
  cloudCoverPercent: number | null,
  windowDays = 3
): OpportunityCandidate {
  const suitability = classifyCloudCover(cloudCoverPercent);
  return {
    date: overpass.date,
    daysFromToday: overpass.daysFromToday,
    cloudCoverPercent,
    suitability,
    window: samplingWindow(overpass.date, windowDays),
    recommended: suitability === "good" || suitability === "acceptable",
  };
}
