/**
 * Configuración Copernicus Data Space Ecosystem (CDSE).
 * Autenticación OAuth2 client_credentials — sin JWT de service account (a diferencia de GEE).
 */

export const COPERNICUS_AUTH_ENV_KEYS = {
  clientId: "COPERNICUS_CLIENT_ID",
  clientSecret: "COPERNICUS_CLIENT_SECRET",
} as const;

export type CopernicusAuthEnvKey =
  (typeof COPERNICUS_AUTH_ENV_KEYS)[keyof typeof COPERNICUS_AUTH_ENV_KEYS];

export interface CopernicusConfigValidation {
  isValid: boolean;
  missingVariables: CopernicusAuthEnvKey[];
  errors: string[];
  warnings: string[];
  message: string;
}

function readEnv(key: string): string {
  return process.env[key]?.trim() ?? "";
}

export const copernicusConfig = {
  clientId: readEnv(COPERNICUS_AUTH_ENV_KEYS.clientId),
  clientSecret: readEnv(COPERNICUS_AUTH_ENV_KEYS.clientSecret),
  integrationEnabled: process.env.COPERNICUS_INTEGRATION_ENABLED !== "false",
} as const;

const FRIENDLY_LABELS: Record<CopernicusAuthEnvKey, string> = {
  COPERNICUS_CLIENT_ID: "Client ID de la aplicación OAuth registrada en Copernicus Data Space Ecosystem",
  COPERNICUS_CLIENT_SECRET: "Client Secret de la aplicación OAuth registrada en Copernicus Data Space Ecosystem",
};

export function validateCopernicusConfig(): CopernicusConfigValidation {
  const missingVariables: CopernicusAuthEnvKey[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!copernicusConfig.integrationEnabled) {
    warnings.push(
      "COPERNICUS_INTEGRATION_ENABLED=false. La autenticación permanecerá deshabilitada."
    );
  }

  for (const key of Object.values(COPERNICUS_AUTH_ENV_KEYS)) {
    if (!readEnv(key)) {
      missingVariables.push(key);
    }
  }

  if (missingVariables.length > 0) {
    errors.push(
      `Faltan ${missingVariables.length} variable(s) obligatoria(s) para autenticación Copernicus.`
    );

    for (const key of missingVariables) {
      errors.push(`• ${key}: ${FRIENDLY_LABELS[key]}`);
    }

    errors.push(
      "Complete las variables en .env y reinicie el servidor. El adaptador Copernicus permanecerá en modo simulado."
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

export function isCopernicusConfigured(): boolean {
  return validateCopernicusConfig().isValid;
}
