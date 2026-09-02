/**
 * Seed PostgreSQL — Sprint 3B / 3D
 * Catálogos ambientales · 5 cuencas · 10 ríos · 30 estaciones
 */

import { PrismaClient } from "@prisma/client";
import { CATALOG_IDS, seedCatalogs } from "./seed/catalogs";
import { seedAuthorization } from "./seed/authorization";
import { seedMonitoringDemo } from "./seed/monitoring";

const prisma = new PrismaClient();

const NOW = new Date("2025-08-05T12:00:00.000Z");

// =============================================================================
// Geografía administrativa
// =============================================================================

const DEPARTAMENTO = {
  id: "dept-lambayeque",
  codigo: "LAM",
  nombre: "Lambayeque",
};

const PROVINCIA = {
  id: "prov-lambayeque",
  departmentId: DEPARTAMENTO.id,
  nombre: "Lambayeque",
};

const DISTRITOS = [
  { id: "dist-reque", nombre: "Reque" },
  { id: "dist-monsefu", nombre: "Monsefú" },
  { id: "dist-chiclayo", nombre: "Chiclayo" },
  { id: "dist-ferrenafe", nombre: "Ferreñafe" },
  { id: "dist-saana", nombre: "Saña" },
];

// =============================================================================
// Cuencas (5)
// =============================================================================

const CUENCAS = [
  {
    id: "cuenca-reque",
    codigo: "CUC-REQUE",
    distritoId: "dist-reque",
    nombre: "Cuenca Río Reque",
    region: "Lambayeque",
    descripcion: "Cuenca media del río Reque, principal eje de monitoreo HydroVision.",
    areaKm2: 1240,
  },
  {
    id: "cuenca-chancay",
    codigo: "CUC-CHANCAY",
    distritoId: "dist-chiclayo",
    nombre: "Cuenca Río Chancay",
    region: "Lambayeque",
    descripcion: "Cuenca costera con influencia agrícola intensiva.",
    areaKm2: 980,
  },
  {
    id: "cuenca-zana",
    codigo: "CUC-ZANA",
    distritoId: "dist-saana",
    nombre: "Cuenca Río Zaña",
    region: "Lambayeque",
    descripcion: "Cuenca histórica con uso mixto agrícola y urbano.",
    areaKm2: 760,
  },
  {
    id: "cuenca-lambayeque",
    codigo: "CUC-LAMBAY",
    distritoId: "dist-monsefu",
    nombre: "Cuenca Río Lambayeque",
    region: "Lambayeque",
    descripcion: "Cuenca alta con aporte andino y tramo intermedio cultivado.",
    areaKm2: 1580,
  },
  {
    id: "cuenca-ferrenafe",
    codigo: "CUC-FERRE",
    distritoId: "dist-ferrenafe",
    nombre: "Cuenca Ferreñafe",
    region: "Lambayeque",
    descripcion: "Subcuenca de la vertiente occidental de la región.",
    areaKm2: 620,
  },
];

// =============================================================================
// Ríos (10 — 2 por cuenca)
// =============================================================================

