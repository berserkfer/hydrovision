/**
 * Catálogo de parámetros de calidad del agua — Sprint 2E
 */

import type { ParameterCategory, ParameterCode } from "@/types/parameter-management";

export interface ParameterDefinition {
  code: ParameterCode;
  name: string;
  category: ParameterCategory;
  unit: string;
  ecaMin?: number;
  ecaMax?: number;
  alertThresholdRatio: number;
  description: string;
  measurementMethod: string;
  interpretationGuide: string;
  /** Campo en ParametrosFisicoquimicos o 'simulated' */
  storeField?: string;
}

export const PARAMETER_CATEGORY_LABELS: Record<ParameterCategory, string> = {
  physical: "Propiedades físicas",
  chemical: "Propiedades químicas",
  microbiological: "Propiedades microbiológicas",
};

export const WATER_PARAMETER_CATALOG: ParameterDefinition[] = [
  {
    code: "temperature",
    name: "Temperatura",
    category: "physical",
    unit: "°C",
    ecaMax: 30,
    alertThresholdRatio: 0.85,
    description:
      "Indica el balance térmico del cuerpo de agua. Valores elevados reducen la solubilidad del oxígeno disuelto y pueden afectar la fauna acuática.",
    measurementMethod: "Termómetro digital calibrado in situ · ISO 5665",
    interpretationGuide:
      "Variaciones bruscas sugieren descargas térmicas o cambios en el régimen de caudal.",
    storeField: "temperatura",
  },
  {
    code: "turbidity",
    name: "Turbidez",
    category: "physical",
    unit: "NTU",
    ecaMax: 50,
    alertThresholdRatio: 0.8,
    description:
      "Mide la dispersión de luz por partículas en suspensión. Relacionada con erosión, arrastre de sólidos y carga sedimentológica.",
    measurementMethod: "Nefelométrico portátil · SM 2130 B",
    interpretationGuide:
      "Incrementos post-lluvia indican arrastre de sedimentos desde cuenca agrícola o urbana.",
    storeField: "turbidez",
  },
  {
    code: "conductivity",
    name: "Conductividad",
    category: "physical",
    unit: "µS/cm",
    ecaMax: 2500,
    alertThresholdRatio: 0.85,
    description:
      "Proxy de salinidad y concentración de iones disueltos. Sensible a vertidos minero-industriales y retorno agrícola.",
    measurementMethod: "Conductímetro compensado en temperatura · SM 2510",
    interpretationGuide:
      "Valores sostenidamente altos pueden indicar intrusión salina o aporte de sales.",
    storeField: "conductividad",
  },
  {
    code: "ph",
    name: "pH",
    category: "chemical",
    unit: "—",
    ecaMin: 6.5,
    ecaMax: 8.5,
    alertThresholdRatio: 0.9,
    description:
      "Potencial de hidrógeno. Controla la especiación química y la toxicidad de algunos metales.",
    measurementMethod: "Electrodo combinado calibrado con buffers 4 y 7 · SM 4500-H+",
    interpretationGuide:
      "Desviaciones hacia valores ácidos o alcalinos limitan la biodiversidad acuática.",
    storeField: "ph",
  },
  {
    code: "dissolvedOxygen",
    name: "Oxígeno Disuelto",
    category: "chemical",
    unit: "mg/L",
    ecaMin: 4,
    alertThresholdRatio: 0.9,
    description:
      "Indicador clave de salud biológica. Condiciona supervivencia de peces e invertebrados.",
    measurementMethod: "Sonda multiparamétrica · SM 4500-O G",
    interpretationGuide:
      "Valores bajo 4 mg/L sugieren estrés oxígeno y posible carga orgánica.",
    storeField: "oxigenoDisuelto",
  },
  {
    code: "bod5",
    name: "DBO5",
    category: "chemical",
    unit: "mg/L",
    ecaMax: 15,
    alertThresholdRatio: 0.8,
    description:
      "Demanda Bioquímica de Oxígeno a 5 días. Mide materia orgánica biodegradable.",
    measurementMethod: "Incubación 20 °C · SM 5210 B",
    interpretationGuide:
      "Incrementos reflejan vertidos orgánicos o arrastre de suelo con alta carga biodegradable.",
    storeField: "dbo5",
  },
  {
    code: "cod",
    name: "DQO",
    category: "chemical",
    unit: "mg/L",
    ecaMax: 40,
    alertThresholdRatio: 0.8,
    description:
      "Demanda Química de Oxígeno. Estima materia orgánica total oxidable.",
    measurementMethod: "Método cerrado con digestión ácida · SM 5220 D",
    interpretationGuide:
      "Relación DQO/DBO elevada sugiere presencia de compuestos difícilmente biodegradables.",
    storeField: "dqo",
  },
  {
    code: "nitrates",
    name: "Nitratos",
    category: "chemical",
    unit: "mg/L",
    ecaMax: 50,
    alertThresholdRatio: 0.85,
    description:
      "Forma asimilable de nitrógeno. Indicador de fertilización agrícola y eutrofización.",
    measurementMethod: "Espectrofotometría UV · SM 4500-NO3",
    interpretationGuide:
      "Concentraciones altas favorecen floraciones algales y reducción de oxígeno.",
    storeField: "simulated",
  },
  {
    code: "phosphates",
    name: "Fosfatos",
    category: "chemical",
    unit: "mg/L",
    ecaMax: 0.5,
    alertThresholdRatio: 0.8,
    description:
      "Nutriente limitante en muchos ecosistemas fluviales. Marcador de eutrofización.",
    measurementMethod: "Método del molibdato ácido · SM 4500-P E",
    interpretationGuide:
      "Valores sobre el límite ECA orientativo indican aporte de detergentes o fertilizantes.",
    storeField: "simulated",
  },
  {
    code: "coliforms",
    name: "Coliformes Totales",
    category: "microbiological",
    unit: "NMP/100mL",
    ecaMax: 1000,
    alertThresholdRatio: 0.8,
    description:
      "Indicadores microbiológicos de contaminación fecal general.",
    measurementMethod: "Número más probable en tubos múltiples · SM 9221 B",
    interpretationGuide:
      "Presencia elevada señala riesgo sanitario y vertidos no tratados.",
    storeField: "coliformes",
  },
  {
    code: "coliformThermotolerant",
    name: "Coliformes Termotolerantes",
    category: "microbiological",
    unit: "NMP/100mL",
    ecaMax: 400,
    alertThresholdRatio: 0.8,
    description:
      "Subgrupo de coliformes asociado a contaminación fecal reciente.",
    measurementMethod: "Incubación a 44.5 °C · SM 9222 D",
    interpretationGuide:
      "Confirman impacto de descarga sanitaria directa sobre el cuerpo de agua.",
    storeField: "simulated",
  },
  {
    code: "eColi",
    name: "Escherichia coli",
    category: "microbiological",
    unit: "NMP/100mL",
    ecaMax: 200,
    alertThresholdRatio: 0.8,
    description:
      "Bacteria indicadora específica de contaminación fecal humana y animal.",
    measurementMethod: "Sustrato cromogénico · SM 9223 B",
    interpretationGuide:
      "Valores altos implican riesgo directo para uso recreativo y consumo.",
    storeField: "simulated",
  },
];

export const PARAMETER_CATALOG_BY_CODE = Object.fromEntries(
  WATER_PARAMETER_CATALOG.map((p) => [p.code, p])
) as Record<ParameterCode, ParameterDefinition>;

export function getParameterDefinition(code: ParameterCode): ParameterDefinition {
  return PARAMETER_CATALOG_BY_CODE[code];
}
