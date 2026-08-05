-- HydroVision Fase 5.1 — Modelo Ambiental Profesional v2
-- Migración incremental desde Fase 5.0

-- Nuevos ENUMs
CREATE TYPE "EstadoRegistro" AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE "EstadoMuestreo" AS ENUM ('registered', 'validated', 'rejected');
CREATE TYPE "EstadoNormativa" AS ENUM ('draft', 'active', 'revoked');
CREATE TYPE "TipoCuerpoAgua" AS ENUM ('river', 'stream', 'canal', 'reservoir', 'lagoon');

-- Renombrar enum operativo estación
ALTER TYPE "EstadoEstacion" RENAME TO "EstadoPuntoMonitoreo";

-- Geografía: campos comunes
ALTER TABLE "departamentos" ADD COLUMN IF NOT EXISTS "estado" "EstadoRegistro" NOT NULL DEFAULT 'active';
ALTER TABLE "departamentos" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;
ALTER TABLE "provincias" ADD COLUMN IF NOT EXISTS "estado" "EstadoRegistro" NOT NULL DEFAULT 'active';
ALTER TABLE "provincias" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;
ALTER TABLE "distritos" ADD COLUMN IF NOT EXISTS "estado" "EstadoRegistro" NOT NULL DEFAULT 'active';
ALTER TABLE "distritos" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;

-- Cuenca v2
ALTER TABLE "cuencas" ADD COLUMN IF NOT EXISTS "codigo" VARCHAR(20);
UPDATE "cuencas" SET "codigo" = UPPER(REPLACE("id", 'cuenca-', 'CUC-')) WHERE "codigo" IS NULL;
ALTER TABLE "cuencas" ALTER COLUMN "codigo" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "cuencas_codigo_key" ON "cuencas"("codigo");
ALTER TABLE "cuencas" ADD COLUMN IF NOT EXISTS "estado" "EstadoRegistro" NOT NULL DEFAULT 'active';
ALTER TABLE "cuencas" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;

