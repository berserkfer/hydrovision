"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createCampana,
  getAllCampanaSummaries,
  getCampaignStats,
} from "@/lib/repositories/campaign.repository";
import type {
  CampanaSummary,
  CampaignFilters,
  CampaignStats,
  CreateCampanaInput,
} from "@/types/campaign";
import { useCampaignFilters } from "./useCampaignFilters";
import { usePagination } from "./usePagination";

interface UseCampaignsOptions {
  initialCampaigns: CampanaSummary[];
  initialStats: CampaignStats;
  pageSize?: number;
}

function applyFilters(campaigns: CampanaSummary[], filters: CampaignFilters): CampanaSummary[] {
  return campaigns.filter((c) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        c.nombre.toLowerCase().includes(q) ||
        c.codigo.toLowerCase().includes(q) ||
        c.responsableNombre.toLowerCase().includes(q) ||
        c.rioNombre.toLowerCase().includes(q) ||
        c.cuencaNombre.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filters.fecha && !c.fechaInicio.startsWith(filters.fecha)) return false;
    if (filters.responsableId && c.responsableId !== filters.responsableId) return false;
    if (filters.cuencaId && c.cuencaId !== filters.cuencaId) return false;
    if (filters.estado && c.estado !== filters.estado) return false;

    return true;
  });
}

export function useCampaigns({ initialCampaigns, initialStats, pageSize = 5 }: UseCampaignsOptions) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [stats, setStats] = useState(initialStats);
  const { filters, setFilter, resetFilters, hasActiveFilters } = useCampaignFilters();

  const filtered = useMemo(() => applyFilters(campaigns, filters), [campaigns, filters]);

  const pagination = usePagination({ totalItems: filtered.length, pageSize });
  const paginatedCampaigns = useMemo(
    () => pagination.paginate(filtered),
    [filtered, pagination]
  );

  const refreshFromStore = useCallback(() => {
    setCampaigns(getAllCampanaSummaries());
    setStats(getCampaignStats());
  }, []);

  const handleCreate = useCallback(
    (input: CreateCampanaInput) => {
      createCampana(input);
      refreshFromStore();
      pagination.resetPage();
    },
    [refreshFromStore, pagination.resetPage]
  );

  const handleFilterChange = useCallback(
    <K extends keyof CampaignFilters>(key: K, value: CampaignFilters[K]) => {
      setFilter(key, value);
      pagination.resetPage();
    },
    [setFilter, pagination.resetPage]
  );

  const handleResetFilters = useCallback(() => {
    resetFilters();
    pagination.resetPage();
  }, [resetFilters, pagination.resetPage]);

  return {
    campaigns: paginatedCampaigns,
    allFiltered: filtered,
    stats,
    filters,
    setFilter: handleFilterChange,
    resetFilters: handleResetFilters,
    hasActiveFilters,
    createCampaign: handleCreate,
    pagination,
  };
}
