/**
 * Tipos del adaptador Copernicus — mismo shape que GeeSceneRecord/GeeReflectanceRecord
 * a propósito: permite reutilizar satellite-observation.builder.ts sin duplicar
 * el cálculo de índices espectrales (catálogo único en src/satellite/catalog/).
 */

import type { GeeReflectanceRecord, GeeReflectanceRequest, GeeSceneRecord, GeeSceneSearchRequest } from "@/server/gee/gee.adapter.types";

export type CopernicusSceneRecord = GeeSceneRecord;
export type CopernicusReflectanceRecord = GeeReflectanceRecord;
export type CopernicusSceneSearchRequest = GeeSceneSearchRequest;
export type CopernicusReflectanceRequest = GeeReflectanceRequest;

export interface CopernicusAdapterStatus {
  isConfigured: boolean;
  isLive: boolean;
  authMode: "simulated" | "oauth_client_credentials";
  message: string;
}
