# Handoff — HydroVision para Claude Code

**Repositorio:** `github.com/berserkfer/hydrovision`
**Último commit:** `967c525` o posterior
**Fecha:** 20 de octubre de 2026
**Uso:** pega este documento en el repo y pide a Claude Code ejecutar **un bloque por vez**, con tests y commit.

---

## 1. Contexto

HydroVision es la plataforma de la tesis de Ingeniería Ambiental (UCV) sobre calidad del agua del **Dren 4000**, Santa Rosa, Lambayeque, Perú. Título: *"Desarrollo de plataforma predictiva de la calidad del agua mediante Sentinel-2 y datos in situ, Dren 4000, Lambayeque, 2027"*.

Stack: Next.js 15.5, React 19, TypeScript estricto, Tailwind 4, Prisma 6/PostgreSQL. Capa satelital real vía Microsoft Planetary Computer (Sentinel-2 L2A) y adaptadores Copernicus/GEE.

Datos clave:

- 20 muestras reales de 2014 (10 puntos × 2 fechas), fuente Nizama Pacheco & Cabrera Carranza (2018).
- **Sentinel-2A se lanzó el 23/06/2015**: esas muestras no tienen par satelital. Documentado en `src/data/mock/dren-4000-real-data.ts`.
- Landsat 8 (desde 2013) sí podría emparejar 2014, a 30 m.
- El Excel de la tesis tiene coliformes 2015-2016, promedios 2017 y estudios experimentales.

Estado verificado: **345 tests pasan** (39 archivos) y `next build` compila.

Documentos: `docs/INFORME_COMPARATIVO_2026-10.md` (13 referentes y roadmap) y `docs/ESTADO_TRABAJO.md`.

---

## 2. Reglas no negociables

1. **No inventar valores normativos ni datos.** Si un límite no se verificó, `pendingVerification` y no clasifica.
2. **No mezclar ECA y LMP** en un mismo veredicto. ECA aplica al cuerpo de agua; LMP al efluente.
3. **No tocar el punto 7** (recursos, financiamiento y cronograma del documento de tesis).
4. Mantener la honestidad de datos: `isSimulated` por registro, disclaimers, "sin datos suficientes" antes que un número inventado.
5. Cada bloque termina con tests pasando y un `git commit` propio.

---

## 3. Decisiones tomadas

| Punto | Decisión |
|---|---|
| Cauce del dren | ECA **E2** por defecto; **D1** opcional si se documenta reúso para riego |
| Zona marina (P6, P7, P9, P10) | ECA **E3** |
| P1 (laguna de oxidación) | **LMP PTAR** (D.S. 003-2010-MINAM) |
| P2–P5 (pesqueros) | **LMP pesca** (D.S. 010-2008-PRODUCE, columna I) |
| P8 (agua de proceso) | Excluido: no es punto de descarga |
| Ventana campo–satélite | **±3 días** |
| Píxel mezclado | `f_agua` con NDWI en ventana 3×3; ≥ 0,5 y mínimo 3 píxeles |
| Validación | **Leave-one-date-out** |

---

## 4. Lo ya implementado (no rehacer)

| Commit | Contenido |
|---|---|
| `5a1980f` | Motor normativo ECA/LMP (`src/lib/normative/`) + 15 tests; adaptadores en `src/lib/eca/classifier.ts`; `fatsOils` en `FieldMeasurement` |
| `864a8ba` | Página `/normativa` y entrada de navegación |
| `b810aea` | Ventana única ±3 días; readiness y validación con la misma constante |
| `092c785` | Fracción de agua (`water-fraction.ts`), ventana 3×3 en Planetary, campos en la observación y bloqueo `NO_WATER_PIXELS` |
| `f3b57e7` | Leave-one-date-out + `crossValidation` en calibración; metadatos de agua en `SatelliteQualityMetadata` |
| `3ead7d0` | `POST /api/normative/evaluate` y selector de perfil en `/normativa` |
| `8f8e7f3` | Bloque de agua (fracción, píxeles, suficiencia) en la vista de predicción |
| `0010dfe` | Marco normativo aplicable en el PDF de reportes y mapeo compartido `point-types.ts` |
| `f217b09` | Planificador de campañas: proyección de pasadas, nubosidad y ventana ±3 días (`/planificador`) |
| `967c525` | Caché TTL de búsquedas STAC y rate limit en rutas satelitales |

Valores normativos verificados (fuente en `catalog.ts`):

- ECA E2: pH 6,5–9,0; DBO5 ≤10; OD ≥5; SST ≤100; conductividad ≤1000; coliformes termotolerantes ≤2000; nitratos ≤13; aceites ≤5.
- ECA E3: pH 6,8–8,5; DBO5 ≤10; OD ≥4; SST ≤30; coliformes ≤2000; nitratos ≤200; aceites ≤5.
- ECA D1: pH 6,5–8,5; DBO5 ≤15; DQO ≤40; OD ≥4; conductividad ≤2500; coliformes ≤1000; nitratos ≤100; aceites ≤5.
- LMP PTAR: pH 6,5–8,5; DBO5 ≤100; DQO ≤200; SST ≤150; aceites ≤20; coliformes ≤10 000; temperatura <35 °C.
- LMP pesca: pH 6–9; DBO5 ≤60; SST ≤100; aceites ≤20.