-- Subcuenca
CREATE TABLE IF NOT EXISTS "subcuencas" (
    "id" TEXT NOT NULL,
    "cuenca_id" TEXT NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "area_km2" DOUBLE PRECISION,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'active',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subcuencas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "subcuencas_cuenca_id_codigo_key" ON "subcuencas"("cuenca_id", "codigo");
ALTER TABLE "subcuencas" ADD CONSTRAINT "subcuencas_cuenca_id_fkey"
  FOREIGN KEY ("cuenca_id") REFERENCES "cuencas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Rio v2
ALTER TABLE "rios" ADD COLUMN IF NOT EXISTS "codigo" VARCHAR(20);
UPDATE "rios" SET "codigo" = UPPER(REPLACE("id", 'rio-', 'RIO-')) WHERE "codigo" IS NULL;
ALTER TABLE "rios" ALTER COLUMN "codigo" SET NOT NULL;
ALTER TABLE "rios" ADD COLUMN IF NOT EXISTS "subcuenca_id" TEXT;
ALTER TABLE "rios" ADD COLUMN IF NOT EXISTS "estado" "EstadoRegistro" NOT NULL DEFAULT 'active';
ALTER TABLE "rios" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "rios_cuenca_id_codigo_key" ON "rios"("cuenca_id", "codigo");
ALTER TABLE "rios" ADD CONSTRAINT "rios_subcuenca_id_fkey"
  FOREIGN KEY ("subcuenca_id") REFERENCES "subcuencas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Quebrada
CREATE TABLE IF NOT EXISTS "quebradas" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "cuenca_id" TEXT NOT NULL,
    "subcuenca_id" TEXT,
    "rio_id" TEXT,
    "nombre" VARCHAR(150) NOT NULL,
    "longitud_km" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'active',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quebradas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "quebradas_cuenca_id_codigo_key" ON "quebradas"("cuenca_id", "codigo");
ALTER TABLE "quebradas" ADD CONSTRAINT "quebradas_cuenca_id_fkey"
  FOREIGN KEY ("cuenca_id") REFERENCES "cuencas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quebradas" ADD CONSTRAINT "quebradas_subcuenca_id_fkey"
  FOREIGN KEY ("subcuenca_id") REFERENCES "subcuencas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quebradas" ADD CONSTRAINT "quebradas_rio_id_fkey"
  FOREIGN KEY ("rio_id") REFERENCES "rios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Proyecto v2
ALTER TABLE "proyectos" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;

CREATE TABLE IF NOT EXISTS "proyecto_rios" (
    "proyecto_id" TEXT NOT NULL,
    "rio_id" TEXT NOT NULL,
    CONSTRAINT "proyecto_rios_pkey" PRIMARY KEY ("proyecto_id","rio_id")
);
ALTER TABLE "proyecto_rios" ADD CONSTRAINT "proyecto_rios_proyecto_id_fkey"
  FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proyecto_rios" ADD CONSTRAINT "proyecto_rios_rio_id_fkey"
  FOREIGN KEY ("rio_id") REFERENCES "rios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PuntoMonitoreo (tabla estaciones)
ALTER TABLE "estaciones" RENAME COLUMN "estado_operativo" TO "estado";
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "subcuenca_id" TEXT;
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "quebrada_id" TEXT;
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "departamento_id" TEXT;
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "provincia_id" TEXT;
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "distrito_id" TEXT;
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "tipo_cuerpo_agua" "TipoCuerpoAgua" NOT NULL DEFAULT 'river';
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "fotografia_url" VARCHAR(500);
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "estado_registro" "EstadoRegistro" NOT NULL DEFAULT 'active';
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;
ALTER TABLE "estaciones" ALTER COLUMN "rio_id" DROP NOT NULL;

-- Campana / Muestreo
ALTER TABLE "campanas" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;
ALTER TABLE "muestreos" ADD COLUMN IF NOT EXISTS "estado" "EstadoMuestreo" NOT NULL DEFAULT 'registered';

-- Parametro: mover límites ECA a normativa
ALTER TABLE "parametros" DROP COLUMN IF EXISTS "limite_eca_min";
ALTER TABLE "parametros" DROP COLUMN IF EXISTS "limite_eca_max";
ALTER TABLE "parametros" DROP COLUMN IF EXISTS "activo";
ALTER TABLE "parametros" ADD COLUMN IF NOT EXISTS "estado" "EstadoRegistro" NOT NULL DEFAULT 'active';
ALTER TABLE "parametros" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;

-- Normativa ECA
CREATE TABLE IF NOT EXISTS "normativas_eca" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "vigente_desde" DATE NOT NULL,
    "vigente_hasta" DATE,
    "estado" "EstadoNormativa" NOT NULL DEFAULT 'active',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "normativas_eca_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "normativas_eca_codigo_key" ON "normativas_eca"("codigo");

CREATE TABLE IF NOT EXISTS "normativa_limites_parametro" (
    "id" TEXT NOT NULL,
    "normativa_id" TEXT NOT NULL,
    "parametro_id" TEXT NOT NULL,
    "limite_min" DOUBLE PRECISION,
    "limite_max" DOUBLE PRECISION,
    "unidad" VARCHAR(30) NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "normativa_limites_parametro_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "normativa_limites_parametro_normativa_id_parametro_id_key"
  ON "normativa_limites_parametro"("normativa_id", "parametro_id");

-- Medicion v2
ALTER TABLE "mediciones" RENAME COLUMN "medido_en" TO "fecha_medicion";
ALTER TABLE "mediciones" RENAME COLUMN "metodo" TO "metodo_analisis";
ALTER TABLE "mediciones" ADD COLUMN IF NOT EXISTS "laboratorio" VARCHAR(150);
ALTER TABLE "mediciones" ADD COLUMN IF NOT EXISTS "responsable_id" TEXT;
ALTER TABLE "mediciones" ADD COLUMN IF NOT EXISTS "estado" "EstadoRegistro" NOT NULL DEFAULT 'active';
ALTER TABLE "mediciones" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;

-- EvaluacionAmbiental v2
ALTER TABLE "evaluaciones_ambientales" ADD COLUMN IF NOT EXISTS "normativa_id" TEXT;
ALTER TABLE "evaluaciones_ambientales" ADD COLUMN IF NOT EXISTS "estado_registro" "EstadoRegistro" NOT NULL DEFAULT 'active';

-- IndiceSatelital v2
ALTER TABLE "indices_satelitales" ADD COLUMN IF NOT EXISTS "proyecto_id" TEXT;
ALTER TABLE "indices_satelitales" ADD COLUMN IF NOT EXISTS "temperatura_superficial" DOUBLE PRECISION;
ALTER TABLE "indices_satelitales" ADD COLUMN IF NOT EXISTS "cobertura_vegetal" DOUBLE PRECISION;
ALTER TABLE "indices_satelitales" ADD COLUMN IF NOT EXISTS "estado" "EstadoRegistro" NOT NULL DEFAULT 'active';
ALTER TABLE "indices_satelitales" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;

-- ImagenSatelital
CREATE TABLE IF NOT EXISTS "imagenes_satelitales" (
    "id" TEXT NOT NULL,
    "indice_satelital_id" TEXT,
    "estacion_id" TEXT NOT NULL,
    "proyecto_id" TEXT,
    "fuente" "FuenteSatelital" NOT NULL DEFAULT 'sentinel2',
    "fecha_adquisicion" DATE NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "tile_id" VARCHAR(50),
    "bandas" JSONB,
    "metadata" JSONB,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'active',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "imagenes_satelitales_pkey" PRIMARY KEY ("id")
);

-- Usuario / Reporte v2
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "estado" "EstadoRegistro" NOT NULL DEFAULT 'active';
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;
ALTER TABLE "reportes" ADD COLUMN IF NOT EXISTS "proyecto_id" TEXT;
ALTER TABLE "reportes" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;

-- FKs adicionales PuntoMonitoreo geografía
ALTER TABLE "estaciones" ADD CONSTRAINT "estaciones_departamento_id_fkey"
  FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "estaciones" ADD CONSTRAINT "estaciones_provincia_id_fkey"
  FOREIGN KEY ("provincia_id") REFERENCES "provincias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "estaciones" ADD CONSTRAINT "estaciones_distrito_id_fkey"
  FOREIGN KEY ("distrito_id") REFERENCES "distritos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "estaciones" ADD CONSTRAINT "estaciones_subcuenca_id_fkey"
  FOREIGN KEY ("subcuenca_id") REFERENCES "subcuencas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "estaciones" ADD CONSTRAINT "estaciones_quebrada_id_fkey"
  FOREIGN KEY ("quebrada_id") REFERENCES "quebradas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "mediciones" ADD CONSTRAINT "mediciones_responsable_id_fkey"
  FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "evaluaciones_ambientales" ADD CONSTRAINT "evaluaciones_ambientales_normativa_id_fkey"
  FOREIGN KEY ("normativa_id") REFERENCES "normativas_eca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "indices_satelitales" ADD CONSTRAINT "indices_satelitales_proyecto_id_fkey"
  FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "imagenes_satelitales" ADD CONSTRAINT "imagenes_satelitales_indice_satelital_id_fkey"
  FOREIGN KEY ("indice_satelital_id") REFERENCES "indices_satelitales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "imagenes_satelitales" ADD CONSTRAINT "imagenes_satelitales_estacion_id_fkey"
  FOREIGN KEY ("estacion_id") REFERENCES "estaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "imagenes_satelitales" ADD CONSTRAINT "imagenes_satelitales_proyecto_id_fkey"
  FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_proyecto_id_fkey"
  FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "estaciones_rio_id_codigo_key";
CREATE UNIQUE INDEX IF NOT EXISTS "estaciones_cuenca_id_codigo_key" ON "estaciones"("cuenca_id", "codigo");
