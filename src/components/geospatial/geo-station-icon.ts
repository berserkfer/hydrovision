import L from "leaflet";
import type { GeoStationStatus } from "@/types/geospatial-center";
import { GEO_STATUS_COLORS } from "@/types/geospatial-center";

export function createGeoStationIcon(status: GeoStationStatus): L.DivIcon {
  const color = GEO_STATUS_COLORS[status];
  const selectedRing = status === "unknown" ? "2px solid #64748b" : "2px solid #ffffff";

  return L.divIcon({
    className: "hydrovision-geo-station-marker",
    html: `
      <div
        style="
          background-color: ${color};
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: ${selectedRing};
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.35);
        "
        aria-hidden="true"
      ></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}
