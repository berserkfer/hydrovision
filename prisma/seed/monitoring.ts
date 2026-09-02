/**
 * Seed — datos demostrativos de monitoreo (campañas, muestreos, parámetros, mediciones)
 * Marcados como demostrativos en observaciones. No representan datos reales de campo.
 */

import type { PrismaClient } from "@prisma/client";
import { PARAMETRO_CATALOG } from "../../src/database/constants/parametros-catalog";

const ECA_STANDARD_ID = "eca-agua-receptores-v1";
const DEMO_NOTE = "Dato demostrativo — HydroVision seed (no representa medición real)";

const CATEGORY_BY_FIELD: Record<string, string> = {
  ph: "cat-quimico",
  turbidity: "cat-fisico",
  conductivity: "cat-fisico",
  dissolved_oxygen: "cat-quimico",
  temperature: "cat-fisico",
  bod5: "cat-quimico",
  cod: "cat-quimico",
  coliforms: "cat-biologico",
  nitrates: "cat-quimico",
  phosphates: "cat-quimico",
  total_dissolved_solids: "cat-fisico",
  flow_rate: "cat-hidrologico",
};

export async function seedMonitoringDemo(prisma: PrismaClient): Promise<void> {
  // ---------------------------------------------------------------------------
  // Catálogo de parámetros + límites ECA orientativos
  // ---------------------------------------------------------------------------
  for (const entry of PARAMETRO_CATALOG) {
    await prisma.parameter.upsert({
      where: { codigo: entry.codigo },
      update: {
        nombre: entry.nombre,
        unidad: entry.unidad,
        descripcion: entry.descripcion,
        categoryId: CATEGORY_BY_FIELD[entry.codigo],
        estado: "active",
      },
      create: {
        id: entry.id,
        codigo: entry.codigo,
        nombre: entry.nombre,
        unidad: entry.unidad,
        descripcion: entry.descripcion,
        categoryId: CATEGORY_BY_FIELD[entry.codigo],
        estado: "active",
        observaciones: DEMO_NOTE,
      },
    });

    await prisma.ecaStandardParameterLimit.upsert({
      where: {
        ecaStandardId_parametroId: {
          ecaStandardId: ECA_STANDARD_ID,
          parametroId: entry.id,
        },
      },
      update: {
        limiteMin: entry.limiteEcaMin ?? null,
        limiteMax: entry.limiteEcaMax ?? null,
        unidad: entry.unidad,
      },
      create: {
        id: `eca-limit-${entry.codigo}`,
        ecaStandardId: ECA_STANDARD_ID,
        parametroId: entry.id,
        limiteMin: entry.limiteEcaMin ?? null,
        limiteMax: entry.limiteEcaMax ?? null,
        unidad: entry.unidad,
        observaciones: DEMO_NOTE,
      },
    });
  }

  const responsableId = "usr-investigador";

  // ---------------------------------------------------------------------------
  // Campañas demostrativas
  // ---------------------------------------------------------------------------
  const campaigns = [
    {
      id: "camp-demo-2025-01",
      codigo: "CAMP-2025-01",
      nombre: "Campaña Seca 2025 — Río Reque (demo)",
      rioId: "rio-reque",
      cuencaId: "cuenca-reque",
      fechaInicio: new Date("2025-01-15"),
      fechaFin: new Date("2025-03-31"),
      estado: "active" as const,
      objetivo: "Monitoreo demostrativo de calidad de agua en tramo medio del Reque.",
    },
    {
      id: "camp-demo-2025-02",
      codigo: "CAMP-2025-02",
      nombre: "Campaña Lluvias 2025 — Chancay (demo)",
      rioId: "rio-chancay",
      cuencaId: "cuenca-chancay",
      fechaInicio: new Date("2025-04-01"),
      fechaFin: new Date("2025-06-30"),
      estado: "planned" as const,
      objetivo: "Seguimiento demostrativo post-lluvias en cuenca costera.",
    },
  ];

  for (const camp of campaigns) {
    await prisma.campaign.upsert({
      where: { id: camp.id },
      update: {
        nombre: camp.nombre,
        estado: camp.estado,
        objetivo: camp.objetivo,
        observaciones: DEMO_NOTE,
      },
      create: {
        ...camp,
        responsableId,
        observaciones: DEMO_NOTE,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Muestreos + mediciones normalizadas (estaciones E01–E06 del seed geográfico)
  // ---------------------------------------------------------------------------
  const demoSamples = [
    {
      id: "muestreo-demo-e01",
      campanaId: "camp-demo-2025-01",
      estacionId: "est-e01",
      codigoMuestra: "E01-20250120",
      fecha: new Date("2025-01-20T10:30:00.000Z"),
      values: {
        ph: 7.4,
        turbidity: 12.5,
        conductivity: 420,
        dissolved_oxygen: 6.8,
        temperature: 24.2,
        bod5: 8.1,
        cod: 22,
        coliforms: 180,
        nitrates: 1.2,
        phosphates: 0.08,
        total_dissolved_solids: 310,
        flow_rate: 2.4,
      },
    },
    {
      id: "muestreo-demo-e02",
      campanaId: "camp-demo-2025-01",
      estacionId: "est-e02",
      codigoMuestra: "E02-20250205",
      fecha: new Date("2025-02-05T09:15:00.000Z"),
      values: {
        ph: 6.9,
        turbidity: 28,
        conductivity: 510,
        dissolved_oxygen: 5.2,
        temperature: 25.8,
        bod5: 11,
        cod: 31,
        coliforms: 420,
        nitrates: 2.1,
        phosphates: 0.15,
        total_dissolved_solids: 380,
        flow_rate: 1.9,
      },
    },
    {
      id: "muestreo-demo-e04",
      campanaId: "camp-demo-2025-01",
      estacionId: "est-e04",
      codigoMuestra: "E04-20250312",
      fecha: new Date("2025-03-12T11:00:00.000Z"),
      values: {
        ph: 7.8,
        turbidity: 8.2,
        conductivity: 390,
        dissolved_oxygen: 7.5,
        temperature: 23.5,
        bod5: 6.5,
        cod: 18,
        coliforms: 95,
        nitrates: 0.9,
        phosphates: 0.05,
        total_dissolved_solids: 290,
        flow_rate: 3.1,
      },
    },
  ];

  for (const sample of demoSamples) {
    await prisma.muestreo.upsert({
      where: { id: sample.id },
      update: {
        fechaMuestreo: sample.fecha,
        observaciones: DEMO_NOTE,
      },
      create: {
        id: sample.id,
        campanaId: sample.campanaId,
        puntoMonitoreoId: sample.estacionId,
        codigoMuestra: sample.codigoMuestra,
        fechaMuestreo: sample.fecha,
        responsableId,
        clima: "Parcialmente nublado",
        colorAparente: "Verde claro",
        observaciones: DEMO_NOTE,
        estado: "registered",
      },
    });

    for (const [codigo, valor] of Object.entries(sample.values)) {
      const parametro = await prisma.parameter.findUnique({
        where: { codigo: codigo as never },
      });
      if (!parametro) continue;

      await prisma.measurement.upsert({
        where: {
          muestreoId_parametroId: {
            muestreoId: sample.id,
            parametroId: parametro.id,
          },
        },
        update: {
          valor,
          unidad: parametro.unidad,
          fechaMedicion: sample.fecha,
          observaciones: DEMO_NOTE,
          estado: "active",
        },
        create: {
          id: `med-${sample.id}-${codigo}`,
          muestreoId: sample.id,
          campanaId: sample.campanaId,
          parametroId: parametro.id,
          puntoMonitoreoId: sample.estacionId,
          valor,
          unidad: parametro.unidad,
          fechaMedicion: sample.fecha,
          responsableId,
          calidadDato: "valid",
          estado: "active",
          observaciones: DEMO_NOTE,
        },
      });
    }

    // Evaluación ECA demostrativa simplificada
    const worstStatus =
      sample.values.dissolved_oxygen < 4
        ? "non_compliant"
        : sample.values.dissolved_oxygen < 5
          ? "alert"
          : sample.values.ph < 6.5 || sample.values.ph > 8.5
            ? "alert"
            : "compliant";

    await prisma.environmentalAssessment.upsert({
      where: { muestreoId: sample.id },
      update: {
        estado: worstStatus,
        evaluadoEn: sample.fecha,
        observaciones: DEMO_NOTE,
      },
      create: {
        id: `eca-${sample.id}`,
        muestreoId: sample.id,
        puntoMonitoreoId: sample.estacionId,
        normativaId: ECA_STANDARD_ID,
        estado: worstStatus,
        parametrosViolados: worstStatus === "non_compliant" ? ["dissolved_oxygen"] : [],
        parametrosEnAlerta: worstStatus === "alert" ? ["dissolved_oxygen"] : [],
        normativaReferencia: "ECA Agua — Cuerpos receptores (referencia orientativa — demo)",
        evaluadoEn: sample.fecha,
        evaluadoPorId: responsableId,
        observaciones: DEMO_NOTE,
      },
    });
  }

  console.log(`  ✓ ${PARAMETRO_CATALOG.length} parámetros + límites ECA`);
  console.log(`  ✓ ${campaigns.length} campañas demostrativas`);
  console.log(`  ✓ ${demoSamples.length} muestreos con mediciones normalizadas (demo)`);
}
