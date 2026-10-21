# Proveedor Sentinel-2: Planetary Computer por defecto, Copernicus de respaldo

## Decisión

- **Microsoft Planetary Computer** es el proveedor **principal por defecto**. Es público, no requiere credenciales y hoy es el único adaptador que aplica la regla de **fracción de agua** (`f_agua ≥ 0,5`, ventana 3×3).
- **Copernicus Data Space Ecosystem (CDSE)** queda como **respaldo opcional**. Solo se activa si se configuran sus credenciales OAuth.
- Todos los módulos siguen el mismo orden de proveedores.

Historia: en una primera versión de la rama `rediseno`, Copernicus fue el principal. Se volvió a Planetary porque Copernicus no calcula la fracción de agua y hoy no hay credenciales de CDSE configuradas.

## Configuración

| Variable | Valores | Por defecto | Efecto |
|---|---|---|---|
| `SATELLITE_PRIMARY_PROVIDER` | `planetary`, `copernicus` | `planetary` | Proveedor que se consulta primero |
| `SATELLITE_PROVIDER_FALLBACK` | `true`, `false` | `true` | Si el principal no devuelve datos, se intenta el otro |
| `COPERNICUS_CLIENT_ID` / `COPERNICUS_CLIENT_SECRET` | credenciales OAuth de CDSE | sin definir | Activan el respaldo de Copernicus; sin ellas se salta |
| `PLANETARY_COMPUTER_ENABLED` | `true`, `false` | `true` | Desactiva Planetary Computer |
| `PLANETARY_MAX_CONCURRENCY` | 2–4 | `3` | Peticiones simultáneas máximas a Planetary Computer (fuera de rango se acota) |
| `PLANETARY_MAX_RETRIES` | 0–6 | `3` | Reintentos ante 429 / 408 / 5xx / fallo de red (firma, STAC, lecturas) |
| `PLANETARY_RETRY_BASE_DELAY_MS` | ms | `500` | Espera del primer reintento; se duplica en cada uno |
| `PLANETARY_RETRY_MAX_DELAY_MS` | ms | `8000` | Tope de la espera entre reintentos |
| `PLANETARY_STAC_CACHE_TTL_SECONDS` | s | `600` | Vida de la caché de búsquedas STAC (`0` la desactiva) |
| `PLANETARY_STAC_CACHE_MAX_ENTRIES` | entero | `100` | Búsquedas STAC guardadas como máximo |

Todos estos límites se leen en `getPlanetaryRequestConfig()` (`src/config/planetary-computer.config.ts`).

Ejemplos:

```env
# Por defecto: Planetary principal; Copernicus de respaldo solo si hay credenciales
COPERNICUS_CLIENT_ID="..."
COPERNICUS_CLIENT_SECRET="..."

# Copernicus como principal (la regla de fracción de agua no se aplicará a sus escenas)
SATELLITE_PRIMARY_PROVIDER="copernicus"

# Solo Planetary, sin respaldo
SATELLITE_PROVIDER_FALLBACK="false"
```

## Dónde se aplica

| Módulo | Archivo | Cómo elige |
|---|---|---|
| Escenas y observaciones (`/api/satellite/scenes`, `/observations`) | `src/server/satellite/satellite.service.ts` | `liveProviderOrder()`: Planetary → Copernicus → GEE (o Copernicus → GEE → Planetary) |
| Predicción satelital | `src/server/satellite/prediction/prediction.service.ts` | Mismo orden |
| NDVI / NDCI | `src/vegetation/vegetation-index.service.ts` | `sentinel2Provider` |
| Referencia satelital de la foto (Nivel 2) | `src/photo-quality/photo-satellite-reference.service.ts` | `sentinel2Provider` |
| Planificador de campañas | `src/server/satellite/opportunities/opportunity.service.ts` | `sentinel2Provider` |

El selector común está en `src/server/satellite/sentinel2-provider.ts` y la configuración en `src/config/satellite-provider.config.ts`.

