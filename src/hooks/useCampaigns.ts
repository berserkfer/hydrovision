"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createCampaign,
  deleteCampaign,
  fetchCampaignsList,
  updateCampaign,
} from "@/lib/api/campaigns.client";
import { withApiToast } from "@/lib/api/notify";
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
        c.cuencaNombre.toLowerCase().includes(q) ||
        c.observaciones.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filters.year && !c.fechaInicio.startsWith(filters.year)) return false;
    if (filters.month && c.fechaInicio.slice(5, 7) !== filters.month) return false;
    if (filters.responsableId && c.responsableId !== filters.responsableId) return false;
    if (filters.estado && c.estado !== filters.estado) return false;

    return true;
  });
}

export function useCampaigns({ initialCampaigns, initialStats, pageSize = 8 }: UseCampaignsOptions) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [stats, setStats] = useState(initialStats);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const { filters, setFilter, resetFilters, hasActiveFilters } = useCampaignFilters();

  const filtered = useMemo(() => applyFilters(campaigns, filters), [campaigns, filters]);

  const pagination = usePagination({ totalItems: filtered.length, pageSize });
  const paginatedCampaigns = useMemo(
    () => pagination.paginate(filtered),
    [filtered, pagination]
  );

  const refreshFromApi = useCallback(async () => {
    const data = await fetchCampaignsList({ pageSize: 500 });
    setCampaigns(data.items);
    setStats(data.stats);
  }, []);

  const handleCreate = useCallback(
    async (input: CreateCampanaInput) => {
      const result = await withApiToast(() => createCampaign(input), {
        success: "Campaña registrada correctamente",
        error: "No se pudo crear la campaña",
      });
      if (result) {
        await refreshFromApi();
        pagination.resetPage();
      }
    },
    [refreshFromApi, pagination]
  );

  const handleUpdate = useCallback(
    async (id: string, input: Partial<CreateCampanaInput>) => {
      const result = await withApiToast(() => updateCampaign(id, input), {
        success: "Campaña actualizada correctamente",
        error: "No se pudo actualizar la campaña",
      });
      if (result) await refreshFromApi();
    },
    [refreshFromApi]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await withApiToast(() => deleteCampaign(id), {
        success: "Campaña eliminada correctamente",
        error: "No se pudo eliminar la campaña",
      });
      if (result) {
        await refreshFromApi();
        pagination.resetPage();
      }
    },
    [refreshFromApi, pagination]
  );

  const handleFilterChange = useCallback(
    <K extends keyof CampaignFilters>(key: K, value: CampaignFilters[K]) => {
      setFilter(key, value);
      pagination.resetPage();
    },
    [setFilter, pagination]
  );

  const handleResetFilters = useCallback(() => {
    resetFilters();
    pagination.resetPage();
  }, [resetFilters, pagination]);

  return {
    campaigns: paginatedCampaigns,
    allFiltered: filtered,
    stats,
    filters,
    setFilter: handleFilterChange,
    resetFilters: handleResetFilters,
    hasActiveFilters,
    createCampaign: handleCreate,
    updateCampaign: handleUpdate,
    deleteCampaign: handleDelete,
    refreshCampaigns: refreshFromApi,
    pagination,
    viewMode,
    setViewMode,
  };
}
