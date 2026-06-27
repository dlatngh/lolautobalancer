import { describe, expect, it } from "vitest";
import {
  aggregateSelectedProfiles,
  buildCategoryProfiles,
  buildRoleProfile,
  emptyRoleProfile,
  MatchSample,
  MetricValues,
} from "./roleProfile";
import { QUEUE_WEIGHTS } from "./queueWeights";

function metrics(overrides: Partial<MetricValues> = {}): MetricValues {
  return {
    kda: 3,
    gpm: 400,
    killingSprees: 2,
    largestKillingSpree: 2,
    totalDamage: 150000,
    visionScore: 20,
    ccTime: 20,
    ...overrides,
  };
}

function sample(overrides: Partial<MatchSample> = {}): MatchSample {
  return {
    role: "MID",
    queue: "SOLO_DUO",
    champion: "Ahri",
    win: true,
    firstBloodKill: false,
    firstBloodAssist: false,
    metrics: metrics(),
    ...overrides,
  };
}

describe("buildRoleProfile", () => {
  it("test_GIVEN_no_samples_WHEN_buildRoleProfile_THEN_all_roles_zeroed", () => {
    const profile = buildRoleProfile([]);
    expect(profile.roles).toEqual(emptyRoleProfile());
    expect(profile.championGames).toEqual({});
  });

  it("test_GIVEN_one_soloduo_win_WHEN_buildRoleProfile_THEN_weighted_by_soloduo", () => {
    const profile = buildRoleProfile([sample({ metrics: metrics({ kda: 3 }) })]);
    const w = QUEUE_WEIGHTS.SOLO_DUO;
    expect(profile.roles.MID.weightedGames).toBeCloseTo(w);
    expect(profile.roles.MID.weightedWins).toBeCloseTo(w);
    expect(profile.roles.MID.weightedMetricSums.kda).toBeCloseTo(w * 3);
    expect(profile.championGames.Ahri).toBeCloseTo(w);
  });

  it("test_GIVEN_first_blood_WHEN_buildRoleProfile_THEN_counted", () => {
    const profile = buildRoleProfile([sample({ firstBloodKill: true })]);
    expect(profile.roles.MID.weightedFirstBloodKills).toBeCloseTo(QUEUE_WEIGHTS.SOLO_DUO);
  });

  it("test_GIVEN_loss_WHEN_buildRoleProfile_THEN_games_counts_but_wins_does_not", () => {
    const profile = buildRoleProfile([sample({ role: "TOP", win: false })]);
    expect(profile.roles.TOP.weightedGames).toBeCloseTo(QUEUE_WEIGHTS.SOLO_DUO);
    expect(profile.roles.TOP.weightedWins).toBe(0);
  });
});

describe("buildCategoryProfiles", () => {
  it("test_GIVEN_samples_in_different_queues_WHEN_buildCategoryProfiles_THEN_kept_raw_and_separate", () => {
    const profiles = buildCategoryProfiles([
      sample({ role: "MID", win: true, queue: "SOLO_DUO", champion: "Ahri" }),
      sample({ role: "MID", win: false, queue: "NORMAL", champion: "Zed" }),
    ]);
    expect(profiles.SOLO_DUO.roles.MID.games).toBe(1);
    expect(profiles.SOLO_DUO.roles.MID.wins).toBe(1);
    expect(profiles.SOLO_DUO.championGames.Ahri).toBe(1);
    expect(profiles.NORMAL.roles.MID.games).toBe(1);
    expect(profiles.NORMAL.championGames.Zed).toBe(1);
    expect(profiles.FLEX.roles.MID.games).toBe(0);
  });
});

describe("aggregateSelectedProfiles", () => {
  it("test_GIVEN_unselected_category_WHEN_aggregate_THEN_excluded", () => {
    const profiles = buildCategoryProfiles([
      sample({ role: "MID", queue: "SOLO_DUO" }),
      sample({ role: "TOP", queue: "NORMAL" }),
    ]);
    const soloOnly = aggregateSelectedProfiles(profiles, ["SOLO_DUO"]);
    expect(soloOnly.roles.MID.weightedGames).toBeCloseTo(QUEUE_WEIGHTS.SOLO_DUO);
    expect(soloOnly.roles.TOP.weightedGames).toBe(0);
  });

  it("test_GIVEN_selected_category_WHEN_aggregate_THEN_weighted_by_that_category", () => {
    const profiles = buildCategoryProfiles([
      sample({ role: "ADC", queue: "NORMAL", metrics: metrics({ kda: 2 }) }),
    ]);
    const normalOnly = aggregateSelectedProfiles(profiles, ["NORMAL"]);
    expect(normalOnly.roles.ADC.weightedGames).toBeCloseTo(QUEUE_WEIGHTS.NORMAL);
    expect(normalOnly.roles.ADC.weightedMetricSums.kda).toBeCloseTo(QUEUE_WEIGHTS.NORMAL * 2);
  });

  it("test_GIVEN_no_selected_categories_WHEN_aggregate_THEN_all_zero", () => {
    const profiles = buildCategoryProfiles([sample({ role: "JUNGLE" })]);
    const none = aggregateSelectedProfiles(profiles, []);
    expect(none.roles).toEqual(emptyRoleProfile());
    expect(none.championGames).toEqual({});
  });
});
