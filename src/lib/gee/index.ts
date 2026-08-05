/**
 * Cliente GEE — punto de entrada desde lib/ (Sprint 1)
 * No consume imágenes reales ni expone credenciales al cliente Next.js.
 */

export {
  getGeeClient,
  runGeeHealthCheck,
  printGeeHealthReport,
  validateGeeConfig,
  isGeeConfigured,
  getGeeProvider,
  getGeeHealthService,
} from "./health-check";

export type { GeeHealthCheckResult, IGEEProvider } from "./health-check";
