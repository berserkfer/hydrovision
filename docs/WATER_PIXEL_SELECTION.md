# Selección robusta del píxel de agua

Para cada punto de monitoreo y cada escena Sentinel-2 L2A (proveedor Planetary Computer), HydroVision decide qué píxel representa el agua del punto antes de calcular índices o predecir.

Código: `src/satellite/quality/water-pixel-selection.ts` (lógica pura) y `src/server/planetary/planetary.adapter.ts` (lectura de bandas).

## Pasos

1. **Máscara SCL.** Se leen rejillas de B03 y B08 (10 m) alrededor del punto. A cada píxel de 10 m se le asigna la clase SCL (20 m) del píxel que contiene su centro, por coordenadas, sin suponer que las rejillas están alineadas.
   - **Se descartan:** nube media y alta (8, 9), sombra de nube (3), cirros (10), nieve (11), y sin dato, saturado, oscuro o sin clasificar (0, 1, 2, 7).
   - **Se conservan solo para el NDWI:** agua (6), suelo desnudo (5) y vegetación (4).
2. **NDWI** = (B03 − B08) / (B03 + B08) en cada píxel. Un píxel es **agua** si SCL = 6 **y** NDWI > 0.
3. **Ajuste.** Si el píxel del punto no es agua, se busca el píxel de agua **más cercano** dentro del radio (por defecto 30 m, tres píxeles), solo si está **dentro del cauce**. Si hay empate de distancia, gana el de mayor NDWI.
4. **Regla de la ventana** (sin cambios): en la ventana 3×3 del píxel elegido debe haber al menos **3 píxeles de agua válidos** y **f_agua ≥ 0,5**. Si no se cumple, la escena queda bloqueada para el punto y **no se predice**.
5. **Nubes.** Si la ventana 3×3 (del punto o del píxel ajustado) contiene nube, sombra, cirros o nieve, la escena se **descarta** para ese punto.

## "Dentro del cauce"

El proyecto **todavía no tiene la geometría del cauce** del Dren 4000. Mientras no exista, el píxel candidato debe pertenecer a un **cuerpo de agua conexo** (8 vecinos) de al menos 3 píxeles de agua. Así, un charco o un píxel aislado mal clasificado no puede "capturar" el punto.

El criterio usado queda registrado en `channelCheck`:
- `connected_water_body`: el criterio actual.
- `channel_polygon`: cuando se configure un polígono, mediante el parámetro `isInChannel`. Está implementado y probado, pero sin datos de geometría.

## Estados

| Estado | Utilizable | Significado |
|---|---|---|
| `center_water` | sí | El píxel del punto es agua y la ventana cumple la regla |
| `adjusted` | sí | Se usó el píxel de agua más cercano dentro del cauce |
| `blocked_no_water_in_radius` | no | No hay agua del cauce dentro del radio |
| `blocked_insufficient_water` | no | La ventana no tiene ≥ 3 píxeles de agua o f_agua ≥ 0,5 |
| `discarded_clouds` | no | Nube, sombra, cirros o nieve en la ventana |
| `no_data` | no | Faltan B03/B08/SCL: no se elige píxel ni se asume agua |

## Qué se guarda

- **Observación** (`SatelliteObservation.waterPixelSelection`):
  - coordenada original y coordenada ajustada (centro del píxel usado);
  - distancia de ajuste en metros y desplazamiento en píxeles;
  - motivo legible, estado y métricas de la ventana.
- **Bandas:** B04, B05 y B11 se leen en la coordenada **ajustada**; B03, B08 y SCL salen del mismo píxel de la rejilla.
- **Par de calibración** (`ScientificFieldSatellitePair.pixelSelection` y `satelliteProvider`): píxel usado, distancia, motivo y proveedor de imágenes. Un píxel no utilizable **rechaza** el par con su motivo.
- **Exportación del dataset:** columnas `satellite_provider`, `pixel_status`, `pixel_adjustment_m`, `pixel_latitude`, `pixel_longitude` y `pixel_reason`.
- **Predicción:**
  - usa la escena **utilizable** más reciente;
  - si ninguna lo es, se bloquea con `NO_WATER_PIXELS` y el motivo de la selección.

## Revisión antes de calibrar

- **Página `/revision-pixeles`:** lista, para los 10 puntos y las escenas de los últimos 90 días, los píxeles ajustados, bloqueados y descartados, con coordenadas, distancia y motivo. Muestra también los puntos sin escenas.
- **API:** `GET /api/satellite/pixel-review?days=90` devuelve JSON; con `&format=csv` descarga un CSV.

## Configuración

| Variable | Por defecto | Rango |
|---|---|---|
| `WATER_PIXEL_SEARCH_RADIUS_M` | `30` | 0–60 m (0 desactiva el ajuste) |

## Limitaciones

- **Solo Planetary Computer.** El respaldo de Copernicus no aplica esta selección: sus escenas aparecen como "sin selección de píxel" en la revisión.
- **Cauce aproximado** por conectividad hasta que se cargue el polígono del Dren 4000.
- **SCL de 20 m.** En un dren angosto, un píxel SCL puede cubrir agua y orilla, y la clase asignada a cada píxel de 10 m hereda esa mezcla. Por eso se exige además NDWI > 0.
