/**
 * Repositorio de imágenes satelitales — abstracción sobre GEE o mock.
 */

import { getDataStore } from "@/data/store-access";
import type { SatelliteImageMetadata } from "@/types/gee";

export interface ISatelliteImageRepository {
  findByStation(stationId: string, startDate: string, endDate: string): Promise<SatelliteImageMetadata[]>;
  findLatestByStation(stationId: string): Promise<SatelliteImageMetadata | null>;
}

export class MockSatelliteImageRepository implements ISatelliteImageRepository {
  async findByStation(
    stationId: string,
    _startDate: string,
    _endDate: string
  ): Promise<SatelliteImageMetadata[]> {
    return getDataStore().indicesSatelitales
      .filter((i) => i.estacionId.includes(stationId.toLowerCase()))
      .map((i) => ({
        stationId,
        acquiredAt: i.fechaAdquisicion,
        source: i.fuente as SatelliteImageMetadata["source"],
        cloudCover: i.coberturaNubosa,
        resolution: 30,
      }));
  }

  async findLatestByStation(stationId: string): Promise<SatelliteImageMetadata | null> {
    const images = await this.findByStation(stationId, "", "");
    return images[0] ?? null;
  }
}

export const satelliteImageRepository: ISatelliteImageRepository =
  new MockSatelliteImageRepository();
