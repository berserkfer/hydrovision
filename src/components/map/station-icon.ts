import L from "leaflet";
import type { ComplianceStatus } from "@/types";
import { COMPLIANCE_MARKER_COLORS } from "./map-config";

/**
 * Genera un ícono circular personalizado para cada estación según su estado ECA.
 * Usa DivIcon para evitar dependencia de assets PNG de Leaflet en Next.js.
 */
export function createStationIcon(status: ComplianceStatus): L.DivIcon {
  const color = COMPLIANCE_MARKER_COLORS[status];

  return L.divIcon({
    className: "hydrovision-station-marker",
    html: `
      <div
        style="
          background-color: ${color};
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.35);
        "
        aria-hidden="true"
      ></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}
