# HydroVision — Auditoría Técnica v2 (Sprint 2I)

**Fecha:** 2026-08-05  
**Alcance:** Consolidación del MVP antes de integración con PostgreSQL, GEE y APIs reales  
**Restricción:** Sin módulos nuevos · Sin eliminar funcionalidades · Solo correcciones seguras  

---

## 1. Resumen ejecutivo

HydroVision completó los sprints 2B–2H con una **plataforma modular funcional** sobre Next.js 15, React 19 y TypeScript estricto. El MVP cubre monitoreo ambiental, estaciones, campañas, muestreos, parámetros, evaluación, reportes, centro geoespacial, mapa legacy, índices satelitales, análisis temporal y administración GEE simulada.

**Estado general estimado: 82 / 100** (vs. 76 en v1)

| Dimensión | v1 | v2 | Comentario |
|-----------|----|----|------------|
| Arquitectura modular | 72% | 85% | `platform/modules`, repos por dominio, layer providers |
| TypeScript / Build | 85% | 92% | Build de producción verificado |
| Patrones (SOLID/DI) | 74% | 80% | Factory + provider pattern consolidado |
| Mantenibilidad | 70% | 75% | Duplicación documentada; shims legacy pendientes |
| Escalabilidad | 68% | 78% | GEE/DB preparados; mock como default estable |
| Rendimiento | 80% | 82% | Mapas con `dynamic` SSR off; hooks delgados |
| UX / Accesibilidad | 78% | 83% | Sticky corregido; mejoras a11y en sidebar |
| Navegación | — | 80% | 17 rutas activas; entradas duplicadas intencionales |

**Veredicto:** El MVP está **listo para iniciar integración incremental** con tecnologías reales (PostgreSQL → GEE → APIs), manteniendo mock como fallback.

---

## 2. Revisión por área (16 puntos)

### 2.1 Arquitectura de carpetas

```
src/
├── app/              → Rutas App Router (17 páginas + 3 API)
├── components/       → UI por dominio (dashboard, stations, geospatial…)
├── hooks/            → 18 hooks client-side
├── platform/modules/ → Registry + navigation (Sprint 2B)
├── repositories/     → Acceso mock canónico
├── lib/repositories/ → Re-exports compatibilidad (@deprecated path)
├── lib/mock/         → Helpers derivados del store
├── data/mock/        → Store monolítico (single source of truth)
├── database/         → Prisma loader + mappers (Fase 5)
├── services/         → Motores de negocio por sprint
├── providers/        → DI de fuentes de datos
├── models/           → Entidades dominio (español, store)
└── types/            → Tipos UI/API (inglés, vistas)
```

**Fortaleza:** Separación clara pages → views → hooks → repositories → mock store.  
**Debilidad:** Tres namespaces de repositorio (`repositories/`, `lib/repositories/`, `database/repositories/`).  
**Riesgo:** Confusión al onboarding sobre cuál import usar.

### 2.2 Organización de componentes

| Patrón | Ejemplo | Estado |
|--------|---------|--------|
| `*View.tsx` | `StationsView`, `GeospatialCenterView` | ✅ Consistente |
| `*DetailView` + `*Detail` | stations, campaigns, parameters | ✅ Consistente |
| Singular legacy | `components/station/` | ⚠️ Dashboard only |
| Plural módulos | `components/stations/` | ✅ Sprint 2C+ |
| Mapas (4 impl.) | Monitoring, GIS, Geospatial, Placeholder | ⚠️ Duplicación Leaflet |

### 2.3 Componentes duplicados

| Par | Ubicación | Acción recomendada |
|-----|-----------|-------------------|
| Station detail panel | `station/` vs `stations/` | Mantener (contextos distintos) |
| ParameterCard | `station/` vs `parameters/` | Renombrar en Sprint 3 |
| Map + icons + popup | `map/` vs `geospatial/` | Unificar base Leaflet post-GEE |
| Campaign shims | `CampaignFiltersBar`, `CampaignFormModal` | Deprecar tras migración imports |
| Headers | `Header.tsx` (sin uso) vs `MonitoringHeader` | Eliminar Header en Sprint 3 |
| Satellite sections | `SatelliteIndicesSection` + `Preview` | Consolidar vista dashboard |

