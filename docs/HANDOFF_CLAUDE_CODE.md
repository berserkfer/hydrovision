# Handoff — HydroVision para Claude Code

**Repositorio:** `github.com/berserkfer/hydrovision`
**Último commit:** `f3b57e7`
**Fecha:** 20 de octubre de 2026
**Uso:** pega este documento en el repo y pide a Claude Code ejecutar **un bloque por vez**, con tests y commit.

---

## 1. Contexto

HydroVision es la plataforma de la tesis de Ingeniería Ambiental (UCV) sobre calidad del agua del **Dren 4000**, Santa Rosa, Lambayeque, Perú. Título del proyecto: *"Desarrollo de plataforma predictiva de la calidad del agua mediante Sentinel-2 y datos in situ, Dren 4000, Lambayeque, 2027"*.

Stack: Next.js 15.5, React 19, TypeScript estricto, Tailwind 4, Prisma 6/PostgreSQL. Capa satelital real vía Microsoft Planetary Computer (Sentinel-2 L2A) y adaptadores Copernicus/GEE.

Datos clave:

- 20 muestras reales de 2014 (10 puntos × 2 fechas: 2014-03-01 y 2014-09-01), fuente Nizama Pacheco & Cabrera Carranza (2018).
- **Sentinel-2A se lanzó el 23/06/2015**: esas muestras no tienen par satelital. El código lo documenta en `src/data/mock/dren-4000-real-data.ts`.
- Landsat 8 (desde 2013) sí podría emparejar 2014, a 30 m.
- El Excel de la tesis tiene coliformes 2015-2016, promedios 2017 y estudios experimentales.

Estado verificado: **324 tests pasan** (35 archivos) y `next build` compila.

Documentos de referencia:

- `docs/INFORME_COMPARATIVO_2026-10.md` — análisis con 13 referentes y roadmap.
- `docs/ESTADO_TRABAJO.md` — checklist y punto de reanudación.
- `docs/TECHNICAL_AUDIT_V2.md`, `docs/SATELLITE_DATA_ARCHITECTURE.md` — arquitectura (parcialmente desactualizados).

---

## 2. Reglas no negociables

1. **No inventar valores normativos ni datos.** Si un límite no se verificó contra la norma, se marca `pendingVerification` y no clasifica.
2. **No mezclar ECA y LMP** en un mismo veredicto. ECA aplica al cuerpo de agua; LMP al efluente.
3. **No tocar el punto 7** (recursos, financiamiento y cronograma del documento de tesis).
4. Mantener la honestidad de datos: `isSimulated` por registro, disclaimers, "sin datos suficientes" antes que un número inventado.
5. Cada bloque termina con tests pasando y un `git commit` propio.

---

## 3. Decisiones ya tomadas

| Punto | Decisión |
|---|---|
| Cauce del dren | ECA **E2** por defecto; **D1** opcional si se documenta reúso para riego |
| Zona marina (P6, P7, P9, P10) | ECA **E3** |
| P1 (laguna de oxidación) | **LMP PTAR** (D.S. 003-2010-MINAM) |
| P2–P5 (pesqueros) | **LMP pesca** (D.S. 010-2008-PRODUCE, columna I) |
| P8 (agua de proceso) | Excluido: no es punto de descarga |
| Ventana campo–satélite | **±3 días** |
| Píxel mezclado | `f_agua` con NDWI en ventana 3×3; ≥ 0,5 y mínimo 3 píxeles |
| Validación | **Leave-one-date-out** como estrategia principal |

---

## 4. Lo ya implementado (no rehacer)

