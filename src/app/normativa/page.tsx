import { NormativeComplianceView } from "@/components/normative/NormativeComplianceView";

interface NormativaPageProps {
  searchParams: Promise<{ perfil?: string | string[] }>;
}

export default async function NormativaPage({ searchParams }: NormativaPageProps) {
  const params = await searchParams;
  const perfil = Array.isArray(params.perfil) ? params.perfil[0] : params.perfil;

  return <NormativeComplianceView profileOverrideId={perfil} />;
}
