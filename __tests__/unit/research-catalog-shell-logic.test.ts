import { describe, expect, it } from "vitest";
import {
  cockpitKeyFor,
  productItemId,
  researchBaseForMarket,
  reviewItemId,
} from "@/lib/research/catalog-shell-logic";

describe("Discovery identity", () => {
  it("keeps topic out of a cockpit-only item id", () => {
    expect(productItemId("us", "credit-repair", "lexington-law")).toBe(
      "product:us:credit-repair:lexington-law",
    );
  });

  it("uses the canonical review href as review identity", () => {
    expect(reviewItemId("/us/trading/fidelity-review")).toBe(
      "review:/us/trading/fidelity-review",
    );
  });

  it("keeps category in the Cockpit key", () => {
    expect(cockpitKeyFor("us", "credit-repair", "companies")).not.toBe(
      cockpitKeyFor("us", "debt-relief", "companies"),
    );
  });
});

describe.each([
  ["us", "/research"],
  ["uk", "/uk/research"],
  ["ca", "/ca/research"],
  ["au", "/au/research"],
] as const)("researchBaseForMarket(%s)", (market, expected) => {
  it(`returns ${expected}`, () => {
    expect(researchBaseForMarket(market)).toBe(expected);
  });
});
