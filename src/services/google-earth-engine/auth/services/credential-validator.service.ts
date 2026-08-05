/**
 * CredentialValidator — validación de formato de credenciales (Sprint 2)
 */

import type { CredentialValidationResult } from "../types/auth.types";
import type { GeeCredentialsRepository } from "../repositories/gee-credentials.repository";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROJECT_ID_PATTERN = /^[a-z][a-z0-9-]{4,62}[a-z0-9]$/;

export class CredentialValidator {
  constructor(private readonly credentialsRepository: GeeCredentialsRepository) {}

  validate(): CredentialValidationResult {
    const errors: string[] = [];

    const clientEmail = this.credentialsRepository.getClientEmail();
    const privateKey = this.credentialsRepository.getPrivateKey();
    const googleProjectId = this.credentialsRepository.getGoogleProjectId();
    const earthEngineProjectId = this.credentialsRepository.getEarthEngineProjectId();

    if (clientEmail && !EMAIL_PATTERN.test(clientEmail)) {
      errors.push("GOOGLE_CLIENT_EMAIL no tiene un formato de correo válido.");
    }

    if (clientEmail && !clientEmail.includes(".iam.gserviceaccount.com")) {
      errors.push(
        "GOOGLE_CLIENT_EMAIL debería ser una cuenta de servicio (*.iam.gserviceaccount.com)."
      );
    }

    if (privateKey && !privateKey.includes("BEGIN PRIVATE KEY")) {
      errors.push("GOOGLE_PRIVATE_KEY no parece una clave PEM válida.");
    }

    if (privateKey && !privateKey.includes("END PRIVATE KEY")) {
      errors.push("GOOGLE_PRIVATE_KEY está incompleta (falta END PRIVATE KEY).");
    }

    if (googleProjectId && !PROJECT_ID_PATTERN.test(googleProjectId)) {
      errors.push("GOOGLE_PROJECT_ID tiene un formato inválido para Google Cloud.");
    }

    if (earthEngineProjectId && !PROJECT_ID_PATTERN.test(earthEngineProjectId)) {
      errors.push("GOOGLE_EARTH_ENGINE_PROJECT tiene un formato inválido.");
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        message: "Las credenciales presentes no pasaron la validación de formato.",
      };
    }

    return {
      isValid: true,
      errors: [],
      message: "✅ Configuración válida",
    };
  }
}
