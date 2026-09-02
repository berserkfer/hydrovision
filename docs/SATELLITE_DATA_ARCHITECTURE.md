# Arquitectura de datos satelitales — HydroVision

## 1. Objetivo

Preparar la capa científica y técnica para integrar **Sentinel-2** como fuente de **estimaciones y proxies espectrales**, separada de las **mediciones de campo** (muestreos, sensores in-situ, laboratorio).

> **HydroVision no considera una variable satelital como medición directa de calidad del agua. Las variables estimadas mediante Sentinel-2 deberán validarse/calibrarse con datos de campo.**

Este documento describe el diseño del **Prompt 3**. No incluye Google Earth Engine real, descarga de imágenes ni modelos entrenados.

---

## 2. Arquitectura

```
Sentinel-2 (futuro)
      ↓
selección de escena
      ↓
control de calidad / nubes (QA60, SCL — futuro GEE)
      ↓
bandas espectrales (catálogo B02–B12)
      ↓
reflectancia de superficie (L2A)
      ↓
índices espectrales (NDVI, NDCI, NDWI, MNDWI, …)
      ↓
variables ambientales estimadas (proxy/modelo — futuro)
      ↓
SatelliteIndex / SatelliteObservation (PostgreSQL)
      ↓
HydroVision (API, mapa, comparación campo ↔ satélite)
      ↓
validación con Measurement → ParametrosFisicoquimicos (campo)
```

**Capa de campo (intocable en este diseño):**

```
Prisma Measurement[]
      ↓
aggregateMedicionesToParametros()
      ↓
ParametrosFisicoquimicos
      ↓
ECA / Risk / Rules / Executive
```

---

## 3. Sentinel-2

| Atributo | Valor |
|----------|-------|
| Plataforma | Sentinel-2 MSI |
| Colección GEE (futuro) | `COPERNICUS/S2_SR_HARMONIZED` |
| Nivel de procesamiento | L2A (reflectancia de superficie) |
| Resolución | 10 m (RGB/NIR), 20 m (red edge, SWIR), 60 m (aerosol — no incluida en catálogo mínimo) |

Implementación actual: **stub/mock** — sin conexión externa.

---

## 4. Bandas

Catálogo tipado: `src/satellite/catalog/sentinel2-bands.catalog.ts`

| Banda | Nombre | λ central (nm) | Resolución (m) |
|-------|--------|----------------|----------------|
| B02 | Blue | 490 | 10 |
| B03 | Green | 560 | 10 |
| B04 | Red | 665 | 10 |
| B05 | Red Edge 1 | 705 | 20 |
| B06 | Red Edge 2 | 740 | 20 |
| B07 | Red Edge 3 | 783 | 20 |
| B08 | NIR | 842 | 10 |
| B8A | NIR narrow | 865 | 20 |
| B11 | SWIR 1 | 1610 | 20 |
| B12 | SWIR 2 | 2190 | 20 |

---

## 5. Reflectancia

Tipo: `Sentinel2ReflectanceMap = Partial<Record<Sentinel2BandCode, number>>`

- Almacenamiento futuro: campo JSON `ImagenSatelital.bandas` (Prisma).
- Cálculo de índices: `computeSpectralIndex(code, reflectanceMap)` — solo si todas las bandas requeridas están presentes.
- **No se inventan reflectancias** cuando faltan bandas.

---

## 6. Índices espectrales

Catálogo canónico: `src/satellite/catalog/spectral-indices.catalog.ts`

| Índice | Fórmula (Sentinel-2) | Bandas | Agua |
|--------|----------------------|--------|------|
| NDVI | (B08−B04)/(B08+B04) | B08, B04 | No (vegetación riparia) |
| NDCI | (B05−B04)/(B05+B04) | B05, B04 | Sí (proxy clorofila-a) |
| NDWI | (B03−B08)/(B03+B08) | B03, B08 | Sí |
| MNDWI | (B03−B11)/(B03+B11) | B03, B11 | Sí |
| NDTI | (B04−B03)/(B04+B03) | B04, B03 | Sí (proxy turbidez) |
| NDMI | (B08−B11)/(B08+B11) | B08, B11 | No (humedad vegetación) |

