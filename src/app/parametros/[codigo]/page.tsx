import { notFound } from "next/navigation";
import { ParameterDetailView } from "@/components/parameters/ParameterDetailView";
import { getParameterDetail } from "@/lib/repositories/parameter.repository";
import type { ParameterCode } from "@/types/parameter-management";
import { PARAMETER_CATALOG_BY_CODE } from "@/lib/parameters/catalog";

interface ParametroDetailPageProps {
  params: Promise<{ codigo: string }>;
}

export default async function ParametroDetailPage({ params }: ParametroDetailPageProps) {
  const { codigo } = await params;

  if (!(codigo in PARAMETER_CATALOG_BY_CODE)) {
    notFound();
  }

  const detail = getParameterDetail(codigo as ParameterCode);

  if (!detail) {
    notFound();
  }

  return <ParameterDetailView detail={detail} />;
}
