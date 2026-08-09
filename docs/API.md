# HydroVision — API REST (Sprint 3E)

Documentación de los endpoints CRUD profesionales del sistema. Todas las rutas devuelven JSON con el envelope:

```json
{ "success": true, "data": { ... }, "meta": { "source": "mock" | "database" } }
```

Errores:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

## Flujo de datos

```
UI (Page/Hook) → lib/api/*.client.ts → app/api/*/route.ts → Service → Repository → mock / Prisma
```

- **Validación:** Zod en `src/server/validators/schemas/crud.schemas.ts` (servidor) y `src/lib/validators/form-schemas.ts` (formularios RHF).
- **Soft delete:** `estadoRegistro = inactive` (PostgreSQL) o registro en `src/server/lib/soft-delete.ts` (mock).
- **Notificaciones:** Sonner vía `src/lib/api/notify.ts` y `src/lib/api/handle-api-error.ts`.

---

## Estaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/stations` | Listado, estadísticas y opciones de filtro |
| POST | `/api/stations` | Crear estación |
| GET | `/api/stations/:id` | Detalle con campañas y mediciones |
| PUT | `/api/stations/:id` | Actualizar estación |
| DELETE | `/api/stations/:id` | Soft delete |

**Query params (GET):** `page`, `pageSize`, `search`, `sortBy`, `sortOrder`

**DTO crear/actualizar (`CreateStationInput`):**

| Campo | Tipo | Validación |
|-------|------|------------|
| codigo | string | 2–10 chars, único |
| nombre | string | 3–200 chars |
| cuencaId, rioId | string | obligatorios |
| tramo | string | min 2 chars |
| latitud | number | -90 … 90 |
| longitud | number | -180 … 180 |
| altitud | number | 0 … 7000 |
| estado | enum | active \| maintenance \| offline |
| descripcion, entidadResponsable | string | opcionales |

---

## Campañas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/campaigns` | Listado paginado + stats |
| POST | `/api/campaigns` | Crear campaña |
| GET | `/api/campaigns/:id` | Detalle |
| PUT | `/api/campaigns/:id` | Actualizar |
| DELETE | `/api/campaigns/:id` | Soft delete |

**DTO (`CreateCampaignInput`):** nombre, responsableId, fecha, cuencaId, rioId, objetivo, descripcion?, estacionIds[], observaciones?

---

## Muestreos (Samples)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/samples` | Listado paginado + stats |
| POST | `/api/samples` | Registrar muestra |
| GET | `/api/samples/:id` | Detalle con parámetros ECA |
| PUT | `/api/samples/:id` | Actualizar |
| DELETE | `/api/samples/:id` | Soft delete |

**Query params:** `campanaId`, `page`, `pageSize`, `search`, `sortBy`, `sortOrder`

**DTO (`CreateMuestraPayload`):** campanaId, estacionId, fechaMuestreo (ISO), responsableId, clima, colorAparente, observaciones, ph, turbidez, conductividad, oxigenoDisuelto, temperatura, solidosDisueltosTotales, caudal

---

## Parámetros (catálogo)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/parameters` | Catálogo paginado |
| POST | `/api/parameters` | Crear parámetro |
| GET | `/api/parameters/:id` | Detalle |
| PUT | `/api/parameters/:id` | Actualizar |
| DELETE | `/api/parameters/:id` | Soft delete |

**DTO (`CreateParameterInput`):** codigo (único), nombre, unidad, descripcion?, limiteEcaMin?, limiteEcaMax?

---

## Mediciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/measurements` | Listado paginado |
| POST | `/api/measurements` | Crear medición |
| GET | `/api/measurements/:id` | Detalle |
| PUT | `/api/measurements/:id` | Actualizar |
| DELETE | `/api/measurements/:id` | Soft delete |

**DTO (`CreateMeasurementInput`):** muestraId, estacionId, parametroCodigo, parametroNombre, valor, unidad, fechaMedicion, metodoAnalisis?, laboratorio?, equipoUtilizado?, observaciones?, nivelConfianza?

---

## Códigos de error

| Código | HTTP | Descripción |
|--------|------|-------------|
| VALIDATION_ERROR | 400 | Datos inválidos (Zod) |
| NOT_FOUND | 404 | Recurso no encontrado |
| DUPLICATE_ERROR | 409 | Código duplicado |
| DATABASE_ERROR | 503 | Error PostgreSQL |
| INTERNAL_ERROR | 500 | Error inesperado |

---

## Clientes frontend

| Módulo | Archivo |
|--------|---------|
| Estaciones | `src/lib/api/stations.client.ts` |
| Campañas | `src/lib/api/campaigns.client.ts` |
| Muestreos | `src/lib/api/samples.client.ts` |
| Parámetros | `src/lib/api/parameters.client.ts` |
| Mediciones | `src/lib/api/measurements.client.ts` |