| Commit | Contenido |
|---|---|
| `5a1980f` | Motor normativo ECA/LMP: `src/lib/normative/{types,catalog,evaluate,resolve,index}.ts` + 15 tests; `classifyMeasurementAgainstProfile`, `classifyForPointType`, `toComplianceResult` en `src/lib/eca/classifier.ts`; `fatsOils` en `FieldMeasurement` |
| `864a8ba` | Página `/normativa` (`src/components/normative/NormativeComplianceView.tsx`, `src/app/normativa/page.tsx`) y entrada de navegación |
| `b810aea` | Ventana única ±3 días en `src/satellite/config/matching.config.ts`; readiness y validación usan la misma constante; test explícito |
| `092c785` | Fracción de agua: `src/satellite/quality/water-fraction.ts` (+9 tests), ventana 3×3 en `pc-band-reader.ts` y `planetary.adapter.ts`, campos en `SatelliteObservation`, bloqueo `NO_WATER_PIXELS` en `prediction.service.ts` |
| `f3b57e7` | `src/satellite/calibration/leave-one-date-out.ts` (+4 tests), `crossValidation` en la respuesta de calibración, metadatos de agua en `SatelliteQualityMetadata` |

Valores normativos cargados y verificados (con fuente en `catalog.ts`):

- ECA E2: pH 6,5–9,0; DBO5 ≤10; OD ≥5; SST ≤100; conductividad ≤1000; coliformes termotolerantes ≤2000; nitratos ≤13; aceites y grasas ≤5.
- ECA E3: pH 6,8–8,5; DBO5 ≤10; OD ≥4; SST ≤30; coliformes ≤2000; nitratos ≤200; aceites ≤5.
- ECA D1: pH 6,5–8,5; DBO5 ≤15; DQO ≤40; OD ≥4; conductividad ≤2500; coliformes ≤1000; nitratos ≤100; aceites ≤5.
- LMP PTAR: pH 6,5–8,5; DBO5 ≤100; DQO ≤200; SST ≤150; aceites ≤20; coliformes ≤10 000; temperatura <35 °C.
- LMP pesca: pH 6–9; DBO5 ≤60; SST ≤100; aceites ≤20.

Fósforo/fosfatos queda `pendingVerification` porque el ECA limita fósforo total, no fosfatos.

---

## 5. Lo que falta — plataforma

### Bloque A — Integración del motor normativo (prioridad alta)

1. Persistir el tipo de punto por estación (campo Prisma `Station` o configuración por código).
2. Selector de perfil (E2 / E3 / D1 / LMP PTAR / LMP pesca) en `/normativa`.
3. Endpoint `POST /api/normative/evaluate` que reciba medición + perfil y devuelva `NormativeEvaluation`.
4. Sección "Cumplimiento normativo" en el PDF de reportes.

**Aceptación:** el usuario puede cambiar el perfil y ver el veredicto; el PDF incluye la tabla con la fuente de cada límite.

### Bloque B — Scorecard visible

Los campos `waterFraction`, `pixelsUsed` y `waterSufficiency` ya viajan en `SatelliteObservation` y en `quality`. Falta mostrarlos en la vista satelital (tabla o tarjeta) y advertir cuando `waterSufficiency === "insufficient"`.

### Bloque C — Deuda técnica (opcional, no bloquea la tesis)

| Problema | Evidencia |
|---|---|
| `tsc --noEmit` falla | 10 errores en `src/server/satellite/validation/scientific-dataset.builder.test.ts` (fixtures incompletos); `next build` sí pasa |
| Sin autenticación real | `src/server/authorization/dev-user-context.ts` |
| Sin caché ni rate limit satelital | `/api/satellite/*` |
| Docs desactualizados | `README.md`, `docs/ROADMAP.md`, `docs/PROJECT_STATUS.md` |
| Duplicación | 2 stacks GEE, 4 mapas Leaflet, 3 namespaces de repositorios |

---

## 6. Lo que falta — documento de tesis

Archivo: `Proyecto_de_investigacion_HydroVision_formato_UCV_corregido.docx`.

