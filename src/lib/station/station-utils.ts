import type { ParameterDisplayConfig, StationDetail, StationHistoryEntry } from "@/types/station";
import type { StationSummary } from "@/types";
import type { RiverContext } from "@/types/geography";
import { getComplianceLabel, classifyMeasurement } from "@/lib/eca/classifier";
import { getDataStore } from "@/data/store-access";
import { parametrosToFieldMeasurement } from "@/lib/adapters/legacy-adapter";

/** Genera TDS simulado a partir de conductividad (aprox. 0.65 × µS/cm) — SOLO para ríos de demo */
export function estimateTDS(conductivity: number): number {
  return Number((conductivity * 0.65).toFixed(1));
}

/** Genera caudal simulado (m³/s) según índice de estación — SOLO para ríos de demo */
export function estimateFlowRate(stationIndex: number): number {
  return Number((2.5 + stationIndex * 1.8 + (stationIndex % 2) * 0.5).toFixed(2));
}

/** Calcula porcentaje para barra de progreso normalizado */
export function normalizeParameter(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

/** Color de barra según proximidad al límite */
export function getProgressColor(percent: number): string {
  if (percent >= 85) return "bg-red-500";
  if (percent >= 65) return "bg-amber-500";
  return "bg-emerald-500";
}

/** Construye serie de tendencia SIMULADA (6 puntos) — solo para ríos de demo */
export function buildSparklineTrend(base: number, variance: number): number[] {
  return Array.from({ length: 6 }, (_, i) =>
    Number((base + (i - 2.5) * variance * 0.4 + (i % 2) * variance * 0.15).toFixed(2))
  );
}

/**
 * Serie temporal REAL de un parámetro a partir de las muestras reales de una estación
 * (orden cronológico). Con menos de 2 puntos reales, retorna un array vacío — nunca se
 * rellena con valores fabricados para completar el sparkline.
 */
function buildRealParameterTrend(
  domainEstacionId: string,
  field: keyof ReturnType<typeof parametrosToFieldMeasurement>
): number[] {
  const store = getDataStore();
  const muestras = [...store.muestras]
    .filter((m) => m.estacionId === domainEstacionId)
    .sort((a, b) => a.fechaMuestreo.localeCompare(b.fechaMuestreo));

  const values: number[] = [];
  for (const muestra of muestras) {
    const params = store.parametros.find((p) => p.muestraId === muestra.id);
    if (!params) continue;
    const measurement = parametrosToFieldMeasurement(params, muestra.fechaMuestreo);
    const value = measurement[field];
    if (typeof value === "number" && Number.isFinite(value)) values.push(value);
  }
  return values;
}

/** Historial SIMULADO por estación — solo para ríos de demo */
export function buildStationHistory(
  stationId: string,
  currentStatus: StationSummary["compliance"]["status"]
): StationHistoryEntry[] {
  const statuses: StationSummary["compliance"]["status"][] = [
    currentStatus,
    currentStatus === "compliant" ? "alert" : "compliant",
    "compliant",
    currentStatus,
    "alert",
  ];

  const observations = [
    "Muestreo de rutina completado.",
    "Incremento leve de turbidez observado.",
    "Condiciones normales en el tramo.",
    "Verificación de sensores in situ.",
    "Seguimiento post-evento de lluvia.",
  ];

  const dates = ["2025-06-15", "2025-06-01", "2025-05-15", "2025-05-01", "2025-04-15"];

  return dates.map((date, i) => ({
    date,
    status: statuses[i],
    observation: `[${stationId}] ${observations[i]}`,
  }));
}

/**
 * Historial REAL de una estación: todas sus muestras reales, más recientes primero,
 * con la clasificación ECA calculada sobre esa muestra específica y la observación real
 * registrada (incluye la cita de la fuente — ver dren-4000-real-data.ts).
 */
export function buildRealStationHistory(domainEstacionId: string): StationHistoryEntry[] {
  const store = getDataStore();
  const muestras = [...store.muestras]
    .filter((m) => m.estacionId === domainEstacionId)
    .sort((a, b) => b.fechaMuestreo.localeCompare(a.fechaMuestreo));

  return muestras.map((muestra) => {
    const params = store.parametros.find((p) => p.muestraId === muestra.id);
    const clasificacion = store.clasificaciones.find((c) => c.muestraId === muestra.id);
    const status = clasificacion
      ? (clasificacion.estado as StationSummary["compliance"]["status"])
      : params
        ? classifyMeasurement(parametrosToFieldMeasurement(params, muestra.fechaMuestreo)).status
        : "compliant";

    return {
      date: muestra.fechaMuestreo.slice(0, 10),
      status,
      observation: muestra.observaciones ?? "Muestreo real registrado.",
    };
  });
}

/**
 * Configura parámetros visuales para el panel de estación — SOLO incluye tarjetas para
 * valores realmente presentes (nunca rellena con 0 un parámetro no medido). Para estaciones
 * reales (isSimulated=false) usa la serie histórica real como sparkline; para las de demo,
 * conserva la serie sintética existente.
 */
export function buildParameterConfigs(
  measurement: StationDetail["measurement"],
  domainEstacionId?: string
): ParameterDisplayConfig[] {
  const isReal = !measurement.isSimulated && !!domainEstacionId;

  const trendFor = (
    field: keyof ReturnType<typeof parametrosToFieldMeasurement> | null,
    base: number,
    variance: number
  ): number[] => {
    if (!isReal) return buildSparklineTrend(base, variance);
    return field ? buildRealParameterTrend(domainEstacionId!, field) : [];
  };

  const configs: ParameterDisplayConfig[] = [];

  const push = (
    key: string,
    label: string,
    unit: string,
    value: number | undefined,
    min: number,
    max: number,
    icon: ParameterDisplayConfig["icon"],
    field: keyof ReturnType<typeof parametrosToFieldMeasurement> | null,
    variance: number
  ) => {
    if (value === undefined || !Number.isFinite(value)) return; // nunca fabricar un valor faltante
    configs.push({ key, label, unit, value, min, max, icon, trend: trendFor(field, value, variance) });
  };

  push("ph", "pH", "—", measurement.ph, 6, 9, "ph", "ph", 0.15);
  push("temperature", "Temperatura", "°C", measurement.temperature, 18, 32, "temperature", "temperature", 0.8);
  push("conductivity", "Conductividad", "µS/cm", measurement.conductivity, 0, 1500, "conductivity", "conductivity", 40);
  push("dissolvedOxygen", "Oxígeno disuelto", "mg/L", measurement.dissolvedOxygen, 0, 10, "oxygen", "dissolvedOxygen", 0.5);
  push("turbidity", "Turbidez", "NTU", measurement.turbidity, 0, 60, "turbidity", "turbidity", 3);
  push("tds", "Sólidos disueltos totales", "mg/L", measurement.totalDissolvedSolids, 0, 1000, "tds", "totalDissolvedSolids", 25);
  push("suspendedSolids", "Sólidos suspendidos totales", "mg/L", measurement.totalSuspendedSolids, 0, 100, "suspendedSolids", "totalSuspendedSolids", 5);
  push("bod5", "DBO5", "mg/L", measurement.bod5, 0, 900, "bod5", "bod5", 20);
  push("cod", "DQO", "mg/L", measurement.cod, 0, 1500, "bod5", "cod", 30);
  push("coliforms", "Coliformes totales", "NMP/100mL", measurement.coliforms, 0, 1_000_000, "coliforms", "coliforms", 1000);
  push(
    "thermotolerantColiforms",
    "Coliformes termotolerantes",
    "NMP/100mL",
    measurement.thermotolerantColiforms,
    0,
    1_000_000,
    "coliforms",
    "thermotolerantColiforms",
    1000
  );
  push("nitrates", "Nitratos", "mg/L", measurement.nitrates, 0, 50, "nutrients", "nitrates", 2);
  push("phosphates", "Fosfatos", "mg/L", measurement.phosphates, 0, 20, "nutrients", "phosphates", 1);
  push("flowRate", "Caudal", "m³/s", measurement.flowRate, 0, 20, "flow", null, 0.6);

  return configs;
}

/** Construye el detalle completo de estación para el panel lateral */
export function buildStationDetail(
  summary: StationSummary,
  riverContext: RiverContext,
  stationIndex: number,
  domainEstacionId?: string
): StationDetail {
  const m = summary.latestMeasurement;
  const isSimulated = m.isSimulated;

  const measurement = {
    ph: m.ph,
    temperature: m.temperature,
    conductivity: m.conductivity,
    dissolvedOxygen: m.dissolvedOxygen,
    turbidity: m.turbidity,
    // TDS estimado SOLO para ríos de demo — nunca se fabrica sobre datos reales.
    totalDissolvedSolids:
      isSimulated && m.conductivity !== undefined ? estimateTDS(m.conductivity) : m.totalDissolvedSolids,
    totalSuspendedSolids: m.totalSuspendedSolids,
    bod5: m.bod5,
    cod: m.cod,
    coliforms: m.coliforms,
    thermotolerantColiforms: m.thermotolerantColiforms,
    nitrates: m.nitrates,
    phosphates: m.phosphates,
    // Caudal estimado SOLO para ríos de demo — Dren 4000 no tiene medición real de caudal.
    flowRate: isSimulated ? estimateFlowRate(stationIndex) : undefined,
    sampledAt: m.sampledAt,
    isSimulated,
  };

  const geoStation = riverContext.river.stations[stationIndex];

  const entity = {
    code: summary.station.id,
    name: summary.station.name,
    latitude: summary.station.latitude,
    longitude: summary.station.longitude,
    altitude: geoStation?.altitude ?? 45,
    river: riverContext.river.name,
    watershed: riverContext.watershed.name,
    riverSegment: summary.station.riverSegment,
    installedAt: geoStation?.installedAt ?? "2022-03-15",
    operationalStatus: geoStation?.operationalStatus ?? "active",
    lastUpdatedAt: m.sampledAt,
    description: summary.station.description,
    isSimulated,
  };

  const history =
    !isSimulated && domainEstacionId
      ? buildRealStationHistory(domainEstacionId)
      : buildStationHistory(summary.station.id, summary.compliance.status);

  return {
    entity,
    measurement,
    compliance: summary.compliance,
    parameters: buildParameterConfigs(measurement, domainEstacionId),
    history,
    latestIndices: summary.latestIndices,
    domainId: domainEstacionId,
  };
}

export { getComplianceLabel };
