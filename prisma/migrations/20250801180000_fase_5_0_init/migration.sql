-- HydroVision Fase 5.0 — Migración inicial PostgreSQL normalizado

-- CreateEnum
CREATE TYPE "EstadoECA" AS ENUM ('compliant', 'alert', 'non_compliant');
CREATE TYPE "EstadoEstacion" AS ENUM ('active', 'maintenance', 'offline');
CREATE TYPE "EstadoCampana" AS ENUM ('planned', 'active', 'completed', 'cancelled');
CREATE TYPE "EstadoProyecto" AS ENUM ('planned', 'active', 'completed', 'archived');
CREATE TYPE "EstadoReporte" AS ENUM ('draft', 'generated', 'published', 'archived');
CREATE TYPE "RolUsuario" AS ENUM ('admin', 'researcher', 'field_operator', 'viewer');
CREATE TYPE "FuenteSatelital" AS ENUM ('landsat8', 'landsat9', 'sentinel2');
CREATE TYPE "NivelAlerta" AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE "TipoParametroCodigo" AS ENUM ('ph', 'turbidity', 'conductivity', 'dissolved_oxygen', 'temperature', 'bod5', 'cod', 'coliforms', 'total_dissolved_solids', 'flow_rate');
CREATE TYPE "CalidadDato" AS ENUM ('valid', 'estimated', 'suspect');

