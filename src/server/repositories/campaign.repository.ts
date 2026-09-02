/**
 * CampaignRepository — mock fallback + Prisma cuando DATA_SOURCE=database
 */

import {
  createMockCampaign,
  getMockCampaignDetail,
  getMockCampaignSummaries,
  getMockCampaignStats,
  updateMockCampaign,
} from "@/lib/mock/campaigns";
import { getMonitoringDataSource } from "@/config/monitoring-data-source.config";
import type { CreateCampanaInput } from "@/types/campaign";
import type { CampanaDetail, CampanaSummary, CampaignStats } from "@/types/campaign";
import { filterActive, markSoftDeleted } from "@/server/lib/soft-delete";
import { campaignPrismaRepository } from "./prisma/campaign.prisma-repository";

const ENTITY = "campaign";

export class CampaignRepository {
  getDataSource(): "database" | "mock" {
    return getMonitoringDataSource();
  }

  async findAll(): Promise<CampanaSummary[]> {
    if (this.getDataSource() === "database") {
      return campaignPrismaRepository.findAll();
    }
    return filterActive(ENTITY, getMockCampaignSummaries());
  }

  async findDetailById(id: string): Promise<CampanaDetail | null> {
    if (this.getDataSource() === "database") {
      return campaignPrismaRepository.findDetailById(id);
    }
    if (filterActive(ENTITY, [{ id }]).length === 0) return null;
    return getMockCampaignDetail(id);
  }

  async getStats(): Promise<CampaignStats> {
    if (this.getDataSource() === "database") {
      return campaignPrismaRepository.getStats();
    }
    return getMockCampaignStats();
  }

  async create(input: CreateCampanaInput): Promise<CampanaSummary> {
    if (this.getDataSource() === "database") {
      return campaignPrismaRepository.create(input);
    }
    return createMockCampaign(input);
  }

  async update(id: string, input: CreateCampanaInput): Promise<CampanaSummary | null> {
    if (this.getDataSource() === "database") {
      return campaignPrismaRepository.update(id, input);
    }
    return updateMockCampaign(id, input);
  }

  async softDelete(id: string): Promise<boolean> {
    if (this.getDataSource() === "database") {
      return campaignPrismaRepository.softDelete(id);
    }
    const detail = getMockCampaignDetail(id);
    if (!detail) return false;
    markSoftDeleted(ENTITY, id);
    return true;
  }
}

export const campaignRepository = new CampaignRepository();
