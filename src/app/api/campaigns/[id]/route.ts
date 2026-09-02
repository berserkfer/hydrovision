/**
 * GET/PUT/DELETE /api/campaigns/:id
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { requirePermission } from "@/server/authorization/guards";
import { campaignService } from "@/server/services/campaign.service";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  return runRouteHandler(async () => {
    await requirePermission(request, "CAMPAIGNS_VIEW");
    const { id } = await context.params;
    const data = await campaignService.getById(id);
    return jsonSuccess(data, campaignService.getDataSource());
  });
}

export async function PUT(request: Request, context: RouteContext) {
  return runRouteHandler(async () => {
    await requirePermission(request, "CAMPAIGNS_UPDATE");
    const { id } = await context.params;
    const body = await request.json();
    const data = await campaignService.update(id, body);
    return jsonSuccess(data, campaignService.getDataSource());
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return runRouteHandler(async () => {
    await requirePermission(request, "CAMPAIGNS_DELETE");
    const { id } = await context.params;
    const data = await campaignService.remove(id);
    return jsonSuccess(data, campaignService.getDataSource());
  });
}
