/**
 * CampaignRepository — Sprint 3E
 */

import {
  createMockCampaign,
  getMockCampaignById,
  getMockCampaignDetail,
  getMockCampaignSummaries,
  getMockCampaignStats,
  updateMockCampaign,
} from "@/lib/mock/campaigns";
import type { CreateCampanaInput } from "@/types/campaign";
import { filterActive, markSoftDeleted } from "@/server/lib/soft-delete";

const ENTITY = "campaign";

export class CampaignRepository {
  findAll() {
    return filterActive(ENTITY, getMockCampaignSummaries());
  }

  findById(id: string) {
    if (filterActive(ENTITY, [{ id }]).length === 0) return null;
    return getMockCampaignById(id);
  }

  findDetailById(id: string) {
    if (filterActive(ENTITY, [{ id }]).length === 0) return null;
    return getMockCampaignDetail(id);
  }

  getStats() {
    return getMockCampaignStats();
  }

  create(input: CreateCampanaInput) {
    return createMockCampaign(input);
  }

  update(id: string, input: CreateCampanaInput) {
    return updateMockCampaign(id, input);
  }

  softDelete(id: string): boolean {
    const exists = getMockCampaignById(id);
    if (!exists) return false;
    markSoftDeleted(ENTITY, id);
    return true;
  }
}

export const campaignRepository = new CampaignRepository();