El **Satellite Index Engine** existente reexporta un subconjunto (sin NDCI) desde este catálogo para compatibilidad UI.

---

## 7. Variables estimadas

Catálogo: `src/satellite/catalog/estimated-variables.catalog.ts`

| Código | Nombre | Tipo | Estado |
|--------|--------|------|--------|
| `turbidity_estimated` | Turbidez estimada | proxy | No disponible — requiere calibración |
| `chlorophyll_a_estimated` | Clorofila-a estimada | proxy | No disponible — requiere calibración |
| `suspended_solids_estimated` | SST estimados | model | No implementado |

Términos obligatorios en UI/API: **estimado**, **derivado**, **proxy**, **modelo**.

---

## 8. Datos de campo

| Categoría | sourceType | Ejemplos |
|-----------|------------|----------|
| Medición directa | `field` | pH, turbidez, OD, conductividad, DBO5, coliformes |

Flujo oficial sin cambios: `Measurement` → `aggregateMedicionesToParametros()` → motores ECA/Risk.

**Prohibido** presentar índices satelitales como mediciones de campo.

---

## 9. Calibración campo ↔ satélite

Contratos: `src/satellite/types/calibration.types.ts`

```
Turbidez campo (NTU)
        ↕
NDTI / reflectancia Sentinel-2
        ↓
modelo de regresión (FUTURO)
        ↓
turbidity_estimated
```

- Sin coeficientes ni entrenamiento en esta fase.
- Stubs documentados: `CALIBRATION_MODEL_STUBS`.

---

## Field ↔ Sentinel-2 Validation Layer (Prompt 5)

> **Esta capa permite comparar observaciones de campo con observaciones Sentinel-2, pero NO establece todavía relaciones predictivas ni equivalencias entre índices espectrales y concentraciones de contaminantes.**

### Propósito

Enlazar descriptivamente muestreos de campo (`Muestra` + parámetros) con `SatelliteObservation` para preparar calibración futura.

### Matching operativo vs validación científica

| Concepto | Qué responde |
|----------|--------------|
| **Matching operativo** | ¿Qué par campo-satélite puede compararse por fecha/estación? |
| **Validación científica** | ¿El satélite predice la variable? — **NO implementada** |

Criterios operativos (`matching.config.ts`):
- `MATCHING_MAX_TEMPORAL_DIFFERENCE_DAYS = 7`
- `MATCHING_MAX_SPATIAL_DISTANCE_METERS = 500`

### Estados de matching

`matched` | `temporal_mismatch` | `spatial_mismatch` | `missing_satellite` | `missing_field` | `insufficient_data`

### Variables

- **Campo directo:** parámetros de `PARAMETRO_CATALOG` (turbidez, pH, OD, etc.)
- **Satélite:** NDVI, NDCI, NDWI, MNDWI, NDTI, NDMI
- **Modelo:** `turbidity_estimated`, etc. — **not_calibrated**

Relaciones campo↔índice: **`candidate_relationship`** únicamente (comparability.catalog.ts).

### API

```
GET /api/satellite/validation?stationId=est-e01&parameterCode=turbidity&useGee=false
```

Respuesta: `matches`, `comparisons`, `summary`, `meta.scientificStatus = "descriptive_only"`.

### Persistencia

**PERSISTENCE — FUTURE PHASE** — resultados calculados bajo demanda, sin tabla Prisma nueva.

### Limitaciones

- Sin regresiones, ML ni coeficientes.
- Sin conversión índice → concentración.
- `scientificStatus` siempre `descriptive_only` salvo `not_available` / `insufficient_data`.