1. **Año:** la universidad pidió **2027**. Cambiar las dos frases que aún dicen 2026 (problema y objetivo general).
2. **Autoría de Nizama:** la referencia dice "W. R. y C. E."; los autores reales son **Lizveth Karín Nizama Pacheco** y **Carlos Francisco Cabrera Carranza**.
3. **ECA vs LMP:** separar P1 LMP PTAR; P2–P5 LMP pesca; cauce E2 (o D1); P6–P10 E3; P8 excluido.
4. **Píxel mezclado:** reemplazar "se descartarán los píxeles que mezclen agua con márgenes" por `f_agua ≥ 0,5`, mínimo 3 píxeles y reporte de pureza.
5. **Tamaño muestral:** el plan dice 20 observaciones nuevas; la plataforma exige 30 pares. Subir a ≥30 pares (5 puntos × 6 fechas) o declarar el nivel exploratorio.
6. **Ventana:** la tesis dice ±5 días; el código ya usa **±3**. Unificar en 3.
7. **Validación:** 70/30 con n=20 deja 6 puntos de prueba. Cambiar a leave-one-date-out (ya implementado en la plataforma) y reportar media ± desviación e intervalo.
8. **Anexos 3 y 4** (matriz de operacionalización y ficha de campo) pendientes.
9. **Tablas administrativas** (punto 7): no tocar en esta fase.

---

## 7. Comandos

```bash
npm ci
npx vitest run                 # 324 tests
npx tsc --noEmit               # falla por los fixtures (ver deuda)
npm run build                  # OK, incluye /normativa
npm run dev                    # http://localhost:3000/normativa
```

Nota: en PowerShell, `vitest` escribe un warning de Vite en stderr y el proceso termina con código 1 aunque los tests pasen. No confundir con fallo.

---

## 8. Prompts sugeridos para Claude Code

**Bloque A:**

> En HydroVision, integra el motor normativo de `src/lib/normative`: persiste el tipo de punto por estación, añade un selector de perfil (E2, E3, D1, LMP PTAR, LMP pesca) en `/normativa`, crea `POST /api/normative/evaluate` y agrega la sección "Cumplimiento normativo" al PDF. No modifiques los valores de `catalog.ts`. Tests y commit.

**Bloque B:**

> Muestra `waterFraction`, `pixelsUsed` y `waterSufficiency` en la vista satelital de HydroVision y advierte cuando la suficiencia sea insuficiente. Añade un test de render o de la función de formato. Commit.

**Documento:**

> Corrige el .docx de la tesis: año 2027 en problema y objetivo; autoría de Nizama (Lizveth Karín Nizama Pacheco y Carlos Francisco Cabrera Carranza); separa LMP (P1–P5) de ECA (E2 cauce, E3 mar, P8 excluido); reemplaza el descarte de píxeles mezclados por la regla f_agua ≥ 0,5; sube el mínimo a 30 pares o declara exploratorio; unifica la ventana en ±3 días; cambia la validación a leave-one-date-out. No toques recursos, financiamiento ni cronograma.

---

## 9. Archivos de datos y fuentes

- `C:\Users\ferch\Downloads\Paquete_Tesis_Dren4000_antes_de_Astra.xlsx` — 13 hojas; `Datos_2014` tiene UTM de los 10 puntos; `Plan_Sentinel` reconoce que 2014 no tiene Sentinel-2.
- `C:\Users\ferch\Downloads\admOjs__IIGeo_21-41_006_LizvethNizama.pdf` — paper fuente; Figura 1 es un mapa georreferenciable del cauce.
- `C:\Users\ferch\Downloads\Proyecto_de_investigacion_HydroVision_formato_UCV_corregido.docx` — proyecto de tesis.
- Normas verificadas en `_analisis/normas/` (D.S. 004-2017, D.S. 003-2010, D.S. 010-2008).

---

## 10. Reanudación

1. `git log --oneline -8` → el último commit debe ser `f3b57e7` o posterior.
2. Leer `docs/ESTADO_TRABAJO.md`.
3. Continuar por el bloque A (integración) o por las correcciones del documento.
4. Si algo no coincide con este documento, **el código y los tests mandan**.
