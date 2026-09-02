# Estado de la Capa de Datos — HydroVision (Prompt 1 — Unificación)

## Arquitectura unificada

```
Frontend (hooks → API clients)
        ↓
API Route Handlers (/api/stations|campaigns|samples|parameters|measurements)
        ↓
Service (CampaignService, SampleService, …)
        ↓
Repository (mock fallback | Prisma según DATA_SOURCE)
        ↓
PostgreSQL (Prisma)  —  o  —  mockDataStore
        ↓
Mapper (Prisma → dominio) → motores científicos (ECA, Risk, Rules, …)
```

## DATA_SOURCE

| Valor | Comportamiento |
|-------|----------------|
| `mock` | `mockDataStore` vía `getDataProvider().getStore()` |
| `database` | PostgreSQL vía Prisma; repositorios server usan tablas reales |
| `gee` | Stub (sin cambios) |
| `api` | Stub (sin cambios) |

Configuración: `src/config/data-source.config.ts`, `src/config/monitoring-data-source.config.ts`

**Recomendado para integración:** `DATA_SOURCE=database` + `DATABASE_URL` + `npx prisma migrate deploy` + `npx prisma db seed`

## Entidades persistentes (cuando DATA_SOURCE=database)

| Entidad | Modelo Prisma | Repositorio server |
|---------|---------------|-------------------|
| Estaciones | `Station` | `station.repository.ts` |
| Campañas | `Campaign` | `campaign.repository.ts` → `prisma/campaign.prisma-repository.ts` |
| Muestreos | `Muestreo` | `sample.repository.ts` → `prisma/sample.prisma-repository.ts` |
| Parámetros | `Parameter` | `parameter.repository.ts` → `prisma/parameter.prisma-repository.ts` |
| Mediciones | `Measurement` | `measurement.repository.ts` → `prisma/measurement.prisma-repository.ts` |

## Mapper oficial wide-row ↔ normalizado

```
Prisma Measurement[] (normalizado)
        ↓
aggregateMedicionesToParametros()  — src/database/mappers/hydrovision-store.mapper.ts
        ↓
ParametrosFisicoquimicos (dominio plano para UI/motores)
```

No duplicar esta conversión en módulos individuales.

## Seed demostrativo

`prisma/seed/monitoring.ts` inserta:
- 12 parámetros + límites ECA
- 2 campañas demo
- 3 muestreos con mediciones normalizadas en estaciones E01–E04
- Evaluaciones ambientales demo

Observaciones marcadas como **dato demostrativo**.

## Importación

`/api/import/execute` escribe en PostgreSQL. Con `DATA_SOURCE=database`, las APIs de lectura devuelven los mismos datos importados.

## Qué sigue en MOCK

- Índices satelitales, imágenes Sentinel-2, GEE
- Auditoría (in-memory), reportes legacy
- Capas GIS, IA predictiva
- Usuarios (parcial — Prisma existe, API usa mock overlay)
- Dashboard time series agregada (`getAggregatedTimeSeries` — serie sintética)

## Prompt 2 — Estabilización (cierre)

- Dashboard: `getAggregatedTimeSeries()` deriva de muestreos reales vía `getDataStore()`.
- `StationService.getById()` usa `station-detail.repository.ts` (Prisma o mock).
- Auditoría e importación alineados con `isMonitoringDatabaseEnabled()`.
- Usuarios: lectura desde Prisma cuando `DATA_SOURCE=database`.
- Tipos `isSimulated`: `boolean` en contratos legacy principales (`FieldMeasurement`, `DashboardStats`, etc.).
- `/reportes` marcado como legacy en navegación.


Tras mutaciones Prisma, `invalidateMonitoringDataStoreCache()` recarga `DatabaseDataProvider` para motores que usan `getDataStore()`.
