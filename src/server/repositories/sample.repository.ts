/**
 * SampleRepository — mock fallback + Prisma cuando DATA_SOURCE=database
 */

import {
  createMuestra,
  deleteMuestra,
  getAllSampleSummaries,
  getSampleDetailById,
  getSampleStats,
  updateMuestra,
} from "@/repositories/sample.repository";
import { getMonitoringDataSource } from "@/config/monitoring-data-source.config";
import type { CreateMuestraPayload, MuestraDetail, MuestraSummary, SampleOperationResult, SampleStats } from "@/types/sampling";
import { filterActive, markSoftDeleted } from "@/server/lib/soft-delete";
import { samplePrismaRepository } from "./prisma/sample.prisma-repository";

const ENTITY = "sample";

export class SampleRepository {
  getDataSource(): "database" | "mock" {
    return getMonitoringDataSource();
  }

  async findAll(campanaId?: string): Promise<MuestraSummary[]> {
    if (this.getDataSource() === "database") {
      return samplePrismaRepository.findAll(campanaId);
    }
    const items = getAllSampleSummaries(campanaId);
    return filterActive(ENTITY, items);
  }

  async findById(id: string): Promise<MuestraDetail | null> {
    if (this.getDataSource() === "database") {
      return samplePrismaRepository.findById(id);
    }
    if (filterActive(ENTITY, [{ id }]).length === 0) return null;
    return getSampleDetailById(id);
  }

  async getStats(campanaId?: string): Promise<SampleStats> {
    if (this.getDataSource() === "database") {
      return samplePrismaRepository.getStats(campanaId);
    }
    return getSampleStats(campanaId);
  }

  async create(payload: CreateMuestraPayload): Promise<SampleOperationResult> {
    if (this.getDataSource() === "database") {
      return samplePrismaRepository.create(payload);
    }
    return createMuestra(payload);
  }

  async update(id: string, payload: CreateMuestraPayload): Promise<SampleOperationResult> {
    if (this.getDataSource() === "database") {
      return samplePrismaRepository.update(id, payload);
    }
    return updateMuestra(id, payload);
  }

  async softDelete(id: string): Promise<MuestraDetail | null> {
    if (this.getDataSource() === "database") {
      return samplePrismaRepository.softDelete(id);
    }
    const detail = getSampleDetailById(id);
    if (!detail) return null;
    markSoftDeleted(ENTITY, id);
    deleteMuestra(id);
    return detail;
  }
}

export const sampleRepository = new SampleRepository();
