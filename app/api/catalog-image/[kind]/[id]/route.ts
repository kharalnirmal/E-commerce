import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { prisma } from "@/lib/prisma";

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) return isPrivateAddress(normalized.slice(7));
  if (isIP(address) === 6) return !(normalized.startsWith("2") || normalized.startsWith("3"));
  if (isIP(address) !== 4) return true;
  const [first, second] = address.split(".").map(Number);
  return first === 0 || first === 10 || first === 127 || first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && (second === 0 || second === 168)) ||
    (first === 198 && (second === 18 || second === 19));
}

async function assertPublicImageUrl(value: string) {
  const url = new URL(value);
  if (!(["http:", "https:"].includes(url.protocol)) || url.username || url.password || url.hostname === "localhost") throw new Error("Invalid remote image URL");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error("Private image hosts are not allowed");
  return { url, address: addresses[0].address };
}

async function fetchImage(target: Awaited<ReturnType<typeof assertPublicImageUrl>>) {
  for (let redirect = 0; redirect < 4; redirect += 1) {
    const { url, address } = target;
    if (url.protocol === "https:") return Response.redirect(url, 307);
    const host = address.includes(":") ? `[${address}]` : address;
    const pinnedUrl = new URL(`${url.protocol}//${host}${url.port ? `:${url.port}` : ""}${url.pathname}${url.search}`);
    const response = await fetch(pinnedUrl, {
      redirect: "manual",
      headers: { Host: url.host },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Invalid image redirect");
      target = await assertPublicImageUrl(new URL(location, url).toString());
      continue;
    }
    const contentType = response.headers.get("content-type")?.split(";", 1)[0].toLowerCase();
    const safeTypes = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);
    if (!response.ok || !contentType || !safeTypes.has(contentType)) throw new Error("Remote response is not a safe raster image");
    const declaredSize = Number(response.headers.get("content-length") ?? 0);
    if (declaredSize > 10_000_000) throw new Error("Remote image is too large");
    const body = await response.arrayBuffer();
    if (body.byteLength > 10_000_000) throw new Error("Remote image is too large");
    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  throw new Error("Too many image redirects");
}

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const value = kind === "image"
    ? (await prisma.productImage.findUnique({ where: { id }, select: { url: true } }))?.url
    : kind === "product"
      ? (await prisma.product.findUnique({ where: { id }, select: { imageUrl: true } }))?.imageUrl
      : kind === "category"
        ? (await prisma.category.findUnique({ where: { id }, select: { imageUrl: true } }))?.imageUrl
        : null;
  if (!value) return new Response("Image not found", { status: 404 });
  try {
    return await fetchImage(await assertPublicImageUrl(value));
  } catch {
    return new Response("Image unavailable", { status: 502 });
  }
}
