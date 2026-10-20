# HydroVision — Análisis comparativo y hoja de ruta de funciones innovadoras

**Repositorio:** `github.com/berserkfer/hydrovision` · commit `77be869`
**Fecha:** 19 de octubre de 2026
**Método:** auditoría estática del código, ejecución de la suite de pruebas y comparación con 13 referentes internacionales.

---

## 0. Ficha técnica

| Dimensión | Valor |
|---|---|
| Stack | Next.js 15.5 · React 19 · TypeScript estricto · Tailwind 4 · Prisma 6 / PostgreSQL |
| Rutas | 19 páginas + 43 endpoints API |
| Modelo de datos | 35 modelos Prisma (esquema de 920 líneas) |
| Código | 901 archivos versionados (incluye docs y skills) |
| Pruebas | 32 archivos · **295 tests, todos pasando** (6,6 s) |
| Build | `next build` **OK** (19 páginas + 43 endpoints) |
| Fuentes satelitales | Copernicus Data Space, Google Earth Engine, Microsoft Planetary Computer (STAC público), Landsat (catálogo) |
| Dominio | Calidad de agua del Dren 4000 / río Reque, Lambayeque, Perú |

---

## 1. Veredicto

HydroVision no es un dashboard de tesis: es una plataforma de observación ambiental con capa satelital real, control de procedencia y motores de evaluación. El nivel de ingeniería está por encima del promedio de un trabajo de fin de grado, y hay decisiones científicas que están bien tomadas (bloqueo de parámetros no ópticos, no extrapolación de modelos, separación campo/satélite).

Pero hoy hay tres cosas que limitan su valor científico y su narrativa:

1. **No existen pares campo–satélite válidos.** Las 20 muestras reales son de 2014 y Sentinel-2 empezó a operar en junio de 2015. Sin pares, la calibración nunca pasa de "insuficiente" y las predicciones caen siempre al modelo de literatura. Tu propio código lo documenta (`src/data/mock/dren-4000-real-data.ts:16`), así que no es un bug: es un problema de plan de datos.
2. **La documentación visible describe una fase anterior.** El `README.md` dice "Fase 1, datos simulados"; el `ROADMAP.md` marca como pendientes cosas que ya existen. Quien lo lea —jurado, reclutador, colega— subestima el trabajo.
3. **El núcleo normativo está simplificado.** El clasificador ECA es una tabla plana de 8 parámetros sin categoría (A1/A2/A3/B/C/E3). Para una tesis sobre un dren costero, la categoría E3 y su justificación son parte del argumento, no un detalle.

Los tres se resuelven sin reescribir la plataforma, y dos de ellos se convierten en funciones innovadoras por sí mismos.

---

## 2. Lo que hay hoy

### 2.1 Fortalezas reales (no las toques)

| Fortaleza | Dónde se ve | Por qué importa |
|---|---|---|
| Honestidad computable | `isSimulated` por registro, no por entorno; `SimulatedDataIndicator` | Un dato simulado nunca se confunde con uno real |
| Bloqueo duro de parámetros no ópticos | `src/satellite/config/optically-plausible-parameters.config.ts` | pH, DQO, DBO5, nutrientes y coliformes no se "predicen" desde satélite |
| No extrapolación de modelos | Nechad 2010 y HydroColor rechazan valores fuera de rango | Evita el error clásico de inventar números en los extremos |
| Procedencia explícita | `meta.providerStatus`, `providerFromMeta()` | Se reporta el proveedor real que sirvió el dato, no el que se pidió |
| Rigor estadístico | Split temporal, umbrales de readiness, métricas de validación | No es "entrenar y listo": hay criterios de independencia y dominancia |
| Literatura verificada | DOI de Nechad et al. (2010) y Leeuw & Boss (2018), con advertencia de transferibilidad | Defendible ante un jurado |
| Operación de campo | PWA offline, HydroColor con 3 niveles de confianza, cola de sincronización | Caso de uso real: técnico sin señal en el dren |
| Pruebas | 295 tests passing | Base sólida para refactorizar sin miedo |

### 2.2 Deudas concretas

