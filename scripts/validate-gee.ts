#!/usr/bin/env tsx
/**
 * Validación Sprint 2 — autenticación GEE
 * Ejecutar: npm run test:gee
 */

import { printGeeHealthReport, runGeeHealthCheck } from "@/lib/gee";
import { getEarthEngineAuthService } from "@/services/google-earth-engine";

async function main() {
  const health = runGeeHealthCheck();
  console.log(printGeeHealthReport());
  console.log("");

  const authService = getEarthEngineAuthService();
  const envStatus = authService.getStatus();
  console.log(`Configuración: ${envStatus.configurationMessage}`);

  if (!envStatus.isConfigured) {
    console.log("⚠ Autenticación no inicializada — variables incompletas (esperado en dev mock).");
    process.exit(0);
  }

  try {
    await authService.initialize();
    console.log("✓ EarthEngineAuthService inicializado correctamente.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ No se pudo inicializar autenticación:\n${message}`);
    process.exit(1);
  }

  const connection = await authService.testConnection();
  console.log(connection.message);

  if (connection.success && health.status !== "unconfigured") {
    process.exit(0);
  }

  process.exit(health.status === "unconfigured" ? 0 : 1);
}

void main();