### Siguiente fase

Calibración con pares campo-satélite validados operativamente → modelos en `calibration.types.ts`.

---

## 9b. Scientific Dataset Layer (Prompt 6)

```
Campo (Measurement / Muestreo)
      ↓
Matching operativo (±7 días, ≤500 m)
      ↓
FieldSatelliteComparison (descriptive_only)
      ↓
Quality Control (evaluateScientificPairQuality)
      ↓
ScientificFieldSatellitePair[] (dataset científico)
      ↓
ScientificDatasetSummary
      ↓
[FUTURO] Calibración / modelado
```

### Contratos

| Tipo | Ubicación |
|------|-----------|
| `ScientificFieldSatellitePair` | `src/satellite/types/scientific-dataset.types.ts` |
| `ScientificDatasetSummary` | idem |
| `ScientificDatasetExportRow` | idem (CSV futuro) |
| `evaluateScientificPairQuality()` | `src/satellite/quality/scientific-pair-quality.ts` |
| `buildScientificFieldSatellitePairs()` | `src/server/satellite/validation/scientific-dataset.builder.ts` |
| `ScientificDatasetService` | `src/server/satellite/validation/scientific-dataset.service.ts` |

### Estados separados

| Campo | Pregunta que responde |
|-------|----------------------|
| `matchingStatus` | ¿Campo y satélite corresponden **operacionalmente**? |
| `qualityStatus` | ¿El par es apto para el **dataset científico**? |

`qualityStatus` posibles: `accepted`, `rejected`, `insufficient_data`, `simulated_data`, `temporal_mismatch`, `spatial_mismatch`, `missing_index`, `invalid_measurement`.

### Reglas de calidad

1. **Fuente:** mock/simulado → `simulated_data` (se conserva, no se elimina).
2. **Matching:** estación, muestra, observación y compatibilidad operativa requeridos.
3. **Fecha:** diferencia temporal exacta — no se alteran fechas.
4. **Índices:** faltantes = `null` (nunca rellenar con `0`).
5. **Medición:** valor numérico, unidad y parámetro válidos.

### Comparabilidad

Reutiliza `comparability.catalog.ts` — solo `candidate_relationship`. **No** equivalencias directas (NDCI ≠ clorofila, NDTI ≠ turbidez).

### API

```
GET /api/satellite/dataset?stationId=...&fechaInicio=...&fechaFin=...&parameterCode=...&includeSimulated=false&useGee=false
```

Respuesta:

```json
{
  "pairs": [...],
  "summary": { "totalPairs", "acceptedPairs", "qualityBreakdown", "temporalDifferenceStatistics", ... },
  "meta": {
    "scientificStatus": "descriptive_only",
    "isSimulated": boolean,
    "dataSource": "mock|database",
    "geeConnected": boolean,
    "disclaimer": "..."
  }
}
```

`includeSimulated=false` (default): excluye pares simulados de `pairs`; `summary.excludedSimulatedPairs` informa cuántos se omitieron.

### Persistencia

**No** se modificó schema Prisma. El dataset se construye **determinísticamente** bajo demanda desde entidades existentes (campo + satélite + matching).

### Trazabilidad

Cada par conserva IDs originales:

- `fieldSampleId` → Muestreo
- `fieldMeasurementId` = `{sampleId}::{parameterCode}`
- `satelliteObservationId` → SatelliteObservation
- `satelliteSceneId` → SatelliteScene

### Exportación futura

`ScientificDatasetExportRow` — fila plana sin columnas predictivas (`predicted_value`, `correlation`, `r2`, etc.).

### Disclaimer central

> Este dataset contiene pares operacionalmente compatibles entre mediciones de campo y observaciones Sentinel-2. Su inclusión **NO** implica equivalencia física, correlación estadística ni capacidad predictiva.

### Estado actual vs futuro

