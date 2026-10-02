-- Dren 4000: nuevos códigos de parámetro para mediciones reales publicadas
-- (Nizama Pacheco & Cabrera Carranza, 2018) que no tenían equivalente exacto:
--   - thermotolerant_coliforms: distinto de "coliforms" (coliformes totales)
--   - total_suspended_solids: distinto de "total_dissolved_solids" (disueltos, no suspendidos)
ALTER TYPE "TipoParametroCodigo" ADD VALUE IF NOT EXISTS 'thermotolerant_coliforms';
ALTER TYPE "TipoParametroCodigo" ADD VALUE IF NOT EXISTS 'total_suspended_solids';
