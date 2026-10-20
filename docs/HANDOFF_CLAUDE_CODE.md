# Handoff — HydroVision para Claude Code

**Repositorio:** `github.com/berserkfer/hydrovision`
**Último commit:** `864a8ba` (página `/normativa`)
**Fecha:** 20 de octubre de 2026
**Uso:** pega este documento en el repo y pide a Claude Code ejecutar **un bloque por vez**, con tests y commit. No ejecutes todo de golpe.

---

## 1. Contexto

HydroVision es la plataforma de la tesis de Ingeniería Ambiental (UCV) sobre calidad del agua del **Dren 4000**, Santa Rosa, Lambayeque, Perú. Título del proyecto: *"Desarrollo de plataforma predictiva de la calidad del agua mediante Sentinel-2 y datos in situ, Dren 4000, Lambayeque, 2027"*.

Stack: Next.js 15.5, React 19, TypeScript estricto, Tailwind 4, Prisma 6/PostgreSQL. Capa satelital real vía Microsoft Planetary Computer (Sentinel-2 L2A) y adaptadores Copernicus/GEE.

Datos clave:

- 20 muestras reales de 2014 (10 puntos × 2 fechas: 2014-03-01 y 2014-09-01), fuente Nizama Pacheco & Cabrera Carranza (2018).
- **Sentinel-2A se lanzó el 23/06/2015**, por lo que esas muestras NO tienen par satelital. El código ya lo documenta en `src/data/mock/dren-4000-real-data.ts`.
- Landsat 8 (desde 2013) sí podría emparejar 2014, a 30 m.
- Hay datos de coliformes 2015-2016, promedios 2017 y estudios experimentales en el Excel de la tesis (`Paquete_Tesis_Dren4000_antes_de_Astra.xlsx`).

Estado verificado antes del handoff: **310 tests pasan** (33 archivos) y `next build` compila, incluida la ruta `/normativa`.

Documentos de referencia en el repo:

- `docs/INFORME_COMPARATIVO_2026-10.md` — análisis con 13 referentes y roadmap.
- `docs/ESTADO_TRABAJO.md` — checklist y punto de reanudación.
- `docs/TECHNICAL_AUDIT_V2.md`, `docs/SATELLITE_DATA_ARCHITECTURE.md` — arquitectura (parcialmente desactualizados).

---

## 2. Reglas no negociables

1. **No inventar valores normativos ni datos.** Si un límite no se verificó contra la norma, se marca `pendingVerification` y no clasifica.
2. **No mezclar ECA y LMP** en un mismo veredicto. ECA aplica al cuerpo de agua; LMP al efluente.
3. **No tocar el punto 7** (tablas administrativas del documento de tesis: recursos, financiamiento, cronograma).
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
| Ventana campo–satélite | **±3 días** (hoy el código usa 7) |
| Píxel mezclado | Calcular `f_agua`; conservar ≥ 0.5; si hay < 3 píxeles, "sin píxeles de agua suficientes" |
| Validación | **Leave-one-date-out** como estrategia principal |

---

## 4. Lo ya implementado

### Commit `5a1980f` — motor normativo

- `src/lib/normative/types.ts` — tipos de instrumento, perfiles y evaluación.
- `src/lib/normative/catalog.ts` — catálogo verificado:
  - ECA E2: pH 6,5–9,0; DBO5 ≤10; OD ≥5; SST ≤100; conductividad ≤1000; coliformes termotolerantes ≤2000; nitratos ≤13; aceites y grasas ≤5.
  - ECA E3: pH 6,8–8,5; DBO5 ≤10; OD ≥4; SST ≤30; coliformes ≤2000; nitratos ≤200; aceites ≤5.
  - ECA D1: pH 6,5–8,5; DBO5 ≤15; DQO ≤40; OD ≥4; conductividad ≤2500; coliformes ≤1000; nitratos ≤100; aceites ≤5.
  - LMP PTAR: pH 6,5–8,5; DBO5 ≤100; DQO ≤200; SST ≤150; aceites ≤20; coliformes ≤10 000; temperatura <35 °C.
  - LMP pesca: pH 6–9; DBO5 ≤60; SST ≤100; aceites ≤20.
- `src/lib/normative/evaluate.ts` — clasificación con banda de alerta del 10 %.
- `src/lib/normative/resolve.ts` — mapeo tipo de punto → perfil.
- `src/lib/normative/normative.test.ts` — 15 tests.
- `src/lib/eca/classifier.ts` — añade `classifyMeasurementAgainstProfile`, `classifyForPointType`, `toComplianceResult`.
- `src/types/index.ts` — `fatsOils?: number` en `FieldMeasurement`.

