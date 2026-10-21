# HydroVision

[![CI](https://github.com/berserkfer/hydrovision/actions/workflows/ci.yml/badge.svg)](https://github.com/berserkfer/hydrovision/actions/workflows/ci.yml)

Plataforma de monitoreo y modelado de la calidad del agua del **Dren 4000** (Santa Rosa, Lambayeque, Perú). Proyecto de tesis de Ingeniería Ambiental (UCV): *"Desarrollo de plataforma predictiva de la calidad del agua mediante Sentinel-2 y datos in situ, Dren 4000, Lambayeque, 2027"*.

## Estado actual

Plataforma funcional con build de producción y **489 tests pasando** (56 archivos):

- **Monitoreo:** estaciones, muestreos, campañas, parámetros y evaluación ambiental.
- **Cumplimiento normativo ECA/LMP** por tipo de punto (`/normativa`).
- **Capa satelital** Sentinel-2 L2A: Microsoft Planetary Computer como fuente principal y Copernicus como respaldo opcional.
- **Selección robusta del píxel de agua** (máscara SCL, NDWI, ajuste al cauce, f_agua), con su revisión antes de calibrar (`/revision-pixeles`).
- **Buscador de tramos aptos** para Sentinel-2 (`/tramos-aptos`), con polígono del cauce opcional.
- **Calibración exploratoria** campo–satélite con validación *leave-one-date-out* (R² agrupado e IC por bootstrap).
- **Imágenes propias** de dron y campo (`/imagenes-propias`), solo para verificación.
- **Autenticación real:** sesión httpOnly y contraseñas bcrypt.
- PWA de campo con HydroColor y modo offline; reportes PDF, Excel y CSV.

## Reglas satelitales (resumen)

Detalle en [docs/SATELLITE_PROVIDER.md](docs/SATELLITE_PROVIDER.md) y [docs/WATER_PIXEL_SELECTION.md](docs/WATER_PIXEL_SELECTION.md).

| Regla | Qué hace | Configuración |
|---|---|---|
| Píxel de agua | Cuenta como agua si SCL = 6 y NDWI > 0. Ventana 3×3 con ≥ 3 píxeles de agua y f_agua ≥ 0,5; ajuste ≤ 30 m dentro del cauce. Si no se cumple, no se predice | `WATER_PIXEL_SEARCH_RADIUS_M` |
| Nubes | Estricta: 0 píxeles contaminados. Relajada costera: como máximo 1. El modo queda en cada registro y par | `WATER_PIXEL_CLOUD_MODE` |
| Cauce | Con polígono subido, el píxel debe quedar dentro; sin él, se exige un cuerpo de agua conexo | `/tramos-aptos` → Polígono del cauce |
| Tramos aptos | Traza P1→P5 (o GeoJSON) cada 50 m, en 6 escenas: frecuencia de aptitud, f_agua media, UTM 17S, histórico o nuevo | `TRAMO_FINDER_SCENES` |
| Imágenes propias | `source = imagen_propia`. Nunca en pares ni en R², RMSE o MAE; columnas separadas | `OWN_IMAGE_MAX_BYTES` |
| Mezcla subpíxel | **Experimental**, apagada por defecto, fuera de las métricas de la tesis | `SUBPIXEL_UNMIXING_ENABLED` |

**Hallazgo con datos reales (oct. 2026):**
- **P1–P5 (dentro del dren):** en 6 escenas Sentinel-2 recientes, ningún tramo de la traza P1→P5 tuvo píxeles de agua aptos. El dren es más angosto que el píxel de 10 m.
- **P6–P10 (zona marina):** sí tienen agua visible.

Los tramos nuevos que proponga el buscador (idealmente con el eje real del dren) son los candidatos para el muestreo de campo. P6–P10 se conservan como referencia.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15.5, React 19, TypeScript estricto |
| Estilos | Tailwind CSS 4 |
| Gráficos / mapas | Recharts, Leaflet |
| Base de datos | PostgreSQL + Prisma 6 |
| Satélite | Microsoft Planetary Computer (principal), Copernicus (respaldo), Google Earth Engine (opcional) |
| Pruebas | Vitest |

## Datos

- 20 muestras reales de 2014 (10 puntos × 2 fechas), fuente Nizama Pacheco & Cabrera Carranza (2018).
- **Sentinel-2A se lanzó el 23/06/2015**, por lo que esas muestras no tienen par satelital; el código lo declara explícitamente.
- Los datos simulados se marcan con `isSimulated` por registro y nunca se presentan como mediciones.
- **Resultados calculados y archivos subidos** (reportes guardados, tramos propuestos, polígono del cauce, imágenes propias) van al almacén en archivos `HV_DATA_DIR` (por defecto `.hv-data/`, fuera de git), mientras no se migren a PostgreSQL.

## Cómo ejecutar

```bash
npm ci
npm run dev      # http://localhost:3000
```

Para trabajar sin PostgreSQL, usa `DATA_SOURCE=mock`. Con base de datos:

```bash
npx prisma migrate deploy
npm run db:seed
HV_ADMIN_EMAIL="admin@institucion.pe" HV_ADMIN_PASSWORD="<contraseña segura>" npm run seed:admin
```

- **En producción** hace falta `AUTH_SECRET` (≥ 32 caracteres).
- **El usuario simulado** solo funciona con `NODE_ENV=development`.

Las variables están descritas en `.env.example`.

## Reportes pesados en segundo plano

La revisión de píxeles y el buscador de tramos **no se calculan al abrir la página**:
- la página muestra el último resultado guardado y su fecha;
- el botón "Recalcular en segundo plano" lanza el cálculo, que corre en el servidor y muestra su progreso;
- un fallo no borra el último resultado correcto.

Requiere un servidor Node persistente (`next start`).

## Verificación

```bash
npx vitest run     # 489 tests
npx tsc --noEmit   # typecheck limpio
npm run build      # build de producción
```

## Documentación

- [Proveedor satelital y reglas Sentinel-2 (fases 1–5)](docs/SATELLITE_PROVIDER.md)
- [Selección del píxel de agua](docs/WATER_PIXEL_SELECTION.md)
- [Autorización y autenticación](docs/AUTHORIZATION.md)
- [Estado de trabajo](docs/ESTADO_TRABAJO.md)
- [Handoff para Claude Code](docs/HANDOFF_CLAUDE_CODE.md)
- [Arquitectura de datos satelitales](docs/SATELLITE_DATA_ARCHITECTURE.md)

## Limitaciones declaradas

- **El dren es más estrecho que el píxel de 10 m.** Dentro del dren no hay píxeles de agua aptos en las escenas evaluadas; el sistema bloquea la predicción en vez de usar un píxel de tierra.
- **La traza por defecto P1→P5 es aproximada** (une los puntos con rectas). Subir el eje o el polígono real del dren mejora el buscador.
- **La corrección atmosférica es la de Sentinel-2 L2A.** No se ha validado contra ACOLITE ni POLYMER.
- **Sin campañas de campo posteriores a 2015 no es posible calibrar localmente.** El sistema lo indica en lugar de fabricar valores.
- **La mezcla subpíxel es experimental** y no forma parte de la validación de la tesis.
