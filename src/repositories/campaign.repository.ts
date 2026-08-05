/**
 * Repositorio mock — Campañas de monitoreo (delegación a lib/mock).
 */

import { getDataStore } from "@/data/store-access";

export {
  createMockCampaign as createCampana,
  getMockCampaignDetail as getCampanaDetailById,
  getMockCampaignById as getCampanaById,
  getMockCampaignSummaries as getAllCampanaSummaries,
  getMockCampaignStats as getCampaignStats,
  getMockCuencasOptions as getCuencasOptions,
  getMockEstacionesByRio as getEstacionesByRio,
  getMockCampaignMonthOptions as getCampaignMonthOptions,
  getMockCampaignYearOptions as getCampaignYearOptions,
  getMockCampanasByRio as getCampanasByRio,
  getMockMuestrasByCampana as getMuestrasByCampana,
  getMockResponsablesOptions as getResponsablesOptions,
  getMockRiosByCuenca as getRiosByCuenca,
} from "@/lib/mock/campaigns";

export function getAllRiosOptions() {
  return getDataStore().rios.map((r) => ({ value: r.id, label: r.nombre }));
}
