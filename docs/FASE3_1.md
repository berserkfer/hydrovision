# Fase 3.1 — Preparación de la Base de Datos (Arquitectura)

**Proyecto:** HydroVision — Monitoreo de calidad del agua del río Reque  
**Fecha:** Julio 2026  
**Estado:** Esquema Prisma preparado · PostgreSQL **no conectado** · Migraciones **no ejecutadas**

---

## 1. Objetivo

Preparar toda la capa de persistencia para que en **Fase 3.2** únicamente sea necesario:

1. Configurar `DATABASE_URL` en `.env`
2. Ejecutar `npm run db:generate`
3. Ejecutar `npm run db:migrate` (o `db:push`)
4. Ejecutar `npm run db:seed`
5. Cambiar `USE_DATABASE=true`

La aplicación **sigue operando con datos mock** (`src/data/mock/store.ts`). Ningún componente de UI fue modificado.

---

## 2. Estructura creada

```
prisma/
├── schema.prisma          # Modelo relacional completo (14 entidades)
├── seed.ts                # Placeholder para seed Fase 3.2
├── migrations/.gitkeep    # Carpeta reservada para migraciones
└── README.md              # Comandos de referencia

src/lib/db/
├── config.ts              # Lectura de USE_DATABASE y DATABASE_URL
├── prisma.client.ts       # Singleton Prisma (activo solo Fase 3.2+)
└── index.ts               # Barrel export

.env.example               # Plantilla sin credenciales reales
```

### Scripts npm añadidos

| Script | Descripción |
|--------|-------------|
| `db:generate` | Genera el cliente Prisma |
| `db:migrate` | Crea/aplica migraciones versionadas |
| `db:push` | Sincroniza schema sin migración (dev) |
| `db:studio` | Explorador visual de datos |
| `db:seed` | Pobla BD desde mock (Fase 3.2) |

### Dependencias

- `prisma` — CLI y validación de schema (devDependency)
- `tsx` — Ejecución del seed TypeScript (devDependency)
- `@prisma/client` — **No instalado aún** (Fase 3.2)

---

## 3. Modelo relacional

### 3.1 Diagrama de entidades

```mermaid
erDiagram
    Departamento ||--o{ Provincia : contiene
    Provincia ||--o{ Distrito : contiene
    Distrito ||--o{ Cuenca : contiene
    Cuenca ||--o{ Rio : contiene
    Cuenca ||--o{ Estacion : ubica
    Rio ||--o{ Estacion : monitorea
    Rio ||--o{ Campana : planifica
    Cuenca ||--o{ Campana : abarca
    Usuario ||--o{ Campana : responsable
    Campana ||--o{ Muestra : recolecta
    Estacion ||--o{ Muestra : registra
    Usuario ||--o{ Muestra : responsable
    Muestra ||--o| ParametrosFisicoquimicos : mide
    Muestra ||--o| ClasificacionECA : evalua
    Estacion ||--o{ ParametrosFisicoquimicos : denormaliza
    Estacion ||--o{ ClasificacionECA : denormaliza
    Estacion ||--o{ IndicesSatelitales : observa
    Reporte }o--o{ Estacion : incluye
    Rio ||--o{ Reporte : documenta
    Cuenca ||--o{ Reporte : documenta
    Usuario ||--o{ Reporte : genera
```

### 3.2 Jerarquía geográfica e hidrográfica

```
Departamento (Lambayeque)
   └── Provincia (Chiclayo, Lambayeque, …)
          └── Distrito (Reque, Monsefú, …)
                 └── Cuenca (Cuenca Reque)
                        └── Río (Río Reque)
                               └── Estación (P1 … P6)
                                      └── Campaña
                                             └── Muestra
                                                    ├── ParámetrosFisicoquímicos (1:1)
                                                    └── ClasificaciónECA (1:1)
```

### 3.3 Entidades del schema

| Modelo Prisma | Tabla PostgreSQL | Descripción |
|---------------|------------------|-------------|
| `Departamento` | `departamentos` | División política nivel 1 |
| `Provincia` | `provincias` | Subdivisión departamental |
| `Distrito` | `distritos` | Subdivisión provincial |
| `Cuenca` | `cuencas` | Unidad hidrográfica |
| `Rio` | `rios` | Cuerpo de agua + centro cartográfico |
| `Estacion` | `estaciones` | Punto de monitoreo (P1–P6) |
| `Campana` | `campanas` | Campaña de muestreo en campo |
| `Muestra` | `muestras` | Registro de muestreo |
| `ParametrosFisicoquimicos` | `parametros_fisicoquimicos` | Mediciones de calidad |
| `ClasificacionECA` | `clasificaciones_eca` | Evaluación normativa |
| `IndicesSatelitales` | `indices_satelitales` | NDWI, NDVI, etc. (GEE Fase 4) |
| `Usuario` | `usuarios` | Roles y permisos |
| `Reporte` | `reportes` | Documentos técnicos (PDF Fase 5) |
| `ReporteEstacion` | `reporte_estaciones` | Tabla intermedia N:M |

---

## 4. Relaciones y decisiones de diseño

### 4.1 Integridad referencial

Todas las FK usan `onDelete: Restrict` excepto:

- **Cascade** en `ParametrosFisicoquimicos` y `ClasificacionECA` → al eliminar una `Muestra`, se eliminan sus mediciones y clasificación (datos dependientes).
- **Cascade** en `ReporteEstacion` → al eliminar un `Reporte`, se eliminan sus vínculos con estaciones.
- **Cascade** en `IndicesSatelitales` → al eliminar una `Estacion`, se eliminan sus índices satelitales.

Esto protege la jerarquía geográfica de borrados accidentales en cascada.

### 4.2 Denormalización controlada

