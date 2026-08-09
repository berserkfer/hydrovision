/**
 * SampleRepository — Sprint 3E
 */

import {
  createMuestra,
  deleteMuestra,
  getAllSampleSummaries,
  getSampleDetailById,
  getSampleStats,
  updateMuestra,
} from "@/repositories/sample.repository";
import type { CreateMuestraPayload } from "@/types/sampling";
import { filterActive, markSoftDeleted } from "@/server/lib/soft-delete";

const ENTITY = "sample";

export class SampleRepository {
  findAll(campanaId?: string) {
    const items = getAllSampleSummaries(campanaId);
    return filterActive(ENTITY, items);
  }

  findById(id: string) {
    if (filterActive(ENTITY, [{ id }]).length === 0) return null;
    return getSampleDetailById(id);
  }

  getStats(campanaId?: string) {
    return getSampleStats(campanaId);
  }

  create(payload: CreateMuestraPayload) {
    return createMuestra(payload);
  }

  update(id: string, payload: CreateMuestraPayload) {
    return updateMuestra(id, payload);
  }

  softDelete(id: string) {
    const detail = getSampleDetailById(id);
    if (!detail) return null;
    markSoftDeleted(ENTITY, id);
    deleteMuestra(id);
    return detail;
  }
}

export const sampleRepository = new SampleRepository();