| Fase | Estado |
|------|--------|
| **CURRENT** | Dataset descriptivo, QC, summary, API |
| **CURRENT (Prompt 7)** | Auditoría, readiness, calibración exploratoria lineal |
| **FUTURE** | Calibración validada, persistencia de modelos |
| **NO IMPLEMENTADO** | ML, producción automática, estimación operacional de concentraciones, persistencia Prisma |

---

## 9c. Scientific Calibration Layer (Prompt 7)

```
Scientific Dataset (pares reales aceptados)
      ↓
ScientificDatasetAuditReport
      ↓
Calibration Readiness (por parámetro)
      ↓
Temporal Split (cronológico — no random)
      ↓
Exploratory Calibration (y = a + b·x)
      ↓
Validation Metrics (MAE, RMSE, R²)
      ↓
ScientificCalibrationModel (en memoria — sin persistencia)
```

### Regla absoluta: datos reales

Solo entran pares con:
- `isSimulated === false`
- `sourceTypeField === "field"`
- `sourceTypeSatellite === "satellite"`
- `qualityStatus === "accepted"`

Si no hay suficientes datos reales → `INSUFFICIENT_REAL_DATA` — **no se calibra**.

### Criterios mínimos (minimum exploratory readiness criteria)

Documentados en `src/satellite/config/calibration-readiness.config.ts`:

| Criterio | Valor |
|----------|-------|
| Pares reales mínimos | 30 |
| Estaciones mínimas | 3 |
| Periodos temporales independientes | 2 |
| Fracción máxima una estación | 80% |
| Training mínimo | 15 |
| Validation mínimo | 5 |

**No son estándares científicos universales** — solo umbrales internos para decidir si explorar.

### Estados readiness

`READY` | `READY_WITH_WARNINGS` | `INSUFFICIENT_REAL_DATA` | `INSUFFICIENT_PARAMETER_COVERAGE` | `INSUFFICIENT_STATION_COVERAGE` | `INSUFFICIENT_TEMPORAL_COVERAGE` | `INSUFFICIENT_INDEX_COVERAGE` | `DATA_QUALITY_FAILURE`

Evaluación **por parámetro** usando `comparability.catalog.ts` — solo relaciones `candidate_relationship`.

### Split temporal

- Orden cronológico por `fieldDate`
- Objetivo 70% training / 30% validation
- No aplica si grupos quedarían por debajo de mínimos
- `assertNoTemporalLeakage()` — training siempre anterior a validation

### Modelo exploratorio

`ScientificCalibrationModel`:
- `modelType: "linear_regression"` — y = a + b·x
- Métricas separadas: `trainingMetrics` / `validationMetrics` (MAE, RMSE, R²)
- `validationStatus`: `not_attempted` | `trained` | `validated` | `failed` | `insufficient_data`
- `scientificStatus: "exploratory_calibration"`
- Salida calibrada: `predictedFieldValue` con `sourceType: "model"`, label `"calibrated estimate"`

**NO:** Random Forest, XGBoost, redes neuronales, ensembles, persistencia Prisma.

### APIs

```
GET /api/satellite/calibration/audit?stationId=...&parameterCode=...&fechaInicio=...&fechaFin=...
POST /api/satellite/calibration/run
Body: { parameterCode, predictorIndex, stationId?, fechaInicio?, fechaFin? }
```

HTTP **422** si datos insuficientes — sin coeficientes ficticios ni modelos vacíos.

### Disclaimers

- Calibración exploratoria — no equivalencia física
- R² elevado ≠ causalidad ni generalización

### Estado actual vs futuro

| Fase | Estado |
|------|--------|
| **CURRENT** | Auditoría, readiness, calibración lineal exploratoria, APIs |
| **NOT IMPLEMENTED** | Predicción productiva, ML, persistencia de modelos, estimación operacional de concentraciones |

---

## 9d. Scientific Calibration Validation Layer (Prompt 8)

