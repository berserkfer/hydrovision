# HydroVision — Mejoras implementadas

**Repositorio:** `github.com/berserkfer/hydrovision`
**Rama:** `main`
**Último commit:** `150a933`
**Fecha:** 20 de octubre de 2026

---

## Cómo usar este documento con Claude Code

Pega este archivo en el repo (o adjúntalo) y usa este prompt:

> Lee `docs/MEJORAS_IMPLEMENTADAS.md` y `docs/HANDOFF_CLAUDE_CODE.md`. Todo lo listado como completado ya está implementado, probado y commiteado: **no lo reimplementes**. Revisa los cambios, ejecuta `npx tsc --noEmit`, `npx vitest run` y `npm run build`, y continúa solo con lo que figura en "Pendiente".

---

## 1. Resumen

Se corrigieron los huecos identificados en la plataforma y en el documento de tesis:

- Motor normativo **ECA/LMP** con valores verificados y separación por tipo de punto.
- **Fracción de agua** por píxel para no tratar un píxel mixto como agua pura.
- Ventana de emparejamiento campo–satélite unificada en **±3 días**.
- Validación **leave-one-date-out** con métricas por fecha.
- **Planificador de campañas** con próximas pasadas Sentinel-2 y pronóstico de nubosidad.
- **Caché y rate limit** en las rutas satelitales.
- **Typecheck limpio**, **CI** y documentación al día.
- **Tesis corregida** con anexos 3 y 4, exportada a PDF.

**Verificación actual:** 348 tests pasan (40 archivos), `tsc --noEmit` sin errores, `next build` OK.

---

## 2. Plataforma

### 2.1 Motor normativo ECA/LMP — `5a1980f`

- `src/lib/normative/{types,catalog,evaluate,resolve,index}.ts`.
- Perfiles: **ECA E2** (cauce), **ECA E3** (mar), **ECA D1** (riego), **LMP PTAR** y **LMP pesca**.
- Valores transcritos de D.S. 004-2017-MINAM, D.S. 003-2010-MINAM y D.S. 010-2008-PRODUCE, con fuente por límite.
- Fósforo/fosfatos marcado `pendingVerification` porque el ECA limita fósforo total, no fosfatos.
- Clasificación con banda de alerta del 10 %; tests unitarios.

### 2.2 Cumplimiento normativo en la interfaz — `864a8ba`, `3ead7d0`

- Página **`/normativa`**: evalúa P1–P10 con el instrumento que corresponde (P1 PTAR, P2–P5 pesca, P6–P10 E3, P8 excluido por ser agua de proceso).
- Selector de perfil por query param (`?perfil=eca-e3`, etc.).
- API `POST /api/normative/evaluate`.

### 2.3 Ventana de emparejamiento ±3 días — `b810aea`

- Constante única en `src/satellite/config/matching.config.ts`.
- Readiness y validación usan la misma constante; test explícito del límite.

### 2.4 Fracción de agua y pureza de píxel — `092c785`

- `src/satellite/quality/water-fraction.ts`: NDWI, `f_agua`, mínimo de píxeles y suficiencia.
- La capa Planetary lee **ventanas 3×3** de B03/B08 y calcula la fracción.
- `SatelliteObservation` expone `waterFraction`, `pixelsUsed` y `waterSufficiency`.
- La predicción se bloquea con `NO_WATER_PIXELS` si no hay agua suficiente.

### 2.5 Validación leave-one-date-out — `f3b57e7`

- `src/satellite/calibration/leave-one-date-out.ts`: entrena con todas las fechas menos una y valida con la excluida.
- Reporta R², RMSE, MAE y sesgo por fecha, más media y desviación.
- La respuesta de calibración incluye `crossValidation`.

### 2.6 Scorecard en la vista satelital — `8f8e7f3`

- `/prediccion` muestra fracción de agua, píxeles válidos y advertencia cuando la suficiencia es insuficiente.

### 2.7 Marco normativo en el PDF — `0010dfe`

- El reporte exportado incluye la sección **"Marco normativo aplicable"** con punto, tipo, instrumento, perfil y fuente.
- `normativeProfiles` en el bundle y mapeo compartido `point-types.ts`.

### 2.8 Planificador de campañas — `f217b09`, `0677bc8`

