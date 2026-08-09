/**
 * POST /api/import/validate
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { importService } from "@/server/import/import.service";
import type { ColumnMapping } from "@/server/import/import.types";
import { z } from "zod";
import { parseBody } from "@/server/validators/schemas/crud.schemas";

export const dynamic = "force-dynamic";

const validateSchema = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1),
  mapping: z.record(z.string(), z.string()),
});

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "IMPORT_DATA");
    const body = await request.json();
    const input = parseBody(validateSchema, body);
    const summary = await importService.validate(
      input.rows,
      input.mapping as ColumnMapping
    );
    return jsonSuccess(summary, "mock");
  });
}
