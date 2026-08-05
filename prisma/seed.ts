/**
 * Seed PostgreSQL v2 — datos equivalentes a mockDataStore (Fase 5.1)
 */

import { PrismaClient } from "@prisma/client";
import { mockDataStore } from "../src/data/mock/store";
import {
  PARAMETRO_CATALOG,
  type ParametroDomainFields,
} from "../src/database/constants/parametros-catalog";

const prisma = new PrismaClient();

const NORMATIVA_ID = "eca-agua-receptores-v1";
const SUBCUENCA_REQUE_ID = "subcuenca-reque-media";

function parseDate(value: string): Date {
  return new Date(value);
}

function cuencaCodigo(id: string): string {
  return id.replace("cuenca-", "CUC-").toUpperCase().slice(0, 20);
}

function rioCodigo(id: string): string {
  return id.replace("rio-", "RIO-").toUpperCase().slice(0, 20);
}

/** Resuelve jerarquía administrativa desde cuencaId */
function resolveGeoFromCuenca(cuencaId: string) {
  const cuenca = mockDataStore.cuencas.find((c) => c.id === cuencaId);
  if (!cuenca) {
    return {
      distritoId: "reque",
      provinciaId: "lambayeque-prov",
      departamentoId: "lambayeque",
    };
  }
  const distrito = mockDataStore.distritos.find((d) => d.id === cuenca.distritoId)!;
  const provincia = mockDataStore.provincias.find((p) => p.id === distrito.provinciaId)!;
  return {
    distritoId: distrito.id,
    provinciaId: provincia.id,
    departamentoId: provincia.departamentoId,
  };
}

async function seedParametrosCatalog(): Promise<void> {
  for (const param of PARAMETRO_CATALOG) {
    await prisma.parametro.upsert({
      where: { id: param.id },
      update: {
        nombre: param.nombre,
        unidad: param.unidad,
        descripcion: param.descripcion,
      },
      create: {
        id: param.id,
        codigo: param.codigo,
        nombre: param.nombre,
        unidad: param.unidad,
        descripcion: param.descripcion,
      },
    });
  }
}

async function seedNormativaECA(): Promise<void> {
  await prisma.normativaECA.upsert({
    where: { id: NORMATIVA_ID },
    update: {
      nombre: "ECA Agua — Cuerpos receptores",
      descripcion: "Estándares de Calidad Ambiental para agua — referencia orientativa Perú",
      version: "1.0",
      vigenteDesde: parseDate("2023-01-01"),
      estado: "active",
    },
    create: {
      id: NORMATIVA_ID,
      codigo: "ECA-AGUA-RECEPTORES",
      nombre: "ECA Agua — Cuerpos receptores",
      descripcion: "Estándares de Calidad Ambiental para agua — referencia orientativa Perú",
      version: "1.0",
      vigenteDesde: parseDate("2023-01-01"),
      estado: "active",
    },
  });

  for (const param of PARAMETRO_CATALOG) {
    const limiteId = `lim-${NORMATIVA_ID}-${param.codigo}`;
    await prisma.normativaLimiteParametro.upsert({
      where: { id: limiteId },
      update: {
        limiteMin: param.limiteEcaMin ?? null,
        limiteMax: param.limiteEcaMax ?? null,
        unidad: param.unidad,
      },
      create: {
        id: limiteId,
        normativaId: NORMATIVA_ID,
        parametroId: param.id,
        limiteMin: param.limiteEcaMin ?? null,
        limiteMax: param.limiteEcaMax ?? null,
        unidad: param.unidad,
      },
    });
  }
}

