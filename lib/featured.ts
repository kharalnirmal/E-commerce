export const FEATURED_PRODUCT_LIMIT = 6;

export function canFeatureProduct(currentFeaturedCount: number, alreadyFeatured: boolean) {
  return alreadyFeatured || currentFeaturedCount < FEATURED_PRODUCT_LIMIT;
}
