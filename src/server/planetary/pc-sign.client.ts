/**
 * Firma SAS pública de Microsoft Planetary Computer — sin cuenta ni API key.
 */

import { PLANETARY_COMPUTER_SIGN_URL } from "@/config/planetary-computer.config";

interface SignResponse {
  href?: string;
}

export async function signAssetHref(href: string): Promise<string> {
  const url = `${PLANETARY_COMPUTER_SIGN_URL}?href=${encodeURIComponent(href)}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Planetary Computer SAS sign falló (${response.status}): ${text}`);
  }

  const data = (await response.json()) as SignResponse;
  if (!data.href) {
    throw new Error("Planetary Computer SAS sign no devolvió href firmado");
  }
  return data.href;
}
