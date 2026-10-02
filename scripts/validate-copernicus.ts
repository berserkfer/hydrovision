#!/usr/bin/env tsx
/**
 * Validación de autenticación Copernicus Data Space Ecosystem.
 * Ejecutar: npm run test:copernicus
 */

import { validateCopernicusConfig } from "@/config/copernicus.config";
import { testCopernicusConnection } from "@/server/copernicus/copernicus-oauth.client";

async function main() {
  const validation = validateCopernicusConfig();
  console.log(`Configuración: ${validation.message}`);

  if (!validation.isValid) {
    console.log("⚠ Copernicus no configurado — operando en modo simulado (esperado en dev mock).");
    for (const err of validation.errors) console.log(`  ${err}`);
    process.exit(0);
  }

  const result = await testCopernicusConnection();
  console.log(result.message);

  if (result.success && !result.simulated) {
    console.log("✓ Conexión OAuth Copernicus verificada correctamente.");
    process.exit(0);
  }

  console.error("✗ Conexión Copernicus no verificada (token simulado o error).");
  process.exit(1);
}

void main();
