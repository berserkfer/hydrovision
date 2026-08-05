# HydroVision — Prisma / PostgreSQL

## Esquema

Ver `schema.prisma` — **Sprint 2A Base de Datos Científica** (8 entidades núcleo + extensiones v2).

Documentación: `docs/SPRINT2A_SCIENTIFIC_DATABASE.md`

## Migraciones

| Migración | Descripción |
|-----------|-------------|
| `20250801180000_fase_5_0_init` | Inicial Fase 5.0 |
| `20250801210000_fase_5_1_model_v2` | Modelo ambiental v2 |
| `20250805120000_sprint_2a_scientific_database` | Sprint 2A — campos científicos + RiesgoAmbiental |

## Seed

```powershell
npm run db:seed
```

Importa datos equivalentes a `src/data/mock/store.ts` (Río Reque).

## Modo de datos

| Variable | Valor | Comportamiento |
|----------|-------|----------------|
| `DATA_SOURCE` | `mock` | Default — sin PostgreSQL |
| `DATA_SOURCE` | `database` | Usa `DatabaseDataProvider` |
