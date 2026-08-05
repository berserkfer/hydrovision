"use client";

import { useCallback, useState } from "react";
import { buildEnvironmentalEvaluation } from "@/lib/repositories/environmental-evaluation.repository";
import type {
  EnvironmentalEvaluationDocument,
  EnvironmentalEvaluationFilters,
} from "@/types/environmental-evaluation";

export function useEnvironmentalEvaluation(initial: EnvironmentalEvaluationDocument) {
  const [evaluation, setEvaluation] = useState(initial);
  const [filters, setFilters] = useState<EnvironmentalEvaluationFilters>(initial.filters);

  const setFilter = useCallback(
    <K extends keyof EnvironmentalEvaluationFilters>(key: K, value: EnvironmentalEvaluationFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const evaluate = useCallback(() => {
    const doc = buildEnvironmentalEvaluation(filters);
    setEvaluation(doc);
  }, [filters]);

  return { evaluation, filters, setFilter, evaluate };
}
