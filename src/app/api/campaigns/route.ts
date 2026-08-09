/**
 * GET/POST /api/campaigns
 */

import { runRouteHandler } from "@/server/api/handler";
import { jsonSuccess } from "@/server/api/response";
import { parseListQuery } from "@/server/dto/common.dto";
import { requirePermission } from "@/server/authorization/guards";
import { campaignService } from "@/server/services/campaign.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "CAMPAIGNS_VIEW");
    const query = parseListQuery(new URL(request.url).searchParams);
    const data = campaignService.list(query);
    return jsonSuccess(data, "mock");
  });
}

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "CAMPAIGNS_CREATE");
    const body = await request.json();
    const data = campaignService.create(body);
    return jsonSuccess(data, "mock", 201);
  });
}
