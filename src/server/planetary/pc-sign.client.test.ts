import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSignedHrefCache, signAssetHref } from "./pc-sign.client";

function signResponse(href: string, expiry: string) {
  return new Response(JSON.stringify({ href: `${href}?sig=abc`, "msft:expiry": expiry }), {
    status: 200,
  });
}

beforeEach(() => clearSignedHrefCache());
afterEach(() => vi.unstubAllGlobals());

describe("signAssetHref", () => {
  it("reutiliza la firma de un asset hasta poco antes de que caduque", async () => {
    const expiry = new Date(Date.now() + 60 * 60_000).toISOString();
    const fetchMock = vi.fn(async (url: string) =>
      signResponse(decodeURIComponent(url.split("href=")[1]), expiry)
    );
    vi.stubGlobal("fetch", fetchMock);

    const a = await signAssetHref("https://blob/B04.tif");
    const b = await signAssetHref("https://blob/B04.tif");

    expect(a).toBe("https://blob/B04.tif?sig=abc");
    expect(b).toBe(a);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("comparte una sola firma entre peticiones simultáneas del mismo asset", async () => {
    const expiry = new Date(Date.now() + 60 * 60_000).toISOString();
    const fetchMock = vi.fn(async (url: string) =>
      signResponse(decodeURIComponent(url.split("href=")[1]), expiry)
    );
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all(Array.from({ length: 5 }, () => signAssetHref("https://blob/B08.tif")));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("no reutiliza una firma a punto de caducar", async () => {
    const nearlyExpired = new Date(Date.now() + 60_000).toISOString();
    const fetchMock = vi.fn(async (url: string) =>
      signResponse(decodeURIComponent(url.split("href=")[1]), nearlyExpired)
    );
    vi.stubGlobal("fetch", fetchMock);

    await signAssetHref("https://blob/B03.tif");
    await signAssetHref("https://blob/B03.tif");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
