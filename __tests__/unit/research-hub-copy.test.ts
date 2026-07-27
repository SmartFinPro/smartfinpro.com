import { describe, expect, it } from "vitest";
import {
  getResearchHubCopy,
  metadataForResearchMarket,
} from "@/lib/research/hub-copy";
import { markets } from "@/lib/i18n/config";
import { renderTitle } from "@/lib/seo/title-template";

describe.each(markets)("%s Research metadata", (market) => {
  it("keeps rendered title and description in the green range", () => {
    const copy = getResearchHubCopy(market);
    // Suffix comes from the same app/layout.tsx-backing constant that
    // actually renders the <title> (lib/seo/title-template.ts), so this
    // ceiling can't stay green if the real template grows past it.
    expect(renderTitle(copy.metadataTitle).length).toBeGreaterThanOrEqual(45);
    expect(renderTitle(copy.metadataTitle).length).toBeLessThanOrEqual(60);
    expect(copy.description.length).toBeGreaterThanOrEqual(140);
    expect(copy.description.length).toBeLessThanOrEqual(160);
  });

  it("uses a filterless canonical and complete languages map", () => {
    const metadata = metadataForResearchMarket(market);
    expect(metadata.alternates?.canonical).toBe(
      market === "us" ? "/research" : `/${market}/research`,
    );
    expect(Object.keys(metadata.alternates?.languages ?? {})).toEqual(
      expect.arrayContaining(["en-US", "en-GB", "en-CA", "en-AU", "x-default"]),
    );
  });
});
