export type { IGeospatialLayerProvider } from "./layer-provider.interface";
export { MockGeospatialLayerProvider, mockGeospatialLayerProvider } from "./mock-layer-provider";

import type { IGeospatialLayerProvider } from "./layer-provider.interface";
import { mockGeospatialLayerProvider } from "./mock-layer-provider";

/** Factory — intercambiar por GEE sin modificar componentes UI */
export function getGeospatialLayerProvider(): IGeospatialLayerProvider {
  return mockGeospatialLayerProvider;
}
