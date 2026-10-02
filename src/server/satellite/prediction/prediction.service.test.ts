/**
 * Tests — PredictionService, solo las rutas de bloqueo duro (sin DB/GEE/Copernicus).
 * Estas rutas deben cortar ANTES de tocar cualquier repositorio o servicio externo.
 */

import { describe, expect, it } from "vitest";
import { PredictionInsufficientDataError, predictionService } from "./prediction.service";

describe("PredictionService — bloqueos duros", () => {
  it("nunca predice fosfatos — corta antes de tocar la base de datos", async () => {
    await expect(
      predictionService.predict({ stationId: "est-e01", parameterCode: "phosphates" })
    ).rejects.toMatchObject({
      name: "PredictionInsufficientDataError",
      payload: expect.objectContaining({ status: "NOT_OPTICALLY_PLAUSIBLE" }),
    });
  });

  it.each(["ph", "cod", "bod5", "nitrates", "coliforms"] as const)(
    "nunca predice %s",
    async (parameterCode) => {
      const error = await predictionService
        .predict({ stationId: "est-e01", parameterCode })
        .catch((e) => e);
      expect(error).toBeInstanceOf(PredictionInsufficientDataError);
      expect(error.payload.status).toBe("NOT_OPTICALLY_PLAUSIBLE");
      expect(error.payload.sampleSize.trainingSampleCount).toBeNull();
    }
  );

  it("rechaza parámetros ópticamente plausibles pero no habilitados como target (ej. conductivity)", async () => {
    const error = await predictionService
      .predict({ stationId: "est-e01", parameterCode: "conductivity" })
      .catch((e) => e);
    expect(error).toBeInstanceOf(PredictionInsufficientDataError);
    expect(error.payload.status).toBe("MODELING_TARGET_NOT_ENABLED");
  });
});
