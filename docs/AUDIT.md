# Auditoría y Trazabilidad — Sprint 3H

Sistema de auditoría append-only para registrar creaciones, modificaciones, eliminaciones, importaciones y exportaciones en HydroVision.

## Modelo de auditoría

Prisma: `AuditLog` (`audit_logs`)

| Campo | Descripción |
|-------|-------------|
| `id` | Identificador único |
| `entityType` | Tipo de entidad (Station, Campaign, …) |
| `entityId` | ID del registro afectado |
| `action` | CREATE, UPDATE, DELETE, IMPORT, EXPORT |
| `timestamp` | Fecha y hora del evento |
| `previousData` | JSON del estado anterior |
| `newData` | JSON del estado nuevo |
| `description` | Descripción legible |
| `responsableId` / `responsableNombre` | Responsable (`responsibleUser` en API) |

Índices: `entityType`, `entityId`, `action`, `timestamp`, `responsableId`.

## Acciones

| Acción | Cuándo se registra |
|--------|-------------------|
| **CREATE** | Alta de estación, campaña, parámetro, medición |
| **UPDATE** | Modificación de registros CRUD |
| **DELETE** | Soft delete (estado inactivo + marca en memoria) |
| **IMPORT** | Finalización de importación CSV/Excel |
| **EXPORT** | Generación de reporte CSV/XLSX/PDF |

## Entidades auditadas

- **Station** — CRUD vía `StationService`
- **Campaign** — CRUD vía `CampaignService`
- **Parameter** — CRUD vía `ParameterService`
- **Measurement** — CRUD vía `MeasurementService`
- **EnvironmentalAssessment** — Recalculo tras cambios en mediciones (mock)
- **DataImport** — Evento IMPORT al ejecutar importación
- **ReportExport** — Evento EXPORT al generar reportes

## Flujo de trazabilidad

```
Operación (UI → API → Service)
  → mutación en Repository
  → AuditService.log / record*
  → AuditRepository.appendAuditLog
  → PostgreSQL (audit_logs) o store en memoria
```

Consulta:

```
/audit → GET /api/audit → AuditService.list + summary
Detalle → GET /api/audit/[id] → diff calculado en servidor
```

## Retención de registros

- **PostgreSQL:** sin purga automática; retención según política institucional.
- **Mock:** últimos 500 eventos en memoria.

## Consideraciones de seguridad

- Los registros de auditoría son **solo lectura** (no hay POST/PUT/DELETE en `/api/audit`).
- La UI no permite editar ni borrar eventos históricos.
- Sin autenticación completa: responsable por defecto vía `resolveDefaultResponsable()` hasta Sprint de auth.

## Archivos

```
src/server/audit/
  audit.types.ts
  audit-diff.ts
  audit.repository.ts
  audit.service.ts
  audit.test.ts

src/app/api/audit/
  route.ts
  [id]/route.ts

src/components/audit/
  AuditView.tsx
  AuditTable.tsx
  AuditFilters.tsx
  AuditDetail.tsx
  AuditDiffViewer.tsx
  AuditSummary.tsx
```

Migración: `20250808230000_sprint_3h_audit_log`.

## Pruebas

```bash
npm run test
npm run lint
npm run build
```
