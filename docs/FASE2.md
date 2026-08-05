# Fase 2 — Mapa interactivo Leaflet

Documentación de la implementación del módulo de mapa para HydroVision.

## Objetivo cumplido

Reemplazo del placeholder estático por un mapa real con **Leaflet** y **React Leaflet**, manteniendo el tamaño (`h-72`), diseño responsive y la arquitectura existente del proyecto.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/dashboard/MapPlaceholder.tsx` | Dynamic import (`ssr: false`) + contenedor Card sin cambios estructurales |
| `src/app/globals.css` | Estilos mínimos para íconos DivIcon de Leaflet |
| `package.json` | Nuevas dependencias Leaflet |

## Archivos creados

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/components/map/MonitoringMap.tsx` | Mapa Leaflet principal (client component) |
| `src/components/map/MapLegend.tsx` | Leyenda ECA (esquina inferior derecha) |
| `src/components/map/StationPopupContent.tsx` | Contenido del popup por estación |
| `src/components/map/station-icon.ts` | Factory de marcadores coloreados (DivIcon) |
| `src/components/map/map-config.ts` | Constantes: centro, zoom, colores, teselas OSM |
| `docs/FASE2.md` | Este documento |

---

## Dependencias instaladas

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

| Paquete | Versión | Uso |
|---------|---------|-----|
| `leaflet` | ^1.9.4 | Motor cartográfico |
| `react-leaflet` | ^5.0.0 | Componentes React para Leaflet (compatible React 19) |
| `@types/leaflet` | ^1.9.17 | Tipado TypeScript |

---

## Estructura creada

```
src/components/map/
├── map-config.ts           # Configuración centralizada
├── station-icon.ts         # Íconos por estado ECA
├── MapLegend.tsx           # Leyenda de colores
├── StationPopupContent.tsx # Popup con parámetros simulados
└── MonitoringMap.tsx       # MapContainer + marcadores + controles
```

El componente público del dashboard sigue siendo `MapPlaceholder` (sin renombrar ni eliminar), que delega el renderizado cartográfico a `MonitoringMap`.

---

## Decisiones técnicas

### 1. Dynamic Import (`ssr: false`)

Leaflet accede a `window` y al DOM del navegador. En Next.js App Router, importar Leaflet en el servidor provoca errores de hidratación o `window is not defined`.

**Solución:** `next/dynamic` en `MapPlaceholder.tsx` con `ssr: false` y estado de carga mientras el chunk del mapa se descarga.

### 2. DivIcon en lugar de íconos PNG

Los marcadores por defecto de Leaflet requieren rutas a imágenes (`marker-icon.png`) que en bundlers como Webpack/Turbopack suelen romperse. Se usan **DivIcon** circulares con colores ECA, sin assets externos.

### 3. Datos reutilizados de Fase 1

Las coordenadas y mediciones provienen de `src/lib/data/simulated.ts` y la clasificación ECA de `src/lib/eca/classifier.ts`. No se duplicaron datos ni se crearon APIs nuevas.

### 4. Centro del mapa

Centro en **Lambayeque, Perú** (`-6.7017, -79.9068`) con zoom `12`, suficiente para visualizar las seis estaciones simuladas del río Reque (P1–P6) agrupadas en la cuenca.

### 5. Controles cartográficos

- **Zoom:** control nativo de Leaflet (`zoomControl`, esquina superior izquierda)
- **Escala:** `<ScaleControl position="bottomleft" imperial={false} />` (metros/km)
- **Leyenda ECA:** componente HTML superpuesto en esquina inferior derecha

### 6. Colores ECA

| Estado | Color | Hex |
|--------|-------|-----|
| Cumple ECA | Verde | `#10b981` |
| En alerta | Amarillo | `#f59e0b` |
| No cumple | Rojo | `#ef4444` |

### 7. Teselas cartográficas

OpenStreetMap (gratuito, adecuado para prototipo de tesis). En producción institucional se puede cambiar la URL en `map-config.ts` sin tocar la lógica de marcadores.

---

## Funcionalidades del mapa

- 6 marcadores: **P1, P2, P3, P4, P5, P6**
- Popup con: nombre, estado ECA, pH, oxígeno disuelto, turbidez, temperatura, conductividad
- Leyenda de colores ECA
- Controles de zoom y escala métrica
- Altura fija `h-72` (288px) igual al placeholder original
- Responsive: ancho 100% del contenedor padre

---

## Cómo seguir con la Fase 3

La Fase 3 debe implementar **registro de parámetros fisicoquímicos e historial** con PostgreSQL + Prisma. Pasos recomendados:

1. **Activar Prisma** — completar `prisma/schema.prisma` según `docs/DATA-MODEL.md`
2. **API REST** — reemplazar stub en `src/app/api/monitoring/route.ts` con consultas reales
3. **Página `/monitoreo`** — formulario de captura y tabla de historial
4. **Conectar mapa** — opcionalmente refrescar marcadores desde la API en lugar de `simulated.ts`
5. **Gráficos temporales** — filtrar por estación P1–P6 con datos persistidos

No se integró en Fase 2 (según restricciones):

- Google Earth Engine
- Base de datos
- API de producción
- Inteligencia Artificial
- Reportes PDF

---

## Verificación

```bash
cd C:\Users\ferch\Projects\hydrovision
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) y confirmar:

- Mapa OSM centrado en Lambayeque
- 6 marcadores con colores ECA
- Popups al hacer clic
- Leyenda inferior derecha
- Zoom y escala operativos

Para build de producción:

```bash
npm run build
```
