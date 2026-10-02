/**
 * Tipos del adaptador Planetary Computer — mismo shape que GeeSceneRecord/GeeReflectanceRecord
 * a propósito, para reutilizar satellite-observation.builder.ts sin duplicar el cálculo
 * de índices espectrales (catálogo único en src/satellite/catalog/).
 */

import type { GeeReflectanceRecord, GeeReflectanceRequest, GeeSceneRecord, GeeSceneSearchRequest } from "@/server/gee/gee.adapter.types";

export type PlanetarySceneRecord = GeeSceneRecord;
export type PlanetaryReflectanceRecord = GeeReflectanceRecord;
export type PlanetarySceneSearchRequest = GeeSceneSearchRequest;
export type PlanetaryReflectanceRequest = GeeReflectanceRequest;

export interface PlanetaryAdapterStatus {
  isConfigured: boolean;
  isLive: boolean;
  authMode: "public_no_auth";
  message: string;
}
