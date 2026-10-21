/**
 * DELETE /api/imagenes-propias/[id] — elimina un registro de imagen propia y su archivo.
 */

import { NextResponse } from "next/server";
import { runRouteHandler } from "@/server/api/handler";
import { ApiError } from "@/server/api/errors";
import { requirePermission } from "@/server/authorization/guards";
import { deleteOwnImage } from "@/server/own-imagery/own-imagery.service";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return runRouteHandler(async () => {
    await requirePermission(request, "IMPORT_DATA");
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw ApiError.validation("Identificador inválido.");
    const removed = await deleteOwnImage(id);
    if (!removed) throw ApiError.notFound("Imagen propia", id);
    return NextResponse.json({ success: true });
  });
}
