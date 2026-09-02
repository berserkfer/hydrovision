/**
 * EarthEngineTokenManager — OAuth2 Service Account real cuando hay credenciales.
 */

import { isGeeConfigured } from "@/config/gee.config";
import { fetchGoogleAccessToken } from "@/server/gee/google-oauth.client";
import type { ITokenProvider } from "../interfaces";
import type { GeeAccessToken } from "../types/auth.types";

const TOKEN_TTL_MS = 55 * 60 * 1000;

export class EarthEngineTokenManager implements ITokenProvider {
  private cachedToken: GeeAccessToken | null = null;

  constructor(private readonly isAuthReady: () => boolean) {}

  async getAccessToken(): Promise<GeeAccessToken> {
    if (!this.isAuthReady()) {
      throw new Error(
        "EarthEngineAuthService no inicializado. Complete la configuración antes de solicitar tokens."
      );
    }

    if (this.isTokenValid(this.cachedToken)) {
      return this.cachedToken as GeeAccessToken;
    }

    return this.refreshAccessToken();
  }

  async refreshAccessToken(): Promise<GeeAccessToken> {
    if (!this.isAuthReady()) {
      throw new Error("No se puede refrescar token: servicio de autenticación no inicializado.");
    }

    if (isGeeConfigured()) {
      try {
        const response = await fetchGoogleAccessToken();
        const expiresAt = new Date(Date.now() + response.expires_in * 1000).toISOString();

        this.cachedToken = {
          value: response.access_token,
          expiresAt,
          source: "google_oauth",
        };

        return this.cachedToken;
      } catch (error) {
        console.warn("[EarthEngineTokenManager] OAuth real falló, usando token simulado:", error);
      }
    }

    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
    this.cachedToken = {
      value: `simulated-gee-token-${Date.now()}`,
      expiresAt,
      source: "simulated",
    };

    return this.cachedToken;
  }

  isTokenValid(token: GeeAccessToken | null): boolean {
    if (!token) return false;
    return new Date(token.expiresAt).getTime() > Date.now();
  }

  revokeToken(): void {
    this.cachedToken = null;
  }

  getCachedTokenSource(): GeeAccessToken["source"] | null {
    return this.cachedToken?.source ?? null;
  }
}
