/**
 * POST /api/import/preview
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { ApiError } from "@/server/api/errors";
import { requirePermission } from "@/server/authorization/guards";
import { importService } from "@/server/import/import.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "IMPORT_DATA");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw ApiError.validation("Archivo requerido");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const preview = importService.parsePreview(
      buffer,
      file.name,
      file.type || null,
      file.size
    );
    return jsonSuccess(preview, "mock");
  });
}
