/**
 * Configuración Google Earth Engine — Sprint 2
 * Validación de credenciales Service Account (server-side).
 */

export const GEE_AUTH_ENV_KEYS = {
  clientEmail: "GOOGLE_CLIENT_EMAIL",
  privateKey: "GOOGLE_PRIVATE_KEY",
  googleProjectId: "GOOGLE_PROJECT_ID",
  earthEngineProject: "GOOGLE_EARTH_ENGINE_PROJECT",
} as const;

/** @deprecated Sprint 1 — mantener compatibilidad opcional */
export const GEE_LEGACY_ENV_KEYS = {
  serviceAccount: "GOOGLE_SERVICE_ACCOUNT",
} as const;

export type GeeAuthEnvKey = (typeof GEE_AUTH_ENV_KEYS)[keyof typeof GEE_AUTH_ENV_KEYS];

export interface GeeConfigValidation {
  isValid: boolean;
  missingVariables: GeeAuthEnvKey[];
  errors: string[];
  warnings: string[];
  message: string;
}

function readEnv(key: string): string {
  return process.env[key]?.trim() ?? "";
}

function normalizePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

export const geeConfig = {
  clientEmail: readEnv(GEE_AUTH_ENV_KEYS.clientEmail),
  googleProjectId: readEnv(GEE_AUTH_ENV_KEYS.googleProjectId),
  earthEngineProjectId: readEnv(GEE_AUTH_ENV_KEYS.earthEngineProject),
  serviceAccountLegacy: readEnv(GEE_LEGACY_ENV_KEYS.serviceAccount),
  integrationEnabled: process.env.GEE_INTEGRATION_ENABLED !== "false",
} as const;

const FRIENDLY_LABELS: Record<GeeAuthEnvKey, string> = {
  GOOGLE_CLIENT_EMAIL: "Correo de la cuenta de servicio (client_email del JSON)",
  GOOGLE_PRIVATE_KEY: "Clave privada PEM de la cuenta de servicio",
  GOOGLE_PROJECT_ID: "ID del proyecto Google Cloud",
  GOOGLE_EARTH_ENGINE_PROJECT: "ID del proyecto con Earth Engine habilitado",
};

/** Solo server-side — nunca exportar al cliente */
export function getGeePrivateKey(): string {
  return normalizePrivateKey(readEnv(GEE_AUTH_ENV_KEYS.privateKey));
}

export function hasGeePrivateKey(): boolean {
  return getGeePrivateKey().length > 0;
}

export function validateGeeConfig(): GeeConfigValidation {
  const missingVariables: GeeAuthEnvKey[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!geeConfig.integrationEnabled) {
    warnings.push(
      "GEE_INTEGRATION_ENABLED=false. La autenticación permanecerá deshabilitada."
    );
  }

  for (const key of Object.values(GEE_AUTH_ENV_KEYS)) {
    const value = key === GEE_AUTH_ENV_KEYS.privateKey ? getGeePrivateKey() : readEnv(key);
    if (!value) {
      missingVariables.push(key);
    }
  }

  if (missingVariables.length > 0) {
    errors.push(
      `Faltan ${missingVariables.length} variable(s) obligatoria(s) para autenticación GEE.`
    );

    for (const key of missingVariables) {
      errors.push(`• ${key}: ${FRIENDLY_LABELS[key]}`);
    }

    errors.push(
      "Complete las variables en .env y reinicie el servidor. El servicio de autenticación no se inicializará."
    );

    return {
      isValid: false,
      missingVariables,
      errors,
      warnings,
      message: "Configuración incompleta. Revise las variables de entorno.",
    };
  }

  return {
    isValid: true,
    missingVariables: [],
    errors: [],
    warnings,
    message: "✅ Configuración válida",
  };
}

export function isGeeConfigured(): boolean {
  return validateGeeConfig().isValid;
}

/** Compatibilidad Sprint 1 */
export const GEE_ENV_KEYS = {
  ...GEE_AUTH_ENV_KEYS,
  project: GEE_AUTH_ENV_KEYS.earthEngineProject,
  serviceAccount: GEE_LEGACY_ENV_KEYS.serviceAccount,
  privateKey: GEE_AUTH_ENV_KEYS.privateKey,
  clientEmail: GEE_AUTH_ENV_KEYS.clientEmail,
} as const;

export type GeeEnvKey = GeeAuthEnvKey | typeof GEE_LEGACY_ENV_KEYS.serviceAccount;
