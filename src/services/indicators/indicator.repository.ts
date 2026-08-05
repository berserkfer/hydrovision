/**
 * IndicatorRepository — catálogo y metadatos de indicadores ambientales.
 */

import type { IndicatorCategoryMeta } from "@/types/indicators";
import { INDICATOR_CATEGORIES } from "./indicator.constants";

export interface IndicatorDefinition {
  id: string;
  category: IndicatorCategoryMeta["key"];
  name: string;
  description: string;
  unit: string;
  importance: "low" | "medium" | "high" | "critical";
  icon: IndicatorCategoryMeta["icon"];
}

const CATALOG: IndicatorDefinition[] = [
  {
    id: "ind-water-quality",
    category: "water_quality",
    name: "Índice de Calidad del Agua",
    description:
      "Puntuación compuesta basada en pH, oxígeno disuelto, turbidez y conductividad promedio de la cuenca.",
    unit: "IQAg",
    importance: "critical",
    icon: "droplets",
  },
  {
    id: "ind-eca-rate",
    category: "eca_compliance",
    name: "Tasa de Cumplimiento ECA",
    description: "Porcentaje de estaciones que cumplen los Estándares de Calidad Ambiental vigentes.",
    unit: "%",
    importance: "critical",
    icon: "shield",
  },
  {
    id: "ind-risk-index",
    category: "environmental_risk",
    name: "Índice de Riesgo Ambiental",
    description: "Índice inverso del motor de riesgo — mayor valor indica menor riesgo percibido.",
    unit: "/100",
    importance: "high",
    icon: "alert",
  },
  {
    id: "ind-risk-level",
    category: "environmental_risk",
    name: "Nivel de Riesgo General",
    description: "Clasificación cualitativa derivada del Environmental Risk Engine.",
    unit: "—",
    importance: "high",
    icon: "activity",
  },
  {
    id: "ind-temporal-trend",
    category: "temporal_trend",
    name: "Estabilidad Temporal",
    description: "Grado de estabilidad de parámetros en los últimos monitoreos simulados.",
    unit: "%",
    importance: "medium",
    icon: "trend",
  },
  {
    id: "ind-stations-active",
    category: "station_status",
    name: "Estaciones Operativas",
    description: "Proporción de estaciones en estado operativo activo.",
    unit: "%",
    importance: "high",
    icon: "map-pin",
  },
  {
    id: "ind-stations-alert",
    category: "station_status",
    name: "Estaciones en Alerta",
    description: "Cantidad de estaciones con parámetros en zona de alerta ECA.",
    unit: "est.",
    importance: "medium",
    icon: "map-pin",
  },
  {
    id: "ind-campaigns-active",
    category: "campaign_status",
    name: "Campañas en Curso",
    description: "Número de campañas de monitoreo activas en la cuenca.",
    unit: "camp.",
    importance: "medium",
    icon: "clipboard",
  },
  {
    id: "ind-campaigns-coverage",
    category: "campaign_status",
    name: "Cobertura de Campañas",
    description: "Relación entre muestras registradas y estaciones monitoreadas.",
    unit: "%",
    importance: "low",
    icon: "clipboard",
  },
  {
    id: "ind-data-integrity",
    category: "data_quality",
    name: "Integridad de Datos",
    description: "Completitud de registros de muestreo y parámetros asociados.",
    unit: "%",
    importance: "high",
    icon: "database",
  },
  {
    id: "ind-data-freshness",
    category: "data_quality",
    name: "Actualización de Datos",
    description: "Frescura de la última sincronización simulada de la plataforma.",
    unit: "%",
    importance: "medium",
    icon: "database",
  },
];

export class IndicatorRepository {
  getCatalog(): IndicatorDefinition[] {
    return CATALOG.map((d) => ({ ...d }));
  }

  getCategories(): IndicatorCategoryMeta[] {
    return [...INDICATOR_CATEGORIES];
  }

  getDefinitionById(id: string): IndicatorDefinition | undefined {
    return CATALOG.find((d) => d.id === id);
  }

  getDefinitionsByCategory(category: IndicatorDefinition["category"]): IndicatorDefinition[] {
    return CATALOG.filter((d) => d.category === category);
  }
}

export const indicatorRepository = new IndicatorRepository();