async function seedGeography(): Promise<void> {
  for (const row of mockDataStore.departamentos) {
    await prisma.departamento.upsert({
      where: { id: row.id },
      update: { codigo: row.codigo, nombre: row.nombre },
      create: { id: row.id, codigo: row.codigo, nombre: row.nombre },
    });
  }

  for (const row of mockDataStore.provincias) {
    await prisma.provincia.upsert({
      where: { id: row.id },
      update: { departamentoId: row.departamentoId, nombre: row.nombre },
      create: { id: row.id, departamentoId: row.departamentoId, nombre: row.nombre },
    });
  }

  for (const row of mockDataStore.distritos) {
    await prisma.distrito.upsert({
      where: { id: row.id },
      update: { provinciaId: row.provinciaId, nombre: row.nombre },
      create: { id: row.id, provinciaId: row.provinciaId, nombre: row.nombre },
    });
  }

  for (const row of mockDataStore.cuencas) {
    await prisma.cuenca.upsert({
      where: { id: row.id },
      update: {
        codigo: cuencaCodigo(row.id),
        distritoId: row.distritoId,
        nombre: row.nombre,
        areaKm2: row.areaKm2,
      },
      create: {
        id: row.id,
        codigo: cuencaCodigo(row.id),
        distritoId: row.distritoId,
        nombre: row.nombre,
        areaKm2: row.areaKm2,
      },
    });
  }

  await prisma.subcuenca.upsert({
    where: { id: SUBCUENCA_REQUE_ID },
    update: {
      codigo: "SUB-REQUE-MEDIA",
      nombre: "Subcuenca Media — Río Reque",
      areaKm2: 620,
    },
    create: {
      id: SUBCUENCA_REQUE_ID,
      cuencaId: "cuenca-reque",
      codigo: "SUB-REQUE-MEDIA",
      nombre: "Subcuenca Media — Río Reque",
      areaKm2: 620,
    },
  });

  await prisma.quebrada.upsert({
    where: { id: "qb-reque-norte" },
    update: {
      codigo: "QB-REQUE-01",
      nombre: "Quebrada La Pampa",
      longitudKm: 8.5,
      latitude: -6.6521,
      longitude: -79.8812,
    },
    create: {
      id: "qb-reque-norte",
      cuencaId: "cuenca-reque",
      subcuencaId: SUBCUENCA_REQUE_ID,
      rioId: "rio-reque",
      codigo: "QB-REQUE-01",
      nombre: "Quebrada La Pampa",
      longitudKm: 8.5,
      latitude: -6.6521,
      longitude: -79.8812,
    },
  });

  for (const row of mockDataStore.rios) {
    const subcuencaId = row.id === "rio-reque" ? SUBCUENCA_REQUE_ID : null;
    await prisma.rio.upsert({
      where: { id: row.id },
      update: {
        codigo: rioCodigo(row.id),
        cuencaId: row.cuencaId,
        subcuencaId,
        nombre: row.nombre,
        longitudKm: row.longitudKm,
        centroLat: row.centro.latitude,
        centroLng: row.centro.longitude,
        zoomMapa: row.centro.zoom,
      },
      create: {
        id: row.id,
        codigo: rioCodigo(row.id),
        cuencaId: row.cuencaId,
        subcuencaId,
        nombre: row.nombre,
        longitudKm: row.longitudKm,
        centroLat: row.centro.latitude,
        centroLng: row.centro.longitude,
        zoomMapa: row.centro.zoom,
      },
    });
  }
}

async function seedUsuarios(): Promise<void> {
  for (const row of mockDataStore.usuarios) {
    await prisma.usuario.upsert({
      where: { id: row.id },
      update: {
        nombre: row.nombre,
        email: row.email,
        rol: row.rol,
        institucion: row.institucion,
        activo: row.activo,
      },
      create: {
        id: row.id,
        nombre: row.nombre,
        email: row.email,
        rol: row.rol,
        institucion: row.institucion,
        activo: row.activo,
      },
    });
  }
}

