/**
 * Catálogo de parámetros fisicoquímicos — Fase 5.0
 */

export type ParametroCodigoDb =
  | "ph"
  | "turbidity"
  | "conductivity"
  | "dissolved_oxygen"
  | "temperature"
  | "bod5"
  | "cod"
  | "coliforms"
  | "thermotolerant_coliforms"
  | "nitrates"
  | "phosphates"
  | "total_dissolved_solids"
  | "total_suspended_solids"
  | "flow_rate";

export interface ParametroCatalogEntry {
  id: string;
  codigo: ParametroCodigoDb;
  nombre: string;
  unidad: string;
  limiteEcaMin?: number;
  limiteEcaMax?: number;
  descripcion: string;
  domainField: keyof ParametroDomainFields;
}

export interface ParametroDomainFields {
  ph: number;
  turbidez: number;
  conductividad: number;
  oxigenoDisuelto: number;
  temperatura: number;
  dbo5: number;
  dqo: number;
  coliformes?: number;
  coliformesTermotolerantes?: number;
  nitratos?: number;
  fosfatos?: number;
  solidosDisueltosTotales: number;
  solidosSuspendidosTotales?: number;
  caudal: number;
}

export const PARAMETRO_CATALOG: ParametroCatalogEntry[] = [
  { id: "param-ph", codigo: "ph", nombre: "pH", unidad: "UPH", limiteEcaMin: 6.5, limiteEcaMax: 8.5, descripcion: "Potencial de hidrógeno", domainField: "ph" },
  { id: "param-turbidity", codigo: "turbidity", nombre: "Turbidez", unidad: "NTU", limiteEcaMax: 50, descripcion: "Turbidez aparente", domainField: "turbidez" },
  { id: "param-conductivity", codigo: "conductivity", nombre: "Conductividad", unidad: "µS/cm", limiteEcaMax: 2500, descripcion: "Conductividad eléctrica", domainField: "conductividad" },
  { id: "param-dissolved-oxygen", codigo: "dissolved_oxygen", nombre: "Oxígeno Disuelto", unidad: "mg/L", limiteEcaMin: 4, descripcion: "Oxígeno disuelto", domainField: "oxigenoDisuelto" },
  { id: "param-temperature", codigo: "temperature", nombre: "Temperatura", unidad: "°C", limiteEcaMax: 35, descripcion: "Temperatura del agua", domainField: "temperatura" },
  { id: "param-bod5", codigo: "bod5", nombre: "DBO5", unidad: "mg/L", limiteEcaMax: 15, descripcion: "Demanda bioquímica de oxígeno", domainField: "dbo5" },
  { id: "param-cod", codigo: "cod", nombre: "DQO", unidad: "mg/L", limiteEcaMax: 40, descripcion: "Demanda química de oxígeno", domainField: "dqo" },
  { id: "param-coliforms", codigo: "coliforms", nombre: "Coliformes Totales", unidad: "NMP/100mL", limiteEcaMax: 1000, descripcion: "Coliformes totales", domainField: "coliformes" },
  { id: "param-thermotolerant-coliforms", codigo: "thermotolerant_coliforms", nombre: "Coliformes Termotolerantes", unidad: "NMP/100mL", limiteEcaMax: 2000, descripcion: "Coliformes termotolerantes (fecales)", domainField: "coliformesTermotolerantes" },
  { id: "param-nitrates", codigo: "nitrates", nombre: "Nitratos", unidad: "mg/L", limiteEcaMax: 50, descripcion: "Nitratos como N", domainField: "nitratos" },
  { id: "param-phosphates", codigo: "phosphates", nombre: "Fosfatos", unidad: "mg/L", limiteEcaMax: 0.5, descripcion: "Fosfatos como P", domainField: "fosfatos" },
  { id: "param-tds", codigo: "total_dissolved_solids", nombre: "Sólidos Disueltos Totales (STD)", unidad: "mg/L", limiteEcaMax: 1500, descripcion: "Sólidos disueltos totales (STD) — sales y minerales disueltos, distinto de SST; no estimable desde Sentinel-2 ni desde foto, solo laboratorio/histórico", domainField: "solidosDisueltosTotales" },
  { id: "param-tss", codigo: "total_suspended_solids", nombre: "Sólidos Suspendidos Totales", unidad: "mg/L", descripcion: "Sólidos suspendidos totales (SST) — distinto de sólidos disueltos", domainField: "solidosSuspendidosTotales" },
  { id: "param-flow-rate", codigo: "flow_rate", nombre: "Caudal", unidad: "m³/s", descripcion: "Caudal instantáneo", domainField: "caudal" },
];

export const PARAMETRO_CATALOG_BY_FIELD = Object.fromEntries(
  PARAMETRO_CATALOG.map((entry) => [entry.domainField, entry])
) as Record<keyof ParametroDomainFields, ParametroCatalogEntry>;

export const PARAMETRO_CATALOG_BY_CODIGO = Object.fromEntries(
  PARAMETRO_CATALOG.map((entry) => [entry.codigo, entry])
) as Record<ParametroCodigoDb, ParametroCatalogEntry>;
