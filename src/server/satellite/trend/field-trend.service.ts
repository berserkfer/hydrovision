/**
 * FieldTrendService — serie histórica real + proyección corta de un parámetro de campo.
 * Responde a "cómo evolucionó en años pasados y hacia dónde va", con datos reales únicamente
 * (nunca simulados — ver field-measurement.loader.ts sobre el flag isSimulated por registro).
 */

import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import {
  computeFieldValueTrend,
  type FieldTrendInputPoint,
  type FieldTrendResult,
} from "@/satellite/calibration/field-value-trend";
import { loadFieldMeasurementsForMatching } from "../validation/field-measurement.loader";

export interface FieldTrendQuery {
  stationId: string;
  parameterCode: ParametroCodigoDb;
  fechaInicio?: string;
  fechaFin?: string;
  forecastHorizonDays?: number;
}

export interface FieldTrendResponse extends FieldTrendResult {
  stationId: string;
  parameterCode: ParametroCodigoDb;
  totalRecordsFound: number;
  simulatedRecordsExcluded: number;
  isSimulated: boolean;
}

export class FieldTrendService {
  async getTrend(query: FieldTrendQuery): Promise<FieldTrendResponse> {
    const data = await loadFieldMeasurementsForMatching({
      stationId: query.stationId,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
      parameterCode: query.parameterCode,
    });

    const matching = data.parameters.filter(
      (p) => p.parameterCode === query.parameterCode && p.value !== null
    );
    const realOnly = matching.filter((p) => !p.isSimulated);

    const points: FieldTrendInputPoint[] = realOnly.map((p) => ({
      date: p.date,
      value: p.value as number,
      sampleId: p.sampleId,
      isSimulated: p.isSimulated,
    }));

    const result = computeFieldValueTrend(points, query.forecastHorizonDays);

    return {
      ...result,
      stationId: query.stationId,
      parameterCode: query.parameterCode,
      totalRecordsFound: matching.length,
      simulatedRecordsExcluded: matching.length - realOnly.length,
      isSimulated: realOnly.length === 0,
    };
  }
}

export const fieldTrendService = new FieldTrendService();
