/** Opciones de clima para registro de muestreo en campo */
export const CLIMA_OPTIONS = [
  { value: "soleado", label: "Soleado" },
  { value: "parcialmente_nublado", label: "Parcialmente nublado" },
  { value: "nublado", label: "Nublado" },
  { value: "lluvia_ligera", label: "Lluvia ligera" },
  { value: "lluvia_intensa", label: "Lluvia intensa" },
] as const;

/** Escala de color aparente del agua (campo visual) */
export const COLOR_APARENTE_OPTIONS = [
  { value: "incoloro", label: "Incoloro" },
  { value: "verde_claro", label: "Verde claro" },
  { value: "verde", label: "Verde" },
  { value: "marron_claro", label: "Marrón claro" },
  { value: "marron", label: "Marrón" },
  { value: "turquesa", label: "Turquesa" },
] as const;

export type ClimaValue = (typeof CLIMA_OPTIONS)[number]["value"];
export type ColorAparenteValue = (typeof COLOR_APARENTE_OPTIONS)[number]["value"];

/** Etiquetas legibles */
export const CLIMA_LABELS: Record<string, string> = Object.fromEntries(
  CLIMA_OPTIONS.map((o) => [o.value, o.label])
);

export const COLOR_APARENTE_LABELS: Record<string, string> = Object.fromEntries(
  COLOR_APARENTE_OPTIONS.map((o) => [o.value, o.label])
);
