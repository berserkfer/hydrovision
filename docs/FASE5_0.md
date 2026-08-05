# Fase 5.0 — Migración profesional hacia PostgreSQL

**Proyecto:** HydroVision  
**Fecha:** Agosto 2026  
**Estado:** Esquema normalizado · Prisma ORM · Seed preparado · **Mock activo por defecto**

---

## 1. Objetivo

Migrar HydroVision desde datos simulados hacia una arquitectura preparada para PostgreSQL 16 con Prisma ORM, manteniendo la interfaz intacta y el patrón Provider de la Fase 4.6.

---

## 2. Modelo Entidad-Relación

```mermaid
erDiagram
    Departamento ||--o{ Provincia : contiene
    Provincia ||--o{ Distrito : contiene
    Distrito ||--o{ Cuenca : contiene
    Cuenca ||--o{ Rio : drena
    Cuenca ||--o{ Estacion : monitorea
    Rio ||--o{ Estacion : ubicacion
    Usuario ||--o{ Proyecto : responsable
    Proyecto ||--o{ ProyectoCuenca : abarca
    Cuenca ||--o{ ProyectoCuenca : vinculada
    Proyecto ||--o{ Campana : planifica
    Campana ||--o{ Muestreo : registra
    Estacion ||--o{ Muestreo : recibe
    Muestreo ||--o{ Medicion : contiene
    Parametro ||--o{ Medicion : define
    Muestreo ||--|| EvaluacionAmbiental : evalua
    Estacion ||--o{ IndiceSatelital : satelite
    Reporte ||--o{ ReporteEstacion : incluye
    Estacion ||--o{ ReporteEstacion : referenciada
```

### Entidades principales (Fase 5.0)

| Entidad | Tabla | Descripción |
|---------|-------|-------------|
| **Usuario** | `usuarios` | Roles: admin, researcher, field_operator, viewer |
| **Proyecto** | `proyectos` | Agrupación de monitoreo (ej. tesis Río Reque) |
| **Cuenca** | `cuencas` | Unidad hidrográfica |
| **Rio** | `rios` | Cuerpo de agua monitoreado |
| **Estacion** | `estaciones` | Punto P1–P6 |
| **Campana** | `campanas` | Periodo de muestreo |
| **Muestreo** | `muestreos` | Registro de campo |
| **Parametro** | `parametros` | Catálogo normalizado (pH, turbidez, OD…) |
| **Medicion** | `mediciones` | Valor individual por parámetro |
| **IndiceSatelital** | `indices_satelitales` | NDWI, NDVI (preparado GEE) |
| **EvaluacionAmbiental** | `evaluaciones_ambientales` | Cumplimiento ECA + campos IA |
| **Reporte** | `reportes` | Informes técnicos |

### Normalización clave

**Antes (mock):** `ParametrosFisicoquimicos` — fila ancha con 10 columnas.

**Ahora (PostgreSQL):**
- `parametros` — catálogo con límites ECA
- `mediciones` — una fila por (muestreo, parámetro)

El mapper `aggregateMedicionesToParametros()` reconstruye el shape plano para la UI.

---

## 3. Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│  UI · Hooks · Services · Repositories (sin cambios visuales) │
└────────────────────────────┬─────────────────────────────────┘
                             │ getDataStore()
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  IDataProvider (Factory + DI)                                │
│  MockDataProvider │ DatabaseDataProvider                     │
└────────────┬───────────────────────────────┬─────────────────┘
             │                               │
             ▼                               ▼
    mockDataStore                    PrismaDataStoreLoader
    (store.ts)                              │
                                            ▼
                                     PrismaService
                                            │
                                            ▼
                                     PostgreSQL 16
```

### Capa database (nueva)

```
src/database/
├── prisma.service.ts              # Singleton PrismaClient
├── interfaces/                    # Contratos Repository
├── repositories/                  # Implementaciones Prisma
│   ├── prisma-data-store.loader.ts
│   ├── prisma-geography.repository.ts
│   ├── prisma-monitoring.repository.ts
│   └── prisma-ancillary.repository.ts
├── mappers/
│   └── hydrovision-store.mapper.ts
└── constants/
    └── parametros-catalog.ts      # Catálogo ECA
```

---

## 4. Flujo de datos

### Modo Mock (default)

```
DATA_SOURCE=mock → MockDataProvider → mockDataStore → UI
```

### Modo PostgreSQL

```
DATA_SOURCE=database
       ↓
DatabaseDataProvider.initialize()
       ↓
PrismaDataStoreLoader.loadStore()
       ↓
Mapper → HydroVisionDataStore
       ↓
getDataStore() → UI (misma interfaz)
```

---

## 5. Patrones aplicados

| Patrón | Implementación |
|--------|----------------|
| **Repository** | `IGeographyRepository`, `IMonitoringRepository`, `IAncillaryRepository` |
| **Factory** | `DataProviderFactory` selecciona mock/database |
| **Dependency Injection** | `getDataProvider()` / `setDataProvider()` |
| **Mapper** | Prisma ↔ dominio `HydroVisionDataStore` |
| **Singleton** | `PrismaService.getClient()` |

---

## 6. Configuración

`.env`:

```env
DATA_SOURCE=mock          # default — sin PostgreSQL requerido
DATABASE_URL="postgresql://hydrovision:password@localhost:5432/hydrovision?schema=public"
```

Activar PostgreSQL:

```env
DATA_SOURCE=database
```

---

## 7. Comandos

```powershell
npm install
npm run db:generate      # Genera @prisma/client
npm run db:migrate       # Aplica migración fase_5_0_init
npm run db:seed          # Pobla datos Río Reque
npm run test:providers   # Valida contrato IDataProvider
npm run dev
```

---

## 8. Seed — Río Reque

El seed (`prisma/seed.ts`) importa `mockDataStore` y persiste:

- Geografía Lambayeque / La Libertad
- Proyecto `PROY-REQUE-2025`
- 6 estaciones P1–P6 del Río Reque
- Campañas, muestreos, mediciones normalizadas
- Evaluaciones ECA e índices satelitales simulados

---

## 9. Preparación Google Earth Engine

- Tabla `indices_satelitales` con campos `fuente`, `tile_id`
- `FutureEarthEngineProvider` sin cambios (stub)
- Fase 5+ conectará GEE → insertará en `indices_satelitales`

---

## 10. Preparación IA

Campos en `evaluaciones_ambientales`:

| Campo | Uso futuro |
|-------|------------|
| `score_riesgo` | Puntuación ML |
| `nivel_alerta` | Clasificación automática |
| `model_version` | Trazabilidad del modelo |

---

## 11. Preparación Reportes

- Tabla `reportes` con estados: draft → generated → published
- Tabla N:M `reporte_estaciones`
- Módulo PDF (Fase 5+) consumirá repositorio PostgreSQL

---

## 12. Restricciones respetadas

- Diseño visual **sin cambios**
- Dashboard **operativo con mock**
- Google Earth Engine **no conectado**
- Funcionalidades existentes **preservadas**

---

## 13. Próxima fase (5.1)

1. Inicializar `DatabaseDataProvider` en layout server de Next.js
2. Activar `DATA_SOURCE=database` en producción
3. Migrar repositorios mock a consultas Prisma directas (opcional)
