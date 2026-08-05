# Fase 2.2 — Panel profesional de control del mapa

Módulo de monitoreo ambiental con panel de control geográfico, sincronización de datos en tiempo real (simulados) y experiencia de usuario tipo ArcGIS Dashboard.

---

## Objetivo cumplido

Convertir el mapa en un **módulo profesional de monitoreo ambiental** con:

- Panel de control con 6 filtros jerárquicos simulados
- Sincronización entre título, mapa, marcadores, KPIs y tabla de estaciones
- Indicador visible **"Datos simulados"**
- Animaciones, hover, transiciones y diseño responsive
- Botones **Restablecer filtros** y **Centrar mapa**

---

## Componentes creados

| Componente | Ubicación | Responsabilidad |
|------------|-----------|-----------------|
| `SimulatedDataIndicator` | `src/components/ui/` | Badge reutilizable "Datos simulados" |
| `FilterSelect` | `src/components/map/filters/` | Select con hover/focus profesional |
| `MapFilterActions` | `src/components/map/filters/` | Botones de acción del panel |
| `MapControlPanel` | `src/components/map/filters/` | Panel estilo ArcGIS con cabecera oscura |
| `MapRecenter` | `src/components/map/` | Recentrado animado con `flyTo` |
| `FilteredMonitoringMap` | `src/components/map/` | Mapa Leaflet con filtros |
| `MapMonitoringSection` | `src/components/map/` | Panel + mapa en tarjeta |
| `MonitoringHeader` | `src/components/layout/` | Header con título dinámico |
| `DashboardView` | `src/components/dashboard/` | Orquestación client-side |
| `useMapFilters` | `src/hooks/` | Hook central de estado |
| `geography-simulated` | `src/lib/data/` | Jerarquía geográfica simulada |
| `filter-utils` | `src/lib/map/` | Cascada de filtros |
| `stats-utils` | `src/lib/map/` | KPIs derivados de estaciones |

---

## Componentes modificados

| Componente | Cambio | Compatibilidad |
|------------|--------|----------------|
| `MonitoringPointsTable` | Props opcionales `title`, `description`, `contentKey`; indicador simulado; animaciones | ✅ Defaults mantienen Fase 1 |
| `DashboardView` | Sincroniza KPIs, tabla y mapa con filtros | Solo integración |
| `MonitoringHeader` | Transiciones suaves en título/subtítulo | Sin breaking changes |
| `globals.css` | Animaciones `hv-fade-in`, `hv-pulse-soft` | Aditivo |
| `page.tsx` | Usa `DashboardView` | Integración mínima |

## Componentes preservados (sin cambios internos)

- `MapPlaceholder.tsx` — referencia Fase 2
- `MonitoringMap.tsx` — mapa original
- `Header.tsx` — header estático original
- `KpiCards`, `TemporalChart`, `Sidebar`, clasificador ECA
- `simulated.ts` — datos base Fase 1

---

## Decisiones de arquitectura

### 1. Hook único `useMapFilters`

Centraliza toda la lógica reactiva:

```
Filtros → riverContext → summaries → mapView + filteredStats + dashboardTitle
```

Evita prop drilling y mantiene una sola fuente de verdad.

### 2. Sincronización en cascada

Al cambiar el **río**:

| Elemento | Comportamiento |
|----------|----------------|
| Título dashboard | `HydroVision — Monitoreo del {río}` |
| Mapa | `flyTo` al centro simulado del río |
| Marcadores | Estaciones del río seleccionado |
| Tabla | Filas actualizadas con animación |
| KPIs | Recalculados según estaciones del río |

### 3. Componentes nuevos vs. modificar existentes

`FilteredMonitoringMap` extiende `MonitoringMap` sin modificarlo.  
`MonitoringHeader` reemplaza `Header` solo en `DashboardView`.  
`MonitoringPointsTable` recibe props opcionales para no romper usos previos.

### 4. Diseño tipo ArcGIS Dashboard

- Cabecera del panel: gradiente `slate-800 → slate-700`
- Ícono de capas + acciones en barra superior
- Filtros en grid responsive `1 → 2 → 3` columnas
- Selects con chevron, hover shadow y focus ring cyan
- Botones con `active:scale-[0.98]` y transiciones 200ms

