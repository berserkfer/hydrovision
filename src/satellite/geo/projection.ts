/**
 * Proyecciones usadas en el Dren 4000: WGS84 geográficas ↔ UTM (WGS84). La zona del dren es
 * UTM 17 Sur (EPSG:32717); las escenas Sentinel-2 informan su propio EPSG y se respeta.
 */

import proj4 from "proj4";

export const WGS84 = "EPSG:4326";
export const UTM_17S_EPSG = 32717;

export interface LatLon {
  latitude: number;
  longitude: number;
}

export interface Utm {
  easting: number;
  northing: number;
}

/** EPSG:326xx = UTM zona xx Norte, EPSG:327xx = UTM zona xx Sur (WGS84). */
export function utmProj4Def(epsg: number): string {
  const zone = epsg % 100;
  const hemisphere = epsg >= 32700 ? "+south" : "";
  return `+proj=utm +zone=${zone} ${hemisphere} +datum=WGS84 +units=m +no_defs`.trim();
}

export function isUtmWgs84Epsg(epsg: number): boolean {
  return (epsg >= 32601 && epsg <= 32660) || (epsg >= 32701 && epsg <= 32760);
}

export function toUtm(point: LatLon, epsg = UTM_17S_EPSG): Utm {
  const [easting, northing] = proj4(WGS84, utmProj4Def(epsg), [point.longitude, point.latitude]);
  return { easting, northing };
}

export function fromUtm(point: Utm, epsg = UTM_17S_EPSG): LatLon {
  const [longitude, latitude] = proj4(utmProj4Def(epsg), WGS84, [point.easting, point.northing]);
  return { latitude, longitude };
}

export function distanceMeters(a: LatLon, b: LatLon): number {
  const pa = toUtm(a);
  const pb = toUtm(b);
  return Math.hypot(pa.easting - pb.easting, pa.northing - pb.northing);
}
