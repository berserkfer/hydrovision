import type { FilterOption, MapFilterField, MapFilterState } from "@/types/geography";
import { ALL_STATIONS_VALUE } from "@/types/geography";
import { GEOGRAPHIC_HIERARCHY } from "@/lib/data/geography-simulated";

/**
 * Resuelve opciones disponibles para cada filtro según la selección actual.
 * Implementa cascada jerárquica: Departamento → … → Estación.
 */
export function getFilterOptions(
  filters: MapFilterState,
  field: MapFilterField
): FilterOption[] {
  const department = GEOGRAPHIC_HIERARCHY.find((d) => d.id === filters.departmentId);

  switch (field) {
    case "departmentId":
      return GEOGRAPHIC_HIERARCHY.map((d) => ({ value: d.id, label: d.name }));

    case "provinceId": {
      const dept =
        GEOGRAPHIC_HIERARCHY.find((d) => d.id === filters.departmentId) ??
        GEOGRAPHIC_HIERARCHY[0];
      return dept.provinces.map((p) => ({ value: p.id, label: p.name }));
    }

    case "districtId":
      return (
        department?.provinces
          .find((p) => p.id === filters.provinceId)
          ?.districts.map((d) => ({ value: d.id, label: d.name })) ?? []
      );

    case "watershedId":
      return (
        department?.provinces
          .find((p) => p.id === filters.provinceId)
          ?.districts.find((d) => d.id === filters.districtId)
          ?.watersheds.map((w) => ({ value: w.id, label: w.name })) ?? []
      );

    case "riverId":
      return (
        department?.provinces
          .find((p) => p.id === filters.provinceId)
          ?.districts.find((d) => d.id === filters.districtId)
          ?.watersheds.find((w) => w.id === filters.watershedId)
          ?.rivers.map((r) => ({ value: r.id, label: r.name })) ?? []
      );

    case "stationId": {
      const stations =
        department?.provinces
          .find((p) => p.id === filters.provinceId)
          ?.districts.find((d) => d.id === filters.districtId)
          ?.watersheds.find((w) => w.id === filters.watershedId)
          ?.rivers.find((r) => r.id === filters.riverId)?.stations ?? [];

      return [
        { value: ALL_STATIONS_VALUE, label: "Todas las estaciones" },
        ...stations.map((s) => ({ value: s.id, label: s.name })),
      ];
    }

    default:
      return [];
  }
}

/** Reajusta filtros dependientes al cambiar un nivel superior de la jerarquía */
export function cascadeFilterChange(
  current: MapFilterState,
  field: MapFilterField,
  value: string
): MapFilterState {
  const next = { ...current, [field]: value };

  const department = GEOGRAPHIC_HIERARCHY.find((d) => d.id === next.departmentId)!;

  if (field === "departmentId") {
    const dept = GEOGRAPHIC_HIERARCHY.find((d) => d.id === value) ?? GEOGRAPHIC_HIERARCHY[0];
    const province = dept.provinces[0];
    const district = province.districts[0];
    const watershed = district.watersheds[0];
    const river = watershed.rivers[0];
    return {
      departmentId: dept.id,
      provinceId: province.id,
      districtId: district.id,
      watershedId: watershed.id,
      riverId: river.id,
      stationId: ALL_STATIONS_VALUE,
    };
  }

  const province =
    department.provinces.find((p) => p.id === next.provinceId) ?? department.provinces[0];

  if (field === "provinceId") {
    const prov = department.provinces.find((p) => p.id === value) ?? department.provinces[0];
    const district = prov.districts[0];
    const watershed = district.watersheds[0];
    const river = watershed.rivers[0];
    return {
      ...next,
      provinceId: prov.id,
      districtId: district.id,
      watershedId: watershed.id,
      riverId: river.id,
      stationId: ALL_STATIONS_VALUE,
    };
  }

  const district =
    province.districts.find((d) => d.id === next.districtId) ?? province.districts[0];

  if (field === "districtId") {
    const dist = province.districts.find((d) => d.id === value) ?? province.districts[0];
    const watershed = dist.watersheds[0];
    const river = watershed.rivers[0];
    return {
      ...next,
      districtId: dist.id,
      watershedId: watershed.id,
      riverId: river.id,
      stationId: ALL_STATIONS_VALUE,
    };
  }

  const watershed =
    district.watersheds.find((w) => w.id === next.watershedId) ?? district.watersheds[0];

  if (field === "watershedId") {
    const ws = district.watersheds.find((w) => w.id === value) ?? district.watersheds[0];
    const river = ws.rivers[0];
    return {
      ...next,
      watershedId: ws.id,
      riverId: river.id,
      stationId: ALL_STATIONS_VALUE,
    };
  }

  if (field === "riverId") {
    const river =
      watershed.rivers.find((r) => r.id === value) ?? watershed.rivers[0];
    return { ...next, riverId: river.id, stationId: ALL_STATIONS_VALUE };
  }

  return next;
}
