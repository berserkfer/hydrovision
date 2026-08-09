# Estado de la Capa de Datos — HydroVision (Sprint 3J)

Auditoría técnica de consolidación previa a integración geoespacial y satelital.

## Arquitectura actual

```
Usuario (simulado dev)
  ↓
Interfaz (Next.js App Router / React)
  ↓
API Route Handlers (/api/*)
  ↓
DTO + Validator (Zod)
  ↓
Service (lógica de negocio)
  ↓
Repository (mock overlay + Prisma opcional)
  ↓
Prisma Client (src/server/db)
  ↓
PostgreSQL
```

**Regla verificada:** ningún componente en `src/components/` importa Prisma ni `@/server/db`. El acceso a datos ocurre exclusivamente vía API o server components que invocan servicios.

## Modelos de datos (Prisma)

| Dominio | Modelos principales |
|---------|---------------------|
| Geografía | `Department`, `Province`, `District`, `Watershed`, `Subcuenca`, `River`, `Quebrada` |
| Monitoreo | `Station`, `Campaign`, `Muestreo`, `Parameter`, `Measurement`, `EnvironmentalAssessment` |
| Satélite (prep.) | `SatelliteIndex`, `ImagenSatelital`, `SatelliteSource` |
| Catálogos | `WaterBodyType`, `ParameterCategory`, `MeasurementUnit`, `EcaStandard`, `SensorType` |
| Operaciones | `DataImport`, `ReportExport`, `AuditLog` |
| Seguridad | `Usuario`, `Role`, `Permission`, `RolePermission` |
| Reportes legacy | `Reporte`, `ReportePuntoMonitoreo`, `RiesgoAmbiental`, `Proyecto` |

**Usuario = User:** el DTO `UserDto` mapea al modelo `Usuario` (`@@map("usuarios")`).

**Soft delete:** `EstadoRegistro` en estaciones; overlay en memoria (`markSoftDeleted`) para mock CRUD; usuarios con baja lógica (`activo` + `estado`).

**Migraciones:** 9 migraciones desde `20250801180000` hasta `20250809010000`.

## Módulos conectados

| Módulo | UI | API | Service | Estado |
|--------|-----|-----|---------|--------|
| Estaciones | `/estaciones` | `/api/stations` | `StationService` | OK |
| Campañas | `/campanas` | `/api/campaigns` | `CampaignService` | OK |
| Parámetros | `/parametros` | `/api/parameters` | `ParameterService` | OK |
| Mediciones | `/api/measurements` | `MeasurementService` | OK |
| Muestreos | `/muestreos` | `/api/samples` | `SampleService` | OK |
| Evaluación ambiental | `/evaluacion-ambiental` | mock/rules | Parcial (sin CRUD API dedicado) |
| Importación | `/import` | `/api/import/*` | `ImportService` | OK |
| Exportación | `/reports` | `/api/reports/*` | `ReportService` | OK |
| Auditoría | `/audit` | `/api/audit` (solo GET) | `AuditService` | OK |
| Usuarios/Roles | `/users` | `/api/users`, `/api/auth/context` | `UserService` + `AuthorizationService` | OK |

## APIs disponibles (26 rutas)

Todas las rutas mutativas críticas usan `requirePermission()` excepto:
- `/api/monitoring` — lectura agregada dashboard (mock)
- `/api/admin/*` — diagnóstico sistema/GEE (stub)
- `/api/auth/context` — contexto dev simulado

Rutas protegidas en Sprint 3J: `parameters`, `samples`, `import/*`, `reports/*` (completando cobertura iniciada en 3I).

## Importación

| Etapa | Endpoint | Permiso |
|-------|----------|---------|
| Preview | `POST /api/import/preview` | `IMPORT_DATA` |
| Validación | `POST /api/import/validate` | `IMPORT_DATA` |
| Ejecución | `POST /api/import/execute` | `IMPORT_DATA` |
| Historial | `GET /api/import/history` | `IMPORT_DATA` |

Transacción Prisma con rollback en error; historial `DataImport`; auditoría `IMPORT`.

## Exportación

| Formato | Servicio | Permiso |
|---------|----------|---------|
| CSV | `CsvExportService` | `EXPORT_DATA` |
| XLSX | `ExcelExportService` | `EXPORT_DATA` |
| PDF | `PdfExportService` | `EXPORT_DATA` |

Preview, filtros e historial requieren `EXPORT_DATA`. Historial en `ReportExport` + auditoría `EXPORT`.

## Auditoría

- Modelo `AuditLog` append-only
- Acciones: CREATE, UPDATE, DELETE, IMPORT, EXPORT
- API solo lectura (`GET /api/audit`, `GET /api/audit/[id]`)
- Sin endpoints POST/PUT/DELETE en auditoría

## Roles

| Rol | Permisos clave |
|-----|----------------|
| ADMIN | Todos (16 permisos) |
| INVESTIGATOR | Datos científicos, import/export, auditoría |
| TECHNICIAN | Ver + crear/actualizar mediciones |
| VIEWER | Solo consulta |

Matriz: `src/server/authorization/permissions.ts`. Usuario simulado: `DEV_SIMULATED_USER_ID` / header `X-HydroVision-Dev-User`.

## Seguridad

| Control | Estado |
|---------|--------|
| `.env` en `.gitignore` | OK |
| `.env.example` sin secretos reales | OK (placeholders) |
| Sin contraseñas en schema | OK |
| Sin Prisma en frontend | OK |
| Validación Zod en APIs CRUD | OK |
| Guards de autorización | OK (ampliado 3J) |
| AuditLog inmutable | OK |
| GEE keys solo en env | OK (stub, no conectado) |

## Limitaciones conocidas

1. **Autenticación real pendiente** — usuario simulado en desarrollo.
2. **EnvironmentalAssessment** — sin API CRUD dedicada; evaluaciones vía mock/rules engine.
3. **Dual mock/database** — repositorios con fallback a mock si BD no configurada.
4. **GEE / satélite / ML / IoT** — stubs y UI exploratoria; no integrados.
5. **Parámetros API** — usa permisos `MEASUREMENTS_*` (catálogo acoplado a dominio de mediciones).
6. **`/api/monitoring`** — sin guard (lectura dashboard; datos simulados).

## Próximos pasos (Fase geoespacial)

- [ ] Conectar Google Earth Engine (service account)
- [ ] Pipeline Sentinel-2 / Landsat
- [ ] Índices NDWI, MNDWI, NDVI, NDTI con datos reales
- [ ] Autenticación institucional (JWT/sesión)
- [ ] CRUD API para `EnvironmentalAssessment`
- [ ] Middleware global Next.js para auth
- [ ] Tests E2E de APIs con roles

## Verificación Sprint 3J

```
npm run test   → 35/35 passed
npm run lint   → OK (warnings preexistentes no críticos)
npm run build  → OK
npm run db:validate → OK
```