```
Dataset
      ↓
Audit
      ↓
Readiness
      ↓
Training (exploratory calibration)
      ↓
Validation (ScientificCalibrationValidationResult)
      ↓
Robustness Assessment
```

### Distinción de estados

| Estado | Significado |
|--------|-------------|
| `trained` | Modelo ajustado — **no implica validación** |
| `validated` | Métricas de validation calculadas con conjunto independiente |
| `validated_exploratory` | Máximo estado permitido en esta fase |

Estados finales exploratorios:
`VALIDATED_EXPLORATORY` | `VALIDATED_WITH_WARNINGS` | `INSUFFICIENT_VALIDATION_DATA` | `TEMPORAL_LEAKAGE` | `INVALID_MODEL` | `SIMULATED_DATA` | `NOT_VALIDATED`

`robustnessStatus`: `robust_exploratory` | `warning` | `insufficient_data` | `invalid`

### VALIDATED_EXPLORATORY NO significa

- Modelo productivo
- Modelo generalizable
- Causalidad
- Equivalencia física
- Precisión operacional
- Validación científica definitiva

### Criterios (minimum exploratory validation criteria)

`src/satellite/config/calibration-validation.config.ts` — umbrales internos, no universales.

Evalúa: pares validation, estaciones, cobertura temporal, R²/MAE/RMSE, gap training vs validation, estación dominante, outliers, coeficientes finitos.

### Overfitting

Señal `possible_overfitting_signal` cuando gap R² o ratios MAE/RMSE superan umbrales — **no afirma overfitting confirmado**.

### API

```
GET /api/satellite/calibration/validate?stationId=...&parameterCode=...&predictorIndex=...&fechaInicio=...&fechaFin=...
```

Flujo: dataset → audit → calibration → validation

HTTP **422** si datos simulados o insuficientes — sin resultados ficticios.

---

## 10. DATA_SOURCE

| Modo | Satélite |
|------|----------|
| `DATA_SOURCE=mock` | `SatelliteMockRepository` → `mockDataStore.indicesSatelitales`, `isSimulated: true` |
| `DATA_SOURCE=database` | `SatellitePrismaRepository` → `SatelliteIndex`, `isSimulated: false` |

Config: `src/config/satellite-data-source.config.ts` (alineado con monitoreo).

---

## 11. isSimulated

| Origen | isSimulated |
|--------|-------------|
| mockDataStore | `true` |
| PostgreSQL | `false` |
| Catálogo / definiciones | N/A |
| Variables estimadas (futuro) | según origen del cálculo |

API expone `meta.isSimulated` en todas las respuestas satelitales.

---

## 12. Futuro GEE

**Estado Prompt 4 — IMPLEMENTADO (controlado)**

```
Google Earth Engine REST + OAuth2 Service Account
        ↓
GeeAdapter (src/server/gee/) — SOLO datos: escenas + reflectancias
        ↓
SatelliteGeeService
        ↓
satellite-observation.builder — computeSpectralIndex() HydroVision
        ↓
SatelliteObservation
        ↓
API ?useGee=true
```

Componentes:
- `google-oauth.client.ts` — JWT Service Account → access token
- `gee-rest.client.ts` — computePixels / value:compute
- `gee-expression.builder.ts` — filtros colección + select bandas (sin fórmulas)
- `gee.adapter.ts` — GeeSceneRecord, GeeReflectanceRecord
- `satellite-gee.service.ts` — orquestación por estación
- `SatelliteService` — `useGee=true` en query params

APIs con GEE:
- `GET /api/satellite/scenes?stationId=...&useGee=true`
- `GET /api/satellite/observations?stationId=...&useGee=true`

Requisitos: `GOOGLE_*` + `GEE_INTEGRATION_ENABLED=true`

**Regla:** el adaptador GEE NO calcula NDVI/NDCI/NDWI — solo entrega reflectancias. Índices en `spectral-indices.catalog.ts`.

