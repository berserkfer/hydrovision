# HydroVision — Modelo de datos

## Entidades principales (Fase 3+)

### MonitoringStation
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | P1 … P6 |
| name | string | Nombre descriptivo |
| latitude | float | WGS84 |
| longitude | float | WGS84 |
| riverSegment | string | Tramo del río Reque |

### FieldMeasurement
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| stationId | string | FK → MonitoringStation |
| sampledAt | datetime | Fecha/hora muestreo |
| ph | float | pH |
| turbidity | float | NTU |
| conductivity | float | µS/cm |
| dissolvedOxygen | float | mg/L |
| temperature | float | °C |
| bod5 | float | mg/L DBO5 |
| cod | float | mg/L DQO |
| coliforms | float? | NMP/100mL (opcional) |
| notes | text? | Observaciones campo |
| createdBy | string? | Responsable |

### SatelliteIndex
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| stationId | string | Estación asociada o celda |
| acquiredAt | date | Fecha imagen |
| source | enum | landsat8, landsat9, sentinel2 |
| ndwi | float | -1 … 1 |
| ndvi | float | -1 … 1 |
| mndwi | float | -1 … 1 |
| ndti | float | -1 … 1 |
| cloudCover | float | % |

### ComplianceAssessment
| Campo | Tipo | Descripción |
|-------|------|-------------|
| measurementId | uuid | FK |
| status | enum | compliant, alert, non_compliant |
| violatedParameters | json | Lista parámetros fuera de ECA |
| assessedAt | datetime | Timestamp evaluación |

### AI risk (Fase 6)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| stationId | string | Estación |
| assessedAt | datetime | Fecha inferencia |
| riskScore | float | 0 … 1 |
| riskCategory | enum | low, medium, high |
| modelVersion | string | Trazabilidad científica |

## Parámetros fisicoquímicos registrados

1. pH  
2. Turbidez (NTU)  
3. Conductividad (µS/cm)  
4. Oxígeno disuelto (mg/L)  
5. Temperatura (°C)  
6. DBO5 (mg/L)  
7. DQO (mg/L)  
8. Coliformes (NMP/100mL, si aplica)

## Nota sobre datos simulados

Durante Fase 1–2, `src/lib/data/simulated.ts` provee datos de desarrollo.  
Cada registro incluye `isSimulated: true`. No deben citarse como datos de campo en la tesis hasta reemplazarlos por mediciones reales.