- Página **`/planificador`**: próximas pasadas estimadas de Sentinel-2, nubosidad pronosticada y ventana de muestreo ±3 días.
- API `GET /api/satellite/opportunities?stationId=...&days=14`.
- Proyección a partir del patrón reciente de adquisiciones (no es una efeméride orbital; se declara).
- Nubosidad desde Open-Meteo (sin credenciales).
- Tests de la lógica pura y test de integración con `fetch` simulado.

### 2.9 Caché y rate limit — `967c525`, `a004759`

- Caché TTL de búsquedas STAC (10 min, 100 entradas).
- Límite de 30 peticiones/minuto por IP en `scenes`, `observations`, `prediction`, `trend` y `opportunities`.

### 2.10 Calidad de código — `c1a4d66`, `54c1a2f`

- Se corrigieron **15 errores de `tsc --noEmit`** en fixtures de tests; el typecheck quedó limpio.
- **CI de GitHub Actions** (`.github/workflows/ci.yml`): `npm ci`, `tsc --noEmit`, `vitest run`, `next build`, con badge en el README.

### 2.11 Documentación — `958c1ab`, `150a933`

- `README.md`, `docs/ROADMAP.md` y `docs/PROJECT_STATUS.md` reescritos al estado real.
- `docs/ESTADO_TRABAJO.md` y `docs/HANDOFF_CLAUDE_CODE.md` actualizados.
- `docs/INFORME_COMPARATIVO_2026-10.md`: análisis con 13 referentes y roadmap.

---

## 3. Documento de tesis

### 3.1 Correcciones — `ca89931`

Archivo: `docs/Proyecto_de_investigacion_HydroVision_UCV_corregido_v2.docx`.

- Año **2027** en el problema y en el objetivo general.
- Autoría de Nizama corregida a **Lizveth Karín Nizama Pacheco** y **Carlos Francisco Cabrera Carranza**.
- Separación de instrumentos: P1 LMP PTAR; P2–P5 LMP pesca; cauce E2 (o D1); P6–P10 E3; P8 excluido.
- Regla de **fracción de agua** (`f_agua ≥ 0,5`, mínimo 3 píxeles) en lugar de descartar píxeles mezclados.
- Mínimo **30 pares en 6 fechas**; ventana **±3 días**.
- Validación **leave-one-date-out** con métricas por fecha y desviación.
- Referencias agregadas del D.S. 003-2010-MINAM y D.S. 010-2008-PRODUCE.

### 3.2 Anexos — `5361f87`

- **Anexo 3**: matriz de operacionalización de variables, con celdas fusionadas.
- **Anexo 4**: ficha de registro de campo.
- Revisión visual: 31 páginas, tablas correctas.

### 3.3 PDF — `6051f11`

- `docs/Proyecto_de_investigacion_HydroVision_UCV_corregido_v2.pdf` (31 páginas, firma `%PDF` válida).

---

## 4. Verificación

```bash
npx tsc --noEmit   # sin errores
npx vitest run     # 348 tests, 40 archivos
npm run build      # OK, incluye /normativa y /planificador
```

---

## 5. Pendiente (no implementado)

| Tema | Por qué queda pendiente |
|---|---|
| Autenticación real | El usuario sigue siendo simulado por header; requiere decisión de proveedor y sesión |
| Adaptador Landsat 8/9 | Feature nueva para emparejar 2014 a 30 m |
| Serie temporal satelital 2015–2026 | Requiere consultas masivas y diseño de caché |
| Campañas de campo | Trabajo de campo del autor |
| Revisión final del asesor | Revisión humana del documento |

---

## 6. Commits relevantes

| Commit | Cambio |
|---|---|
| `5a1980f` | Motor normativo ECA/LMP |
| `864a8ba` | Página `/normativa` |
| `b810aea` | Ventana ±3 días |
| `092c785` | Fracción de agua |
| `f3b57e7` | Leave-one-date-out |
| `3ead7d0` | API normativa y selector |
| `8f8e7f3` | Scorecard satelital |
| `0010dfe` | Marco normativo en PDF |
| `ca89931` | Tesis v2 corregida |
| `5361f87` | Anexos 3 y 4 |
| `958c1ab` | Documentación raíz |
| `c1a4d66` | Typecheck limpio |
| `54c1a2f` | CI y badge |
| `f217b09` | Planificador de campañas |
| `967c525` | Caché y rate limit |
| `0677bc8` | Test de integración del planificador |
| `a004759` | Rate limit en predicción y tendencia |
| `6051f11` | PDF de la tesis |
| `150a933` | Documentación final |