### 5. Indicador "Datos simulados"

Componente `SimulatedDataIndicator` reutilizable en:

- Panel de control (variante `dark`)
- Cabecera de tarjeta del mapa
- Cabecera de tabla de estaciones

### 6. Animaciones

| Clase CSS | Uso |
|-----------|-----|
| `hv-animate-fade-in` | Panel, mapa, filas de tabla |
| `hv-animate-pulse-soft` | Estado de carga del mapa |
| Opacity transition | Mapa durante cambio de filtros |

### 7. Dynamic Import SSR-safe

`FilteredMonitoringMap` se carga con `next/dynamic` y `ssr: false` para evitar errores de Leaflet en el servidor.

---

## Filtros disponibles (datos simulados)

| Nivel | Ejemplos |
|-------|----------|
| Departamento | Lambayeque, La Libertad |
| Provincia | Lambayeque, Ferreñafe, Trujillo |
| Distrito | Reque, Monsefú, Ferreñafe, Laredo |
| Cuenca | Cuenca Reque, Cuenca Zaña, Cuenca La Leche, Cuenca Moche |
| Río | Reque (6 est.), Zaña (4), La Leche (5), Moche (3) |
| Estación | Todas o P1…Pn individual |

---

## Mejoras realizadas (respecto a 2.2 inicial)

1. **Tabla sincronizada** con el río seleccionado
2. **KPIs dinámicos** según estaciones del río
3. **Panel ArcGIS** con cabecera oscura e iconografía
4. **Indicador "Datos simulados"** en panel, mapa y tabla
5. **Animaciones** en filtros, mapa y filas de tabla
6. **Hover profesional** en selects, botones y filas
7. **Transición de opacidad** al cambiar filtros
8. **`stats-utils`** para mantener KPIs desacoplados del hook

---

## Dependencias

Sin nuevas dependencias. Reutiliza:

- `leaflet` ^1.9.4
- `react-leaflet` ^5.0.0

---

## No implementado (según restricciones)

- Google Earth Engine
- PostgreSQL / Prisma activo
- APIs de producción
- Inteligencia Artificial
- Reportes PDF

---

## Verificación

```powershell
cd C:\Users\ferch\Projects\hydrovision
npm install
npm run dev
```

### Checklist funcional

- [ ] Panel de 6 filtros visible con estilo ArcGIS
- [ ] Indicador "Datos simulados" en panel, mapa y tabla
- [ ] Cambiar río → título, mapa, marcadores, KPIs y tabla se actualizan
- [ ] "Restablecer filtros" → vuelve a Río Reque
- [ ] "Centrar mapa" → animación `flyTo`
- [ ] Hover en selects, botones y filas de tabla
- [ ] Responsive en móvil y tablet
- [ ] `npm run build` sin errores

---

## Recomendaciones para Fase 3

1. **Persistencia** — migrar `geography-simulated.ts` a PostgreSQL con Prisma
2. **API `/api/geography`** — jerarquía real desde backend
3. **GeoJSON** — trazar cauces reales al seleccionar río
4. **Sincronizar gráfico temporal** — filtrar `TemporalChart` por río/estación
5. **Índices satelitales** — vincular `SatelliteIndicesPreview` al río activo
6. **Validación server-side** — combinaciones geográficas inválidas
7. **Persistir filtros** — `localStorage` o query params para compartir vistas
8. **Accesibilidad** — anuncios ARIA al cambiar contexto de monitoreo

---

## Estructura final del módulo mapa

```
src/
├── hooks/useMapFilters.ts
├── types/geography.ts
├── lib/
│   ├── data/geography-simulated.ts
│   └── map/
│       ├── filter-utils.ts
│       └── stats-utils.ts
└── components/
    ├── ui/SimulatedDataIndicator.tsx
    ├── dashboard/DashboardView.tsx
    ├── layout/MonitoringHeader.tsx
    └── map/
        ├── FilteredMonitoringMap.tsx
        ├── MapMonitoringSection.tsx
        ├── MapRecenter.tsx
        └── filters/
            ├── FilterSelect.tsx
            ├── MapFilterActions.tsx
            └── MapControlPanel.tsx
```
