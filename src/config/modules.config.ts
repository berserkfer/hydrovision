/** Estado de módulos externos — visible en dashboard sin conectar servicios reales */

export const geeModuleConfig = {
  connected: false,
  message: "Google Earth Engine no conectado. Usando índices simulados.",
  phase: 4,
} as const;

export const aiModuleConfig = {
  enabled: false,
  message: "Modelo IA pendiente de entrenamiento con datos reales.",
  plannedVersion: "hv-risk-v1.0",
  phase: 6,
} as const;

export const reportsModuleConfig = {
  enabled: false,
  message: "Exportación PDF disponible en Fase 5.",
  phase: 5,
} as const;
