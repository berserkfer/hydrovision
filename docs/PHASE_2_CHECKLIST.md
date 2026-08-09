# Checklist Fase 2 — Capa de Datos HydroVision

Sprint 3J — Validación de cierre de la capa de datos.

## Infraestructura

- [x] PostgreSQL — schema Prisma completo, 9 migraciones
- [x] Prisma — `prisma validate` OK, client en `src/server/db`

## Entidades núcleo

- [x] Estaciones — CRUD API + UI + soft delete + auditoría
- [x] Campañas — CRUD API + UI + soft delete + auditoría
- [x] Parámetros — CRUD API + UI + auditoría
- [x] Mediciones — CRUD API + UI + soft delete + auditoría
- [x] Muestreos — CRUD API + UI (`/api/samples`)
- [x] Evaluaciones — UI mock + modelo Prisma; CRUD API pendiente (documentado)

## Operaciones de datos

- [x] Importación — CSV/Excel, validación, preview, transacción, historial, auditoría
- [x] Exportación — CSV/XLSX/PDF, filtros, preview, historial, auditoría

## Trazabilidad y seguridad

- [x] Auditoría — AuditLog append-only, UI `/audit`, diff viewer
- [x] Roles — ADMIN, INVESTIGATOR, TECHNICIAN, VIEWER
- [x] Permisos — 16 permisos, matriz Role→Permission
- [x] Validaciones — Zod en DTOs/APIs CRUD e importación
- [x] Seguridad — sin secretos en repo, guards en APIs mutativas, `.env` ignorado

## Calidad

- [x] Tests — 35 pruebas Vitest (import, export, audit, authorization)
- [x] Build — `npm run build` exitoso
- [x] Lint — sin errores bloqueantes

## Documentación

- [x] `docs/DATA_LAYER_STATUS.md` — estado consolidado
- [x] `docs/AUTHORIZATION.md` — roles y permisos
- [x] `docs/AUDIT.md` — auditoría
- [x] `docs/IMPORT_DATA.md` — importación
- [x] `docs/REPORTS.md` — exportación
- [x] `docs/API.md` — APIs CRUD

## Pendiente Fase 3+ (NO incluido en Fase 2)

- [ ] Google Earth Engine
- [ ] Sentinel-2 / Landsat operativos
- [ ] Índices espectrales con datos reales (NDWI, MNDWI, NDVI, NDTI)
- [ ] Machine Learning / predicción
- [ ] IoT / sensores
- [ ] BioBalsa / Neblina / humedales
- [ ] Autenticación real (login institucional)

---

**Resultado Sprint 3J:** Capa de datos consolidada y lista para integración geoespacial.
