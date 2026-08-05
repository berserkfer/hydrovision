# Sprint 3 — Explorador de Imágenes Satelitales (Sentinel-2)

Módulo **Satellite Explorer** para HydroVision. Permite seleccionar cuenca, río, punto de monitoreo, rango de fechas y plataforma satelital, preparando consultas futuras a Google Earth Engine.

**Estado actual:** datos 100% simulados · sin conexión GEE · sin APIs externas.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│  UI React (components/satellite/)                            │
│  SatelliteExplorerView · Filters · Map · Results · InfoPanel │
└────────────────────────────┬────────────────────────────────┘
                             │ useSatelliteExplorer (hook)
┌────────────────────────────▼────────────────────────────────┐
│  SatelliteSearchService (interface)                          │
│  MockSatelliteSearchService                                  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  SatelliteRepository (interface)                           │
│  MockSatelliteRepository                                     │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  utils/mock-image.generator · explorer-geo.utils             │
│  config/satellite-catalog · geography.repository             │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  Sprint 4: GeeSatelliteRepository → Earth Engine REST      │
└─────────────────────────────────────────────────────────────┘
```

### Interfaces (contratos)

| Interface | Responsabilidad |
|-----------|-----------------|
| `SatelliteImage` | Imagen individual (fecha, nubes, miniatura, bounds) |
| `SatelliteCollection` | Catálogo de plataforma (Sentinel-2, Landsat…) |
| `SatelliteMetadata` | Resolución, bandas, índices calculables |
| `SatelliteRepository` | Acceso a colecciones e imágenes |
| `SatelliteSearchService` | Validación, filtros y búsqueda |

### Patrones

- **Repository Pattern** — `MockSatelliteRepository`
- **Dependency Injection** — `getSatelliteSearchService()`
- **Factory** — `SatelliteExplorerFactory.create("mock" | "gee")`
- **Separación UI/lógica** — toda la lógica en `src/services/satellite-explorer/`

---

## Flujo de búsqueda

1. Usuario configura filtros en `/satelite`.
2. Hook `useSatelliteExplorer` mantiene estado local.
3. `SatelliteSearchService.validateQuery()` valida fechas y plataforma activa.
4. `SatelliteRepository.searchImages()` genera imágenes simuladas según ROI.
5. UI muestra lista con fecha, nubes, satélite, estado y miniatura SVG.

### Plataformas

| Plataforma | Estado |
|------------|--------|
| Sentinel-2 | Activo (simulado) |
| Landsat 8 | Próximamente |
| Landsat 9 | Próximamente |

---

## Preparación para Google Earth Engine

### Reemplazo de datos simulados

| Componente actual | Reemplazo Sprint 4+ |
|-------------------|---------------------|
| `MockSatelliteRepository` | `GeeSatelliteRepository` |
| `MockSatelliteSearchService` | Delega a GEE + mantiene validación |
| `generateMockSatelliteImages()` | `ee.ImageCollection.filterDate().filterBounds()` |
| Miniaturas SVG | `thumbUrl` de metadatos GEE |
| ROI polygon simulado | Geometría real de cuenca desde GIS Engine |

### Factory

```typescript
SatelliteExplorerFactory.create("gee");
// → MockSatelliteSearchService(new GeeSatelliteRepository(getGeeProvider()))
```

### Integración prevista

- Autenticación: `getEarthEngineAuthService()` (Sprint 2)
- Colección: `COPERNICUS/S2_SR_HARMONIZED`
- Filtros GEE: `CLOUDY_PIXEL_PERCENTAGE`, `system:time_start`, geometría ROI

---

## Estructura de archivos

```
src/services/satellite-explorer/
├── interfaces/
├── types/
├── config/satellite-catalog.ts
├── repositories/mock-satellite.repository.ts
├── services/mock-satellite-search.service.ts
├── utils/
├── satellite-explorer.factory.ts
└── index.ts

src/components/satellite/
src/hooks/useSatelliteExplorer.ts
src/app/satelite/page.tsx
```

---

## Verificación

```powershell
npm run dev
```

Ruta: [http://localhost:3000/satelite](http://localhost:3000/satelite)

---

## Próximo Sprint

**Sprint 4 — Conexión GEE real al Explorador**
- Implementar `GeeSatelliteRepository`
- Consultar `COPERNICUS/S2_SR_HARMONIZED` con ROI real
- Reemplazar miniaturas simuladas por metadatos GEE
- Mantener misma UI e interfaces
