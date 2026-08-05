/**
 * Contrato de proveedor de tokens OAuth — Sprint 2
 */

import type { GeeAccessToken } from "../types/auth.types";

export interface ITokenProvider {
  getAccessToken(): Promise<GeeAccessToken>;
  refreshAccessToken(): Promise<GeeAccessToken>;
  isTokenValid(token: GeeAccessToken | null): boolean;
  revokeToken(): void;
}