## Reglas de honestidad y trazabilidad

1. **Escena y reflectancia del mismo proveedor.** Los `sceneId` de CDSE y de Planetary Computer no son intercambiables. El selector devuelve la escena junto con su proveedor y lee la reflectancia de ese mismo proveedor.
2. **Nunca un dato simulado de Copernicus como real.** Sin token OAuth real, el adaptador de Copernicus genera escenas de ejemplo (`metadataSource: "simulated"`). El selector y `satellite.service.ts` las descartan y pasan al siguiente proveedor.
3. **Proveedor en cada observación y en cada par.**
   - `SatelliteObservation.provider` se fija al construir la observación (`planetary`, `copernicus`, `gee`).
   - La comparación campo–satélite lo hereda.
   - Cada par de calibración lo guarda en `ScientificFieldSatellitePair.satelliteProvider`, y la exportación del dataset en la columna `satellite_provider`.
   - Si una observación antigua no lo trae, se deduce del prefijo de su id (`planetary-…`, `copernicus-…`, `gee-…`); si no se puede, queda como `unknown`. Nunca se adivina.
4. **Atribución en pantalla.** Vegetación, foto y planificador muestran qué proveedor sirvió el dato.

## Fracción de agua y el respaldo de Copernicus

La regla de fracción de agua solo está implementada en el adaptador de Planetary Computer. Con Planetary como principal se aplica normalmente y `/prediccion` no muestra ningún aviso.

Si una escena llega desde el **respaldo de Copernicus**, su `waterSufficiency` es `"unknown"`. La predicción no se bloquea, pero la regla no se verificó, y `/prediccion` lo avisa en ocre ("Escena del respaldo Copernicus: la fracción de agua no se verificó…"). Para cerrarlo hay que pedir la ventana 3×3 de B03/B08 en el evalscript de la Process API de CDSE y reutilizar `computeWaterFraction`.

## Control de carga hacia Planetary Computer

Planetary Computer limita la frecuencia de peticiones, sobre todo la de firma SAS. Antes, una consulta de observaciones podía lanzar 3 escenas × 6 bandas en paralelo, con una firma por banda y 2 intentos a 150 ms. Ahora (`src/server/planetary/pc-request-pool.ts`):

- **Cupo compartido:** como máximo `PLANETARY_MAX_CONCURRENCY` (3 por defecto, entre 2 y 4) peticiones simultáneas. La firma y la lectura del COG toman turnos separados, nunca anidados, para que el cupo no se bloquee.
- **Reintentos con espera:** ante 429, 408, 5xx o fallo de red, espera exponencial con jitter (0,5 s, 1 s, 2 s… hasta 8 s), respetando `Retry-After`. Un 404 no se reintenta.
- **Reutilización de resultados:**
  - firma SAS por asset, hasta 5 min antes de su `msft:expiry` (y peticiones simultáneas del mismo asset comparten una sola firma);
  - búsqueda STAC: 10 min por defecto (`PLANETARY_STAC_CACHE_TTL_SECONDS`), y las búsquedas idénticas simultáneas comparten una sola petición;
  - ítem STAC por id: 30 min;
  - reflectancia por escena y punto: 6 h (una escena publicada no cambia).
- **Los fallos nunca se guardan en caché**, para que una consulta posterior pueda obtener el dato.

Las cachés son en memoria y por proceso: un reinicio del servidor las vacía.

## Selección del píxel de agua

Con Planetary Computer, cada escena pasa por la selección robusta del píxel de agua: máscara SCL, NDWI 3×3, ajuste al agua más cercana del cauce (30 m) y bloqueo si no se cumple f_agua. Ver `docs/WATER_PIXEL_SELECTION.md` y la página `/revision-pixeles`.

## Diferencias entre proveedores

