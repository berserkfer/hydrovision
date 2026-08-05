# Sprint 2A — Base de Datos Científica HydroVision

**Versión schema:** Sprint 2A sobre modelo v2 (Fase 5.1)  
**Motor:** PostgreSQL · Prisma ORM  
**Estado:** Diseño listo · Sin conexión PostgreSQL real · Mock activo

---

## Entidades núcleo (Sprint 2A)

| # | Entidad Prisma | Tabla | Descripción |
|---|----------------|-------|-------------|
| 1 | `Cuenca` | `cuencas` | Cuenca hidrográfica |
| 2 | `Rio` | `rios` | Cuerpo de agua principal |
| 3 | `PuntoMonitoreo` | `estaciones` | Estación de monitoreo |
| 4 | `Parametro` | `parametros` | Parámetro de calidad del agua |
| 5 | `Campana` | `campanas` | Campaña de monitoreo |
| 6 | `Medicion` | `mediciones` | Medición de campo/laboratorio |
| 7 | `IndiceSatelital` | `indices_satelitales` | Índices espectrales |
| 8 | `RiesgoAmbiental` | `riesgos_ambientales` | Riesgo ambiental agregado |

---

## Migración

```powershell
npm run db:validate
npm run db:generate
# Cuando PostgreSQL esté disponible:
npm run db:migrate
```

Archivo: `prisma/migrations/20250805120000_sprint_2a_scientific_database/migration.sql`

---

## Compatibilidad

- UI sin cambios — sigue usando `getDataStore()` mock
- Modelos v2 extendidos (no eliminados): Subcuenca, Quebrada, NormativaECA, Proyecto, etc.
- `PuntoMonitoreo` mapea a estación UI vía `legacy-adapter`
