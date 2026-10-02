/** Configuración global de la aplicación HydroVision */
export const appConfig = {
  name: "HydroVision",
  description: "Plataforma de monitoreo y predicción satelital de calidad del agua — Dren 4000, Perú",
  timezone: "America/Lima",
  mockDataVersion: "3.4.0",
} as const;

export const SIMULATION_DISCLAIMER =
  "Esta plataforma combina datos reales publicados (ej. Dren 4000, 2014) con datos simulados de demostración en otras cuencas. Cada estación indica explícitamente si su dato es real o simulado — verifique la etiqueta antes de interpretar un valor.";

export const MOCK_LAST_UPDATE = "2025-06-15T10:00:00-05:00";
