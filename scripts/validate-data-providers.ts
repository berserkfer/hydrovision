/**
 * Validación de contrato IDataProvider — Fase 4.6
 * Ejecutar: npm run test:providers
 */

import { DATA_STORE_KEYS } from "../src/types/data-provider";
import { mockDataProvider } from "../src/providers/mock-data.provider";
import { databaseDataProvider as futureDatabaseProvider } from "../src/providers/database-data.provider";
import { futureEarthEngineProvider } from "../src/providers/future-earth-engine.provider";
import { futureApiProvider } from "../src/providers/future-api.provider";
import { DataProviderFactory } from "../src/providers/data-provider.factory";
import type { IDataProvider } from "../src/types/data-provider";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  assert(actual === expected, message);
}

function assertDeepEqual(actual: unknown, expected: unknown, message: string): void {
  assert(JSON.stringify(actual) === JSON.stringify(expected), message);
}

function validateSnapshotStructure(provider: IDataProvider, label: string): void {
  console.log(`\n[${label}]`);

  const snapshot = provider.getSnapshot();
  const metadata = provider.getMetadata();

  assertEqual(metadata.source, snapshot.metadata.source, `${label}: metadata.source coherente`);
  assertDeepEqual(
    snapshot.storeKeys,
    [...DATA_STORE_KEYS],
    `${label}: storeKeys coincide con DATA_STORE_KEYS`
  );

  for (const key of DATA_STORE_KEYS) {
    assert(typeof snapshot.counts[key] === "number", `${label}: counts.${String(key)} es numérico`);
  }
}

function validateMockProvider(): void {
  console.log("\n[MockDataProvider — disponibilidad y datos]");

  assert(mockDataProvider.isAvailable(), "MockDataProvider.isAvailable() === true");

  const store = mockDataProvider.getStore();
  assert(Array.isArray(store.estaciones), "Mock getStore() devuelve estaciones");
  assert(store.estaciones.length > 0, "Mock store contiene estaciones");

  const snapshot = mockDataProvider.getSnapshot();
  assert(
    (snapshot.counts.estaciones ?? 0) > 0,
    "Mock snapshot reporta estaciones > 0"
  );
}

function validateFutureProviders(): void {
  const futures: Array<{ label: string; provider: IDataProvider }> = [
    { label: "FutureDatabaseProvider", provider: futureDatabaseProvider },
    { label: "FutureEarthEngineProvider", provider: futureEarthEngineProvider },
    { label: "FutureApiProvider", provider: futureApiProvider },
  ];

  for (const { label, provider } of futures) {
    console.log(`\n[${label} — stub]`);

    assert(!provider.isAvailable(), `${label}.isAvailable() === false`);
    assert(!provider.getMetadata().isConnected, `${label} no está conectado`);
    assert(!provider.getMetadata().isSimulated, `${label} no es simulado`);

    validateSnapshotStructure(provider, label);

    let threw = false;
    try {
      provider.getStore();
    } catch {
      threw = true;
    }
    assert(threw, `${label}.getStore() lanza error (no conectado)`);
  }
}

function validateFactory(): void {
  console.log("\n[DataProviderFactory]");

  const sources = DataProviderFactory.getRegisteredSources();
  assertDeepEqual(
    sources,
    ["mock", "database", "gee", "api"],
    "Factory registra mock, database, gee, api"
  );

  for (const source of sources) {
    const provider = DataProviderFactory.create(source);
    assertEqual(provider.getMetadata().source, source, `create("${source}") devuelve proveedor correcto`);
  }

  const fallback = DataProviderFactory.createWithFallback("database");
  assert(fallback.isAvailable(), "createWithFallback(database) retorna mock disponible");
  assertEqual(
    fallback.getMetadata().source,
    "mock",
    "createWithFallback(database) hace fallback a mock"
  );
}

console.log("HydroVision — Validación de proveedores de datos (Fase 4.6)");
console.log("=".repeat(60));

validateSnapshotStructure(mockDataProvider, "MockDataProvider");
validateMockProvider();
validateFutureProviders();
validateFactory();

console.log("\n" + "=".repeat(60));
console.log(`Resultado: ${passed} pasaron, ${failed} fallaron`);

if (failed > 0) {
  process.exit(1);
}

console.log("Todos los proveedores cumplen el contrato IDataProvider.\n");
