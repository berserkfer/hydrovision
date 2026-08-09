# HydroVision — Arquitectura del Sistema (Sprint 3C)

## 1. Visión general

HydroVision es una plataforma web para el monitoreo integrado de la calidad del agua del **río Reque** (Lambayeque, Perú). A partir del Sprint 3C adopta una **arquitectura en capas** (Layered Architecture) que separa presentación, API, lógica de negocio y acceso a datos.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PRESENTACIÓN — src/app, src/components, src/hooks                        │
│  Páginas React · consume APIs REST · sin acceso directo a Prisma          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTP (fetch)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  API — src/app/api/* + src/server/api                                   │
│  Route Handlers · respuestas JSON · errores consistentes                │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVICIOS — src/server/services                                        │
│  Lógica de negocio · orquestación · validaciones de dominio               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  REPOSITORIOS — src/server/repositories                                 │
│  Acceso a PostgreSQL (Prisma) o mock · mapeo entidad → DTO                │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│  src/server/db (Prisma)    │      │  src/data/mock           │
│  PostgreSQL                │      │  Datos simulados         │
└──────────────────────────┘      └──────────────────────────┘
```

## 2. Estructura backend (Sprint 3C)

```
src/server/
├── db/                 # Prisma Client singleton
├── repositories/       # Acceso a datos (StationRepository, …)
├── services/           # Lógica de negocio (StationService, …)
├── validators/         # Validación de entrada (StationValidator, …)
├── dto/                # Contratos de transferencia (StationDTO, …)
└── api/                # Utilidades HTTP (errores, respuestas, handler)
```

Capas transversales:

| Carpeta | Rol |
|---------|-----|
| `src/lib/api/` | Cliente HTTP del frontend hacia Route Handlers |
| `src/app/api/` | Endpoints REST expuestos por Next.js |

## 3. Flujo de datos — módulo Estaciones

```
/estaciones (page)
    │
    ▼
lib/api/stations.client.ts  ──fetch──▶  GET /api/stations
                                              │
                                              ▼
                                    server/services/station.service.ts
                                              │
                                              ▼
                                    server/repositories/station.repository.ts
                                              │
                                    ┌─────────┴─────────┐
                                    ▼                   ▼
                              prisma.station       getMockStations()
```

Detalle: `GET /api/stations/:id` → `StationService.getById()` → repositorio + datos auxiliares mock (campañas, mediciones) hasta Sprint 3D+.

## 4. Responsabilidades por capa

| Capa | Responsabilidad | No debe |
|------|-----------------|---------|
| **Presentación** | UI, filtros cliente, navegación | Importar Prisma ni repositorios server |
| **API (Route Handlers)** | HTTP, status codes, serialización JSON | Contener lógica de negocio compleja |
| **Servicios** | Reglas de negocio, composición, validación | Conocer detalles HTTP ni JSX |
| **Repositorios** | Queries Prisma/mock, mappers entidad→DTO | Exponer HTTP ni renderizar UI |
| **DTO** | Tipos del contrato API | Depender de React o Prisma |
| **Validators** | Validar IDs, query params, payloads | Acceder a base de datos |
| **DB** | Conexión singleton Prisma | Lógica de dominio |

## 5. Módulo Estaciones (referencia para futuros módulos)

| Componente | Archivo |
|------------|---------|
| DTO | `server/dto/station.dto.ts` |
| Validator | `server/validators/station.validator.ts` |
| Repository | `server/repositories/station.repository.ts` |
| Service | `server/services/station.service.ts` |
| API | `app/api/stations/route.ts`, `app/api/stations/[id]/route.ts` |
| Cliente UI | `lib/api/stations.client.ts` |

Patrón replicable para Campañas, Muestreos, etc.: DTO → Validator → Repository → Service → Route Handler → Client.

## 6. Manejo de errores

Respuesta de éxito:

```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "...", "source": "database" }
}
```

Respuesta de error:

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Estación 'x' no encontrada" }
}
```

Códigos: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `DATABASE_ERROR` (503), `INTERNAL_ERROR` (500).

## 7. Configuración de datos

| Variable | Efecto |
|----------|--------|
| `DATA_SOURCE=mock` | Dashboard, campañas, muestreos → mock |
| `STATIONS_DATA_SOURCE=database` | Estaciones → PostgreSQL vía capas server |
| `DATABASE_URL` | Conexión PostgreSQL |

## 8. Beneficios para escalabilidad y mantenimiento

- **Separación de concerns**: cambios en UI no afectan queries; cambios en BD no rompen contratos API.
- **Testabilidad**: servicios y repositorios aislados, mockeables sin Next.js.
- **Escalabilidad**: Route Handlers pueden moverse a microservicios manteniendo DTOs.
- **Tipado fuerte**: TypeScript en DTO, servicio y cliente API.
- **Evolución por módulos**: Estaciones ya en capas; otros módulos siguen mock hasta migración incremental.

## 9. Integraciones futuras (sin cambios Sprint 3C)

| Integración | Ubicación prevista |
|-------------|-------------------|
| Google Earth Engine | `server/services/gee/` |
| Autenticación | middleware + `server/validators/auth` |
| IA | `server/services/ai/` |

## 10. Comandos

```bash
npm run dev
npm run lint
npm run build
npm run seed          # PostgreSQL
npx prisma migrate deploy
```

Documentación de base de datos: [DATABASE.md](./DATABASE.md).
