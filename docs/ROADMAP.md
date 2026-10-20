# HydroVision — Roadmap

Estado a octubre de 2026. Lo completado está en `docs/ESTADO_TRABAJO.md`.

## Completado

| Fase | Entregable |
|---|---|
| 1 | Arquitectura modular, tipos de dominio y datos simulados etiquetados |
| 2 | Estaciones, muestreos, campañas, parámetros y evaluación ambiental |
| 3 | PostgreSQL + Prisma, importación CSV/Excel, auditoría y roles |
| 4 | Capa satelital real (Sentinel-2 L2A vía Planetary Computer) e índices espectrales |
| 5 | Calibración exploratoria, validación temporal y modelo de literatura (Nechad 2010) |
| 6 | PWA de campo con HydroColor y modo offline |
| 7 | Motor normativo ECA/LMP, página `/normativa` y sección normativa en el PDF |
| 8 | Fracción de agua por píxel y bloqueo de predicciones sin píxeles acuáticos |
| 9 | Validación *leave-one-date-out* con métricas por fecha |

## Siguiente

| Prioridad | Tarea |
|---|---|
| Alta | Campañas de campo sincronizadas con Sentinel-2 para generar pares reales |
| Alta | Anexos 3 y 4 de la tesis (operacionalización y ficha de campo) |
| Media | Corregir `tsc --noEmit` en fixtures de tests y añadir CI |
| Media | Comparar la corrección atmosférica L2A con ACOLITE/POLYMER |
| Media | Mostrar la serie temporal satelital 2015–2026 del dren en el dashboard |
| Baja | Autenticación real y protección de rutas administrativas |
| Baja | Caché y límite de peticiones en `/api/satellite/*` |
| Baja | Consolidar los dos stacks GEE y los mapas Leaflet duplicados |

## Líneas de investigación futuras

- Fusión multisensor (Sentinel-2, Landsat 8/9, PlanetScope) con armonización.
- Pronóstico a 7 días y detección de anomalías.
- Gemelo digital 1D del dren para escenarios de vertido y lluvia.
- Aprendizaje activo para decidir dónde y cuándo muestrear.
