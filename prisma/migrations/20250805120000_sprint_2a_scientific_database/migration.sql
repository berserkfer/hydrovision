-- Sprint 2A — Base de Datos Científica HydroVision
-- Migración preparatoria (no ejecutar contra producción sin revisión)

-- CreateEnum: nuevos parámetros
ALTER TYPE "TipoParametroCodigo" ADD VALUE IF NOT EXISTS 'nitrates';
ALTER TYPE "TipoParametroCodigo" ADD VALUE IF NOT EXISTS 'phosphates';

-- Cuenca: campos científicos Sprint 2A
ALTER TABLE "cuencas" ADD COLUMN IF NOT EXISTS "region" VARCHAR(120) NOT NULL DEFAULT 'Lambayeque';
ALTER TABLE "cuencas" ADD COLUMN IF NOT EXISTS "pais" VARCHAR(80) NOT NULL DEFAULT 'Perú';
ALTER TABLE "cuencas" ADD COLUMN IF NOT EXISTS "descripcion" TEXT;
CREATE INDEX IF NOT EXISTS "cuencas_region_idx" ON "cuencas"("region");

-- Medición: cumplimiento ECA, comentario, campaña directa
ALTER TABLE "mediciones" ADD COLUMN IF NOT EXISTS "campana_id" TEXT;
ALTER TABLE "mediciones" ADD COLUMN IF NOT EXISTS "cumplimiento_eca" "EstadoECA";
ALTER TABLE "mediciones" ADD COLUMN IF NOT EXISTS "comentario" TEXT;
CREATE INDEX IF NOT EXISTS "mediciones_campana_id_idx" ON "mediciones"("campana_id");
CREATE INDEX IF NOT EXISTS "mediciones_cumplimiento_eca_idx" ON "mediciones"("cumplimiento_eca");
ALTER TABLE "mediciones" ADD CONSTRAINT "mediciones_campana_id_fkey"
  FOREIGN KEY ("campana_id") REFERENCES "campanas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Índice satelital: resolución espacial
ALTER TABLE "indices_satelitales" ADD COLUMN IF NOT EXISTS "resolucion_m" DOUBLE PRECISION NOT NULL DEFAULT 10;

-- Riesgo ambiental — nueva entidad Sprint 2A
CREATE TABLE IF NOT EXISTS "riesgos_ambientales" (
    "id" TEXT NOT NULL,
    "estacion_id" TEXT NOT NULL,
    "muestreo_id" TEXT,
    "evaluacion_id" TEXT,
    "nivel" "NivelAlerta" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "color" VARCHAR(20) NOT NULL,
    "fecha" DATE NOT NULL,
    "score" DOUBLE PRECISION,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'active',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "riesgos_ambientales_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "riesgos_ambientales_estacion_id_fecha_idx" ON "riesgos_ambientales"("estacion_id", "fecha");
CREATE INDEX IF NOT EXISTS "riesgos_ambientales_muestreo_id_idx" ON "riesgos_ambientales"("muestreo_id");
CREATE INDEX IF NOT EXISTS "riesgos_ambientales_nivel_idx" ON "riesgos_ambientales"("nivel");

ALTER TABLE "riesgos_ambientales" ADD CONSTRAINT "riesgos_ambientales_estacion_id_fkey"
  FOREIGN KEY ("estacion_id") REFERENCES "estaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "riesgos_ambientales" ADD CONSTRAINT "riesgos_ambientales_muestreo_id_fkey"
  FOREIGN KEY ("muestreo_id") REFERENCES "muestreos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "riesgos_ambientales" ADD CONSTRAINT "riesgos_ambientales_evaluacion_id_fkey"
  FOREIGN KEY ("evaluacion_id") REFERENCES "evaluaciones_ambientales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
