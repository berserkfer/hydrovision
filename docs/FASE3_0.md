# Fase 3.0 — Arquitectura del modelo de datos HydroVision

Documentación de la reorganización interna del proyecto hacia un modelo de dominio profesional, sin modificar la interfaz de usuario.

---

## Objetivo cumplido

Centralizar todos los datos dispersos en un **modelo de dominio unificado** con mock data consistente, enums tipados y capa de repositorios — preparado para PostgreSQL, Google Earth Engine e IA.

**La UI no fue modificada.** Los componentes existentes siguen importando desde las mismas rutas legacy (`@/lib/data/simulated`, `@/types`, etc.).

---

## Arquitectura creada

```
src/
├── constants/           # Enums y constantes globales
│   ├── enums.ts
│   ├── app.ts
│   └── index.ts
├── models/              # Entidades de dominio (interfaces)
│   ├── base.ts
│   ├── geography.ts
│   ├── station.ts
│   ├── monitoring.ts
│   ├── compliance.ts
│   ├── satellite.ts
│   ├── user.ts
│   ├── report.ts
│   └── index.ts
├── data/mock/           # Datos simulados unificados
│   ├── store.ts         # Única fuente de verdad
│   └── index.ts
├── lib/
│   ├── adapters/
│   │   └── legacy-adapter.ts   # Dominio → tipos UI legacy
│   └── repositories/
│       ├── geography.repository.ts
│       ├── monitoring.repository.ts
│       └── index.ts
└── types/               # DTOs legacy (UI — sin cambios)
```

### Flujo de datos (Clean Architecture)

```
UI Components
     ↓ (sin cambios)
Legacy Types (@/types)
     ↑
Legacy Adapter (mapeo)
     ↑
Repositories (consultas)
     ↑
Mock Store / futuro PostgreSQL
     ↑
Domain Models (@/models)
```

---

## Entidades del dominio

| Modelo | Archivo | Descripción |
|--------|---------|-------------|
| `Departamento` | `geography.ts` | División política nivel 1 |
| `Provincia` | `geography.ts` | Subdivisión del departamento |
| `Distrito` | `geography.ts` | Subdivisión de la provincia |
| `Cuenca` | `geography.ts` | Cuenca hidrográfica |
| `Rio` | `geography.ts` | Cuerpo de agua monitoreado |
| `Estacion` | `station.ts` | Punto de monitoreo P1–Pn |
| `CampanaMonitoreo` | `monitoring.ts` | Campaña de muestreo en campo |
| `Muestra` | `monitoring.ts` | Registro de muestreo |
| `ParametrosFisicoquimicos` | `monitoring.ts` | Mediciones de calidad del agua |
| `ClasificacionECA` | `compliance.ts` | Evaluación normativa ECA |
| `IndicesSatelitales` | `satellite.ts` | NDWI, NDVI, MNDWI, NDTI |
| `Usuario` | `user.ts` | Usuario del sistema |
| `Reporte` | `report.ts` | Reporte técnico |

Todas extienden `EntityMeta` (`createdAt`, `updatedAt`, `isSimulated`).

---

## Enums (`src/constants/enums.ts`)

| Enum | Valores |
|------|---------|
| `EstadoECA` | CUMPLE, EN_ALERTA, NO_CUMPLE |
| `EstadoEstacion` | ACTIVA, MANTENIMIENTO, FUERA_LINEA |
| `TipoParametro` | PH, TURBIDEZ, CONDUCTIVIDAD, OD, TEMPERATURA, DBO5, DQO, … |
| `RolUsuario` | ADMINISTRADOR, INVESTIGADOR, OPERADOR_CAMPO, VISOR |
| `NivelAlerta` | BAJO, MEDIO, ALTO, CRITICO |
| `FuenteSatelital` | LANDSAT_8, LANDSAT_9, SENTINEL_2 |
| `EstadoCampana` | PLANIFICADA, EN_CURSO, FINALIZADA, CANCELADA |
| `EstadoReporte` | BORRADOR, GENERADO, PUBLICADO, ARCHIVADO |