### 2.4 Hooks reutilizables

18 hooks en `src/hooks/`. Patrones repetidos en `useStations`, `useParameters`, `useCampaigns` (filtros + reset + apply).

| Hook | Estado |
|------|--------|
| `usePagination` | ✅ Compartido (campaigns, samples) |
| `useCampaignFilters` | ✅ Extraído |
| `useEnvironmentalRules` | ⚠️ Sin consumidores — candidato a eliminar |
| Resto | ✅ Activos en sus vistas |

**Recomendación:** Extraer `useListFilters<T>()` genérico (prioridad Media).

### 2.5 Tipos TypeScript

Tres capas paralelas para estaciones:

- `models/station.ts` → `Estacion` (store)
- `types/station.ts` → `StationDetail` (dashboard panel)
- `types/station-management.ts` → `StationDetailRecord` (CRUD)
- `types/geospatial-center.ts` → `GeoStationDetail` (mapa unificado)

**Fortaleza:** Tipado estricto en módulos nuevos.  
**Debilidad:** Labels de estado operativo difieren entre tipos (`Operativa` vs `Activa`).  
**Mitigación:** `legacy-adapter.ts` centraliza conversión store → UI.

### 2.6 Interfaces

Contratos bien definidos en:

- `IGeospatialLayerProvider` (Sprint 2H)
- `IDataProvider` (providers)
- `ISatelliteIndex`, `IGeeAuthentication` (services)

**Riesgo:** Dos árboles GEE (`services/gee/` vs `services/google-earth-engine/`) con interfaces no unificadas.

### 2.7 Imports innecesarios

Mezcla `@/repositories/*` vs `@/lib/repositories/*` sin impacto runtime (re-exports).  
Shims `@deprecated` aún en hot path: `lib/data/simulated.ts`, `lib/data/geography-simulated.ts`.

### 2.8 Código duplicado

| Área | Duplicación |
|------|-------------|
| Leaflet maps | 4 componentes, 2 icon factories, 2 popups |
| Filter hooks | 3 implementaciones similares |
| Repository paths | Mirror lib/repositories |
| GEE services | 2 stacks |

### 2.9 Convenciones de nombres

| Convención | Cumplimiento |
|------------|--------------|
| Componentes PascalCase | ✅ |
| Hooks `use*` | ✅ |
| Repos `*.repository.ts` | ✅ |
| Mock `lib/mock/*.ts` | ✅ |
| Rutas kebab-case español | ✅ |
| Mezcla EN/ES en tipos | ⚠️ Intencional (legacy vs dominio) |

### 2.10 Rendimiento de renderizado

- Mapas: `dynamic(..., { ssr: false })` ✅
- Dashboard: múltiples hooks; sin memoización pesada (aceptable en mock)
- Tablas: `contentKey` fuerza re-mount en cambio de río ✅
- Satellite legend: duplicados de key corregidos (Sprint 2I fix previo) ✅
- Sticky panels: removidos del dashboard (evita overlap) ✅

### 2.11 Accesibilidad básica

| Elemento | Estado |
|----------|--------|
| `lang="es"` | ✅ layout.tsx |
| Mapas `aria-label` | ✅ |
| Modal focus trap | ✅ Modal.tsx |
| Sidebar `aria-current` | ✅ Corregido Sprint 2I |
| Skip to content | ✅ Corregido Sprint 2I |
| Tablas clicables | ✅ aria-label en filas |
| Nav disabled items | ⚠️ `<div>` sin teclado (coming-soon intencional) |

### 2.12 Responsive Design

- Grid `xl:grid-cols-*` en dashboard, geospatial, reportes ✅
- Panel estación mobile: `xl:hidden` duplicado en dashboard ✅
- Sidebar fijo 256px; main scroll ✅
- Tablas: `overflow-x-auto` + `min-w-*` ✅

### 2.13 Consistencia visual

