import { describe, expect, it, vi } from "vitest";
import { fetchRoleProfiles, RoleProfileDeps } from "./fetchRoleProfiles";
import { TRACKED_QUEUE_IDS } from "../roleBalance/queueWeights";

const SOLO_DUO_QUEUE = 420;
const FLEX_QUEUE = 440;

function match(puuid: string, teamPosition: string, win: boolean) {
  return {
    info: {
      queueId: SOLO_DUO_QUEUE,
      gameDuration: 1800,
      participants: [
        {
          puuid,
          teamPosition,
          championName: "Ahri",
          win,
          kills: 5,
          deaths: 2,
          assists: 5,
          goldEarned: 12000,
          killingSprees: 2,
          largestKillingSpree: 2,
          totalDamageDealt: 150000,
          visionScore: 20,
          timeCCingOthers: 20,
          firstBloodKill: false,
          firstBloodAssist: false,
        },
      ],
    },
  };
}

function fakeDeps(overrides: Partial<RoleProfileDeps> = {}): RoleProfileDeps {
  const puuid = "puuid-Alice#NA1";
  return {
    getPuuid: async (name) => `puuid-${name}`,
    listMatchIds: async (_puuid, queueId) =>
      queueId === SOLO_DUO_QUEUE ? ["m1", "m2"] : [],
    getMatch: async (matchId) =>
      matchId === "m1" ? match(puuid, "MIDDLE", true) : match(puuid, "BOTTOM", false),
    now: () => 1_000,
    cacheTtlMs: 60_000,
    ...overrides,
  };
}

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"] as const;
const CATEGORIES = ["SOLO_DUO", "FLEX", "NORMAL"] as const;

function totalGames(profiles: Awaited<ReturnType<typeof fetchRoleProfiles>>, name: string): number {
  let total = 0;
  for (const category of CATEGORIES) {
    for (const role of ROLES) {
      total += profiles[name][category].roles[role].games;
    }
  }
  return total;
}

describe("fetchRoleProfiles", () => {
  it("test_GIVEN_match_history_WHEN_fetchRoleProfiles_THEN_maps_positions_to_role_records", async () => {
    const profiles = await fetchRoleProfiles(["Alice#NA1"], fakeDeps());
    expect(profiles["Alice#NA1"].SOLO_DUO.roles.MID.games).toBeGreaterThan(0);
    expect(profiles["Alice#NA1"].SOLO_DUO.roles.ADC.games).toBeGreaterThan(0);
    expect(profiles["Alice#NA1"].SOLO_DUO.roles.MID.wins).toBeGreaterThan(0);
    expect(profiles["Alice#NA1"].SOLO_DUO.roles.ADC.wins).toBe(0);
  });

  it("test_GIVEN_matches_in_a_queue_WHEN_fetchRoleProfiles_THEN_categorized_by_that_queue", async () => {
    const deps = fakeDeps({
      listMatchIds: async (_puuid, queueId) => (queueId === FLEX_QUEUE ? ["f1"] : []),
      getMatch: async () => match("puuid-Alice#NA1", "TOP", true),
    });
    const profiles = await fetchRoleProfiles(["Alice#NA1"], deps);
    expect(profiles["Alice#NA1"].FLEX.roles.TOP.games).toBeGreaterThan(0);
    expect(profiles["Alice#NA1"].SOLO_DUO.roles.TOP.games).toBe(0);
  });

  it("test_GIVEN_non_sr_position_WHEN_fetchRoleProfiles_THEN_ignored", async () => {
    const deps = fakeDeps({
      getMatch: async () => match("puuid-Alice#NA1", "", true),
    });
    const profiles = await fetchRoleProfiles(["Alice#NA1"], deps);
    expect(totalGames(profiles, "Alice#NA1")).toBe(0);
  });

  it("test_GIVEN_one_player_WHEN_fetchRoleProfiles_THEN_lists_once_per_tracked_queue", async () => {
    const listMatchIds = vi.fn(async () => [] as string[]);
    await fetchRoleProfiles(["Alice#NA1"], fakeDeps({ listMatchIds }));
    expect(listMatchIds.mock.calls.length).toBe(TRACKED_QUEUE_IDS.length);
  });

  it("test_GIVEN_second_call_within_ttl_WHEN_fetchRoleProfiles_THEN_uses_cache_and_skips_fetch", async () => {
    const getMatch = vi.fn(fakeDeps().getMatch);
    const deps = fakeDeps({ getMatch });
    await fetchRoleProfiles(["Alice#NA1"], deps);
    const callsAfterFirst = getMatch.mock.calls.length;
    await fetchRoleProfiles(["Alice#NA1"], deps);
    expect(getMatch.mock.calls.length).toBe(callsAfterFirst);
  });
});