| Deuda | Evidencia | Impacto |
|---|---|---|
| Documentación desactualizada | `README.md` (Fase 1), `docs/ROADMAP.md`, `docs/PROJECT_STATUS.md` | Alto: primera impresión falsa |
| Sin autenticación real | `src/server/authorization/dev-user-context.ts` (usuario simulado por header) | Alto si se despliega; medio para demo |
| Autorización parcial | 9 de 43 rutas aplican `getSimulatedUserContext`/permisos | Medio |
| Typecheck roto en tests | `tsc --noEmit` falla con 10 errores en `scientific-dataset.builder.test.ts` (el build de Next sí pasa) | Medio: un CI con typecheck falla |
| Sin caché ni rate limit satelital | Rutas `/api/satellite/*` consultan STAC/COG en cada request | Medio: latencia y límites de servicio |
| Duplicación | 2 stacks GEE, 4 mapas Leaflet, 3 namespaces de repositorios | Medio: mantenimiento |
| ECA sin categorías | `src/lib/eca/standards.ts` (8 parámetros, TODO explícito) | Alto para tesis |
| Sin CI ni Docker | No hay `.github/`, `Dockerfile` ni `compose` | Medio: reproducibilidad |
| Esquema Prisma dual | Modelos en español (legacy) y en inglés (nuevos) | Bajo-medio |

---

## 3. El problema que define todo: no hay pares campo–satélite

### 3.1 Cronología

- Muestras reales: **1 de marzo y 1 de setiembre de 2014**, 10 puntos, 20 registros (Nizama Pacheco & Cabrera Carranza, 2018).
- Sentinel-2A: lanzado el **23 de junio de 2015**. Sentinel-2B: 2017.
- Landsat 8: operativo desde **2013** (30 m, revisita 16 días).

Es decir: para las dos fechas de 2014 **no existe imagen Sentinel-2**. No es que falte procesarla; no fue adquirida.

### 3.2 Además, no son 20 observaciones independientes

Los 10 puntos se muestrearon el mismo día, en un gradiente espacial continuo. Estadísticamente son **2 fechas** con pseudorreplicación espacial, no 20 muestras independientes. Cualquier regresión con esos datos tendría un n efectivo cercano a 2, y un R² alto sería un artefacto de autocorrelación espacial.

### 3.3 Qué implica en el producto

- `evaluateParameterReadiness` exige 30 pares reales, 3 estaciones y 2 periodos temporales independientes (`calibration-readiness.config.ts`). Con los datos actuales nunca se alcanza.
- Por eso `/prediccion` responde `PREDICTED_LITERATURE_MODEL` o `INSUFFICIENT_*`. Es honesto, pero significa que **el módulo estrella de la tesis no está validado con datos propios**.

### 3.4 Cuatro salidas (no excluyentes)

| Salida | Qué da | Costo | Riesgo |
|---|---|---|---|
| **A. Campañas nuevas sincronizadas** | Pares reales; calibración defendible | Medio (logística de campo) | El clima/la logística fallan |
| **B. Landsat 8 para 2014** | Pares históricos a 30 m; prueba el pipeline | Bajo | Canal estrecho → píxel mezclado |
| **C. Prior bayesiano** | Modelo con literatura + pocos datos, con incertidumbre | Medio | Jurado poco familiarizado |
| **D. Cambiar la promesa** | "Sistema de observación y priorización", no "modelo validado" | Bajo | Menos ambicioso, más defendible |

Recomendación: **A + B**, con C como respaldo metodológico y D como encuadre mientras no haya datos.

### 3.5 El elefante en la sala: el ancho del canal

Un dren agrícola puede tener 10–20 m de ancho. Un píxel Sentinel-2 es de 10 m (bandas visibles/NIR) o 20 m (red edge/SWIR). Eso significa **píxeles mixtos**: agua + suelo + vegetación en la misma celda. Es la objeción técnica más fuerte que puede hacer un jurado con experiencia en teledetección, y hay que cuantificarla, no ignorarla:

- Calcular pureza de píxel con SCL/NDWI y reportar la fracción de agua.
- Usar bandas de 20 m (B05, B11) con conciencia de la mezcla.
- Comparar con Landsat (30 m) para mostrar el efecto de escala.
- Si se quiere resolución real: PlanetScope (3 m) o dron multiespectral, ambos con costo.

---

## 4. Comparación con referentes

