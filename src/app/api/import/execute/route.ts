/**
 * POST /api/import/execute
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { importService } from "@/server/import/import.service";
import type { ColumnMapping, ImportValidationSummary } from "@/server/import/import.types";
import { z } from "zod";
import { parseBody } from "@/server/validators/schemas/crud.schemas";

export const dynamic = "force-dynamic";

const executeSchema = z.object({
  validation: z.object({
    totalRows: z.number(),
    validCount: z.number(),
    warningCount: z.number(),
    errorCount: z.number(),
    rows: z.array(
      z.object({
        rowIndex: z.number(),
        status: z.enum(["valid", "warning", "error"]),
        messages: z.array(z.string()),
        normalized: z.record(z.string(), z.unknown()),
      })
    ),
  }),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string().nullable().optional(),
  mapping: z.record(z.string(), z.string()),
});

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "IMPORT_DATA");
    const body = await request.json();
    const input = parseBody(executeSchema, body);
    const result = await importService.execute(
      input.validation as unknown as ImportValidationSummary,
      {
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType ?? null,
        mapping: input.mapping as ColumnMapping,
      }
    );
    return jsonSuccess(result, "database");
  });
}
