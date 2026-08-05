/** Configuración global de la aplicación HydroVision */
export const appConfig = {
  name: "HydroVision",
  description: "Plataforma de monitoreo de calidad del agua — Río Reque, Perú",
  timezone: "America/Lima",
  mockDataVersion: "3.4.0",
} as const;

export const SIMULATION_DISCLAIMER =
  "Los datos mostrados son simulados para desarrollo. No representan mediciones reales del río Reque.";

export const MOCK_LAST_UPDATE = "2025-06-15T10:00:00-05:00";