async function seedProyectoReque(): Promise<void> {
  await prisma.proyecto.upsert({
    where: { id: "proy-reque-2025" },
    update: {
      codigo: "PROY-REQUE-2025",
      nombre: "Monitoreo Calidad del Agua — Río Reque",
      descripcion:
        "Proyecto de tesis — caracterización fisicoquímica y evaluación ECA del río Reque (Lambayeque).",
      fechaInicio: parseDate("2025-01-01"),
      fechaFin: parseDate("2025-12-31"),
      estado: "active",
      responsableId: "usr-admin",
    },
    create: {
      id: "proy-reque-2025",
      codigo: "PROY-REQUE-2025",
      nombre: "Monitoreo Calidad del Agua — Río Reque",
      descripcion:
        "Proyecto de tesis — caracterización fisicoquímica y evaluación ECA del río Reque (Lambayeque).",
      fechaInicio: parseDate("2025-01-01"),
      fechaFin: parseDate("2025-12-31"),
      estado: "active",
      responsableId: "usr-admin",
    },
  });

  await prisma.proyectoCuenca.upsert({
    where: { proyectoId_cuencaId: { proyectoId: "proy-reque-2025", cuencaId: "cuenca-reque" } },
    update: {},
    create: { proyectoId: "proy-reque-2025", cuencaId: "cuenca-reque" },
  });

  await prisma.proyectoRio.upsert({
    where: { proyectoId_rioId: { proyectoId: "proy-reque-2025", rioId: "rio-reque" } },
    update: {},
    create: { proyectoId: "proy-reque-2025", rioId: "rio-reque" },
  });
}

async function seedPuntosMonitoreo(): Promise<void> {
  for (const row of mockDataStore.estaciones) {
    const geo = resolveGeoFromCuenca(row.cuencaId);
    const subcuencaId = row.rioId === "rio-reque" ? SUBCUENCA_REQUE_ID : null;

    await prisma.puntoMonitoreo.upsert({
      where: { id: row.id },
      update: {
        codigo: row.codigo,
        nombre: row.nombre,
        cuencaId: row.cuencaId,
        subcuencaId,
        rioId: row.rioId,
        departamentoId: geo.departamentoId,
        provinciaId: geo.provinciaId,
        distritoId: geo.distritoId,
        latitude: row.coordenadas.latitude,
        longitude: row.coordenadas.longitude,
        altitud: row.altitud,
        tipoCuerpoAgua: "river",
        tramo: row.tramo,
        descripcion: row.descripcion,
        fechaInstalacion: parseDate(row.fechaInstalacion),
        estado: row.estadoOperativo,
        ultimaActualizacion: parseDate(row.ultimaActualizacion),
      },
      create: {
        id: row.id,
        codigo: row.codigo,
        nombre: row.nombre,
        cuencaId: row.cuencaId,
        subcuencaId,
        rioId: row.rioId,
        departamentoId: geo.departamentoId,
        provinciaId: geo.provinciaId,
        distritoId: geo.distritoId,
        latitude: row.coordenadas.latitude,
        longitude: row.coordenadas.longitude,
        altitud: row.altitud,
        tipoCuerpoAgua: "river",
        tramo: row.tramo,
        descripcion: row.descripcion,
        fechaInstalacion: parseDate(row.fechaInstalacion),
        estado: row.estadoOperativo,
        ultimaActualizacion: parseDate(row.ultimaActualizacion),
      },
    });
  }
}

async function seedCampanas(): Promise<void> {
  for (const row of mockDataStore.campanas) {
    const proyectoId = row.rioId === "rio-reque" ? "proy-reque-2025" : null;

    await prisma.campana.upsert({
      where: { id: row.id },
      update: {
        codigo: row.codigo,
        nombre: row.nombre,
        proyectoId,
        rioId: row.rioId,
        cuencaId: row.cuencaId,
        fechaInicio: parseDate(row.fechaInicio),
        fechaFin: parseDate(row.fechaFin),
        responsableId: row.responsableId,
        estado: row.estado,
        objetivo: row.objetivo,
      },
      create: {
        id: row.id,
        codigo: row.codigo,
        nombre: row.nombre,
        proyectoId,
        rioId: row.rioId,
        cuencaId: row.cuencaId,
        fechaInicio: parseDate(row.fechaInicio),
        fechaFin: parseDate(row.fechaFin),
        responsableId: row.responsableId,
        estado: row.estado,
        objetivo: row.objetivo,
      },
    });
  }
}