const RIOS = [
  { id: "rio-reque", codigo: "RIO-REQUE", cuencaId: "cuenca-reque", nombre: "Río Reque", longitudKm: 108, centroLat: -6.72, centroLng: -79.82, zoomMapa: 12 },
  { id: "rio-reque-bajo", codigo: "RIO-RQB", cuencaId: "cuenca-reque", nombre: "Reque Bajo", longitudKm: 42, centroLat: -6.78, centroLng: -79.76, zoomMapa: 13 },
  { id: "rio-chancay", codigo: "RIO-CHANC", cuencaId: "cuenca-chancay", nombre: "Río Chancay", longitudKm: 95, centroLat: -6.65, centroLng: -79.55, zoomMapa: 12 },
  { id: "rio-chancay-sur", codigo: "RIO-CHS", cuencaId: "cuenca-chancay", nombre: "Chancay Sur", longitudKm: 38, centroLat: -6.71, centroLng: -79.58, zoomMapa: 13 },
  { id: "rio-zana", codigo: "RIO-ZANA", cuencaId: "cuenca-zana", nombre: "Río Zaña", longitudKm: 88, centroLat: -6.92, centroLng: -79.45, zoomMapa: 12 },
  { id: "rio-zana-medio", codigo: "RIO-ZNM", cuencaId: "cuenca-zana", nombre: "Zaña Medio", longitudKm: 35, centroLat: -6.88, centroLng: -79.48, zoomMapa: 13 },
  { id: "rio-lambayeque", codigo: "RIO-LAMB", cuencaId: "cuenca-lambayeque", nombre: "Río Lambayeque", longitudKm: 120, centroLat: -6.58, centroLng: -79.68, zoomMapa: 12 },
  { id: "rio-lambayeque-alto", codigo: "RIO-LBA", cuencaId: "cuenca-lambayeque", nombre: "Lambayeque Alto", longitudKm: 48, centroLat: -6.52, centroLng: -79.72, zoomMapa: 13 },
  { id: "rio-ferrenafe", codigo: "RIO-FERR", cuencaId: "cuenca-ferrenafe", nombre: "Río Ferreñafe", longitudKm: 72, centroLat: -6.62, centroLng: -79.88, zoomMapa: 12 },
  { id: "rio-ferrenafe-este", codigo: "RIO-FRE", cuencaId: "cuenca-ferrenafe", nombre: "Ferreñafe Este", longitudKm: 30, centroLat: -6.66, centroLng: -79.84, zoomMapa: 13 },
];

const TRAMOS = ["Alto", "Medio", "Bajo"] as const;
const ESTADOS = ["active", "active", "active", "maintenance", "offline"] as const;

function stationCoords(rioIndex: number, stationIndex: number) {
  const rio = RIOS[rioIndex];
  const offsetLat = (stationIndex - 1) * 0.04;
  const offsetLng = (stationIndex - 1) * 0.03;
  return {
    latitude: Number((rio.centroLat + offsetLat).toFixed(6)),
    longitude: Number((rio.centroLng - offsetLng).toFixed(6)),
    altitud: 80 + rioIndex * 15 + stationIndex * 8,
  };
}

function buildStations() {
  const stations: Array<{
    id: string;
    codigo: string;
    nombre: string;
    cuencaId: string;
    rioId: string;
    distritoId: string;
    tramo: string;
    estado: (typeof ESTADOS)[number];
    coords: ReturnType<typeof stationCoords>;
  }> = [];

  let counter = 1;

  RIOS.forEach((rio, rioIndex) => {
    const cuenca = CUENCAS.find((c) => c.id === rio.cuencaId)!;

    TRAMOS.forEach((tramo, tramoIndex) => {
      const codigo = `E${String(counter).padStart(2, "0")}`;
      stations.push({
        id: `est-${codigo.toLowerCase()}`,
        codigo,
        nombre: `Estación ${codigo} — ${rio.nombre} (${tramo})`,
        cuencaId: cuenca.id,
        rioId: rio.id,
        distritoId: cuenca.distritoId,
        tramo: `Tramo ${tramo}`,
        estado: ESTADOS[(rioIndex + tramoIndex) % ESTADOS.length],
        coords: stationCoords(rioIndex, tramoIndex + 1),
      });
      counter += 1;
    });
  });

  return stations;
}

const STATIONS = buildStations();

async function seedGeography(): Promise<void> {
  await prisma.department.upsert({
    where: { id: DEPARTAMENTO.id },
    update: { nombre: DEPARTAMENTO.nombre },
    create: DEPARTAMENTO,
  });

  await prisma.province.upsert({
    where: { id: PROVINCIA.id },
    update: { nombre: PROVINCIA.nombre },
    create: PROVINCIA,
  });

  for (const distrito of DISTRITOS) {
    await prisma.district.upsert({
      where: { id: distrito.id },
      update: { nombre: distrito.nombre },
      create: {
        id: distrito.id,
        provinceId: PROVINCIA.id,
        nombre: distrito.nombre,
      },
    });
  }
}

