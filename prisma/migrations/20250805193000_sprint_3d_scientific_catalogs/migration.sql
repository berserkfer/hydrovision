-- Sprint 3D — Catálogos ambientales y campos científicos

-- Catálogos nuevos
CREATE TABLE IF NOT EXISTS "cat_tipos_cuerpo_agua" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cat_tipos_cuerpo_agua_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cat_categorias_parametro" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cat_categorias_parametro_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cat_unidades_medicion" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "simbolo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cat_unidades_medicion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cat_fuentes_satelitales" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "plataforma" VARCHAR(80) NOT NULL,
    "resolucion_m" DOUBLE PRECISION,
    "descripcion" TEXT,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cat_fuentes_satelitales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cat_tipos_sensor" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "tecnologia" VARCHAR(80) NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cat_tipos_sensor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cat_tipos_cuerpo_agua_codigo_key" ON "cat_tipos_cuerpo_agua"("codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "cat_categorias_parametro_codigo_key" ON "cat_categorias_parametro"("codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "cat_unidades_medicion_codigo_key" ON "cat_unidades_medicion"("codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "cat_fuentes_satelitales_codigo_key" ON "cat_fuentes_satelitales"("codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "cat_tipos_sensor_codigo_key" ON "cat_tipos_sensor"("codigo");

-- Enums Sprint 3D
DO $$ BEGIN
    CREATE TYPE "NivelConfianza" AS ENUM ('high', 'medium', 'low', 'estimated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "TipoEstacion" AS ENUM ('automatica', 'manual', 'mixta', 'referencia');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Estaciones — campos científicos
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "codigo_oficial" VARCHAR(30);
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "entidad_responsable" VARCHAR(200);
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "water_body_type_id" TEXT;
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "sensor_type_id" TEXT;
ALTER TABLE "estaciones" ADD COLUMN IF NOT EXISTS "tipo_estacion" "TipoEstacion" NOT NULL DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS "estaciones_water_body_type_id_idx" ON "estaciones"("water_body_type_id");
CREATE INDEX IF NOT EXISTS "estaciones_sensor_type_id_idx" ON "estaciones"("sensor_type_id");
CREATE INDEX IF NOT EXISTS "estaciones_tipo_estacion_idx" ON "estaciones"("tipo_estacion");
CREATE INDEX IF NOT EXISTS "estaciones_entidad_responsable_idx" ON "estaciones"("entidad_responsable");

-- Mediciones — metadatos analíticos
ALTER TABLE "mediciones" ADD COLUMN IF NOT EXISTS "equipo_utilizado" VARCHAR(150);
ALTER TABLE "mediciones" ADD COLUMN IF NOT EXISTS "nivel_confianza" "NivelConfianza";
ALTER TABLE "mediciones" ADD COLUMN IF NOT EXISTS "unit_id" TEXT;

CREATE INDEX IF NOT EXISTS "mediciones_unit_id_idx" ON "mediciones"("unit_id");
CREATE INDEX IF NOT EXISTS "mediciones_nivel_confianza_idx" ON "mediciones"("nivel_confianza");
CREATE INDEX IF NOT EXISTS "mediciones_laboratorio_idx" ON "mediciones"("laboratorio");

-- Parámetros — catálogos
ALTER TABLE "parametros" ADD COLUMN IF NOT EXISTS "category_id" TEXT;
ALTER TABLE "parametros" ADD COLUMN IF NOT EXISTS "unit_id" TEXT;
CREATE INDEX IF NOT EXISTS "parametros_category_id_idx" ON "parametros"("category_id");
CREATE INDEX IF NOT EXISTS "parametros_unit_id_idx" ON "parametros"("unit_id");

-- Campañas — estándar ECA de referencia
ALTER TABLE "campanas" ADD COLUMN IF NOT EXISTS "eca_standard_id" TEXT;
CREATE INDEX IF NOT EXISTS "campanas_eca_standard_id_idx" ON "campanas"("eca_standard_id");
CREATE INDEX IF NOT EXISTS "campanas_fecha_inicio_fecha_fin_idx" ON "campanas"("fecha_inicio", "fecha_fin");

-- Índices satelitales — fuente catalogada
ALTER TABLE "indices_satelitales" ADD COLUMN IF NOT EXISTS "satellite_source_id" TEXT;
CREATE INDEX IF NOT EXISTS "indices_satelitales_satellite_source_id_idx" ON "indices_satelitales"("satellite_source_id");

-- FKs (idempotentes)
DO $$ BEGIN
    ALTER TABLE "estaciones" ADD CONSTRAINT "estaciones_water_body_type_id_fkey"
        FOREIGN KEY ("water_body_type_id") REFERENCES "cat_tipos_cuerpo_agua"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "estaciones" ADD CONSTRAINT "estaciones_sensor_type_id_fkey"
        FOREIGN KEY ("sensor_type_id") REFERENCES "cat_tipos_sensor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "parametros" ADD CONSTRAINT "parametros_category_id_fkey"
        FOREIGN KEY ("category_id") REFERENCES "cat_categorias_parametro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "parametros" ADD CONSTRAINT "parametros_unit_id_fkey"
        FOREIGN KEY ("unit_id") REFERENCES "cat_unidades_medicion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "mediciones" ADD CONSTRAINT "mediciones_unit_id_fkey"
        FOREIGN KEY ("unit_id") REFERENCES "cat_unidades_medicion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "campanas" ADD CONSTRAINT "campanas_eca_standard_id_fkey"
        FOREIGN KEY ("eca_standard_id") REFERENCES "normativas_eca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "indices_satelitales" ADD CONSTRAINT "indices_satelitales_satellite_source_id_fkey"
        FOREIGN KEY ("satellite_source_id") REFERENCES "cat_fuentes_satelitales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Índices geográficos adicionales
CREATE INDEX IF NOT EXISTS "departamentos_estado_idx" ON "departamentos"("estado");
CREATE INDEX IF NOT EXISTS "provincias_estado_idx" ON "provincias"("estado");
CREATE INDEX IF NOT EXISTS "distritos_estado_idx" ON "distritos"("estado");
CREATE INDEX IF NOT EXISTS "normativas_eca_vigente_desde_vigente_hasta_idx" ON "normativas_eca"("vigente_desde", "vigente_hasta");