- **Mismo producto (Sentinel-2 L2A)**, pero con procesado y catálogo propios: puede haber pequeñas diferencias de reflectancia y de disponibilidad de escenas entre CDSE y Planetary Computer.
- No se deben mezclar pares de calibración de distintos proveedores sin declararlo. Ahora cada par lleva `satelliteProvider`, así que se pueden filtrar o separar.

## Pruebas

- `src/server/satellite/sentinel2-provider.test.ts`: orden por defecto y configurable, respaldo sin credenciales o con fallo de red, descarte de escenas simuladas, reflectancia del mismo proveedor.
- `src/server/satellite/validation/scientific-dataset.builder.test.ts`: proveedor en el par (declarado, deducido o `unknown`) y en la exportación.
- `src/server/planetary/pc-request-pool.test.ts`: cupo de concurrencia, reintentos con `Retry-After` y espera exponencial, sin reintento ante 404.
- `src/server/planetary/pc-stac.client.test.ts`: búsqueda STAC con respuestas 429/503 simuladas (reintentos, `PLANETARY_MAX_RETRIES`, sin reintento ante 400), caché de búsquedas repetidas y simultáneas, fallos fuera de caché, cupo de concurrencia y acotado de la configuración.
- `src/server/planetary/pc-sign.client.test.ts`: reutilización de la firma, firma compartida entre peticiones simultáneas, no reutilizar una firma a punto de caducar.

---

# Reglas Sentinel-2 del Dren 4000 (fases 1–5)

## Fase 1 · Buscador de tramos aptos (`/tramos-aptos`)

Los puntos históricos dentro del dren (P1–P5) no tienen agua visible en el píxel de 10 m. El buscador indica **dónde** muestrear para que el par campo–satélite sea posible.

- **Traza:**
  - Por defecto, la poligonal P1 → P5. Es **aproximada**: une los puntos con rectas.
  - Se puede subir un GeoJSON de **línea** (eje del dren) o de **polígono** (cauce). WGS84 o UTM 17S (`EPSG:32717`), máximo `GEOJSON_MAX_BYTES` (1 MB), dentro de la zona del dren.
- **Muestreo:** un punto cada **50 m** a lo largo de la línea, o una rejilla de 50 m dentro del polígono.
- **Escenas:** las `TRAMO_FINDER_SCENES` (por defecto **6**) más recientes de Sentinel-2 L2A en Planetary Computer, con nubosidad ≤ 40 % en los últimos 180 días.
- **Eficiencia:** por escena se hace **una lectura por banda** (B03, B08 y SCL) que cubre toda la traza, en lugar de una por punto.
- **Aptitud por escena:** la misma regla del píxel de agua de toda la plataforma. SCL = 6 y NDWI > 0, ventana 3×3, ≥ 3 píxeles de agua conectados, f_agua ≥ 0,5 y ajuste ≤ 30 m dentro del cauce.
- **Por tramo se calcula:**
  - frecuencia de aptitud (escenas aptas / escenas con datos; las descartadas por nubes cuentan como no aptas);
  - f_agua media;
  - coordenada representativa (el píxel de agua más repetido), en **UTM 17S** y en geográficas;
  - distancia al punto histórico más cercano (Nizama y Cabrera, 2014).
- **Histórico o nuevo:** a ≤ 25 m de un punto P es **histórico**; si no, **nuevo**. P6–P10 se evalúan aparte como **referencia** (puntos históricos con agua visible) y se conservan.
- **Uso del resultado:** los candidatos se ordenan por frecuencia de aptitud y luego por f_agua. Se pueden marcar como **"propuesto"** (la marca se guarda por traza) y exportar a CSV.
- **Cálculo:** corre **en segundo plano** y se guarda; la página muestra el último resultado y su fecha, sin recalcular al abrirse.

## Fase 2 · Regla de nubes configurable

`WATER_PIXEL_CLOUD_MODE` define qué hacer con los píxeles contaminados (SCL 3, 8, 9, 10, 11) de la ventana 3×3 del píxel usado:

