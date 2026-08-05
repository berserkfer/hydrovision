/**
 * SystemStatusService — diagnóstico agregado (Sprint 2)
 */

import { databaseConfig, isDatabaseConfigured } from "@/config/database.config";
import { dataSourceConfig } from "@/config/data-source.config";
import type { EarthEngineAuthService } from "../auth/services/earth-engine-auth.service";
import type { GeeCredentialsRepository } from "../auth/repositories/gee-credentials.repository";
import type { IGEEProvider } from "../interfaces";
import type {
  AuthSemaphoreStatus,
  SystemStatusSection,
  SystemStatusSnapshot,
} from "../auth/types/auth.types";

export class SystemStatusService {
  constructor(
    private readonly authService: EarthEngineAuthService,
    private readonly credentialsRepository: GeeCredentialsRepository,
    private readonly geeProvider: IGEEProvider
  ) {}

  getSnapshot(): SystemStatusSnapshot {
    const authStatus = this.authService.getStatus();
    const envValidation = this.credentialsRepository.validateEnvironment();
    const providerStatus = this.geeProvider.getStatus();
    const checkedAt = new Date().toISOString();

    const sections: SystemStatusSection[] = [
      this.buildSystemSection(),
      this.buildDatabaseSection(),
      this.buildGeeSection(authStatus),
      this.buildVariablesSection(envValidation),
      this.buildProviderSection(providerStatus),
      this.buildConfigurationSection(authStatus, envValidation.isValid),
    ];

    const overall = this.resolveOverall(sections);

    return {
      overall,
      checkedAt,
      sections,
      configurationValid: envValidation.isValid && authStatus.isConfigured,
    };
  }

  private buildSystemSection(): SystemStatusSection {
    return {
      id: "system",
      label: "Estado del sistema",
      status: "green",
      message: "HydroVision operativo en modo simulado",
      details: [
        `Entorno: ${process.env.NODE_ENV ?? "development"}`,
        `Origen de datos: ${dataSourceConfig.source}`,
        `Versión schema: ${dataSourceConfig.schemaVersion}`,
      ],
    };
  }

  private buildDatabaseSection(): SystemStatusSection {
    const configured = isDatabaseConfigured();
    const enabled = databaseConfig.isDatabaseEnabled;

    if (enabled && configured) {
      return {
        id: "postgresql",
        label: "Estado de PostgreSQL",
        status: "yellow",
        message: "PostgreSQL configurado — conexión simulada en Sprint 2",
        details: [
          "DATABASE_URL detectada",
          "Verificación real pendiente (Prisma verifyConnection en Sprint 3)",
        ],
      };
    }

    if (enabled && !configured) {
      return {
        id: "postgresql",
        label: "Estado de PostgreSQL",
        status: "red",
        message: "DATA_SOURCE=database pero DATABASE_URL no configurada",
        details: ["Configure DATABASE_URL en .env"],
      };
    }

    return {
      id: "postgresql",
      label: "Estado de PostgreSQL",
      status: "green",
      message: "Modo mock activo — PostgreSQL no requerido",
      details: ["DATA_SOURCE=mock"],
    };
  }

  private buildGeeSection(
    authStatus: ReturnType<EarthEngineAuthService["getStatus"]>
  ): SystemStatusSection {
    let status: AuthSemaphoreStatus = "red";
    if (authStatus.isConfigured && authStatus.isInitialized) status = "green";
    else if (authStatus.isConfigured) status = "yellow";

    return {
      id: "gee",
      label: "Estado de Google Earth Engine",
      status,
      message: authStatus.isInitialized
        ? "Autenticación inicializada (simulada)"
        : authStatus.isConfigured
          ? "Configuración detectada — pendiente inicializar"
          : "Credenciales incompletas o inválidas",
      details: [
        `Modo auth: ${authStatus.authMode}`,
        authStatus.configurationMessage,
      ],
    };
  }

  private buildVariablesSection(
    envValidation: ReturnType<GeeCredentialsRepository["validateEnvironment"]>
  ): SystemStatusSection {
    return {
      id: "variables",
      label: "Estado de Variables",
      status: envValidation.isValid ? "green" : "red",
      message: envValidation.message,
      details: envValidation.isValid
        ? this.credentialsRepository.getRequiredEnvKeys().map((key) => `${key}: definida`)
        : envValidation.missingVariables.map((key) => `${key}: faltante`),
    };
  }

  private buildProviderSection(
    providerStatus: ReturnType<IGEEProvider["getStatus"]>
  ): SystemStatusSection {
    return {
      id: "provider",
      label: "Estado del Provider",
      status: providerStatus.isAvailable ? "green" : "red",
      message: providerStatus.message,
      details: [
        `ID: ${providerStatus.id}`,
        `Modo: ${providerStatus.mode}`,
        `Configurado: ${providerStatus.isConfigured ? "sí" : "no"}`,
      ],
    };
  }

  private buildConfigurationSection(
    authStatus: ReturnType<EarthEngineAuthService["getStatus"]>,
    envValid: boolean
  ): SystemStatusSection {
    const status: AuthSemaphoreStatus =
      envValid && authStatus.isConfigured ? "green" : envValid ? "yellow" : "red";

    return {
      id: "configuration",
      label: "Estado de Configuración",
      status,
      message: authStatus.configurationMessage,
      details: authStatus.isConfigured
        ? ["Todas las variables obligatorias presentes", "Formato de credenciales válido"]
        : ["Complete GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_PROJECT_ID, GOOGLE_EARTH_ENGINE_PROJECT"],
    };
  }

  private resolveOverall(sections: SystemStatusSection[]): AuthSemaphoreStatus {
    if (sections.some((section) => section.status === "red")) return "red";
    if (sections.some((section) => section.status === "yellow")) return "yellow";
    return "green";
  }
}
