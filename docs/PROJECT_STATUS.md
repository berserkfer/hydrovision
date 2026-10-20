# HydroVision — Estado del proyecto

**Fecha:** 20 de octubre de 2026
**Versión:** 0.2.0
**Estado:** plataforma funcional, build de producción verificado.

## Métricas verificadas

| Indicador | Valor |
|---|---|
| Páginas | 20 |
| Endpoints API | 44 |
| Pruebas | 330 (36 archivos) |
| Build | `next build` OK |
| Typecheck estricto | falla en fixtures de tests (ver deuda) |

## Módulos

| Módulo | Rutas |
|---|---|
| Monitoreo | `/`, `/estaciones`, `/muestreos`, `/campanas`, `/parametros` |
| Normativo | `/normativa` (ECA E2/E3/D1 y LMP PTAR/pesca) |
| Satélite | `/prediccion`, `/foto`, `/mapa` |
| Evaluación | `/evaluacion-ambiental`, `/indicadores` |
| Reportes | `/reports`, `/import`, `/audit`, `/users`, `/admin/system-status` |

## Capa de datos

- PostgreSQL + Prisma (35 modelos) con modo `mock` para demostración.
- Datos reales de 2014 (20 registros) y datos simulados marcados por registro.
- Importación CSV/Excel, auditoría y roles.

## Capa satelital

- Sentinel-2 L2A real vía Microsoft Planetary Computer (STAC público).
- Adaptadores opcionales para Copernicus Data Space y Google Earth Engine.
- Índices NDVI, NDCI, NDWI, MNDWI, NDTI y NDMI desde un catálogo único.
- Ventana de emparejamiento campo–satélite de **±3 días**.
- **Fracción de agua** por NDWI en ventana 3×3; mínimo 3 píxeles y `f_agua ≥ 0,5` antes de emitir un valor.
- Calibración exploratoria con validación *leave-one-date-out* y métricas por fecha.

## Motor normativo

- ECA E2 (cauce), E3 (mar) y D1 (riego), más LMP PTAR y LMP pesca.
- Valores transcritos de D.S. 004-2017-MINAM, D.S. 003-2010-MINAM y D.S. 010-2008-PRODUCE, con fuente por límite.
- Fósforo/fosfatos marcado como pendiente de verificación (el ECA limita fósforo total).

## Limitaciones conocidas

- El dren es estrecho frente al píxel de 10 m: sin campañas nuevas no hay pares suficientes para calibrar.
- La corrección atmosférica no se ha contrastado con ACOLITE/POLYMER.
- Sin autenticación real; usuario simulado por header.
- Sin caché ni límite de peticiones en las rutas satelitales.

## Próximos pasos

1. Campañas de campo sincronizadas con Sentinel-2 (≥30 pares en ≥6 fechas).
2. Anexos 3 y 4 del documento de tesis.
3. Corregir `tsc --noEmit` en fixtures y añadir CI.
4. Comparar L2A con ACOLITE/POLYMER.
5. Autenticación real y caché satelital.
