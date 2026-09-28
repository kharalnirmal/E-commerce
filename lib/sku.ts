export function createSkuBase(slug: string) {
  const readable = slug.replace(/[^a-z0-9]+/gi, "").slice(0, 16).toUpperCase();
  return `CHK-${readable || "PRODUCT"}`;
}
