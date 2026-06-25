import { describe, expect, it } from "vitest";
import { Divisions } from "./division";
import { getCumulativeFractionBelow, getFractionOf } from "./rankDistribution";
import { Tiers } from "./tier";

describe("rankDistribution", () => {
  it("test_GIVEN_lowest_rank_WHEN_getCumulativeFractionBelow_THEN_returns_zero", () => {
    expect(getCumulativeFractionBelow(Tiers.IRON, Divisions.IV)).toBe(0);
  });

  it("test_GIVEN_challenger_WHEN_getCumulativeFractionBelow_THEN_returns_near_one", () => {
    expect(getCumulativeFractionBelow(Tiers.CHALLENGER, null)).toBeGreaterThan(0.99);
  });

  it("test_GIVEN_any_rank_WHEN_getFractionOf_THEN_returns_fraction_between_zero_and_one", () => {
    const fraction = getFractionOf(Tiers.GOLD, Divisions.IV);
    expect(fraction).toBeGreaterThan(0);
    expect(fraction).toBeLessThan(1);
  });

  it("test_GIVEN_apex_tier_with_division_WHEN_lookup_THEN_matches_whole_tier", () => {
    // Riot returns rank "I" for Master/Grandmaster/Challenger; lookup must ignore it.
    expect(getFractionOf(Tiers.MASTER, Divisions.I)).toBe(getFractionOf(Tiers.MASTER, null));
    expect(getCumulativeFractionBelow(Tiers.MASTER, Divisions.I)).toBe(
      getCumulativeFractionBelow(Tiers.MASTER, null)
    );
  });

  it("test_GIVEN_ascending_ranks_WHEN_getCumulativeFractionBelow_THEN_strictly_increases", () => {
    const goldIV = getCumulativeFractionBelow(Tiers.GOLD, Divisions.IV);
    const diamondIV = getCumulativeFractionBelow(Tiers.DIAMOND, Divisions.IV);
    const master = getCumulativeFractionBelow(Tiers.MASTER, null);
    expect(diamondIV).toBeGreaterThan(goldIV);
    expect(master).toBeGreaterThan(diamondIV);
  });
});
