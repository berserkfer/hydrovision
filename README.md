# HydroVision

Plataforma de monitoreo y modelado de la calidad del agua del **Dren 4000** (Santa Rosa, Lambayeque, Perú). Proyecto de tesis de Ingeniería Ambiental (UCV): *"Desarrollo de plataforma predictiva de la calidad del agua mediante Sentinel-2 y datos in situ, Dren 4000, Lambayeque, 2027"*.

## Estado actual

Plataforma funcional con build de producción y **330 tests pasando** (36 archivos):

- Monitoreo: estaciones, muestreos, campañas, parámetros y evaluación ambiental.
- **Cumplimiento normativo ECA/LMP** por tipo de punto (`/normativa`): E2 para el cauce, E3 para la zona marina, LMP para los efluentes.
- **Capa satelital real** con Sentinel-2 L2A vía Microsoft Planetary Computer (sin credenciales), más adaptadores opcionales para Copernicus y Google Earth Engine.
- **Calibración exploratoria** campo–satélite con split temporal y validación *leave-one-date-out*.
- **Fracción de agua por píxel** (NDWI en ventana 3×3) para no tratar un píxel mixto como agua pura.
- PWA de campo con HydroColor y modo offline.
- Reportes PDF/Excel/CSV con marco normativo aplicable.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15.5, React 19, TypeScript estricto |
| Estilos | Tailwind CSS 4 |
| Gráficos / mapas | Recharts, Leaflet |
| Base de datos | PostgreSQL + Prisma 6 |
| Satélite | Microsoft Planetary Computer, Copernicus, Google Earth Engine |
| Pruebas | Vitest |

## Datos

- 20 muestras reales de 2014 (10 puntos × 2 fechas), fuente Nizama Pacheco & Cabrera Carranza (2018).
- **Sentinel-2A se lanzó el 23/06/2015**, por lo que esas muestras no tienen par satelital; el código lo declara explícitamente.
- Los datos simulados se marcan con `isSimulated` por registro y nunca se presentan como mediciones.

## Cómo ejecutar

```bash
npm ci
npm run dev      # http://localhost:3000
```

Para trabajar sin PostgreSQL, usa `DATA_SOURCE=mock`. Con base de datos:

```bash
npx prisma migrate deploy
npm run db:seed
```

## Verificación

```bash
npx vitest run     # 330 tests
npm run build      # build de producción
```

`npx tsc --noEmit` todavía reporta errores en fixtures de tests (ver `docs/ESTADO_TRABAJO.md`); el build de Next no se ve afectado.

## Documentación

- [Estado de trabajo](docs/ESTADO_TRABAJO.md)
- [Handoff para Claude Code](docs/HANDOFF_CLAUDE_CODE.md)
- [Análisis comparativo y roadmap](docs/INFORME_COMPARATIVO_2026-10.md)
- [Arquitectura de datos satelitales](docs/SATELLITE_DATA_ARCHITECTURE.md)

## Limitaciones declaradas

- El dren es estrecho frente al píxel de 10 m: la fracción de agua y el número de píxeles se reportan con cada estimación.
- La corrección atmosférica es la de Sentinel-2 L2A; no se ha validado contra ACOLITE/POLYMER.
- Sin campañas de campo posteriores a 2015 no es posible calibrar localmente; el sistema lo indica en lugar de fabricar valores.