- `MonitoringHeader` en todos los módulos ✅
- `SimulatedDataIndicator` en vistas de datos ✅
- Cards + badges ECA unificados (`ComplianceBadge`) ✅
- ExecutiveHeader solo dashboard (diferenciación intencional) ✅

### 2.14 Navegación entre módulos

17 rutas activas en `platform/modules/navigation.ts`.  
Entradas duplicadas a `/indicadores` (3) y `/satelite` (2) — **preservadas** para no perder accesos del sidebar jerárquico.

| Ruta | Módulo |
|------|--------|
| `/centro-geoespacial` | Centro Geoespacial (2H) |
| `/mapa` | Mapa legacy GIS |
| `/evaluacion-ambiental` | Evaluación (2G) |
| `/reportes` | Reportes (2F) |
| `/parametros` | Parámetros (2E) |

### 2.15 Mensajes de error y estados vacíos

| Patrón | Cobertura |
|--------|-----------|
| Filtro vacío | ✅ Tablas módulo |
| `StationDetailEmpty` | ✅ Dashboard |
| `notFound()` en `[id]` | ✅ Detail pages |
| `not-found.tsx` global | ✅ Agregado Sprint 2I |
| `error.tsx` global | ❌ Pendiente |
| Error state en hooks | ❌ Solo satellite explorer |

### 2.16 Organización de archivos mock

```
getDataStore() ← providers/mock-data.provider.ts
       ↑
data/mock/store.ts (monolito ~425 líneas)
       ↑
lib/mock/*.ts (queries por dominio)
       ↑
repositories/*.ts (API pública UI)
```

**Fortaleza:** Flujo unidireccional claro.  
**Debilidad:** `data/mock/index.ts` deprecated aún presente.

---

## 3. Fortalezas del proyecto

1. **Arquitectura modular** (`platform/modules`) con registry v1.6.0 y navegación jerárquica.
2. **Provider pattern** listo para mock / database / GEE / API.
3. **17 rutas funcionales** con build de producción exitoso.
4. **Contratos de extensión** (`IGeospatialLayerProvider`, `IDataProvider`, factories por sprint).
5. **TypeScript strict** + Prisma schema v2 alineado con dominio.
6. **Separación UI/lógica** en motores (satellite-index, gis, executive, evaluation).
7. **Documentación por sprint** (`docs/MODULES.md`, FASE docs, SPRINT docs).
8. **Mock store único** — datos coherentes entre todos los módulos.
9. **Leaflet SSR-safe** en todas las vistas de mapa.
10. **Dashboard ejecutivo** integrado sin romper funcionalidad legacy.

---

## 4. Debilidades detectadas

| ID | Debilidad | Impacto |
|----|-----------|---------|
| W1 | Dos stacks GEE sin unificar | Alto — confusión integración |
| W2 | Repositorios duplicados (lib/repositories shims) | Medio — imports inconsistentes |
| W3 | Cuatro implementaciones de mapa Leaflet | Medio — mantenimiento |
| W4 | Tipos de estación en 4 representaciones | Medio — conversión manual |
| W5 | Navegación con hrefs duplicados | Bajo — UX confusa |
| W6 | Shims deprecated en hot path (page.tsx) | Medio — deuda migración |
| W7 | Sin error boundary global | Medio — UX en fallos |
| W8 | Hook `useEnvironmentalRules` sin uso | Bajo — ruido |
| W9 | Prisma repos granulares sin wiring UI | Medio — DB no activa |
| W10 | Labels estado operativo inconsistentes | Bajo — display only |

---

## 5. Riesgos técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Integración GEE rompe mapas actuales | Media | Alto | `IGeospatialLayerProvider` + fallback mock |
| Migración PostgreSQL desincroniza mock | Media | Alto | Mappers en `hydrovision-store.mapper.ts` |
| Duplicación mapas aumenta bugs Leaflet | Alta | Medio | Base map component Sprint 3 |
| Imports mixtos repos confunden PRs | Alta | Bajo | Estandarizar `@/repositories` |
| Bundle size al unificar GEE | Media | Medio | Dynamic imports ya aplicados |

---

## 6. Recomendaciones priorizadas

### Alta prioridad (pre-integración real)