| Referente | Qué hace bien | Brecha en HydroVision | Qué copiar |
|---|---|---|---|
| **[ACOLITE](https://github.com/acolite/acolite)** (RBINS) | Corrección atmosférica para aguas interiores/costeras, corrección de glint y adyacencia | Usa L2A (Sen2Cor) y asume que la reflectancia de superficie ≈ reflectancia de salida del agua | Comparar Sen2Cor vs ACOLITE en al menos una escena; marcar el método de AC en cada observación |
| **[POLYMER](https://github.com/hygeos/polymer)** | Corrección atmosférica con corrección de reflejo solar, optimización espectral | Igual que arriba | Pipeline alternativo para aguas turbias; validar contra ACOLITE |
| **[C2RCC](https://www.brockmann-consult.de/c2rcc/)** (ESA SNAP) | Inversión de constituyentes ópticamente activos con red neuronal; incertidumbre | Solo índices empíricos (NDTI, MNDWI) | Retrieval de SST/clorofila con incertidumbre por píxel |
| **[CyAN](https://www.epa.gov/sites/default/files/2019-06/documents/cyan_app_fact_sheet_final_19jun19_508_compliant.pdf)** (EPA/NASA/NOAA) | Índice semanal de cianobacterias + app móvil + alertas por cuerpo de agua | Dashboard interno, sin alertas ni app pública | Cadencia operativa semanal, alertas, lenguaje para no expertos |
| **[CSIRO AquaWatch](https://www.csiro.au/en/news/All/News/2024/April/Australia-joins-with-UK-to-deliver-large-scale-water-quality-monitoring-from-space)** | "Servicio meteorológico del agua": satélite + in-situ + modelos + pronóstico + alertas | Todo es pasado; no hay pronóstico | Producto de pronóstico y encuadre de servicio |
| **[CyanoLakes](https://cyanlakes.com/)** | Reportes productizados de estado trófico, clorofila y riesgo de floraciones | Reportes genéricos | Índice de estado trófico y reportes por cuerpo de agua |
| **[EOMAP](https://www.eomap.com/) / [WaterInsight](https://www.waterinsight.nl/)** | Retrieval físico (WASI), incertidumbre por píxel, validación comercial | Incertidumbre heurística ±RMSE | Capa de incertidumbre y reporte de validación |
| **[OpenET](https://openetdata.org/)** | Ensemble de modelos, comparación entre modelos, incertidumbre, API pública | Un solo modelo lineal | Ensemble + intercomparación + API |
| **[mWater](https://www.mwater.co/) / [Akvo](https://akvo.org/) / [ODK](https://getodk.org/)** | Formularios offline, cadena de custodia de muestras, multi-tenant | PWA offline básica, sin cadena de custodia | QR por muestra, ingesta de resultados de laboratorio, validación en campo |
| **[OpenAQ](https://openaq.org/)** | Agregación y armonización de datos abiertos, API, licencia clara | API interna, sin licencia de datos | API pública + licencia + federación de fuentes |
| **[OGC SensorThings](https://www.ogc.org/standards/sensorthings) / [HydroServer](https://www.hydroserver.org/)** | API estandarizada de observaciones; publicación FAIR con DOI | JSON propio | Endpoint STA + DOI en Zenodo para el dataset de tesis |
| **[JRC Global Surface Water](https://global-surface-water.appspot.com/) / [Dynamic World](https://dynamicworld.app/)** | Máscaras de agua y cambios multitemporales | Sin máscara de canal | Delimitar el dren, medir cambios de espejo de agua y desbordes |
| **[NOAA HAB forecasts](https://coastalscience.noaa.gov/science-areas/habs/)** | Boletín operativo con probabilidad y nivel de confianza | Sin boletín | Formato de boletín con probabilidad de exceder umbral |

### 4.1 Qué copiar y qué no

**Copiar:** la cadencia operativa (CyAN), el encuadre de servicio con pronóstico (AquaWatch), la incertidumbre explícita (EOMAP/OpenET), la interoperabilidad (SensorThings), la cadena de custodia (mWater/ODK) y la corrección atmosférica específica de agua (ACOLITE).

**No copiar (todavía):** multi-tenant, facturación, app nativa, microservicios. HydroVision es una tesis: la prioridad es validez científica y claridad narrativa, no escala comercial.

---

## 5. Funciones innovadoras priorizadas

Criterios: **impacto en la tesis** (defensa, originalidad), **impacto en producto** (utilidad real), **esfuerzo** (S/M/L) y **riesgo**.

### Horizonte A — 0 a 6 semanas (alto impacto, bajo riesgo)

#### A1. Planificador de campañas sincronizado con el satélite
**Qué:** dado un punto y un rango de fechas, el sistema muestra las próximas pasadas de Sentinel-2/Landsat, el pronóstico de nubosidad y propone ventanas de muestreo (±3 días) que sí producirán pares válidos.

**Por qué es innovador:** casi nadie lo tiene; resuelve exactamente el problema que hoy bloquea la calibración. Convierte un requisito científico en una herramienta de campo.

**Cómo:** endpoint `GET /api/satellite/opportunities?stationId&days=30`; búsqueda STAC de las próximas escenas; pronóstico de nubosidad con Open-Meteo (gratis, sin clave); cruce con `MATCHING_MAX_TEMPORAL_DIFFERENCE_DAYS = 7`; UI de calendario; exportación a PDF/ICS.

**Esfuerzo:** M · **Impacto:** 5/5.

#### A2. ECA por categoría (DS N° 004-2017-MINAM)
**Qué:** matriz de límites por categoría (A1, A2, A3, B1, B2, C1–C3, D1–D3, E1–E3), selector de categoría por cuerpo de agua y justificación explícita para el Dren 4000 (E3, ecosistemas costeros y marinos).

**Por qué es innovador:** hoy el clasificador es una tabla plana de 8 parámetros; un motor normativo auditable por categoría no existe en abierto para Perú.

**Cómo:** reemplazar `ECA_STANDARDS` por un catálogo tipado `categoria → parámetro → límite/unidad`; migración Prisma (`EcaStandard` ya existe); tests por categoría; mostrar la norma y el artículo en la UI.

**Esfuerzo:** M · **Impacto:** 5/5 (es el corazón normativo de la tesis).

#### A3. Scorecard de procedencia y calidad por observación
**Qué:** cada observación satelital muestra, en una tarjeta: proveedor, fecha, nubosidad, clase SCL, pureza de píxel, diferencia temporal con la muestra, método de corrección atmosférica, versión del modelo y estado de aplicabilidad.

**Por qué es innovador:** convierte la honestidad que ya está en el código en un artefacto visible y auditable.

**Cómo:** consolidar `pixel-quality.ts`, `scientific-pair-quality.ts` y `satellite-observation.builder.ts` en un único `QualityScorecard` que viaje en la respuesta API.

**Esfuerzo:** S–M · **Impacto:** 4/5.

#### A4. Landsat 8/9 como fuente histórica y comparador multi-sensor
**Qué:** añadir Landsat C2 L2 como proveedor (STAC de USGS), con la misma tubería de observaciones. Permite emparejar 2014 y comparar Sentinel-2 vs Landsat sobre la misma fecha.

**Por qué es innovador:** la comparación multi-sensor es un argumento de validez, no solo una fuente de respaldo.

**Cómo:** adaptador análogo a `planetary.adapter.ts`; escalar reflectancia; remuestrear a la malla del punto; reportar la penalización de resolución (30 m vs 10 m).

**Esfuerzo:** M · **Impacto:** 4/5.

#### A5. "Evidence bundle" exportable
**Qué:** un paquete reproducible (JSON + PDF) por predicción o reporte: insumos, escena, coeficientes, métricas, n, supuestos, versión del código y hash.

**Por qué es innovador:** es lo que un jurado o un revisor necesita para creer el número; casi ningún TFG lo entrega.

**Cómo:** serializar el objeto de resultado + metadatos; hash SHA-256; PDF con plantilla; adjuntar al anexo de tesis.

**Esfuerzo:** S · **Impacto:** 4/5.

#### A6. Alertas y reportes programados
**Qué:** umbrales por parámetro, alertas por correo/Telegram/WhatsApp y reporte PDF semanal automático.

**Cómo:** job programado (cron de Vercel o `node-cron`), reutilizando `report.service.ts`; bot de Telegram (gratis).

**Esfuerzo:** S–M · **Impacto:** 3/5.

### Horizonte B — 2 a 4 meses (diferenciación)

#### B1. Pronóstico a 7 días con incertidumbre
Persistencia + lluvia/marea (Open-Meteo) + modelo lineal; intervalos de predicción; boletín tipo AquaWatch. **Esfuerzo:** M · **Impacto:** 5/5.

#### B2. Detección de anomalías
EWMA/CUSUM y z-score robusto; Isolation Forest cuando haya serie. Alertas cuando la turbidez se sale del patrón estacional. **Esfuerzo:** S–M · **Impacto:** 4/5.

#### B3. Gemelo digital 1D del dren
Modelo de advección-dispersión con escenarios (vertido, lluvia, caudal). Permite responder "¿qué pasa si…?" y da un capítulo fuerte a la tesis. **Esfuerzo:** L · **Impacto:** 5/5.

#### B4. Ciencia ciudadana con HydroColor
Fotos georreferenciadas, validación cruzada con satélite, niveles de confianza y control de calidad. **Esfuerzo:** M · **Impacto:** 3/5.

#### B5. API pública e interoperabilidad
Endpoint OGC SensorThings, exportación a SINIA/ANA, DOI del dataset en Zenodo. **Esfuerzo:** M · **Impacto:** 4/5 (institucional).

### Horizonte C — apuestas de investigación

| Idea | Qué aporta | Esfuerzo |
|---|---|---|
| Aprendizaje activo para muestreo | El sistema decide dónde/dónde muestrear para maximizar información (GP / D-optimal) | L |
| Ensemble multisensor + conformal prediction | Intervalos con garantía empírica; comparación de modelos | L |
| Asimilación de datos (EnKF) | El modelo se actualiza con cada muestra nueva | L |
| Gemelo digital 2D + escenarios de gestión | Humedal, reúso, restauración | XL |

### 5.5 Tabla de scoring

| # | Función | Tesis | Producto | Esfuerzo | Prioridad |
|---|---|---|---|---|---|
| A1 | Planificador de campañas | 5 | 5 | M | **1** |
| A2 | ECA por categoría | 5 | 4 | M | **2** |
| A3 | Scorecard de calidad | 4 | 4 | S–M | **3** |
| A4 | Landsat histórico | 4 | 3 | M | **4** |
| A5 | Evidence bundle | 4 | 3 | S | **5** |
| B1 | Pronóstico 7 días | 5 | 4 | M | 6 |
| B2 | Anomalías | 3 | 4 | S–M | 7 |
| B3 | Gemelo digital 1D | 5 | 3 | L | 8 |
| A6 | Alertas | 2 | 4 | S–M | 9 |
| B5 | API/STA/DOI | 3 | 4 | M | 10 |
| B4 | Ciencia ciudadana | 3 | 3 | M | 11 |
| C1 | Aprendizaje activo | 4 | 2 | L | 12 |

---

## 6. Las preguntas que te va a hacer el jurado

| Pregunta | Respuesta hoy | Qué falta |
|---|---|---|
| "¿Sentinel-2 sirve para un dren de 10–20 m?" | No se aborda | Cuantificar pureza de píxel y discutir mezcla espectral |
| "¿Validaron la corrección atmosférica?" | Se asume L2A ≈ reflectancia de agua | Comparar Sen2Cor vs ACOLITE/POLYMER |
| "¿Con 20 muestras alcanza?" | El sistema exige 30 pares y 2 periodos | Explicar pseudorreplicación y planificar campañas |
| "¿Por qué NDCI para fosfatos?" | Está como relación candidata | Eliminarlo o marcarlo como exploración pura |
| "¿Qué categoría ECA aplica?" | Tabla única sin categoría | Definir E3 y justificar |
| "¿Cómo validan el modelo?" | Split temporal + RMSE | Añadir LOO por fecha, sesgo, NSE e intervalos |
| "¿Y si el modelo se usa fuera del rango calibrado?" | Hay guardas en Nechad/HydroColor | Dominio de aplicabilidad explícito (Mahalanobis/convex hull) |
| "¿Es reproducible?" | Tests y docs | Evidence bundle + DOI + Docker |

---

## 7. Quick wins de ingeniería (1 a 3 días)

1. **Reset documental:** reescribir `README.md` con el estado real; archivar `ROADMAP.md` y `PROJECT_STATUS.md` obsoletos; dejar un único `STATUS.md`. Es la mejora con mejor relación impacto/esfuerzo.
2. **Arreglar el typecheck:** 10 errores en `scientific-dataset.builder.test.ts` (fixtures incompletos). `next build` pasa, pero un CI con `tsc --noEmit` no.
3. **CI:** `.github/workflows/ci.yml` con `npm ci`, `tsc --noEmit`, `vitest run`, `next build`.
4. **Docker Compose:** Postgres + app; `.env.example` con `DATA_SOURCE=mock` por defecto para demo sin base de datos.
5. **Auth o modo demo explícito:** Auth.js (Credentials) o banner "DEMO sin autenticación" y bloqueo de `/admin` y `/users` en producción.
6. **Caché + rate limit** en `/api/satellite/*` (LRU 24 h para escenas; límite por IP).
7. **Consolidar duplicados:** 2 stacks GEE, 4 mapas Leaflet, 3 namespaces de repositorios.

---

## 8. Plan 30 / 60 / 90 días

| Periodo | Entregables |
|---|---|
| **Días 1–30** | Docs al día · typecheck verde · CI · Docker · A1 planificador · A2 ECA por categoría · A3 scorecard |
| **Días 31–60** | A4 Landsat · A5 evidence bundle · A6 alertas · primera campaña de campo sincronizada (3 fechas) |
| **Días 61–90** | B1 pronóstico · B2 anomalías · segunda campaña · paper/informe con métricas de validación |

---

## 9. Cómo contarlo en la tesis

Tres contribuciones defendibles, en orden de fuerza:

1. **Protocolo y herramienta para muestreo sincronizado con satélite** en un dren costero peruano: el planificador (A1) no es un adorno, es el método que hace posible la validación.
2. **Arquitectura de procedencia e incertidumbre**: cada número declara origen, calidad y límites (A3, A5). Es original y transferible a otras cuencas.
3. **Motor normativo ECA por categoría** (A2): aporta valor institucional directo a ANA/OEFA y diferencia la plataforma de un dashboard genérico.

Opcional para un capítulo de modelado: gemelo digital 1D (B3) o pronóstico (B1).

---

## 10. Fuentes

- ACOLITE — https://github.com/acolite/acolite
- POLYMER — https://github.com/hygeos/polymer
- C2RCC — https://www.brockmann-consult.de/c2rcc/
- CyAN (EPA/NASA/NOAA) — https://www.epa.gov/sites/default/files/2019-06/documents/cyan_app_fact_sheet_final_19jun19_508_compliant.pdf
- CSIRO AquaWatch — https://www.csiro.au/en/news/All/News/2024/April/Australia-joins-with-UK-to-deliver-large-scale-water-quality-monitoring-from-space
- CyanoLakes — https://cyanlakes.com/
- EOMAP — https://www.eomap.com/
- WaterInsight — https://www.waterinsight.nl/
- OpenET — https://openetdata.org/
- mWater — https://www.mwater.co/
- Akvo — https://akvo.org/
- ODK — https://getodk.org/
- OpenAQ — https://openaq.org/
- OGC SensorThings API — https://www.ogc.org/standards/sensorthings
- HydroServer — https://www.hydroserver.org/
- JRC Global Surface Water — https://global-surface-water.appspot.com/
- Dynamic World — https://dynamicworld.app/
- NOAA HAB forecasts — https://coastalscience.noaa.gov/science-areas/habs/
- SINIA (MINAM) — https://sinia.minam.gob.pe/
- OEFA — https://www.gob.pe/oefa
- DS N° 004-2017-MINAM (ECA agua) — https://www.gob.pe/institucion/minam/normas-legales
- Nechad, B., Ruddick, K. G., & Park, Y. (2010). *Calibration and validation of a generic multisensor algorithm for mapping of total suspended matter in turbid waters*. Remote Sensing of Environment, 114(4), 854–866.
- Leeuw, T., & Boss, E. (2018). *The HydroColor App*. Sensors, 18(1), 256.

---

*Documento de trabajo generado a partir del código en `77be869`. Las cifras de pruebas (295) corresponden a la ejecución del 19/10/2026.*
