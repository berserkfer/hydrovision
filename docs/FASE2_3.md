# Fase 2.3 — Sistema profesional de estaciones de monitoreo

Extensión de HydroVision con entidades completas de estación y panel lateral de detalle interactivo.

---

## Objetivo cumplido

Convertir las estaciones P1–Pn en **entidades completas del sistema** con panel lateral que se actualiza al seleccionar una estación desde el **mapa** o la **tabla**.

---

## Componentes nuevos

| Componente | Ubicación | Responsabilidad |
|------------|-----------|-----------------|
| `StationDetailPanel` | `src/components/station/` | Panel lateral derecho con toda la info |
| `StationDetailEmpty` | `src/components/station/` | Estado vacío cuando no hay selección |
| `ParameterCard` | `src/components/station/` | Tarjeta de parámetro con icono y sparkline |
| `ParameterProgressBar` | `src/components/station/` | Barra de progreso normalizada |
| `ParameterSparkline` | `src/components/station/` | Gráfico SVG de tendencia |
| `StationHistoryCard` | `src/components/station/` | Tabla historial reciente simulado |
| `station-utils.ts` | `src/lib/station/` | Construcción de detalle, TDS, caudal, historial |
| `station.ts` | `src/types/` | Tipos `StationEntity`, `StationDetail`, etc. |

---

## Componentes modificados

| Componente | Cambio | Compatibilidad |
|------------|--------|----------------|
| `geography.ts` | `GeoStation` con altitud, instalación, estado operativo | ✅ Aditivo |
| `geography-simulated.ts` | Metadatos en estaciones + `getStationDetailById` | ✅ |
| `useMapFilters.ts` | `selectStation`, `stationDetail`, `clearStationSelection` | ✅ Extiende hook |
| `FilteredMonitoringMap.tsx` | Click en marcador + botón en popup | ✅ Props opcionales |
| `MapMonitoringSection.tsx` | Pasa callbacks de selección al mapa | ✅ |
| `MonitoringPointsTable.tsx` | Filas clicables + highlight selección | ✅ Props opcionales |
| `DashboardView.tsx` | Layout con panel lateral responsive | ✅ |

## Componentes preservados

- `MapPlaceholder`, `MonitoringMap`, `Header`, `KpiCards`, `TemporalChart`
- Clasificador ECA, componentes de filtros Fase 2.2

---

## Entidad de estación (simulada)

Cada estación incluye:

| Campo | Ejemplo |
|-------|---------|
| Código | P1, P2… |
| Nombre | Estación P1 — Sector alto |
| Coordenadas | lat/lng WGS84 |
| Altitud | m s.n.m. (simulada) |
| Río | Río Reque |
| Cuenca | Cuenca Reque |
| Fecha instalación | 2022-03-15 (simulada) |
| Estado operativo | Operativa / Mantenimiento / Fuera de línea |
| Última actualización | Timestamp medición |

---

## Panel lateral — contenido

### Información general
Coordenadas, altitud, río, cuenca, tramo, instalación, última actualización.

### Parámetros (con barras + sparklines)
- pH
- Temperatura
- Conductividad
- Oxígeno disuelto
- Turbidez
- Sólidos totales disueltos (TDS simulado)
- Caudal (simulado)

### Clasificación ECA
Cumple / En alerta / No cumple + parámetros violados.

### Historial reciente
| Fecha | Estado | Observación |

---

## Decisiones técnicas

### 1. Reutilización del hook `useMapFilters`

La selección de estación sincroniza:
- Filtro del panel de control (`stationId`)
- Marcadores del mapa (centra y filtra)
- Tabla de estaciones (highlight)
- Panel lateral (`stationDetail`)

Una sola fuente de verdad evita estados desincronizados.

### 2. `buildStationDetail` centralizado

Toda la lógica de enriquecimiento (TDS, caudal, historial, sparklines) vive en `station-utils.ts`, separada de la UI.

### 3. Sparklines SVG nativos

Sin dependencias adicionales — SVG `<polyline>` ligero y compatible con SSR del panel.

### 4. Barras de progreso normalizadas

Cada parámetro define `min`/`max` de referencia para visualización relativa, independiente de ECA.

### 5. Layout responsive

| Viewport | Panel lateral |
|----------|---------------|
| Desktop (`xl+`) | Columna derecha sticky (380px) |
| Móvil/tablet | Panel completo arriba del grid al seleccionar |

### 6. Interacción mapa + tabla

- **Mapa:** click en marcador o botón "Ver detalle completo" en popup
- **Tabla:** click en fila (accesible con Enter/Espacio)
- **Cerrar panel:** botón X → vuelve a "Todas las estaciones"

---

## Mejoras implementadas

1. Entidades de estación completas con metadatos ambientales
2. Panel lateral profesional estilo plataforma de monitoreo
3. Tarjetas de parámetros con iconos ambientales (Lucide)
4. Barras de progreso con colores semáforo
5. Sparklines de tendencia simulada
6. Historial reciente por estación
7. Sincronización mapa ↔ tabla ↔ panel ↔ filtros
8. Indicador "Datos simulados" en panel

---

## Verificación

```powershell
cd C:\Users\ferch\Projects\hydrovision
npm run dev
```

### Checklist

- [ ] Clic en marcador del mapa → panel lateral se actualiza
- [ ] Clic en fila de tabla → panel lateral se actualiza
- [ ] Selector de estación en filtros → panel se actualiza
- [ ] Botón X cierra panel y restaura "Todas las estaciones"
- [ ] Barras de progreso y sparklines visibles
- [ ] Historial reciente con fechas y estados ECA
- [ ] Responsive: panel arriba en móvil, derecha en desktop

---

## Próximos pasos (Fase 3)

1. **PostgreSQL** — persistir entidades `StationEntity` y mediciones reales
2. **API REST** — `/api/stations/:id` con historial real
3. **Gráficos temporales** — vincular sparklines a datos históricos reales
4. **GeoJSON** — resaltar tramo de río de la estación seleccionada
5. **Exportación** — ficha PDF de estación individual
6. **Alertas** — notificaciones cuando estado ECA cambia a "No cumple"

---

## Estructura creada

```
src/
├── types/station.ts
├── lib/station/station-utils.ts
└── components/station/
    ├── StationDetailPanel.tsx
    ├── StationDetailEmpty.tsx
    ├── ParameterCard.tsx
    ├── ParameterProgressBar.tsx
    ├── ParameterSparkline.tsx
    └── StationHistoryCard.tsx
```
