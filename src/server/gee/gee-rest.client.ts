/**
 * Cliente REST Google Earth Engine — extracción de datos únicamente.
 */

import { geeConfig } from "@/config/gee.config";
import type { GeeAccessToken } from "@/services/google-earth-engine/auth/types/auth.types";

const GEE_API_BASE = "https://earthengine.googleapis.com/v1";

export interface ComputePixelsRequest {
  expression: string;
  latitude: number;
  longitude: number;
  scale?: number;
}

export interface ComputeValueRequest {
  expression: string;
}

export interface GeeRestClient {
  computePixels(request: ComputePixelsRequest, token: GeeAccessToken): Promise<unknown>;
  computeValue(request: ComputeValueRequest, token: GeeAccessToken): Promise<unknown>;
}

function projectPath(): string {
  return `projects/${geeConfig.earthEngineProjectId}`;
}

export class HttpGeeRestClient implements GeeRestClient {
  async computePixels(request: ComputePixelsRequest, token: GeeAccessToken): Promise<unknown> {
    const url = `${GEE_API_BASE}/${projectPath()}/image:computePixels`;
    const scale = request.scale ?? 10;

    const body = {
      expression: request.expression,
      fileFormat: "JSON",
      grid: {
        dimensions: { width: 1, height: 1 },
        affineTransform: {
          scaleX: scale,
          shearX: 0,
          translateX: request.longitude,
          shearY: 0,
          scaleY: -scale,
          translateY: request.latitude,
        },
        crsCode: "EPSG:4326",
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GEE computePixels failed (${response.status}): ${text}`);
    }

    return response.json();
  }

  async computeValue(request: ComputeValueRequest, token: GeeAccessToken): Promise<unknown> {
    const url = `${GEE_API_BASE}/${projectPath()}/value:compute`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expression: request.expression,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GEE value:compute failed (${response.status}): ${text}`);
    }

    return response.json();
  }
}

export const httpGeeRestClient = new HttpGeeRestClient();
