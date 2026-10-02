/**
 * Escala cualitativa genérica de literatura para NDVI (vigor de vegetación terrestre).
 * NO está calibrada para las etapas fenológicas del arroz en Lambayeque — es una
 * interpretación general del índice, no un modelo agronómico específico de este cultivo.
 */

export type NdviVigorLevel = "sin_vegetacion" | "dispersa" | "moderada" | "densa" | "muy_densa";

export interface NdviVigorInterpretation {
  level: NdviVigorLevel;
  label: string;
}

export function interpretNdviVigor(ndvi: number): NdviVigorInterpretation {
  if (ndvi < 0.2) return { level: "sin_vegetacion", label: "Suelo desnudo / sin vegetación activa" };
  if (ndvi < 0.4) return { level: "dispersa", label: "Vegetación dispersa o en estrés" };
  if (ndvi < 0.6) return { level: "moderada", label: "Vegetación moderada" };
  if (ndvi < 0.8) return { level: "densa", label: "Vegetación densa y saludable" };
  return { level: "muy_densa", label: "Vegetación muy densa" };
}