async function seedWatersheds(): Promise<void> {
  for (const cuenca of CUENCAS) {
    await prisma.watershed.upsert({
      where: { id: cuenca.id },
      update: {
        nombre: cuenca.nombre,
        region: cuenca.region,
        descripcion: cuenca.descripcion,
        areaKm2: cuenca.areaKm2,
      },
      create: {
        id: cuenca.id,
        codigo: cuenca.codigo,
        distritoId: cuenca.distritoId,
        nombre: cuenca.nombre,
        region: cuenca.region,
        pais: "Perú",
        descripcion: cuenca.descripcion,
        areaKm2: cuenca.areaKm2,
      },
    });
  }
}

async function seedRivers(): Promise<void> {
  for (const rio of RIOS) {
    await prisma.river.upsert({
      where: { id: rio.id },
      update: {
        nombre: rio.nombre,
        longitudKm: rio.longitudKm,
        centroLat: rio.centroLat,
        centroLng: rio.centroLng,
      },
      create: {
        id: rio.id,
        codigo: rio.codigo,
        cuencaId: rio.cuencaId,
        nombre: rio.nombre,
        longitudKm: rio.longitudKm,
        centroLat: rio.centroLat,
        centroLng: rio.centroLng,
        zoomMapa: rio.zoomMapa,
      },
    });
  }
}

async function seedStations(): Promise<void> {
  const entidades = [
    "ANA — Autoridad Nacional del Agua",
    "Proyecto HydroVision UCV",
    "GORE Lambayeque",
  ];

  for (const [index, est] of STATIONS.entries()) {
    const sensorTypeId =
      index % 3 === 0
        ? CATALOG_IDS.sensorMultiparametric
        : index % 3 === 1
          ? CATALOG_IDS.sensorManual
          : CATALOG_IDS.sensorSatellite;

    await prisma.station.upsert({
      where: { id: est.id },
      update: {
        nombre: est.nombre,
        tramo: est.tramo,
        estado: est.estado,
        latitude: est.coords.latitude,
        longitude: est.coords.longitude,
        altitud: est.coords.altitud,
        codigoOficial: `PE-LAM-${est.codigo}`,
        entidadResponsable: entidades[index % entidades.length],
        ultimaActualizacion: NOW,
      },
      create: {
        id: est.id,
        codigo: est.codigo,
        codigoOficial: `PE-LAM-${est.codigo}`,
        nombre: est.nombre,
        cuencaId: est.cuencaId,
        rioId: est.rioId,
        departmentId: DEPARTAMENTO.id,
        provinceId: PROVINCIA.id,
        districtId: est.distritoId,
        waterBodyTypeId: CATALOG_IDS.waterBodyRiver,
        sensorTypeId,
        tipoEstacion: index % 4 === 0 ? "automatica" : index % 4 === 1 ? "mixta" : "manual",
        latitude: est.coords.latitude,
        longitude: est.coords.longitude,
        altitud: est.coords.altitud,
        tramo: est.tramo,
        entidadResponsable: entidades[index % entidades.length],
        descripcion: `Punto de monitoreo ${est.codigo} en ${est.tramo.toLowerCase()} del ${RIOS.find((r) => r.id === est.rioId)?.nombre ?? "río"}.`,
        fechaInstalacion: new Date("2022-03-15"),
        estado: est.estado,
        ultimaActualizacion: NOW,
      },
    });
  }
}

async function main(): Promise<void> {
  console.log("🌱 Sprint 3D — Seeding HydroVision PostgreSQL…");

  await seedCatalogs(prisma);
  await seedAuthorization(prisma);
  await seedGeography();
  await seedWatersheds();
  await seedRivers();
  await seedStations();
  await seedMonitoringDemo(prisma);

  console.log(`✅ ${CUENCAS.length} cuencas`);
  console.log(`✅ ${RIOS.length} ríos`);
  console.log(`✅ ${STATIONS.length} estaciones`);
  console.log("✅ roles, permisos y usuarios ficticios (Sprint 3I)");
  console.log("✅ campañas, muestreos, parámetros y mediciones demostrativas (Prompt 1)");
  console.log("🎉 Seed completado.");
}

main()
  .catch((error) => {
    console.error("❌ Error en seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
