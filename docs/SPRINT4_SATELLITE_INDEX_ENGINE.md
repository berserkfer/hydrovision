# Sprint 4 — Satellite Index Engine

Motor de cálculo e interpretación de índices espectrales para HydroVision.

**Estado:** datos simulados · sin GEE · sin descarga de imágenes.

---

## Arquitectura

```
Dashboard (SatelliteIndicesSection)
        │
        ▼
useSatelliteIndexEngine (hook)
        │
        ▼
IndexService (fachada)
 ├── IndexCalculator  → Strategy: ISatelliteIndex (NDWI, NDVI, …)
 ├── IndexInterpreter → interpret(value)
 ├── IndexColorScale  → getLegend() / getColorScale()
 └── IndexRepository  → MockIndexRepository (getDataStore)
```

### Patrones

| Patrón | Implementación |
|--------|----------------|
| **Strategy** | `NdwiIndex`, `NdviIndex`, `MndwiIndex`, `NdtiIndex`, `NdmiIndex` |
| **Repository** | `MockIndexRepository` |
| **Factory** | `SatelliteIndexEngineFactory.create("mock" \| "gee")` |
| **DI** | `getIndexService()` |
| **SOLID / ISP** | Interfaces segregadas por responsabilidad |

---

## Responsabilidades

| Componente | Rol |
|------------|-----|
| `ISatelliteIndex` | `calculate()`, `interpret()`, `getLegend()`, `getColorScale()` |
| `IndexCalculator` | Ejecuta estrategias por código |
| `IndexInterpreter` | Interpretación semántica del valor |
| `IndexColorScale` | Escalas y colores de visualización |
| `IndexRepository` | Valores almacenados, bandas simuladas, históricos |
| `IndexService` | Snapshot para Dashboard con comparación temporal |

### Índices soportados

NDWI · NDVI · MNDWI · NDTI · NDMI

Cada uno incluye: nombre, descripción, fórmula, bandas, interpretación, rango, unidad y color.

---

## Integración Google Earth Engine (futuro)

1. Crear `GeeIndexRepository` que obtenga reflectancias desde `ee.Image.reduceRegion()`.
2. Reemplazar `calculateFromBands()` por valores GEE o mantener fórmulas locales sobre bandas reales.
3. Activar factory: `SatelliteIndexEngineFactory.create("gee")`.
4. Cambiar `source: "simulated"` → `"gee"` en resultados.

**Único punto de cambio por índice:** método `calculate()` de cada estrategia.

---

## Agregar un nuevo índice

1. Añadir definición en `config/index-definitions.ts`.
2. Crear clase estrategia extendiendo `BaseSatelliteIndex`.
3. Registrar en `SatelliteIndexEngineFactory.createStrategyMap()`.
4. Actualizar `SUPPORTED_INDEX_CODES`.

---

## Verificación

```powershell
npm run dev
```

Dashboard → sección **Índices Satelitales** con valor, estado, interpretación, color, leyenda y tendencia temporal simulada.

---

## Próximo Sprint

**Sprint 5 — Conexión GEE al Index Engine**
- `GeeIndexRepository` + OAuth2 Sprint 2/3
- Cálculo real sobre composiciones Sentinel-2
- Sincronización con Explorador Satelital (Sprint 3)