---

## Relaciones del modelo

```
Departamento
  └── Provincia
        └── Distrito
              └── Cuenca
                    └── Rio
                          └── Estacion
                                ├── Muestra ← CampanaMonitoreo
                                │     ├── ParametrosFisicoquimicos
                                │     └── ClasificacionECA
                                └── IndicesSatelitales

Usuario ──→ CampanaMonitoreo (responsable)
Usuario ──→ Muestra (responsable)
Usuario ──→ Reporte (generadoPor)

Reporte ──→ Rio, Cuenca, Estacion[]
```

---

## Mock Data (`src/data/mock/store.ts`)

- **18 estaciones** en 4 ríos
- **18 muestras** + parámetros + clasificaciones ECA
- **18 registros** de índices satelitales
- **3 usuarios** simulados
- **1 campaña** activa (Reque)
- **1 reporte** borrador

Las clasificaciones ECA se calculan con el clasificador existente (`classifyMeasurement`) para mantener coherencia con la UI.

---

## Componentes modificados (solo capa de datos)

| Archivo | Cambio |
|---------|--------|
| `lib/data/simulated.ts` | Re-export → `monitoring.repository` |
| `lib/data/geography-simulated.ts` | Re-export → `geography.repository` |

## Componentes NO modificados

- Todos los componentes UI (`dashboard/`, `map/`, `station/`, `layout/`)
- `types/index.ts`, `types/geography.ts`, `types/station.ts`
- Clasificador ECA, hooks, página principal

---

## Ventajas de la arquitectura

| Principio | Aplicación |
|-----------|------------|
| **SOLID — SRP** | Modelos, mock, adapters y repos con responsabilidad única |
| **SOLID — DIP** | UI depende de abstracciones (legacy types), no del mock directo |
| **DRY** | Una sola fuente de verdad en `mockDataStore` |
| **Clean Architecture** | Dominio → Repositorio → Adaptador → Presentación |
| **Escalabilidad** | Repositorios intercambiables por implementación PostgreSQL |

---

## Preparación para PostgreSQL (Fase 3.1)

1. Activar `prisma/schema.prisma` con entidades equivalentes a `@/models`
2. Crear `PostgresGeographyRepository` implementando las mismas funciones que `geography.repository.ts`
3. Reemplazar `mockDataStore` por consultas Prisma en repositorios
4. Mantener `legacy-adapter.ts` sin cambios — la UI no se entera

```typescript
// Futuro patrón
export const geographyRepository =
  process.env.USE_DB === "true"
    ? new PostgresGeographyRepository()
    : mockGeographyRepository;
```

---

## Preparación para Google Earth Engine (Fase 4)

- `IndicesSatelitales` ya modelado con `FuenteSatelital` enum
- `estacionId` como FK lógica hacia `Estacion`
- Repositorio satelital futuro: `satellite.repository.ts`
- Stub GEE existente (`lib/earth-engine/client.ts`) consumirá el repositorio

---

## Preparación para IA (Fase 6)

- Features de entrada: `ParametrosFisicoquimicos` + `IndicesSatelitales`
- Target: `ClasificacionECA.estado` o `NivelAlerta`
- `mockDataStore` provee dataset etiquetado simulado para prototipado
- Servicio IA consumirá repositorio de monitoreo + satélite

---

## Verificación

```powershell
cd C:\Users\ferch\Projects\hydrovision
npm run dev
```

La aplicación debe comportarse **exactamente igual** visualmente. Solo cambió la organización interna de datos.

---

## Próximos pasos

| Fase | Tarea |
|------|-------|
| 3.1 | Esquema Prisma + migraciones PostgreSQL |
| 3.2 | API REST sobre repositorios |
| 3.3 | Sustituir mock por BD en repositorios |
| 4.0 | Pipeline GEE → `IndicesSatelitales` |
| 5.0 | Generación PDF → entidad `Reporte` |
| 6.0 | Modelo IA entrenado con dataset del dominio |
