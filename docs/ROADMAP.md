# HydroVision — Roadmap por fases

## Fase 1 — Fundamentos (actual)

- [x] Documentación de arquitectura
- [x] Estructura de carpetas
- [x] Tipos TypeScript del dominio
- [x] Datos simulados (sin inventar como reales)
- [x] Dashboard prototipo funcional
- [x] Clasificador ECA básico
- [x] Stubs GEE e IA

## Fase 2 — Mapa e índices satelitales

- [ ] Mapa Leaflet con trazado río Reque (GeoJSON)
- [ ] Marcadores P1–P6 interactivos
- [ ] Panel de índices: NDWI, NDVI, MNDWI, NDTI (simulados)
- [ ] Selector de fecha / comparación visual

## Fase 3 — Datos de campo

- [ ] Esquema Prisma + PostgreSQL
- [ ] Formulario registro parámetros (pH, turbidez, etc.)
- [ ] Historial de monitoreos
- [ ] Gráficos temporales por estación
- [ ] Comparación entre fechas

## Fase 4 — Google Earth Engine

- [ ] Servicio Python con earthengine-api
- [ ] Autenticación GEE (cuenta institucional)
- [ ] Pipeline Landsat/Sentinel para área Reque
- [ ] Caché de índices en BD

## Fase 5 — Reportes y estadísticas

- [ ] Panel estadístico (tendencias, correlaciones)
- [ ] Exportación PDF por estación / periodo
- [ ] Metodología documentada para anexo de tesis

## Fase 6 — Inteligencia Artificial

- [ ] Dataset etiquetado (campo + satélite)
- [ ] Modelo entrenamiento offline
- [ ] API FastAPI inferencia
- [ ] Visualización riesgo en dashboard y mapa
