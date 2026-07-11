// lib/comparison/dates.ts
// The single "when was this cockpit's data last verified" computation —
// max of all providers' dataVerifiedAt, floored at publishedDate so
// dateModified never precedes datePublished (invalid Article schema).
// Shared by the cockpit page (metadata + JSON-LD) and the sitemap so both
// surfaces report the same lastmod for the same /best/{topic} route.

export function computeCockpitModifiedDate(
  products: { dataVerifiedAt: string | null }[],
  publishedDate: string,
): string {
  const latestVerified =
    products
      .map((p) => p.dataVerifiedAt)
      .filter((d): d is string => !!d)
      .sort()
      .at(-1) ?? publishedDate;
  return latestVerified < publishedDate ? publishedDate : latestVerified;
}
