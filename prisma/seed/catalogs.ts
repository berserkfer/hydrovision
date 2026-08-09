/**
 * Seed — Catálogos ambientales Sprint 3D
 */

import type { PrismaClient } from "@prisma/client";

export const CATALOG_IDS = {
  ecaStandard: "eca-agua-receptores-v1",
  waterBodyRiver: "wbt-river",
  waterBodyStream: "wbt-stream",
  waterBodyCanal: "wbt-canal",
  waterBodyReservoir: "wbt-reservoir",
  waterBodyLagoon: "wbt-lagoon",
  sensorMultiparametric: "sensor-multiparametric",
  sensorManual: "sensor-manual",
  sensorSatellite: "sensor-satellite-proxy",
  satelliteSentinel2: "sat-src-sentinel2",
  satelliteLandsat8: "sat-src-landsat8",
  satelliteLandsat9: "sat-src-landsat9",
} as const;

const PARAMETER_CATEGORIES = [
  { id: "cat-fisico", codigo: "FISICO", nombre: "Parámetros físicos", descripcion: "Temperatura, turbidez, conductividad, sólidos disueltos" },
  { id: "cat-quimico", codigo: "QUIMICO", nombre: "Parámetros químicos", descripcion: "pH, nutrientes, materia orgánica, DQO/DBO" },
  { id: "cat-biologico", codigo: "BIOLOGICO", nombre: "Parámetros biológicos", descripcion: "Coliformes e indicadores microbiológicos" },
  { id: "cat-hidrologico", codigo: "HIDROLOGICO", nombre: "Parámetros hidrológicos", descripcion: "Caudal, nivel, variables hidrométricas" },
];

const MEASUREMENT_UNITS = [
  { id: "unit-dimensionless", codigo: "DIMENSIONLESS", simbolo: "—", nombre: "Adimensional", descripcion: "pH y escalares sin unidad" },
  { id: "unit-ntu", codigo: "NTU", simbolo: "NTU", nombre: "Turbiedad", descripcion: "Nephelometric Turbidity Unit" },
  { id: "unit-us-cm", codigo: "US_CM", simbolo: "µS/cm", nombre: "Conductividad eléctrica", descripcion: "Microsiemens por centímetro" },
  { id: "unit-mg-l", codigo: "MG_L", simbolo: "mg/L", nombre: "Miligramos por litro", descripcion: "Concentración massica en agua" },
  { id: "unit-celsius", codigo: "CELSIUS", simbolo: "°C", nombre: "Grados Celsius", descripcion: "Temperatura" },
  { id: "unit-m3s", codigo: "M3S", simbolo: "m³/s", nombre: "Caudal", descripcion: "Metros cúbicos por segundo" },
  { id: "unit-mpn", codigo: "MPN", simbolo: "MPN/100mL", nombre: "Coliformes", descripcion: "Número más probable por 100 mL" },
];

const WATER_BODY_TYPES = [
  { id: CATALOG_IDS.waterBodyRiver, codigo: "RIVER", nombre: "Río", descripcion: "Cuerpo lótico principal" },
  { id: CATALOG_IDS.waterBodyStream, codigo: "STREAM", nombre: "Quebrada / arroyo", descripcion: "Cuerpo lótico menor" },
  { id: CATALOG_IDS.waterBodyCanal, codigo: "CANAL", nombre: "Canal", descripcion: "Canal de riego o derivación" },
  { id: CATALOG_IDS.waterBodyReservoir, codigo: "RESERVOIR", nombre: "Embalse", descripcion: "Cuerpo lentico regulado" },
  { id: CATALOG_IDS.waterBodyLagoon, codigo: "LAGOON", nombre: "Laguna", descripcion: "Cuerpo lentico natural o artificial" },
];

const SENSOR_TYPES = [
  { id: CATALOG_IDS.sensorMultiparametric, codigo: "MULTIPARAMETRIC", nombre: "Sonda multiparamétrica", tecnologia: "Electroquímica / óptica", descripcion: "pH, OD, conductividad, turbidez in situ" },
  { id: CATALOG_IDS.sensorManual, codigo: "MANUAL", nombre: "Muestreo manual", tecnologia: "Campo + laboratorio", descripcion: "Estación de muestreo convencional" },
  { id: CATALOG_IDS.sensorSatellite, codigo: "SATELLITE_PROXY", nombre: "Proxy satelital", tecnologia: "Teledetección", descripcion: "Estación vinculada a índices espectrales" },
];

const SATELLITE_SOURCES = [
  { id: CATALOG_IDS.satelliteSentinel2, codigo: "SENTINEL2", nombre: "Sentinel-2 MSI", plataforma: "Copernicus", resolucionMetros: 10 },
  { id: CATALOG_IDS.satelliteLandsat8, codigo: "LANDSAT8", nombre: "Landsat 8 OLI", plataforma: "NASA/USGS", resolucionMetros: 30 },
  { id: CATALOG_IDS.satelliteLandsat9, codigo: "LANDSAT9", nombre: "Landsat 9 OLI-2", plataforma: "NASA/USGS", resolucionMetros: 30 },
];

const ECA_STANDARD = {
  id: CATALOG_IDS.ecaStandard,
  codigo: "ECA-AGUA-RECEPTORES",
  nombre: "ECA Agua — Cuerpos receptores",
  descripcion: "Estándares de Calidad Ambiental para agua — referencia orientativa Perú (investigación)",
  version: "1.0",
  vigenteDesde: new Date("2023-01-01"),
};

export async function seedCatalogs(prisma: PrismaClient): Promise<void> {
  for (const cat of PARAMETER_CATEGORIES) {
    await prisma.parameterCategory.upsert({
      where: { id: cat.id },
      update: { nombre: cat.nombre, descripcion: cat.descripcion },
      create: cat,
    });
  }

  for (const unit of MEASUREMENT_UNITS) {
    await prisma.measurementUnit.upsert({
      where: { id: unit.id },
      update: { nombre: unit.nombre, simbolo: unit.simbolo },
      create: unit,
    });
  }

  for (const wbt of WATER_BODY_TYPES) {
    await prisma.waterBodyType.upsert({
      where: { id: wbt.id },
      update: { nombre: wbt.nombre },
      create: wbt,
    });
  }

  for (const sensor of SENSOR_TYPES) {
    await prisma.sensorType.upsert({
      where: { id: sensor.id },
      update: { nombre: sensor.nombre },
      create: sensor,
    });
  }

  for (const src of SATELLITE_SOURCES) {
    await prisma.satelliteSource.upsert({
      where: { id: src.id },
      update: { nombre: src.nombre },
      create: src,
    });
  }

  await prisma.ecaStandard.upsert({
    where: { id: ECA_STANDARD.id },
    update: {
      nombre: ECA_STANDARD.nombre,
      descripcion: ECA_STANDARD.descripcion,
    },
    create: {
      ...ECA_STANDARD,
      estado: "active",
    },
  });

  console.log("  ✓ Catálogos: Department/Province/District (geografía en seed principal)");
  console.log(`  ✓ ${PARAMETER_CATEGORIES.length} categorías de parámetro`);
  console.log(`  ✓ ${MEASUREMENT_UNITS.length} unidades de medición`);
  console.log(`  ✓ ${WATER_BODY_TYPES.length} tipos de cuerpo de agua`);
  console.log(`  ✓ ${SENSOR_TYPES.length} tipos de sensor / estación`);
  console.log(`  ✓ ${SATELLITE_SOURCES.length} fuentes satelitales`);
  console.log("  ✓ 1 estándar ECA");
}
