/**
 * Servicio de exportación GEE simulado — Sprint 1
 */

import type { GEEExportService } from "../interfaces";
import type { GeeExportTask, GeeExportTaskResult, GeeExportTaskStatus } from "../types/gee.types";

export class MockGeeExportService implements GEEExportService {
  async createExportTask(task: GeeExportTask): Promise<GeeExportTaskResult> {
    return {
      taskId: `mock-export-${Date.now()}`,
      status: "READY",
      message: `Tarea simulada "${task.name}" registrada. Exportación real pendiente (Sprint 3).`,
    };
  }

  async getExportStatus(taskId: string): Promise<GeeExportTaskStatus> {
    return {
      taskId,
      status: "READY",
      progress: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  async cancelExportTask(_taskId: string): Promise<boolean> {
    return true;
  }
}