Si OAuth falla → fallback token simulado + `isSimulated: true` + `geeLive: false`.

---

## 13. Límites científicos actuales

1. No hay descarga ni procesamiento real de escenas Sentinel-2.
2. `SatelliteIndex` en Prisma almacena NDWI/NDVI/MNDWI/NDTI — **no NDCI** ni reflectancias por banda.
3. Variables estimadas (turbidez, clorofila-a, SST) están en estado **not_available**.
4. Comparación campo vs satélite en dashboard/mapa — contratos listos, UI sin cambios.
5. Máscaras de nubes: documentadas como requisito futuro (`DEFAULT_CLOUD_MASK_REQUIREMENT`).

---

## Estado Prisma vs contrato `SatelliteObservation`

| Campo conceptual | Prisma `SatelliteIndex` | Prisma `ImagenSatelital` |
|------------------|-------------------------|--------------------------|
| Índices agregados | ✅ | — |
| sceneId / tileId | tileId | tileId |
| cloudPercentage | coberturaNubosa | metadata JSON |
| Reflectancias | — | bandas JSON |
| NDCI | ❌ pendiente migración | — |
| isSimulated | ❌ inferido por DATA_SOURCE | — |
| geometry/footprint | — | metadata JSON |

No se modificó el schema en Prompt 3; extensión futura mínima sugerida: columna `ndci`, flag `isSimulated`, enlace escena↔observación.

---

## Estructura de código

```
src/satellite/           — tipos y catálogos canónicos
src/server/satellite/    — repository, service, mappers, API DTOs
src/config/satellite-data-source.config.ts
src/app/api/satellite/   — observations, indices, scenes, validation, dataset, verification, calibration/audit, calibration/run, calibration/validate
docs/SATELLITE_DATA_ARCHITECTURE.md
```

---

## 9e. Empirical GEE/Sentinel-2 Verification (Prompt 11)

### Objetivo

Verificar empíricamente la cadena GEE LIVE → Sentinel-2 → reflectancia → QC → índices → dataset científico real. **No entrena modelos.**

### API

```
GET /api/satellite/verification?stationId=...&fechaInicio=...&fechaFin=...
GET /api/satellite/dataset?...&includeGeeVerification=true
```

### Colección y bandas

| Elemento | Valor |
|----------|-------|
| Colección | `COPERNICUS/S2_SR_HARMONIZED` |
| Bandas reflectancia | B2, B3, B4, B5, B8, B11 |
| QC píxel | SCL (Scene Classification Layer) |
| Point sampling | `spatialRepresentativeness = "point_sampling"` |

### Metadata de escena (live)

Expresión `buildSentinel2SceneDetailsExpression()` obtiene alineados:

- `system:index` → `sceneId` / `systemIndex`
- `system:time_start` → `acquisitionDate` (ms → ISO date)
- `CLOUDY_PIXEL_PERCENTAGE` → `cloudPercentage` (null si ausente — **nunca 0 inventado**)

### Reflectancia — semántica empírica

Función `interpretReflectanceScale()` + `processGeeSurfaceReflectances()`:

| Estado | Criterio | Acción |
|--------|----------|--------|
| `valid` | Valores en [0, 1+tolerance] | Índices permitidos |
| `out_of_range` | Negativo o > umbral | Índices bloqueados |
| `missing` | Sin bandas | Índices bloqueados |
| `unknown` | Escala indeterminada | Índices bloqueados |

**NO se aplica `/10000` automáticamente.** Valores DN-like se documentan en `scaleEvidence.notes`.

### Pixel quality (SCL)

`interpretSclPixelQuality()` — estados: `valid`, `water`, `cloud`, `cloud_shadow`, `cirrus`, `snow`, `invalid`, `unknown`.

- Metadata de escena (`cloudPercentage`) ≠ calidad de píxel (`pixelQualityStatus`)
- `unknown` → QC `insufficient_data` (no se marca válido)
- Nube/sombra/cirrus → `rejected`

