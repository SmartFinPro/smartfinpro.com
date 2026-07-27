import { describe, expect, it } from "vitest";
import {
  getResearchHubCopy,
  metadataForResearchMarket,
} from "@/lib/research/hub-copy";
import { markets } from "@/lib/i18n/config";

describe.each(markets)("%s Research metadata", (market) => {
  it("keeps rendered title and description in the green range", () => {
    const copy = getResearchHubCopy(market);
    expect(`${copy.metadataTitle} | SmartFinPro`.length).toBeGreaterThanOrEqual(
      45,
    );
    expect(`${copy.metadataTitle} | SmartFinPro`.length).toBeLessThanOrEqual(
      60,
    );
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
