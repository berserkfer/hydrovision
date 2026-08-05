# HydroVision — Prisma / PostgreSQL (Fase 5.0)

## Esquema

Ver `schema.prisma` — modelo normalizado con 12 entidades principales.

## Migración inicial

```powershell
npm run db:generate
npm run db:migrate
```

Migración: `prisma/migrations/20250801180000_fase_5_0_init/`

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