async function seedMuestreosAndMediciones(): Promise<void> {
  for (const muestra of mockDataStore.muestras) {
    await prisma.muestreo.upsert({
      where: { id: muestra.id },
      update: {
        campanaId: muestra.campanaId,
        puntoMonitoreoId: muestra.estacionId,
        codigoMuestra: muestra.codigoMuestra,
        fechaMuestreo: parseDate(muestra.fechaMuestreo),
        responsableId: muestra.responsableId,
        clima: muestra.clima,
        colorAparente: muestra.colorAparente,
        estado: "validated",
        observaciones: muestra.observaciones ?? null,
      },
      create: {
        id: muestra.id,
        campanaId: muestra.campanaId,
        puntoMonitoreoId: muestra.estacionId,
        codigoMuestra: muestra.codigoMuestra,
        fechaMuestreo: parseDate(muestra.fechaMuestreo),
        responsableId: muestra.responsableId,
        clima: muestra.clima,
        colorAparente: muestra.colorAparente,
        estado: "validated",
        observaciones: muestra.observaciones ?? null,
      },
    });

    const params = mockDataStore.parametros.find((p) => p.muestraId === muestra.id);
    if (!params) continue;

    for (const catalogEntry of PARAMETRO_CATALOG) {
      const valor = (params as ParametroDomainFields)[catalogEntry.domainField];
      if (valor === undefined) continue;

      const medicionId = `med-${muestra.id}-${catalogEntry.codigo}`;

      await prisma.medicion.upsert({
        where: { id: medicionId },
        update: {
          valor: Number(valor),
          unidad: catalogEntry.unidad,
          fechaMedicion: parseDate(muestra.fechaMuestreo),
          metodoAnalisis: "SM 2550 B / APHA 4500",
          laboratorio: "Lab. Calidad Ambiental — UNMSM (simulado)",
          responsableId: "usr-operador",
        },
        create: {
          id: medicionId,
          muestreoId: muestra.id,
          parametroId: catalogEntry.id,
          puntoMonitoreoId: muestra.estacionId,
          valor: Number(valor),
          unidad: catalogEntry.unidad,
          fechaMedicion: parseDate(muestra.fechaMuestreo),
          metodoAnalisis: "SM 2550 B / APHA 4500",
          laboratorio: "Lab. Calidad Ambiental — UNMSM (simulado)",
          responsableId: "usr-operador",
          calidadDato: "valid",
        },
      });
    }
  }
}

async function seedEvaluaciones(): Promise<void> {
  for (const row of mockDataStore.clasificaciones) {
    await prisma.evaluacionAmbiental.upsert({
      where: { id: row.id },
      update: {
        muestreoId: row.muestraId,
        puntoMonitoreoId: row.estacionId,
        normativaId: NORMATIVA_ID,
        estado: row.estado,
        parametrosViolados: row.parametrosViolados,
        parametrosEnAlerta: row.parametrosEnAlerta,
        normativaReferencia: row.normativaReferencia,
        evaluadoEn: parseDate(row.evaluadoEn),
      },
      create: {
        id: row.id,
        muestreoId: row.muestraId,
        puntoMonitoreoId: row.estacionId,
        normativaId: NORMATIVA_ID,
        estado: row.estado,
        parametrosViolados: row.parametrosViolados,
        parametrosEnAlerta: row.parametrosEnAlerta,
        normativaReferencia: row.normativaReferencia,
        evaluadoEn: parseDate(row.evaluadoEn),
        evaluadoPorId: "usr-investigador",
      },
    });
  }
}

