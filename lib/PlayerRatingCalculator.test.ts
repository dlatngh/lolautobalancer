import { describe, expect, it } from "vitest";
import { PlayerInfo } from "./balanceLobby";
import { PlayerRatingCalculator } from "./PlayerRatingCalculator";

function ratingOf(partial: Partial<PlayerInfo>): number {
  const playerInfo: PlayerInfo = {
    tier: "UNRANKED",
    division: null,
    leaguePoints: 0,
    summonerLevel: 100,
    profileIconId: 0,
    ...partial,
  };
  return new PlayerRatingCalculator(playerInfo).getRating();
}

describe("PlayerRatingCalculator", () => {
  it("test_GIVEN_ascending_ranks_WHEN_rating_THEN_rating_strictly_increases", () => {
    const ascending = [
      ratingOf({ tier: "IRON", division: "IV", leaguePoints: 0 }),
      ratingOf({ tier: "IRON", division: "I", leaguePoints: 0 }),
      ratingOf({ tier: "BRONZE", division: "IV", leaguePoints: 0 }),
      ratingOf({ tier: "SILVER", division: "II", leaguePoints: 50 }),
      ratingOf({ tier: "GOLD", division: "IV", leaguePoints: 0 }),
      ratingOf({ tier: "EMERALD", division: "I", leaguePoints: 0 }),
      ratingOf({ tier: "DIAMOND", division: "IV", leaguePoints: 0 }),
      ratingOf({ tier: "MASTER", division: "I", leaguePoints: 0 }),
      ratingOf({ tier: "GRANDMASTER", division: "I", leaguePoints: 200 }),
      ratingOf({ tier: "CHALLENGER", division: "I", leaguePoints: 500 }),
    ];
    for (let i = 1; i < ascending.length; i++) {
      expect(ascending[i]).toBeGreaterThan(ascending[i - 1]);
    }
  });

  it("test_GIVEN_elite_and_low_tier_steps_WHEN_rating_THEN_elite_steps_dominate", () => {
    const bronzeToSilver =
      ratingOf({ tier: "SILVER", division: "IV", leaguePoints: 0 }) -
      ratingOf({ tier: "BRONZE", division: "IV", leaguePoints: 0 });
    const diamondToMaster =
      ratingOf({ tier: "MASTER", division: "I", leaguePoints: 0 }) -
      ratingOf({ tier: "DIAMOND", division: "IV", leaguePoints: 0 });
    const gmToChallenger =
      ratingOf({ tier: "CHALLENGER", division: "I", leaguePoints: 0 }) -
      ratingOf({ tier: "GRANDMASTER", division: "I", leaguePoints: 0 });
    expect(diamondToMaster).toBeGreaterThan(bronzeToSilver * 3);
    expect(gmToChallenger).toBeGreaterThan(bronzeToSilver * 3);
  });

  it("test_GIVEN_diamond_span_and_silver_to_plat_span_WHEN_rating_THEN_diamond_span_is_larger", () => {
    const diamondSpan =
      ratingOf({ tier: "DIAMOND", division: "I", leaguePoints: 0 }) -
      ratingOf({ tier: "DIAMOND", division: "IV", leaguePoints: 0 });
    const silverToPlatSpan =
      ratingOf({ tier: "PLATINUM", division: "IV", leaguePoints: 0 }) -
      ratingOf({ tier: "SILVER", division: "IV", leaguePoints: 0 });
    expect(diamondSpan).toBeGreaterThan(silverToPlatSpan);
  });

  it("test_GIVEN_diamond_two_division_climb_WHEN_rating_THEN_exceeds_silver_to_plat_span", () => {
    // Climbing D4 -> D2 is a harder skill jump than the whole Silver -> Platinum span.
    const diamondD4toD2 =
      ratingOf({ tier: "DIAMOND", division: "II", leaguePoints: 0 }) -
      ratingOf({ tier: "DIAMOND", division: "IV", leaguePoints: 0 });
    const silverToPlatSpan =
      ratingOf({ tier: "PLATINUM", division: "IV", leaguePoints: 0 }) -
      ratingOf({ tier: "SILVER", division: "IV", leaguePoints: 0 });
    expect(diamondD4toD2).toBeGreaterThan(silverToPlatSpan);
  });

  it("test_GIVEN_higher_lp_WHEN_rating_THEN_rating_increases", () => {
    const low = ratingOf({ tier: "GOLD", division: "II", leaguePoints: 0 });
    const high = ratingOf({ tier: "GOLD", division: "II", leaguePoints: 90 });
    expect(high).toBeGreaterThan(low);
  });

  it("test_GIVEN_unranked_levels_WHEN_rating_THEN_higher_level_rates_higher", () => {
    const lowLevel = ratingOf({ tier: "UNRANKED", summonerLevel: 30 });
    const highLevel = ratingOf({ tier: "UNRANKED", summonerLevel: 300 });
    expect(highLevel).toBeGreaterThan(lowLevel);
  });

  it("test_GIVEN_high_level_unranked_WHEN_rating_THEN_rates_below_weakest_gold", () => {
    const unranked = ratingOf({ tier: "UNRANKED", summonerLevel: 5000 });
    const goldFloor = ratingOf({
      tier: "GOLD",
      division: "IV",
      leaguePoints: 0,
    });
    expect(unranked).toBeLessThan(goldFloor);
  });

  it("test_GIVEN_fresh_unranked_WHEN_rating_THEN_rates_below_weakest_iron", () => {
    const unranked = ratingOf({ tier: "UNRANKED", summonerLevel: 1 });
    const ironFloor = ratingOf({
      tier: "IRON",
      division: "IV",
      leaguePoints: 0,
    });
    expect(unranked).toBeLessThan(ironFloor);
  });
});
