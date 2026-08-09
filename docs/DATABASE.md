# HydroVision — Base de Datos PostgreSQL + Prisma

Sprint 3A — Arquitectura PostgreSQL + Prisma.  
Sprint 3B — Módulo **Estaciones** conectado a PostgreSQL.  
Sprint 3C — Arquitectura backend en capas (`src/server/`).  
Sprint 3D — **Modelo científico** y catálogos ambientales.

## Modelo relacional (Sprint 3D)

```mermaid
erDiagram
  Department ||--o{ Province : contains
  Province ||--o{ District : contains
  District ||--o{ Watershed : locates
  Watershed ||--o{ River : drains
  River ||--o{ Station : monitors
  District ||--o{ Station : admin
  Province ||--o{ Station : admin
  Department ||--o{ Station : admin

  WaterBodyType ||--o{ Station : classifies
  SensorType ||--o{ Station : instruments

  ParameterCategory ||--o{ Parameter : groups
  MeasurementUnit ||--o{ Parameter : default_unit
  MeasurementUnit ||--o{ Measurement : unit_ref

  EcaStandard ||--o{ EcaStandardParameterLimit : defines
  Parameter ||--o{ EcaStandardParameterLimit : limited_by
  EcaStandard ||--o{ Campaign : compliance_ref
  EcaStandard ||--o{ EnvironmentalAssessment : evaluates

  Campaign ||--o{ Muestreo : includes
  Station ||--o{ Muestreo : sampled_at
  Muestreo ||--o{ Measurement : produces
  Parameter ||--o{ Measurement : typed_by
  Station ||--o{ Measurement : recorded_at
  Campaign ||--o{ Measurement : optional

  SatelliteSource ||--o{ SatelliteIndex : provides
  Station ||--o{ SatelliteIndex : observes
```

## Catálogos ambientales (Sprint 3D)

| Modelo Prisma | Tabla PostgreSQL | Descripción |
|---------------|------------------|-------------|
| `Department` | `departamentos` | División política nivel I |
| `Province` | `provincias` | División política nivel II |
| `District` | `distritos` | División política nivel III |
| `WaterBodyType` | `cat_tipos_cuerpo_agua` | Río, quebrada, embalse, laguna… |
| `ParameterCategory` | `cat_categorias_parametro` | Físico, químico, biológico, hidrológico |
| `MeasurementUnit` | `cat_unidades_medicion` | NTU, mg/L, µS/cm, °C… |
| `EcaStandard` | `normativas_eca` | Estándares ECA de referencia |
| `SatelliteSource` | `cat_fuentes_satelitales` | Sentinel-2, Landsat 8/9 |
| `SensorType` | `cat_tipos_sensor` | Multiparamétrica, manual, proxy satelital |

## Campos científicos ampliados

### Station (`estaciones`)

| Campo | Columna | Descripción |
|-------|---------|-------------|
| `codigoOficial` | `codigo_oficial` | Código oficial de registro |
| `entidadResponsable` | `entidad_responsable` | ANA, universidad, GORE… |
| `altitud` | `altitud` | Altitud m.s.n.m. |
| `tipoEstacion` | `tipo_estacion` | automática / manual / mixta / referencia |
| `fechaInstalacion` | `fecha_instalacion` | Fecha de instalación |
| `estado` | `estado` | Estado operativo |
| `waterBodyTypeId` | `water_body_type_id` | FK catálogo cuerpo de agua |
| `sensorTypeId` | `sensor_type_id` | FK tipo de estación/sensor |

### Measurement (`mediciones`)

| Campo | Columna | Descripción |
|-------|---------|-------------|
| `metodoAnalisis` | `metodo_analisis` | Método analítico |
| `laboratorio` | `laboratorio` | Laboratorio acreditado |
| `equipoUtilizado` | `equipo_utilizado` | Equipo / sonda |
| `observaciones` | `observaciones` | Notas de campo o QA/QC |
| `nivelConfianza` | `nivel_confianza` | high / medium / low / estimated |
| `unitId` | `unit_id` | FK unidad de medición |

## Seeders

```bash
npx prisma migrate deploy
npm run seed
```

| Archivo | Contenido |
|---------|-----------|
| `prisma/seed/catalogs.ts` | 9 catálogos ambientales |
| `prisma/seed.ts` | Geografía + 5 cuencas + 10 ríos + 30 estaciones |

## Configuración

```env
DATABASE_URL="postgresql://hydrovision:PASSWORD@localhost:5432/hydrovision?schema=public"
DATA_SOURCE="mock"
STATIONS_DATA_SOURCE="database"
```

## Flujo de datos — Estaciones

UI → `GET /api/stations` → `StationService` → `StationRepository` → PostgreSQL.

Ver también: [ARCHITECTURE.md](./ARCHITECTURE.md).

## Índices y restricciones (Sprint 3D)

- FKs opcionales de catálogos en `estaciones`, `parametros`, `mediciones`, `campanas`, `indices_satelitales`.
- Índices en `estado`, `tipo_estacion`, `entidad_responsable`, `nivel_confianza`, `laboratorio`, fechas de campaña y vigencia ECA.
- Unicidad preservada: `(cuenca_id, codigo)` en estaciones, `(muestreo_id, parametro_id)` en mediciones.

## Comandos

```bash
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run build
```
