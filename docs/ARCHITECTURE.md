# HydroVision — Arquitectura del Sistema (v3.4)

## 1. Visión general

HydroVision es una plataforma web para el monitoreo integrado de la calidad del agua del **río Reque** (Lambayeque, Perú). Combina datos de campo, índices satelitales (GEE), clasificación ECA e inteligencia artificial.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRESENTACIÓN (src/components, src/app)               │
│  Dashboard · Mapa · Campañas · Muestreos · UI compartida                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    APLICACIÓN (src/hooks, src/services)                 │
│  useMapFilters · useCampaigns · useSamples · GEE · IA · Reportes        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    INFRAESTRUCTURA (src/repositories)                   │
│  geography · monitoring · campaign · sample — mock → Prisma (futuro)    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌──────────────────────┐ ┌─────────────────┐ ┌──────────────────────────┐
│   PostgreSQL         │ │ Google Earth    │ │ Servicio IA (Fase 6)     │
│   Prisma ORM         │ │ Engine (Fase 4) │ │ Python FastAPI           │
└──────────────────────┘ └─────────────────┘ └──────────────────────────┘
```

## 2. Estructura de carpetas (Fase 3.4)

```
src/
├── app/                    # Rutas Next.js App Router
│   ├── page.tsx            # Dashboard
│   ├── campanas/           # Gestión de campañas
│   ├── muestreos/          # Registro de muestras
│   └── api/
├── components/             # UI React (presentación)
│   ├── dashboard/
│   ├── campaigns/
│   ├── sampling/
│   ├── map/
│   ├── station/
│   └── ui/                 # Componentes reutilizables
├── config/                 # Configuración app, BD, módulos
├── constants/              # Enums, filtros, sampling
├── hooks/                  # Estado y lógica de UI
├── models/                 # Entidades de dominio
├── repositories/           # Acceso a datos (mock → Prisma)
├── services/               # Casos de uso e integraciones
│   ├── gee/                # Google Earth Engine
│   ├── ai/                 # Inteligencia artificial
│   └── reports/            # PDF, Excel, estadísticas
├── types/                  # DTOs y contratos TypeScript
├── utils/                  # Utilidades puras (fechas, cn, repos)
├── data/mock/              # Fuente mock unificada
└── lib/                    # Compatibilidad + dominio (ECA, adapters)
    ├── eca/                # Clasificador ECA
    ├── adapters/           # Legacy adapter
    └── db/                 # Cliente Prisma (stub)
```

## 3. Principios arquitectónicos

| Principio | Implementación |
|-----------|----------------|
| **Clean Architecture** | Capas: Presentación → Servicios → Repositorios → Datos |
| **SOLID — SRP** | Cada repositorio/servicio una responsabilidad |
| **SOLID — DIP** | Interfaces `IEarthEngineService`, `IRiskPredictionService`, etc. |
| **DRY** | `KpiGrid`, `FieldError`, `resolveNombre`, fechas en `@/utils` |
| **OCP** | Mock intercambiable por implementación real vía interfaces |

## 4. Módulos funcionales

| Ruta | Módulo | Fase |
|------|--------|------|
| `/` | Dashboard + mapa | 1–2 |
| `/campanas` | Campañas de monitoreo | 3.2 |
| `/muestreos` | Registro de muestras | 3.3 |
| GEE | `src/services/gee/` | 4 (preparado) |
| Reportes | `src/services/reports/` | 5 (preparado) |
| IA | `src/services/ai/` | 6 (preparado) |

## 5. Integraciones preparadas

### Google Earth Engine (`src/services/gee/`)

| Componente | Responsabilidad |
|------------|-----------------|
| `EarthEngineService` | Orquestación de consultas GEE |
| `SatelliteImageRepository` | Persistencia/consulta de imágenes |
| `MapLayerManager` | Capas raster/vector en mapa |
| `IndicesCalculator` | NDWI, NDVI, MNDWI, NDTI |

### Inteligencia Artificial (`src/services/ai/`)

| Componente | Responsabilidad |
|------------|-----------------|
| `RiskPredictionService` | Score de riesgo de contaminación |
| `WaterQualityAnalyzer` | Análisis multi-parámetro |
| `RecommendationEngine` | Recomendaciones operativas |

### Reportes (`src/services/reports/`)

| Componente | Responsabilidad |
|------------|-----------------|
| `PDFService` | Informes técnicos |
| `ExcelService` | Exportación tabular |
| `StatisticsService` | Agregaciones temporales |

## 6. Clasificación ECA

Centralizada en `src/lib/eca/classifier.ts`. Tres estados: Cumple, En alerta, No cumple.

## 7. PostgreSQL

Schema en `prisma/schema.prisma`. Activación: `USE_DATABASE=true` + `@/config/database.config`.

## 8. Compatibilidad legacy

Imports `@/lib/repositories/*`, `@/lib/utils`, `@/lib/earth-engine/client` re-exportan desde las nuevas capas sin romper código existente.

## 9. Despliegue

- **Desarrollo**: `npm run dev`
- **Demo tesis**: Vercel + Railway/Render (PostgreSQL + Python services)
