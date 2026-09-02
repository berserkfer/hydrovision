import type { ComplianceStatus } from "@/types";

/** Centro geográfico de Lambayeque, Perú (WGS84) */
export const LAMBAYEQUE_CENTER = {
  latitude: -6.7017,
  longitude: -79.9068,
} as const;

/** Zoom inicial para visualizar las 6 estaciones del río Reque */
export const DEFAULT_MAP_ZOOM = 12;

/** Colores de marcadores según clasificación ECA */
export const COMPLIANCE_MARKER_COLORS: Record<ComplianceStatus, string> = {
  compliant: "#10b981",
  alert: "#f59e0b",
  non_compliant: "#ef4444",
};

/** Etiquetas de la leyenda del mapa */
export const COMPLIANCE_LEGEND_ITEMS: {
  status: ComplianceStatus;
  label: string;
  color: string;
}[] = [
  { status: "compliant", label: "Cumple ECA", color: COMPLIANCE_MARKER_COLORS.compliant },
  { status: "alert", label: "En alerta", color: COMPLIANCE_MARKER_COLORS.alert },
  { status: "non_compliant", label: "No cumple", color: COMPLIANCE_MARKER_COLORS.non_compliant },
];

/** Atribución del proveedor de teselas cartográficas */
export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Teselas cartográficas — siempre legibles (independientes del tema de la app) */
export const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

/** @deprecated El mapa no hereda el tema oscuro de la app — usar MAP_TILE_URL */
export const MAP_TILE_URL_DARK = MAP_TILE_URL;
