"use client";

import { useCallback, useMemo, useState } from "react";
import type { CampaignFilters } from "@/types/campaign";
import { DEFAULT_CAMPAIGN_FILTERS } from "@/types/campaign";

const ALL_VALUE = "all";

export function useCampaignFilters() {
  const [filters, setFilters] = useState<CampaignFilters>(DEFAULT_CAMPAIGN_FILTERS);

  const setFilter = useCallback(<K extends keyof CampaignFilters>(key: K, value: CampaignFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_CAMPAIGN_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      filters.search !== "" ||
      filters.fecha !== "" ||
      filters.responsableId !== "" ||
      filters.cuencaId !== "" ||
      filters.estado !== "",
    [filters]
  );

  return { filters, setFilter, resetFilters, hasActiveFilters, ALL_VALUE };
}

export { ALL_VALUE as CAMPAIGN_FILTER_ALL };
