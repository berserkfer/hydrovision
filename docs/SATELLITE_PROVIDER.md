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
| `PLANETARY_MAX_CONCURRENCY` | entero ≥ 1 | `4` | Peticiones simultáneas máximas a Planetary Computer |
| `PLANETARY_MAX_RETRIES` | entero ≥ 0 | `3` | Reintentos ante 429 / 5xx / fallo de red (firma, STAC) |

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

- **Cupo compartido:** como máximo `PLANETARY_MAX_CONCURRENCY` (4) peticiones simultáneas. La firma y la lectura del COG toman turnos separados, nunca anidados, para que el cupo no se bloquee.
- **Reintentos con espera:** ante 429, 408, 5xx o fallo de red, espera exponencial con jitter (0,5 s, 1 s, 2 s… hasta 8 s), respetando `Retry-After`. Un 404 no se reintenta.
- **Reutilización de resultados:**
  - firma SAS por asset, hasta 5 min antes de su `msft:expiry` (y peticiones simultáneas del mismo asset comparten una sola firma);
  - búsqueda STAC: 10 min (ya existía);
  - ítem STAC por id: 30 min;
  - reflectancia por escena y punto: 6 h (una escena publicada no cambia).
- **Los fallos nunca se guardan en caché**, para que una consulta posterior pueda obtener el dato.

Las cachés son en memoria y por proceso: un reinicio del servidor las vacía.

## Diferencias entre proveedores

- **Mismo producto (Sentinel-2 L2A)**, pero con procesado y catálogo propios: puede haber pequeñas diferencias de reflectancia y de disponibilidad de escenas entre CDSE y Planetary Computer.
- No se deben mezclar pares de calibración de distintos proveedores sin declararlo. Ahora cada par lleva `satelliteProvider`, así que se pueden filtrar o separar.

## Pruebas

- `src/server/satellite/sentinel2-provider.test.ts`: orden por defecto y configurable, respaldo sin credenciales o con fallo de red, descarte de escenas simuladas, reflectancia del mismo proveedor.
- `src/server/satellite/validation/scientific-dataset.builder.test.ts`: proveedor en el par (declarado, deducido o `unknown`) y en la exportación.
- `src/server/planetary/pc-request-pool.test.ts`: cupo de concurrencia, reintentos con `Retry-After` y espera exponencial, sin reintento ante 404.
- `src/server/planetary/pc-sign.client.test.ts`: reutilización de la firma, firma compartida entre peticiones simultáneas, no reutilizar una firma a punto de caducar.