**Fósforo/fosfatos:** el ECA limita fósforo total, no fosfatos. Quedó `pendingVerification: true` y se reporta como "no aplica" hasta tener fósforo total.

### Commit `864a8ba` — página `/normativa`

- `src/components/normative/NormativeComplianceView.tsx` — evaluación de los puntos del Dren 4000 con el instrumento que corresponde, resumen, tabla y detalle por parámetro.
- `src/app/normativa/page.tsx`.
- `src/platform/modules/navigation.ts` — entrada "Cumplimiento Normativo".

---

## 5. Lo que falta — plataforma

### Bloque 2 — Ventana única ±3 días

Archivo: `src/satellite/config/matching.config.ts` (hoy `MATCHING_MAX_TEMPORAL_DIFFERENCE_DAYS = 7`).
Tareas:

1. Cambiar a 3 y exportar una sola constante usada por matching, validación y UI.
2. Mostrar la diferencia exacta en días como variable de calidad.
3. Test que verifique el límite.

**Aceptación:** un solo valor en el código; la tesis dice lo mismo; tests verdes.

### Bloque 3 — Fracción de agua y pureza de píxel

Archivos: `src/server/planetary/planetary.adapter.ts`, `src/satellite/types/satellite-observation.types.ts`, `src/satellite/quality/pixel-quality.ts`.

Tareas:

1. Calcular `waterFraction` por píxel con NDWI = (B03 − B08)/(B03 + B08), umbral configurable.
2. Añadir `waterFraction` y `pixelsUsed` a la observación satelital.
3. Regla: conservar `f_agua >= 0.5`; si quedan < 3 píxeles, devolver estado "sin píxeles de agua suficientes" (no un valor).
4. Mostrar ambos en el scorecard.
5. Tests con casos: píxel puro, mezcla 50/50, sin agua.

**Aceptación:** ninguna estimación sale sin `waterFraction`, `pixelsUsed` y estado de suficiencia.

### Bloque 4 — Validación leave-one-date-out

Archivos: `src/server/satellite/calibration/scientific-calibration.service.ts`, `src/satellite/calibration/temporal-split.ts`, `src/satellite/calibration/regression-metrics.ts`.

Tareas:

1. Añadir estrategia `leave_one_date_out`: por cada fecha, entrenar con las demás y validar con la excluida.
2. Reportar métricas por fold y media ± desviación (R², RMSE, MAE, sesgo).
3. Mantener 70/30 como opción secundaria.
4. Test con dataset sintético de 4 fechas.

**Aceptación:** la respuesta incluye métricas por fold y su dispersión, no un único R².

### Bloque 5 — Integración del motor normativo

1. Persistir el tipo de punto por estación (campo Prisma o configuración).
2. Selector de perfil (E2/E3/D1/LMP) en `/normativa`.
3. Endpoint `POST /api/normative/evaluate` para reportes.
4. Sección "Cumplimiento normativo" en el PDF.

---

## 6. Lo que falta — documento de tesis

Archivo: `Proyecto_de_investigacion_HydroVision_formato_UCV_corregido.docx` (en Descargas del autor).

Correcciones acordadas:

1. **Año:** la universidad pidió **2027**. Cambiar las dos frases que aún dicen 2026 (problema y objetivo general).
2. **Autoría de Nizama:** la referencia dice "W. R. y C. E."; los autores reales son **Lizveth Karín Nizama Pacheco** y **Carlos Francisco Cabrera Carranza**.
3. **ECA vs LMP:** en la metodología (objetivo específico 1) se comparan todos los puntos contra ECA. Separar: P1 LMP PTAR; P2–P5 LMP pesca; cauce E2 (o D1); P6–P10 E3. P8 no es descarga.
4. **Píxel mezclado:** reemplazar "se descartarán los píxeles que mezclen agua con márgenes" por la regla `f_agua >= 0.5`, mínimo 3 píxeles y reporte de pureza.
5. **Tamaño muestral:** el plan dice 20 observaciones nuevas; la plataforma exige 30 pares. Subir a ≥30 pares (5 puntos × 6 fechas) o declarar el nivel exploratorio.
6. **Ventana:** la tesis dice ±5 días; el código usa 7. Unificar en **±3**.
7. **Validación:** 70/30 con n=20 deja 6 puntos de prueba. Cambiar a leave-one-date-out y reportar media ± desviación e intervalo.
8. **Anexos 3 y 4** (matriz de operacionalización y ficha de campo) siguen pendientes.
9. **Tablas administrativas** (punto 7): no tocar en esta fase.

