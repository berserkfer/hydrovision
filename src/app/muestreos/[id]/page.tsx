"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { SampleDetailView } from "@/components/sampling/SampleDetailView";
import { getSampleDetailById } from "@/lib/repositories/sample.repository";

interface SampleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SampleDetailPage({ params }: SampleDetailPageProps) {
  const { id } = use(params);
  const sample = getSampleDetailById(id);

  if (!sample) {
    notFound();
  }

  return <SampleDetailView sample={sample} />;
}
