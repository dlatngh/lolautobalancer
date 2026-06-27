import { describe, expect, it } from "vitest";
import { effectiveMmr, OFF_ROLE_PENALTY, roleAffinities } from "./roleAffinity";
import { buildRoleProfile, MatchSample } from "./roleProfile";

function games(
  role: MatchSample["role"],
  champion: string,
  count: number,
  win: boolean = true,
  kda: number = 3
): MatchSample[] {
  return Array.from({ length: count }, () => ({
    role,
    champion,
    queue: "SOLO_DUO" as const,
    win,
    firstBloodKill: false,
    firstBloodAssist: false,
    metrics: {
      kda,
      gpm: 300,
      killingSprees: 2,
      largestKillingSpree: 2,
      totalDamage: 120000,
      visionScore: 20,
      ccTime: 20,
    },
  }));
}

describe("roleAffinities", () => {
  it("test_GIVEN_no_games_WHEN_roleAffinities_THEN_all_zero", () => {
    const affinities = roleAffinities(buildRoleProfile([]));
    expect(affinities.MID).toBe(0);
    expect(affinities.TOP).toBe(0);
  });

  it("test_GIVEN_single_played_role_WHEN_roleAffinities_THEN_that_role_is_one_others_zero", () => {
    const affinities = roleAffinities(buildRoleProfile(games("JUNGLE", "LeeSin", 20)));
    expect(affinities.JUNGLE).toBe(1);
    expect(affinities.TOP).toBe(0);
    expect(affinities.MID).toBe(0);
  });

  it("test_GIVEN_two_played_roles_WHEN_roleAffinities_THEN_most_played_is_primary_other_below", () => {
    const affinities = roleAffinities(
      buildRoleProfile([...games("MID", "Ahri", 25), ...games("TOP", "Garen", 10)])
    );
    expect(affinities.MID).toBe(1);
    expect(affinities.TOP).toBeGreaterThan(0);
    expect(affinities.TOP).toBeLessThan(1);
  });

  it("test_GIVEN_one_trick_WHEN_roleAffinities_THEN_off_role_lower_than_flexible_player", () => {
    const oneTrick = roleAffinities(
      buildRoleProfile([...games("MID", "Ahri", 20), ...games("TOP", "Ahri", 10)])
    );
    const flexible = roleAffinities(
      buildRoleProfile([...games("MID", "Ahri", 20), ...games("TOP", "Garen", 10)])
    );
    expect(oneTrick.MID).toBe(1);
    expect(flexible.MID).toBe(1);
    expect(oneTrick.TOP).toBeLessThan(flexible.TOP);
  });
});

describe("effectiveMmr", () => {
  it("test_GIVEN_best_role_affinity_one_WHEN_effectiveMmr_THEN_equals_base", () => {
    expect(effectiveMmr(2000, 1)).toBeCloseTo(2000);
  });

  it("test_GIVEN_never_played_role_affinity_zero_WHEN_effectiveMmr_THEN_base_times_one_minus_penalty", () => {
    expect(effectiveMmr(2000, 0)).toBeCloseTo(2000 * (1 - OFF_ROLE_PENALTY));
  });

  it("test_GIVEN_increasing_affinity_WHEN_effectiveMmr_THEN_monotonically_increases", () => {
    expect(effectiveMmr(2000, 0.8)).toBeGreaterThan(effectiveMmr(2000, 0.4));
  });

  it("test_GIVEN_one_trick_off_role_WHEN_effectiveMmr_THEN_penalized_more_than_flexible", () => {
    const oneTrick = effectiveMmr(2000, 0, 1);
    const flexible = effectiveMmr(2000, 0, 0);
    expect(oneTrick).toBeLessThan(flexible);
  });
});
