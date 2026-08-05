/**
 * Contrato de exportación GEE — Sprint 1 (sin tareas reales)
 */

import type { GeeExportTask, GeeExportTaskResult, GeeExportTaskStatus } from "../types/gee.types";

export interface GEEExportService {
  createExportTask(task: GeeExportTask): Promise<GeeExportTaskResult>;

  getExportStatus(taskId: string): Promise<GeeExportTaskStatus>;

  cancelExportTask(taskId: string): Promise<boolean>;
}
