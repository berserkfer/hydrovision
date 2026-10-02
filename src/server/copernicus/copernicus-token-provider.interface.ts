/**
 * Contrato de proveedor de tokens Copernicus — mirror de ITokenProvider (GEE).
 */

import type { CopernicusAccessToken } from "./copernicus-oauth.client";

export interface ITokenProviderLike {
  getAccessToken(): Promise<CopernicusAccessToken>;
  refreshAccessToken(): Promise<CopernicusAccessToken>;
  isTokenValid(token: CopernicusAccessToken | null): boolean;
  revokeToken(): void;
}