---

## 7. Deuda técnica conocida

| Problema | Evidencia | Nota |
|---|---|---|
| `tsc --noEmit` falla | 10 errores en `src/server/satellite/validation/scientific-dataset.builder.test.ts` (fixtures incompletos) | `next build` sí pasa; arreglar antes de un CI con typecheck |
| Sin autenticación real | `src/server/authorization/dev-user-context.ts` | Usuario simulado por header |
| Autorización parcial | 9 de 43 rutas | Proteger `/admin`, `/users` |
| Sin caché ni rate limit satelital | `/api/satellite/*` | Puede golpear STAC/COG en cada request |
| Docs desactualizados | `README.md`, `docs/ROADMAP.md`, `docs/PROJECT_STATUS.md` | Decir el estado real |
| Duplicación | 2 stacks GEE, 4 mapas Leaflet, 3 namespaces de repositorios | Consolidar después |
| `.env.example` | `DATA_SOURCE=database` | Para demo sin Postgres, usar `mock` |
| Tests con exit code 1 en PowerShell | El warning de Vite escribe en stderr | Los tests pasan; no confundir con fallo |

---

## 8. Comandos

```bash
npm ci
npx vitest run                 # 310 tests
npx tsc --noEmit               # falla por los fixtures (ver deuda)
npm run build                  # OK, incluye /normativa
npm run dev                    # http://localhost:3000/normativa
```

---

## 9. Prompts sugeridos para Claude Code

**Bloque 2:**

> En el repo HydroVision, cambia la ventana de emparejamiento campo–satélite a ±3 días en una única constante compartida. Actualiza los usos en matching y validación, muestra la diferencia exacta en días en la UI y añade un test que verifique el límite. No cambies otros valores. Commit al terminar.

**Bloque 3:**

> Implementa `waterFraction` en la capa satelital de HydroVision: calcula NDWI con B03/B08, conserva píxeles con f_agua ≥ 0.5, exige un mínimo de 3 píxeles y devuelve "sin píxeles de agua suficientes" en caso contrario. Añade `pixelsUsed` y `waterFraction` al tipo de observación y al scorecard. Tests para píxel puro, mezcla y sin agua. Commit.

**Bloque 4:**

> Añade validación leave-one-date-out a la calibración satelital: entrena con todas las fechas menos una y valida con la excluida; reporta R², RMSE, MAE y sesgo por fold, más media ± desviación. Mantén 70/30 como opción. Test con 4 fechas sintéticas. Commit.

**Documento:**

> Corrige el .docx de la tesis: año 2027 en problema y objetivo; autoría de Nizama (Lizveth Karín Nizama Pacheco y Carlos Francisco Cabrera Carranza); separa LMP (P1–P5) de ECA (E2 cauce, E3 mar, P8 excluido); reemplaza el descarte de píxeles mezclados por la regla f_agua ≥ 0.5; sube el mínimo a 30 pares o declara exploratorio; unifica la ventana en ±3 días; cambia la validación a leave-one-date-out. No toques recursos, financiamiento ni cronograma.

---

## 10. Archivos de datos y fuentes

- `C:\Users\ferch\Downloads\Paquete_Tesis_Dren4000_antes_de_Astra.xlsx` — 13 hojas; `Datos_2014` tiene UTM de los 10 puntos; `Plan_Sentinel` ya reconoce que 2014 no tiene Sentinel-2.
- `C:\Users\ferch\Downloads\admOjs__IIGeo_21-41_006_LizvethNizama.pdf` — paper fuente; Figura 1 es un mapa georreferenciable del cauce.
- `C:\Users\ferch\Downloads\Proyecto_de_investigacion_HydroVision_formato_UCV_corregido.docx` — proyecto de tesis.
- Normas descargadas y verificadas en `_analisis/normas/` (D.S. 004-2017, D.S. 003-2010, D.S. 010-2008).

---

## 11. Reanudación

1. `git log --oneline -5` → el último commit debe ser `864a8ba` o posterior.
2. Leer `docs/ESTADO_TRABAJO.md`.
3. Continuar por el primer bloque pendiente (2, 3, 4, 5).
4. Si algo no coincide con este documento, **el código y los tests mandan**.
