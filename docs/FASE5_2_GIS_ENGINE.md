# Fase 5.2 — GIS Engine Profesional

**Proyecto:** HydroVision  
**Versión:** 5.2.0  
**Estado:** Motor geoespacial operativo · Datos simulados · GEE **no conectado**

---

## 1. Objetivo

Crear el **motor geoespacial central** de HydroVision, completamente desacoplado de React y Leaflet, capaz de administrar capas vectoriales, raster, marcadores, cuencas, ríos, puntos de monitoreo e imágenes satelitales simuladas.

---

## 2. Arquitectura GIS

```
┌─────────────────────────────────────────────────────────────┐
│  React / Leaflet (GisMonitoringMap, MapLayerOverlays)       │
└────────────────────────────┬────────────────────────────────┘
                             │ ManagedLayer / VectorGeometry
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  LayerManager (adaptador UI — Fase 4.3)                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  GISEngine (orquestador)                                    │
│  ├── GISService      (capas, filtros, leyendas, escalas)    │
│  ├── GISRepository   (datos geoespaciales)                  │
│  ├── MapProvider     (config mapa agnóstica)                │
│  └── Utils           (coordenadas, distancia, área, valid.) │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                    MockGISRepository
                             │
                             ▼
                      getDataStore() (mock)
```

### Estructura de archivos

```
src/services/gis/
├── interfaces/          # MapLayer, VectorLayer, GISRepository, GISService…
├── types/               # LatLng, BoundingBox, SpatialFilter, MapScale
├── config/              # GIS_LAYER_CATALOG, GIS_LAYER_IDS
├── utils/               # coordinate, distance, area, geometry.validation
├── repositories/        # MockGISRepository
├── mappers/             # layer.adapter (GIS → ManagedLayer legacy)
├── gis.service.ts
├── gis-engine.ts
├── gis.factory.ts
├── map-provider.ts
└── index.ts             # getGISEngine(), setGISEngine(), DI
```

---

## 3. Interfaces principales

| Interfaz | Responsabilidad |
|----------|-----------------|
| `MapLayer` | Contrato base de capa (vector/raster/marker) |
| `VectorLayer` | Polígonos, polilíneas, estilos |
| `RasterLayer` | Índices satelitales, bounds, colorRamp |
| `MonitoringStation` | Punto de monitoreo georreferenciado |
| `River` | Cauce con path y longitud |
| `Watershed` | Cuenca con boundary y área |
| `SatelliteImage` | Imagen simulada con índices espectrales |
| `GISRepository` | Acceso a datos geoespaciales |
| `GISService` | Lógica de capas, filtros, leyendas, escalas |
| `MapProvider` | Configuración de mapa (CRS, tiles, viewport) |

---

## 4. Flujo de datos espaciales

```
mockDataStore
    ↓
MockGISRepository.getMonitoringStations()
    ↓
GISEngine.getLegacyVectorGeometries()
    ↓
layer.adapter → VectorGeometry [lat, lng][]
    ↓
MapLayerOverlays (Leaflet Polygon/Polyline)
```

### Capas administradas

| Capa | Tipo | Fuente |
|------|------|--------|
| Estaciones | marker | mock |
| Ríos | vector/polyline | mock |
| Cuencas | vector/polygon | mock |
| Distritos/Provincias/Departamentos | vector/polygon | mock |
| NDWI / NDVI / MNDWI | raster | mock |
| Riesgo Ambiental | raster | mock |

---

## 5. Capacidades implementadas

| Capacidad | Implementación |
|-----------|----------------|
| Sistema de coordenadas | WGS84 (`EPSG:4326`) |
| Bounding Box | `computeBoundingBox()`, `isPointInBBox()` |
| Zoom automático | `computeAutoZoom()` |
| Selección de capas | `GISService.selectLayers()` |
| Filtros espaciales | `SpatialFilter` (cuenca, río, estación, bbox) |
| Leyendas | `GisLegendItem[]` por capa |
| Escalas | `getScale(zoom)` → ratio cartográfico |

---

## 6. Utilidades geoespaciales

| Utilidad | Archivo | Función |
|----------|---------|---------|
| Coordenadas | `coordinate.utils.ts` | Validación WGS84, bbox, auto-zoom |
| Distancias | `distance.utils.ts` | Haversine, longitud de polilínea |
| Áreas | `area.utils.ts` | Área de polígono (km², hectáreas) |
| Geometrías | `geometry.validation.ts` | Validación polyline/polygon |

---

## 7. Patrones aplicados

| Patrón | Implementación |
|--------|----------------|
| **Repository** | `MockGISRepository` |
| **Factory** | `GISFactory.create('mock')` |
| **Dependency Injection** | `getGISEngine()` / `setGISEngine()` |
| **Adapter** | `layer.adapter.ts` → `ManagedLayer` |
| **Facade** | `GISEngine` |
| **SOLID** | Interfaces segregadas, lógica fuera de React |

---

## 8. Preparación Google Earth Engine

1. `GISFactory.create('gee')` → futuro `GeeGISRepository`
2. `GISEngine.registerGeeLayer()` registra capas raster GEE
3. `SatelliteImage` con bounds, índices y URL simulada
4. `RasterLayer.format = 'geotiff'` preparado para export GEE
5. Capas Sentinel-2 / Landsat en catálogo (`GIS_LAYER_IDS.SENTINEL2`)

---

## 9. Preparación GeoJSON y Shapefiles

| Formato | Estado | Integración futura |
|---------|--------|-------------------|
| GeoJSON | Preparado | `GeoDataFormat: 'geojson'` en metadata |
| Shapefile | Preparado | `GeoDataFormat: 'shapefile'` |
| GeoTIFF | Preparado | `RasterLayer.format: 'geotiff'` |
| Mock | Activo | `MockGISRepository` |

`GISFactory.create('file')` reservado para repositorio basado en archivos.

---

## 10. Escalabilidad

- **Multi-cuenca:** `getWatersheds()` retorna todas las cuencas del mock
- **Multi-río:** filtros por `riverId` / `watershedId`
- **Multi-proyecto:** `SatelliteImage` vinculable a estación/proyecto
- **Extensión GEE:** nuevo repository sin modificar UI
- **Extensión PostgreSQL:** `GISRepository` implementación Prisma (Fase 6+)

---

## 11. Uso programático

```typescript
import { getGISEngine } from "@/services/gis";

const engine = getGISEngine();
const stations = engine.getMonitoringStations({ riverId: "rio-reque" });
const bbox = engine.computeStationsBBox("rio-reque");
const viewport = engine.getAutoZoomViewport("rio-reque");
const scale = engine.getService().getScale(12);
```

---

## 12. Compatibilidad UI

- Dashboard y `/mapa` **sin cambios visuales**
- `LayerManager` delega geometrías al `GISEngine`
- `ManagedLayer` se genera vía `toManagedLayers()` adapter
- `layer-geometries.ts` conservado como referencia (delegación activa en GIS)

---

## 13. Verificación

```powershell
npm run dev
```

Navegar a `/mapa` y verificar capas vectoriales, raster simuladas y estaciones.

---

## 14. Restricciones respetadas

- Google Earth Engine **no conectado**
- APIs externas **no utilizadas**
- Dashboard **sin cambios de diseño**
- Datos **100% simulados**