| # | Acción | Sprint |
|---|--------|--------|
| A1 | Unificar stack GEE bajo `services/google-earth-engine/` | 3 |
| A2 | Implementar `GeeGeospatialLayerProvider` | 3 |
| A3 | Invocar `initializeDatabaseProviderIfNeeded()` en bootstrap | 3 |
| A4 | Migrar `page.tsx` y `useMapFilters` off shims deprecated | 3 |
| A5 | Estandarizar imports a `@/repositories/*` | 3 |

### Media prioridad

| # | Acción | Sprint |
|---|--------|--------|
| M1 | Extraer `BaseLeafletMap` compartido | 3–4 |
| M2 | Hook genérico `useListFilters<T>` | 3 |
| M3 | `error.tsx` global con retry | 3 |
| M4 | Documentar boundary models/ vs types/ | 3 |
| M5 | Deduplicar entradas nav `/indicadores` | 4 |
| M6 | Renombrar ParameterCard duplicados | 4 |

### Baja prioridad

| # | Acción | Sprint |
|---|--------|--------|
| B1 | Eliminar `Header.tsx`, `MapPlaceholder`, `CampaignList` muertos | 4 |
| B2 | Eliminar `useEnvironmentalRules` | 4 |
| B3 | Consolidar SatelliteIndices dashboard sections | 4 |
| B4 | Unificar labels estado operativo | 5 |
| B5 | Route-level `loading.tsx` | 5 |

---

## 7. Correcciones aplicadas en Sprint 2I

| Corrección | Archivo |
|------------|---------|
| Export `geospatial.repository` en barrel | `repositories/index.ts` |
| `aria-current="page"` en nav activo | `components/layout/Sidebar.tsx` |
| `aria-label` en `<nav>` | `components/layout/Sidebar.tsx` |
| Label sprint actualizado (2I) | `components/layout/Sidebar.tsx` |
| Skip link accesibilidad | `components/layout/MainLayout.tsx` |
| Página 404 branded | `app/not-found.tsx` |
| `aria-label` en filas tabla dashboard | `MonitoringPointsTable.tsx` |
| Sticky overlap dashboard (sesión previa) | `ExecutiveSummaryPanel`, `StationDetail*` |

---

## 8. Inventario MVP — Rutas activas

| Ruta | Módulo | Datos |
|------|--------|-------|
| `/` | Dashboard ejecutivo | Mock |
| `/estaciones` | Estaciones CRUD | Mock |
| `/muestreos` | Muestreos | Mock |
| `/campanas` | Campañas | Mock |
| `/parametros` | Parámetros ECA | Mock |
| `/evaluacion-ambiental` | Evaluación | Mock |
| `/reportes` | Reportes | Mock |
| `/centro-geoespacial` | Centro geoespacial | Mock + provider |
| `/indicadores` | Indicadores ejecutivos | Mock |
| `/satelite` | Explorador satelital | Mock |
| `/analisis-temporal` | Análisis temporal | Mock |
| `/mapa` | Mapa GIS legacy | Mock |
| `/admin/system-status` | Admin GEE | Mock auth |

---

## 9. Checklist pre-integración

- [x] `npm run build` exitoso
- [x] 17 rutas generadas sin error
- [x] Arquitectura modular documentada (`MODULES.md`)
- [x] Layer provider GEE preparado (`IGeospatialLayerProvider`)
- [x] Prisma schema + seed + mappers alineados
- [x] Provider DI con mock default
- [x] Admin GEE auth simulado
- [ ] PostgreSQL conectado en runtime
- [ ] GEE tiles reales
- [ ] Error boundaries globales
- [ ] Tests automatizados

---

## 10. Referencias

- `docs/MODULES.md` — Arquitectura modular Sprint 2B–2H
- `docs/TECHNICAL_AUDIT_V1.md` — Auditoría baseline
- `src/platform/modules/registry.ts` — v1.6.0
- `src/providers/data-provider.factory.ts` — Selector de fuente
- `src/lib/geospatial/layer-provider.interface.ts` — Contrato GEE

---

*Auditoría Sprint 2I · HydroVision MVP · Listo para integración incremental con tecnologías reales.*
