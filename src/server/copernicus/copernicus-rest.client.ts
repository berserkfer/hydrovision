/**
 * Cliente REST Copernicus Data Space Ecosystem — extracción de datos únicamente.
 * Catalog API (búsqueda STAC de escenas) + Process API (bandas en un punto).
 */

import type { CopernicusAccessToken } from "./copernicus-oauth.client";
import {
  buildCatalogSearchBody,
  buildProcessRequestBody,
  type CopernicusPointReflectanceParams,
  type CopernicusSceneSearchParams,
} from "./copernicus-expression.builder";

export const COPERNICUS_CATALOG_SEARCH_URL =
  "https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search";
export const COPERNICUS_PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process";

export interface CopernicusRestClient {
  searchCatalog(params: CopernicusSceneSearchParams, token: CopernicusAccessToken): Promise<unknown>;
  process(params: CopernicusPointReflectanceParams, token: CopernicusAccessToken): Promise<unknown>;
}

export class HttpCopernicusRestClient implements CopernicusRestClient {
  async searchCatalog(
    params: CopernicusSceneSearchParams,
    token: CopernicusAccessToken
  ): Promise<unknown> {
    const response = await fetch(COPERNICUS_CATALOG_SEARCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildCatalogSearchBody(params)),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Copernicus Catalog search falló (${response.status}): ${text}`);
    }

    return response.json();
  }

  async process(
    params: CopernicusPointReflectanceParams,
    token: CopernicusAccessToken
  ): Promise<unknown> {
    const response = await fetch(COPERNICUS_PROCESS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildProcessRequestBody(params)),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Copernicus Process API falló (${response.status}): ${text}`);
    }

    return response.json();
  }
}

export const httpCopernicusRestClient = new HttpCopernicusRestClient();