-- CreateTable
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provincias" (
    "id" TEXT NOT NULL,
    "departamento_id" TEXT NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "provincias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "distritos" (
    "id" TEXT NOT NULL,
    "provincia_id" TEXT NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "distritos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cuencas" (
    "id" TEXT NOT NULL,
    "distrito_id" TEXT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "area_km2" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cuencas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rios" (
    "id" TEXT NOT NULL,
    "cuenca_id" TEXT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "longitud_km" DOUBLE PRECISION NOT NULL,
    "centro_lat" DOUBLE PRECISION NOT NULL,
    "centro_lng" DOUBLE PRECISION NOT NULL,
    "zoom_mapa" INTEGER NOT NULL DEFAULT 12,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'viewer',
    "institucion" VARCHAR(200) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proyectos" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'active',
    "responsable_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proyecto_cuencas" (
    "proyecto_id" TEXT NOT NULL,
    "cuenca_id" TEXT NOT NULL,
    CONSTRAINT "proyecto_cuencas_pkey" PRIMARY KEY ("proyecto_id","cuenca_id")
);

CREATE TABLE "estaciones" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "rio_id" TEXT NOT NULL,
    "cuenca_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitud" DOUBLE PRECISION NOT NULL,
    "tramo" VARCHAR(120) NOT NULL,
    "descripcion" TEXT,
    "fecha_instalacion" DATE NOT NULL,
    "estado_operativo" "EstadoEstacion" NOT NULL DEFAULT 'active',
    "ultima_actualizacion" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "estaciones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "campanas" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "proyecto_id" TEXT,
    "rio_id" TEXT NOT NULL,
    "cuenca_id" TEXT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "responsable_id" TEXT NOT NULL,
    "estado" "EstadoCampana" NOT NULL DEFAULT 'planned',
    "objetivo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "campanas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "muestreos" (
    "id" TEXT NOT NULL,
    "campana_id" TEXT NOT NULL,
    "estacion_id" TEXT NOT NULL,
    "codigo_muestra" VARCHAR(50) NOT NULL,
    "fecha_muestreo" TIMESTAMP(3) NOT NULL,
    "responsable_id" TEXT NOT NULL,
    "clima" VARCHAR(50) NOT NULL,
    "color_aparente" VARCHAR(50) NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "muestreos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parametros" (
    "id" TEXT NOT NULL,
    "codigo" "TipoParametroCodigo" NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "unidad" VARCHAR(30) NOT NULL,
    "limite_eca_min" DOUBLE PRECISION,
    "limite_eca_max" DOUBLE PRECISION,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "parametros_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mediciones" (
    "id" TEXT NOT NULL,
    "muestreo_id" TEXT NOT NULL,
    "parametro_id" TEXT NOT NULL,
    "estacion_id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "unidad" VARCHAR(30) NOT NULL,
    "medido_en" TIMESTAMP(3) NOT NULL,
    "metodo" VARCHAR(120),
    "calidad_dato" "CalidadDato" NOT NULL DEFAULT 'valid',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mediciones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evaluaciones_ambientales" (
    "id" TEXT NOT NULL,
    "muestreo_id" TEXT NOT NULL,
    "estacion_id" TEXT NOT NULL,
    "estado" "EstadoECA" NOT NULL,
    "score_riesgo" DOUBLE PRECISION,
    "nivel_alerta" "NivelAlerta",
    "parametros_violados" JSONB NOT NULL DEFAULT '[]',
    "parametros_en_alerta" JSONB NOT NULL DEFAULT '[]',
    "normativa_referencia" VARCHAR(255) NOT NULL,
    "evaluado_en" TIMESTAMP(3) NOT NULL,
    "evaluado_por_id" TEXT,
    "observaciones" TEXT,
    "model_version" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "evaluaciones_ambientales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "indices_satelitales" (
    "id" TEXT NOT NULL,
    "estacion_id" TEXT NOT NULL,
    "fecha_adquisicion" DATE NOT NULL,
    "fuente" "FuenteSatelital" NOT NULL,
    "ndwi" DOUBLE PRECISION NOT NULL,
    "ndvi" DOUBLE PRECISION NOT NULL,
    "mndwi" DOUBLE PRECISION NOT NULL,
    "ndti" DOUBLE PRECISION NOT NULL,
    "cobertura_nubosa" DOUBLE PRECISION NOT NULL,
    "tile_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "indices_satelitales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reportes" (
    "id" TEXT NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "rio_id" TEXT NOT NULL,
    "cuenca_id" TEXT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "generado_por_id" TEXT NOT NULL,
    "estado" "EstadoReporte" NOT NULL DEFAULT 'draft',
    "resumen" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reportes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reporte_estaciones" (
    "reporte_id" TEXT NOT NULL,
    "estacion_id" TEXT NOT NULL,
    CONSTRAINT "reporte_estaciones_pkey" PRIMARY KEY ("reporte_id","estacion_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_codigo_key" ON "departamentos"("codigo");
CREATE INDEX "provincias_departamento_id_idx" ON "provincias"("departamento_id");
CREATE INDEX "distritos_provincia_id_idx" ON "distritos"("provincia_id");
CREATE INDEX "cuencas_distrito_id_idx" ON "cuencas"("distrito_id");
CREATE INDEX "rios_cuenca_id_idx" ON "rios"("cuenca_id");
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");
CREATE UNIQUE INDEX "proyectos_codigo_key" ON "proyectos"("codigo");
CREATE INDEX "proyectos_responsable_id_idx" ON "proyectos"("responsable_id");
CREATE INDEX "proyectos_estado_idx" ON "proyectos"("estado");
CREATE INDEX "proyecto_cuencas_cuenca_id_idx" ON "proyecto_cuencas"("cuenca_id");
CREATE UNIQUE INDEX "estaciones_rio_id_codigo_key" ON "estaciones"("rio_id", "codigo");
CREATE INDEX "estaciones_rio_id_idx" ON "estaciones"("rio_id");
CREATE INDEX "estaciones_cuenca_id_idx" ON "estaciones"("cuenca_id");
CREATE INDEX "estaciones_estado_operativo_idx" ON "estaciones"("estado_operativo");
CREATE UNIQUE INDEX "campanas_codigo_key" ON "campanas"("codigo");
CREATE INDEX "campanas_proyecto_id_idx" ON "campanas"("proyecto_id");
CREATE INDEX "campanas_rio_id_idx" ON "campanas"("rio_id");
CREATE INDEX "campanas_cuenca_id_idx" ON "campanas"("cuenca_id");
CREATE INDEX "campanas_responsable_id_idx" ON "campanas"("responsable_id");
CREATE INDEX "campanas_estado_idx" ON "campanas"("estado");
CREATE UNIQUE INDEX "muestreos_codigo_muestra_key" ON "muestreos"("codigo_muestra");
CREATE INDEX "muestreos_campana_id_idx" ON "muestreos"("campana_id");
CREATE INDEX "muestreos_estacion_id_idx" ON "muestreos"("estacion_id");
CREATE INDEX "muestreos_fecha_muestreo_idx" ON "muestreos"("fecha_muestreo");
CREATE UNIQUE INDEX "parametros_codigo_key" ON "parametros"("codigo");
CREATE UNIQUE INDEX "mediciones_muestreo_id_parametro_id_key" ON "mediciones"("muestreo_id", "parametro_id");
CREATE INDEX "mediciones_estacion_id_idx" ON "mediciones"("estacion_id");
CREATE INDEX "mediciones_parametro_id_idx" ON "mediciones"("parametro_id");
CREATE INDEX "mediciones_medido_en_idx" ON "mediciones"("medido_en");
CREATE UNIQUE INDEX "evaluaciones_ambientales_muestreo_id_key" ON "evaluaciones_ambientales"("muestreo_id");
CREATE INDEX "evaluaciones_ambientales_estacion_id_idx" ON "evaluaciones_ambientales"("estacion_id");
CREATE INDEX "evaluaciones_ambientales_estado_idx" ON "evaluaciones_ambientales"("estado");
CREATE INDEX "evaluaciones_ambientales_evaluado_en_idx" ON "evaluaciones_ambientales"("evaluado_en");
CREATE INDEX "indices_satelitales_estacion_id_fecha_adquisicion_idx" ON "indices_satelitales"("estacion_id", "fecha_adquisicion");
CREATE INDEX "indices_satelitales_fuente_idx" ON "indices_satelitales"("fuente");
CREATE INDEX "reportes_rio_id_idx" ON "reportes"("rio_id");
CREATE INDEX "reportes_cuenca_id_idx" ON "reportes"("cuenca_id");
CREATE INDEX "reportes_estado_idx" ON "reportes"("estado");

-- AddForeignKey
ALTER TABLE "provincias" ADD CONSTRAINT "provincias_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "distritos" ADD CONSTRAINT "distritos_provincia_id_fkey" FOREIGN KEY ("provincia_id") REFERENCES "provincias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cuencas" ADD CONSTRAINT "cuencas_distrito_id_fkey" FOREIGN KEY ("distrito_id") REFERENCES "distritos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rios" ADD CONSTRAINT "rios_cuenca_id_fkey" FOREIGN KEY ("cuenca_id") REFERENCES "cuencas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proyecto_cuencas" ADD CONSTRAINT "proyecto_cuencas_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proyecto_cuencas" ADD CONSTRAINT "proyecto_cuencas_cuenca_id_fkey" FOREIGN KEY ("cuenca_id") REFERENCES "cuencas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "estaciones" ADD CONSTRAINT "estaciones_rio_id_fkey" FOREIGN KEY ("rio_id") REFERENCES "rios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "estaciones" ADD CONSTRAINT "estaciones_cuenca_id_fkey" FOREIGN KEY ("cuenca_id") REFERENCES "cuencas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campanas" ADD CONSTRAINT "campanas_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campanas" ADD CONSTRAINT "campanas_rio_id_fkey" FOREIGN KEY ("rio_id") REFERENCES "rios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campanas" ADD CONSTRAINT "campanas_cuenca_id_fkey" FOREIGN KEY ("cuenca_id") REFERENCES "cuencas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campanas" ADD CONSTRAINT "campanas_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "muestreos" ADD CONSTRAINT "muestreos_campana_id_fkey" FOREIGN KEY ("campana_id") REFERENCES "campanas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "muestreos" ADD CONSTRAINT "muestreos_estacion_id_fkey" FOREIGN KEY ("estacion_id") REFERENCES "estaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "muestreos" ADD CONSTRAINT "muestreos_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mediciones" ADD CONSTRAINT "mediciones_muestreo_id_fkey" FOREIGN KEY ("muestreo_id") REFERENCES "muestreos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mediciones" ADD CONSTRAINT "mediciones_parametro_id_fkey" FOREIGN KEY ("parametro_id") REFERENCES "parametros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mediciones" ADD CONSTRAINT "mediciones_estacion_id_fkey" FOREIGN KEY ("estacion_id") REFERENCES "estaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "evaluaciones_ambientales" ADD CONSTRAINT "evaluaciones_ambientales_muestreo_id_fkey" FOREIGN KEY ("muestreo_id") REFERENCES "muestreos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evaluaciones_ambientales" ADD CONSTRAINT "evaluaciones_ambientales_estacion_id_fkey" FOREIGN KEY ("estacion_id") REFERENCES "estaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "evaluaciones_ambientales" ADD CONSTRAINT "evaluaciones_ambientales_evaluado_por_id_fkey" FOREIGN KEY ("evaluado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "indices_satelitales" ADD CONSTRAINT "indices_satelitales_estacion_id_fkey" FOREIGN KEY ("estacion_id") REFERENCES "estaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_rio_id_fkey" FOREIGN KEY ("rio_id") REFERENCES "rios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_cuenca_id_fkey" FOREIGN KEY ("cuenca_id") REFERENCES "cuencas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_generado_por_id_fkey" FOREIGN KEY ("generado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reporte_estaciones" ADD CONSTRAINT "reporte_estaciones_reporte_id_fkey" FOREIGN KEY ("reporte_id") REFERENCES "reportes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reporte_estaciones" ADD CONSTRAINT "reporte_estaciones_estacion_id_fkey" FOREIGN KEY ("estacion_id") REFERENCES "estaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
