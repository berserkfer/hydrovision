/**
 * OAuth2 JWT para Service Account Google — sin dependencias externas.
 */

import { createSign } from "node:crypto";
import { geeConfig, getGeePrivateKey } from "@/config/gee.config";

const TOKEN_URI = "https://oauth2.googleapis.com/token";
const EARTH_ENGINE_SCOPE = "https://www.googleapis.com/auth/earthengine";

export interface GoogleAccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

export function buildServiceAccountJwt(): string {
  const clientEmail = geeConfig.clientEmail;
  const privateKey = getGeePrivateKey();
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: EARTH_ENGINE_SCOPE,
      aud: TOKEN_URI,
      iat: now,
      exp: now + 3600,
    })
  );

  const unsigned = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(privateKey, "base64url");

  return `${unsigned}.${signature}`;
}

export async function exchangeServiceAccountJwtForAccessToken(
  jwt: string
): Promise<GoogleAccessTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  const response = await fetch(TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google OAuth token exchange failed (${response.status}): ${text}`);
  }

  return (await response.json()) as GoogleAccessTokenResponse;
}

export async function fetchGoogleAccessToken(): Promise<GoogleAccessTokenResponse> {
  const jwt = buildServiceAccountJwt();
  return exchangeServiceAccountJwtForAccessToken(jwt);
}