`ParametrosFisicoquimicos` y `ClasificacionECA` incluyen `estacionId` además de `muestraId`:

- **Justificación:** Consultas frecuentes del dashboard (último estado por estación) sin JOIN profundo `Estacion → Muestra → Parámetros`.
- **Consistencia:** El seed (Fase 3.2) debe validar que `muestra.estacionId === parametros.estacionId`.

### 4.3 Estación ↔ Cuenca y Río

`Estacion` referencia tanto `rioId` como `cuencaId`:

- Permite filtrar estaciones por cuenca sin recorrer la jerarquía completa.
- `@@unique([rioId, codigo])` garantiza códigos P1–P6 únicos por río.

### 4.4 Reporte ↔ Estación (N:M)

Un reporte puede abarcar múltiples estaciones; una estación puede aparecer en varios reportes. Tabla intermedia `ReporteEstacion` con clave compuesta `(reporteId, estacionId)`.

### 4.5 Enums alineados con dominio

Los enums de Prisma replican los valores string de `src/constants/enums.ts`:

| Dominio TypeScript | Prisma enum | Valores DB |
|--------------------|-------------|------------|
| `EstadoECA` | `EstadoECA` | `compliant`, `alert`, `non_compliant` |
| `EstadoEstacion` | `EstadoEstacion` | `active`, `maintenance`, `offline` |
| `EstadoCampana` | `EstadoCampana` | `planned`, `active`, `completed`, `cancelled` |
| `EstadoReporte` | `EstadoReporte` | `draft`, `generated`, `published`, `archived` |
| `RolUsuario` | `RolUsuario` | `admin`, `researcher`, `field_operator`, `viewer` |
| `FuenteSatelital` | `FuenteSatelital` | `landsat8`, `landsat9`, `sentinel2` |

### 4.6 IDs string

Se mantienen IDs legibles (`lambayeque`, `rio-reque`, `est-p1`) compatibles con el mock store actual, facilitando el seed y la trazabilidad en desarrollo.

### 4.7 Campos JSON

`ClasificacionECA.parametrosViolados` y `parametrosEnAlerta` usan tipo `Json` para almacenar arrays de códigos de parámetro sin tablas auxiliares. Escalable hacia normalización si se requiere auditoría detallada.

---

## 5. Principios aplicados

| Principio | Aplicación |
|-----------|------------|
| **SOLID — SRP** | Schema Prisma separado de UI y de repositorios mock |
| **SOLID — OCP** | `USE_DATABASE` permite extender repositorios sin modificar componentes |
| **DRY** | Enums centralizados; un solo schema como fuente de verdad de persistencia |
| **Clean Architecture** | `src/lib/db/` como capa de infraestructura; dominio intacto en `src/models/` |
| **TypeScript estricto** | Config y seed tipados; cliente Prisma lazy-load |

---

## 6. Escalabilidad

### Corto plazo (Fase 3.2–3.3)

- Índices en FKs y campos de filtro (`estadoOperativo`, `fechaMuestreo`, `estado`)
- Seed desde `mockDataStore` para transición transparente
- Repositorios PostgreSQL implementando las mismas interfaces que los mock

### Mediano plazo (Fase 4 — SIG)

- Extensión **PostGIS** en PostgreSQL
- Columna `geometry(Point, 4326)` en `estaciones` para consultas espaciales
- Índices GIST para búsqueda por proximidad y polígonos de cuenca

### Largo plazo

- Particionamiento de `muestras` e `indices_satelitales` por `fechaMuestreo` / `fechaAdquisicion`
- Réplicas de lectura para dashboard analítico
- Modelo `EvaluacionRiesgoIA` (comentado en schema) para Fase 6

---

## 7. Preparación para PostgreSQL

### Paso a paso (Fase 3.2)

```powershell
cd C:\Users\ferch\Projects\hydrovision

# 1. Copiar plantilla de entorno
copy .env.example .env

# 2. Editar .env con credenciales PostgreSQL reales
# DATABASE_URL="postgresql://usuario:password@localhost:5432/hydrovision?schema=public"

# 3. Instalar cliente Prisma
npm install @prisma/client

# 4. Generar cliente y crear tablas
npm run db:generate
npm run db:migrate

# 5. Poblar datos
npm run db:seed

# 6. Activar persistencia
# USE_DATABASE="true"
```

### Variable `USE_DATABASE`

| Valor | Comportamiento |
|-------|----------------|
| `false` (actual) | Repositorios mock — sin cambio en runtime |
| `true` | Repositorios Prisma — requiere BD activa y `db:generate` ejecutado |

El módulo `src/lib/db/prisma.client.ts` lanza error explícito si se invoca sin configuración, evitando conexiones accidentales en esta fase.

---

## 8. Lo que NO se implementó (por diseño)

- Conexión real a PostgreSQL
- Ejecución de migraciones
- APIs REST/GraphQL
- Integración Google Earth Engine
- Módulo de Inteligencia Artificial
- Modificaciones a la interfaz de usuario
- Import de `@prisma/client` en componentes React

---

## 9. Verificación

```powershell
npm install
npm run dev
```

La aplicación debe compilar y ejecutarse igual que antes, usando exclusivamente datos simulados.

Para validar el schema Prisma (sin conectar BD):

```powershell
# Requiere .env con DATABASE_URL (placeholder incluido en el repo local)
npm run db:validate
```

---

## 10. Referencias internas

- Modelos de dominio: `src/models/`
- Enumeraciones: `src/constants/enums.ts`
- Mock data: `src/data/mock/store.ts`
- Repositorios: `src/lib/repositories/`
- Fase anterior: `docs/FASE3_0.md`
- Roadmap: `docs/ROADMAP.md`
