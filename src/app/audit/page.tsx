import { AuditView } from "@/components/audit/AuditView";
import { auditService } from "@/server/audit/audit.service";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const [items, summary] = await Promise.all([
    auditService.list(),
    auditService.summary(),
  ]);

  return <AuditView initialItems={items} initialSummary={summary} />;
}