| Modo | Valor | Regla |
|---|---|---|
| Estricto (por defecto) | `strict` | Un solo píxel con nube, sombra, cirros o nieve descarta la ventana |
| Relajado costero | `relaxed` (también `costero`) | Se acepta si el píxel usado es agua, se cumple f_agua (≥ 3 píxeles de agua y ≥ 0,5) y hay **como máximo 1** píxel contaminado, que no cuenta como válido |

- **Dónde queda guardado el modo:** en cada registro (`waterPixelSelection.cloudMode`) y en cada par de calibración (`pixelSelection.cloudMode`).
- **En las exportaciones:** columna `pixel_cloud_mode` del dataset y `regla_nubes` de la revisión de píxeles.
- **En el buscador de tramos:** lo indica en sus notas.
- **Registros antiguos:** los anteriores a esta fase se evaluaron con la regla estricta y así se exportan.

## Fase 3 · Polígono del cauce

- **Importación:** en `/tramos-aptos`, tarjeta "Polígono del cauce", o con `POST /api/satellite/cauce` y `{ name, geojson }`. Se quita con `DELETE`.
- **Validaciones:**
  - **Tipo:** solo `Polygon` o `MultiPolygon`.
  - **Sistema de coordenadas:** WGS84 (por defecto en GeoJSON) o UTM 17S declarado (`EPSG:32717`); cualquier otro `crs` se rechaza.
  - **Tamaño:** máximo `GEOJSON_MAX_BYTES` (1 MB) y 20 000 vértices.
  - **Geometría válida:** anillos cerrados, sin autointersecciones, con área > 0, y agujeros dentro de su anillo exterior.
  - **Ubicación:** dentro de la zona del Dren 4000.
- **Efecto:**
  - Con polígono, el píxel de agua **debe quedar dentro** de él. Esto vale también para el píxel central: si es agua pero queda fuera, se busca agua dentro.
  - El polígono **tiene prioridad** sobre la regla de cuerpo de agua conexo. `channelCheck` pasa de `connected_water_body` a `channel_polygon`.
  - Se aplica en la selección del píxel (predicción, pares, revisión de píxeles) y en el buscador de tramos.
  - Al cambiar el polígono se vacía la caché de reflectancias.

## Fase 4 · Imágenes propias (apoyo y verificación, NO satélite)

Página `/imagenes-propias` y API `/api/imagenes-propias`.

- **Archivos admitidos:** se identifican por su contenido, no por la extensión. Máximo `OWN_IMAGE_MAX_BYTES` (50 MB).
  - **GeoTIFF** de dron o multiespectral, en UTM WGS84 o geográficas `EPSG:4326`. Se recorta **geográficamente** una ventana de `windowM` metros (por defecto 30 m, como la ventana 3×3 de Sentinel-2) centrada en el punto. Si el píxel es muy fino, se lee remuestreado a ≤ 1000 px por lado.
  - **Foto JPEG/PNG:** no tiene georreferencia por píxel. Se usa la posición de la cámara del **GPS del EXIF** (o la que indique el usuario) y se recorta el **40 % central** de la imagen. Se registra la distancia de la cámara al punto.
- **Señal:** promedio, desviación, mínimo y máximo por banda disponible, en valores del sensor (DN o 0–255), **no reflectancia**.
- **Destino:** cada imagen se asocia a un punto histórico (P1–P10) o a un tramo marcado como **propuesto** en el buscador.
- **Separación de los datos satelitales:**
  - cada registro lleva `source = "imagen_propia"` y se guarda en su propio almacén;
  - **nunca** forma pares de calibración y **nunca** entra en R², RMSE ni MAE de Sentinel-2;
  - una prueba automática verifica que ningún módulo de calibración, pares, calidad o predicción lo importa;
  - en las tablas y CSV del buscador de tramos y de la revisión de píxeles aparece como **columna separada** (`imagen_propia_n`, `imagen_propia_ultima`), calculada al consultar;
  - tiene además su propia exportación CSV, con la columna `fuente`.