async function seedIndicesSatelitales(): Promise<void> {
  for (const row of mockDataStore.indicesSatelitales) {
    await prisma.indiceSatelital.upsert({
      where: { id: row.id },
      update: {
        puntoMonitoreoId: row.estacionId,
        proyectoId: "proy-reque-2025",
        fechaAdquisicion: parseDate(row.fechaAdquisicion),
        fuente: row.fuente,
        ndwi: row.ndwi,
        ndvi: row.ndvi,
        mndwi: row.mndwi,
        ndti: row.ndti,
        temperaturaSuperficial: Number((24 + row.ndvi * 5).toFixed(2)),
        coberturaVegetal: Number((row.ndvi * 100).toFixed(1)),
        coberturaNubosa: row.coberturaNubosa,
      },
      create: {
        id: row.id,
        puntoMonitoreoId: row.estacionId,
        proyectoId: "proy-reque-2025",
        fechaAdquisicion: parseDate(row.fechaAdquisicion),
        fuente: row.fuente,
        ndwi: row.ndwi,
        ndvi: row.ndvi,
        mndwi: row.mndwi,
        ndti: row.ndti,
        temperaturaSuperficial: Number((24 + row.ndvi * 5).toFixed(2)),
        coberturaVegetal: Number((row.ndvi * 100).toFixed(1)),
        coberturaNubosa: row.coberturaNubosa,
      },
    });

    if (row.fuente === "sentinel2") {
      await prisma.imagenSatelital.upsert({
        where: { id: `img-${row.id}` },
        update: {
          url: `https://storage.example.com/sentinel2/${row.estacionId}/${row.fechaAdquisicion}.tif`,
        },
        create: {
          id: `img-${row.id}`,
          indiceSatelitalId: row.id,
          puntoMonitoreoId: row.estacionId,
          proyectoId: "proy-reque-2025",
          fuente: "sentinel2",
          fechaAdquisicion: parseDate(row.fechaAdquisicion),
          url: `https://storage.example.com/sentinel2/${row.estacionId}/${row.fechaAdquisicion}.tif`,
          bandas: { B2: true, B3: true, B4: true, B8: true, B11: true },
        },
      });
    }
  }
}

async function seedReportes(): Promise<void> {
  for (const row of mockDataStore.reportes) {
    await prisma.reporte.upsert({
      where: { id: row.id },
      update: {
        titulo: row.titulo,
        proyectoId: "proy-reque-2025",
        rioId: row.rioId,
        cuencaId: row.cuencaId,
        fechaInicio: parseDate(row.fechaInicio),
        fechaFin: parseDate(row.fechaFin),
        generadoPorId: row.generadoPorId,
        estado: row.estado,
        resumen: row.resumen,
      },
      create: {
        id: row.id,
        titulo: row.titulo,
        proyectoId: "proy-reque-2025",
        rioId: row.rioId,
        cuencaId: row.cuencaId,
        fechaInicio: parseDate(row.fechaInicio),
        fechaFin: parseDate(row.fechaFin),
        generadoPorId: row.generadoPorId,
        estado: row.estado,
        resumen: row.resumen,
      },
    });

    for (const puntoId of row.estacionIds) {
      await prisma.reportePuntoMonitoreo.upsert({
        where: {
          reporteId_puntoMonitoreoId: { reporteId: row.id, puntoMonitoreoId: puntoId },
        },
        update: {},
        create: { reporteId: row.id, puntoMonitoreoId: puntoId },
      });
    }
  }
}

async function main(): Promise<void> {
  console.log("[HydroVision] Seed Fase 5.1 — Modelo v2...");

  await seedParametrosCatalog();
  await seedNormativaECA();
  await seedGeography();
  await seedUsuarios();
  await seedProyectoReque();
  await seedPuntosMonitoreo();
  await seedCampanas();
  await seedMuestreosAndMediciones();
  await seedEvaluaciones();
  await seedIndicesSatelitales();
  await seedReportes();

  console.log("[HydroVision] Seed v2 completado.");
}

main()
  .catch((error: unknown) => {
    console.error("[HydroVision] Error en seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