Fósforo/fosfatos queda `pendingVerification` (el ECA limita fósforo total, no fosfatos).

---

## 5. Plataforma — estado

Los bloques de plataforma previstos están completos: motor normativo, página `/normativa` con selector, API, ventana ±3, fracción de agua, LODO, scorecard de agua en la vista satelital y sección normativa en el PDF.

Deuda técnica pendiente (no bloquea la tesis):

| Problema | Evidencia |
|---|---|
| ~~`tsc --noEmit` falla~~ | Resuelto en `c1a4d66`: typecheck limpio |
| Sin autenticación real | `src/server/authorization/dev-user-context.ts` |
| Sin caché ni rate limit satelital | `/api/satellite/*` |
| Docs desactualizados | `README.md`, `docs/ROADMAP.md`, `docs/PROJECT_STATUS.md` |
| Duplicación | 2 stacks GEE, 4 mapas Leaflet, 3 namespaces de repositorios |

---

## 6. Documento de tesis — corregido (v2)

Archivo corregido: `docs/Proyecto_de_investigacion_HydroVision_UCV_corregido_v2.docx` (commit `ca89931`).

Correcciones aplicadas: año 2027 en problema y objetivo; autoría de Nizama (L. K. y C. F.); separación ECA/LMP por punto (P1 PTAR, P2–P5 pesca, E2 cauce, E3 mar, P8 excluido); regla `f_agua ≥ 0,5` con mínimo 3 píxeles; mínimo 30 pares en 6 fechas; ventana ±3 días; validación leave-one-date-out con métricas por fecha. Se agregaron las referencias del D.S. 003-2010-MINAM y del D.S. 010-2008-PRODUCE.

Pendiente en el documento: ninguno. Los anexos 3 (matriz de operacionalización) y 4 (ficha de campo) están agregados y revisados visualmente; el documento tiene 31 páginas.

Detalle de lo aplicado:
1. **Año:** la universidad pidió **2027**. Cambiar las dos frases que aún dicen 2026 (problema y objetivo general).
2. **Autoría de Nizama:** la referencia dice "W. R. y C. E."; los autores reales son **Lizveth Karín Nizama Pacheco** y **Carlos Francisco Cabrera Carranza**.
3. **ECA vs LMP:** separar P1 LMP PTAR; P2–P5 LMP pesca; cauce E2 (o D1); P6–P10 E3; P8 excluido.
4. **Píxel mezclado:** reemplazar "se descartarán los píxeles que mezclen agua con márgenes" por `f_agua ≥ 0,5`, mínimo 3 píxeles y reporte de pureza.
5. **Tamaño muestral:** el plan dice 20 observaciones nuevas; la plataforma exige 30 pares. Subir a ≥30 pares (5 puntos × 6 fechas) o declarar el nivel exploratorio.
6. **Ventana:** la tesis dice ±5 días; el código ya usa **±3**. Unificar en 3.
7. **Validación:** 70/30 con n=20 deja 6 puntos de prueba. Cambiar a leave-one-date-out (ya implementado) y reportar media ± desviación e intervalo.
8. **Anexos 3 y 4** (matriz de operacionalización y ficha de campo) pendientes.
9. **Tablas administrativas** (punto 7): no tocar en esta fase.

---

## 7. Comandos

```bash
npm ci
npx vitest run                 # 345 tests
npx tsc --noEmit               # limpio
npm run build                  # OK
npm run dev                    # http://localhost:3000/normativa
```

Nota: en PowerShell, `vitest` escribe un warning de Vite en stderr y termina con código 1 aunque los tests pasen.

---

## 8. Prompt sugerido para Claude Code

> Corrige el .docx de la tesis: año 2027 en problema y objetivo; autoría de Nizama (Lizveth Karín Nizama Pacheco y Carlos Francisco Cabrera Carranza); separa LMP (P1–P5) de ECA (E2 cauce, E3 mar, P8 excluido); reemplaza el descarte de píxeles mezclados por la regla f_agua ≥ 0,5; sube el mínimo a 30 pares o declara exploratorio; unifica la ventana en ±3 días; cambia la validación a leave-one-date-out. No toques recursos, financiamiento ni cronograma.

---

## 9. Archivos de datos y fuentes

- `C:\Users\ferch\Downloads\Paquete_Tesis_Dren4000_antes_de_Astra.xlsx` — 13 hojas; `Datos_2014` tiene UTM de los 10 puntos.
- `C:\Users\ferch\Downloads\admOjs__IIGeo_21-41_006_LizvethNizama.pdf` — paper fuente; Figura 1 es un mapa georreferenciable del cauce.
- `C:\Users\ferch\Downloads\Proyecto_de_investigacion_HydroVision_formato_UCV_corregido.docx` — proyecto de tesis.
- Normas verificadas en `_analisis/normas/` (D.S. 004-2017, D.S. 003-2010, D.S. 010-2008).

---

## 10. Reanudación

1. `git log --oneline -10` → el último commit debe ser `0010dfe` o posterior.
2. Leer `docs/ESTADO_TRABAJO.md`.
3. Continuar con las correcciones del documento (sección 6) o con la deuda técnica.
4. Si algo no coincide, **el código y los tests mandan**.
