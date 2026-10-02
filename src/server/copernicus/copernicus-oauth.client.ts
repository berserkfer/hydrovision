/**
 * Cliente OAuth2 Copernicus Data Space Ecosystem — grant client_credentials.
 * Sin JWT de service account (a diferencia de GEE): CDSE usa client_id/client_secret directos.
 */

import { copernicusConfig } from "@/config/copernicus.config";

export const COPERNICUS_TOKEN_URL =
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";

export interface CopernicusAccessToken {
  value: string;
  expiresAt: string;
  source: "simulated" | "copernicus_oauth";
}

interface TokenEndpointResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

/**
 * Intercambia client_id/client_secret por un access_token (grant client_credentials).
 * NO cachea — el cacheo vive en CopernicusTokenManager.
 */
export async function exchangeClientCredentialsForAccessToken(
  clientId: string,
  clientSecret: string
): Promise<CopernicusAccessToken> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(COPERNICUS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const payload = (await response.json().catch(() => ({}))) as TokenEndpointResponse;

  if (!response.ok || !payload.access_token) {
    const detail = payload.error_description ?? payload.error ?? (await safeText(response));
    throw new Error(
      `Copernicus OAuth token exchange falló (${response.status}): ${detail ?? "sin detalle"}`
    );
  }

  const expiresInSeconds = payload.expires_in ?? 600;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return {
    value: payload.access_token,
    expiresAt,
    source: "copernicus_oauth",
  };
}

async function safeText(response: Response): Promise<string | null> {
  try {
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Gestor de token con cache en memoria — refresca antes de expirar (margen 60s).
 * Fallback silencioso a token simulado si faltan credenciales o el intercambio falla,
 * igual que EarthEngineTokenManager: nunca lanza al caller, marca source: "simulated".
 */
export class CopernicusTokenManager {
  private cachedToken: CopernicusAccessToken | null = null;

  private isCachedTokenValid(): boolean {
    if (!this.cachedToken) return false;
    if (this.cachedToken.source === "simulated") return false;
    const expiresAtMs = Date.parse(this.cachedToken.expiresAt);
    return Number.isFinite(expiresAtMs) && expiresAtMs - Date.now() > 60_000;
  }

  private buildSimulatedToken(): CopernicusAccessToken {
    return {
      value: "simulated-copernicus-token",
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      source: "simulated",
    };
  }

  async getAccessToken(): Promise<CopernicusAccessToken> {
    if (this.isCachedTokenValid() && this.cachedToken) {
      return this.cachedToken;
    }
    return this.refreshAccessToken();
  }

  async refreshAccessToken(): Promise<CopernicusAccessToken> {
    const { clientId, clientSecret, integrationEnabled } = copernicusConfig;

    if (!integrationEnabled || !clientId || !clientSecret) {
      this.cachedToken = this.buildSimulatedToken();
      return this.cachedToken;
    }

    try {
      const token = await exchangeClientCredentialsForAccessToken(clientId, clientSecret);
      this.cachedToken = token;
      return token;
    } catch {
      this.cachedToken = this.buildSimulatedToken();
      return this.cachedToken;
    }
  }

  isTokenValid(token: CopernicusAccessToken | null): boolean {
    if (!token) return false;
    if (token.source === "simulated") return false;
    const expiresAtMs = Date.parse(token.expiresAt);
    return Number.isFinite(expiresAtMs) && expiresAtMs > Date.now();
  }

  revokeToken(): void {
    this.cachedToken = null;
  }
}

let copernicusTokenManagerSingleton: CopernicusTokenManager | null = null;

export function getCopernicusTokenManager(): CopernicusTokenManager {
  if (!copernicusTokenManagerSingleton) {
    copernicusTokenManagerSingleton = new CopernicusTokenManager();
  }
  return copernicusTokenManagerSingleton;
}

export function resetCopernicusTokenManagerForTests(): void {
  copernicusTokenManagerSingleton = null;
}

export interface CopernicusConnectionTestResult {
  success: boolean;
  simulated: boolean;
  message: string;
  testedAt: string;
  tokenPreview?: string;
  errors?: string[];
}

export async function testCopernicusConnection(): Promise<CopernicusConnectionTestResult> {
  const testedAt = new Date().toISOString();
  const manager = getCopernicusTokenManager();
  manager.revokeToken();

  try {
    const token = await manager.getAccessToken();
    if (token.source === "simulated") {
      return {
        success: false,
        simulated: true,
        message:
          "Copernicus no configurado o autenticación falló — operando en modo simulado. Verifique COPERNICUS_CLIENT_ID/SECRET.",
        testedAt,
      };
    }

    return {
      success: true,
      simulated: false,
      message: "✅ Conexión OAuth Copernicus Data Space Ecosystem exitosa.",
      testedAt,
      tokenPreview: `${token.value.slice(0, 12)}…`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      simulated: true,
      message,
      testedAt,
      errors: [message],
    };
  }
}
