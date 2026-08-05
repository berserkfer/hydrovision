/**
 * Estrategia base para índices espectrales — DRY (Sprint 4)
 */

import type {
  IndexCalculationInput,
  IndexCalculationResult,
  IndexColorScaleStop,
  IndexDefinition,
  IndexInterpretation,
  IndexLegendItem,
  IndexStatusLevel,
} from "../types/index-engine.types";
import type { ISatelliteIndex } from "../interfaces/satellite-index.interface";
import type { IndexRepository } from "../interfaces/index-repository.interface";

export abstract class BaseSatelliteIndex implements ISatelliteIndex {
  constructor(
    readonly definition: IndexDefinition,
    protected readonly repository: IndexRepository
  ) {}

  calculate(input: IndexCalculationInput): IndexCalculationResult {
    const stored = this.repository.getStoredValue(input.stationId, this.definition.code);
    const value =
      stored ??
      this.calculateFromBands(input.bands ?? this.repository.getBandReflectance(input.stationId));

    return {
      code: this.definition.code,
      value: Number(value.toFixed(4)),
      calculatedAt: new Date().toISOString(),
      source: "simulated",
    };
  }

  protected abstract calculateFromBands(bands: Record<string, number>): number;

  interpret(value: number): IndexInterpretation {
    const { min, max } = this.definition.expectedRange;
    const normalized = (value - min) / (max - min);
    let status: IndexStatusLevel = "normal";
    let statusLabel = "Normal";
    let message = this.definition.interpretationGuide;
    let color = this.definition.visualizationColor;

    if (normalized < 0.2) {
      status = "low";
      statusLabel = "Bajo";
      color = "#64748b";
      message = `Valor bajo (${value.toFixed(3)}). ${this.definition.interpretationGuide}`;
    } else if (normalized > 0.85) {
      status = "high";
      statusLabel = "Alto";
      color = this.definition.visualizationColor;
      message = `Valor alto (${value.toFixed(3)}). ${this.definition.interpretationGuide}`;
    } else if (normalized > 0.7) {
      status = "normal";
      statusLabel = "Moderado";
    }

    if (this.definition.code === "NDTI" && value > 0.15) {
      status = "critical";
      statusLabel = "Turbidez elevada";
      color = "#ef4444";
      message = "Posible incremento de sedimentos en suspensión — verificar muestreos de campo.";
    }

    return { status, statusLabel, message, color };
  }

  getLegend(): IndexLegendItem[] {
    return this.getColorScale().map((stop, index, array) => ({
      label: index === 0 ? "Mínimo" : index === array.length - 1 ? "Máximo" : "Intermedio",
      color: stop.color,
      range: stop.value.toFixed(2),
    }));
  }

  getColorScale(): IndexColorScaleStop[] {
    const base = this.definition.visualizationColor;
    return [
      { value: this.definition.expectedRange.min, color: "#f8fafc" },
      { value: 0, color: "#cbd5e1" },
      { value: (this.definition.expectedRange.max + this.definition.expectedRange.min) / 2, color: base },
      { value: this.definition.expectedRange.max, color: base },
    ];
  }
}

function normalizedDifference(a: number, b: number): number {
  const denominator = a + b;
  if (denominator === 0) return 0;
  return (a - b) / denominator;
}

export class NdwiIndex extends BaseSatelliteIndex {
  protected calculateFromBands(bands: Record<string, number>): number {
    return normalizedDifference(bands.green ?? 0.12, bands.nir ?? 0.28);
  }
}

export class NdviIndex extends BaseSatelliteIndex {
  protected calculateFromBands(bands: Record<string, number>): number {
    return normalizedDifference(bands.nir ?? 0.35, bands.red ?? 0.08);
  }
}

export class MndwiIndex extends BaseSatelliteIndex {
  protected calculateFromBands(bands: Record<string, number>): number {
    return normalizedDifference(bands.green ?? 0.12, bands.swir ?? 0.1);
  }
}

export class NdtiIndex extends BaseSatelliteIndex {
  protected calculateFromBands(bands: Record<string, number>): number {
    return normalizedDifference(bands.red ?? 0.08, bands.green ?? 0.12);
  }
}

export class NdmiIndex extends BaseSatelliteIndex {
  protected calculateFromBands(bands: Record<string, number>): number {
    return normalizedDifference(bands.nir ?? 0.35, bands.swir ?? 0.1);
  }
}