### Dataset quality report

`buildScientificDatasetQualityReport()` — métricas de calidad (NO R²/MAE/RMSE):

- `acceptedPairRate`, `insufficientDataRate`, `cloudUnknownRate`, `reflectanceInvalidRate`
- Desgloses por station, parameter, scene, cloud, reflectance, pixel quality

### Readiness

Reutiliza `evaluateParameterReadiness()` para: turbidity, phosphates, flow_rate, conductivity.

### Verificación live

| Condición | Resultado |
|-----------|-----------|
| Credenciales GEE ausentes | `GEE_LIVE_UNAVAILABLE` — **GEE live verification not executed** |
| Token simulado | `GEE_SIMULATED_ONLY` |
| Consulta exitosa | `GEE_LIVE_VERIFIED` |
| Error en consulta | `GEE_LIVE_FAILED` — errores documentados, sin fabricar éxito |

### Limitaciones

1. Point sampling — no garantiza representatividad del cuerpo de agua.
2. QA60 no implementado — solo SCL en point sampling.
3. Sin conversión automática DN→reflectancia.
4. Verificación live requiere variables `GOOGLE_*` en entorno de ejecución.

---

## 9f. Empirical GEE / Sentinel-2 Verification (Prompt 12)

### Fecha de verificación

2026-08-12 (UTC)

### Resultado live

| Estado | Valor |
|--------|-------|
| **GEE live** | `GEE_LIVE_UNAVAILABLE` |
| **Consulta real ejecutada** | No |
| **Motivo** | Credenciales GEE ausentes en entorno de ejecución |

### Variables de entorno evaluadas (SET / NOT_SET — sin valores secretos)

| Variable | Estado |
|----------|--------|
| `GOOGLE_CLIENT_EMAIL` | NOT_SET |
| `GOOGLE_PRIVATE_KEY` | NOT_SET |
| `GOOGLE_PROJECT_ID` | NOT_SET |
| `GOOGLE_EARTH_ENGINE_PROJECT` | NOT_SET |
| `GEE_INTEGRATION_ENABLED` | NOT_SET |

### Colección prevista (no consultada en esta ejecución)

`COPERNICUS/S2_SR_HARMONIZED`

### Estaciones / escenas / reflectancia / SCL / índices

No evaluados en vivo — **ninguna consulta GEE se ejecutó**. No se inventaron escenas, reflectancias, porcentajes de nube ni índices espectrales.

### Dataset y calibración exploratoria

| Estado | Valor |
|--------|-------|
| Dataset real | `DATASET_REAL_NOT_READY` |
| Calibración exploratoria | `CALIBRATION_EXPLORATORY_NOT_READY` |

Motivo: sin GEE live no hay observaciones Sentinel-2 reales enlazables; el entorno mock reporta 0 pares reales aceptados.

### Tests deterministas (Prompt 12)

Se añadieron casos en `gee-verification.test.ts` para: trazabilidad `sceneId`/`system:index`, `acquisitionDate`/`system:time_start`, SCL (cloud_shadow, valid), NDMI, trazabilidad en quality report, simulated → no calibration, y confirmación de `GEE_LIVE_UNAVAILABLE` sin éxito fabricado.

### Limitaciones de esta verificación

1. La verificación empírica live queda **pendiente** hasta configurar credenciales GEE válidas.
2. Los tests usan fixtures sintéticos claramente marcados — no simulan éxito GEE live.
3. No se aplicó conversión automática DN→reflectancia (`/10000`).
4. Point sampling — representatividad espacial no garantizada (heredado de 9e).

### Recomendación

Configurar las cinco variables GEE en `.env`, habilitar `GEE_INTEGRATION_ENABLED=true`, y re-ejecutar `GET /api/satellite/verification` o `npm run test:gee` antes de declarar `GEE_LIVE_VERIFIED`.
