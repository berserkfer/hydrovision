import { ImportView } from "@/components/import/ImportView";
import { importService } from "@/server/import/import.service";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const history = await importService.history();

  return <ImportView initialHistory={history} />;
}
