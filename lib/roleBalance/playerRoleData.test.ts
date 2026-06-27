import { describe, expect, it } from "vitest";
import { PlayerRoleData, toRolePlayer } from "./playerRoleData";
import { buildCategoryProfiles, MatchSample } from "./roleProfile";

function playerData(name: string, baseMmr: number, samples: MatchSample[]): PlayerRoleData {
  return {
    name,
    baseMmr,
    playerInfo: {
      tier: "GOLD",
      division: "II",
      leaguePoints: 50,
      summonerLevel: 100,
      profileIconId: 1,
    },
    categoryProfiles: buildCategoryProfiles(samples),
  };
}

function manyGames(
  role: MatchSample["role"],
  queue: MatchSample["queue"],
  count: number
): MatchSample[] {
  return Array.from({ length: count }, () => ({
    role,
    queue,
    champion: "Ahri",
    win: true,
    firstBloodKill: false,
    firstBloodAssist: false,
    metrics: {
      kda: 3,
      gpm: 350,
      killingSprees: 2,
      largestKillingSpree: 2,
      totalDamage: 120000,
      visionScore: 20,
      ccTime: 20,
    },
  }));
}

describe("toRolePlayer", () => {
  it("test_GIVEN_selection_WHEN_toRolePlayer_THEN_only_selected_queues_shape_affinities", () => {
    const data = playerData("a", 1800, [
      ...manyGames("MID", "SOLO_DUO", 20),
      ...manyGames("TOP", "NORMAL", 20),
    ]);

    const soloOnly = toRolePlayer(data, ["SOLO_DUO"]);
    expect(soloOnly.affinities.MID).toBeCloseTo(1);
    expect(soloOnly.affinities.TOP).toBe(0);

    const normalOnly = toRolePlayer(data, ["NORMAL"]);
    expect(normalOnly.affinities.TOP).toBeCloseTo(1);
    expect(normalOnly.affinities.MID).toBe(0);
  });

  it("test_GIVEN_data_WHEN_toRolePlayer_THEN_base_mmr_and_name_preserved", () => {
    const data = playerData("zed", 2200, manyGames("MID", "SOLO_DUO", 5));
    const rolePlayer = toRolePlayer(data, ["SOLO_DUO"]);
    expect(rolePlayer.name).toBe("zed");
    expect(rolePlayer.baseMmr).toBe(2200);
  });

  it("test_GIVEN_no_selected_queues_WHEN_toRolePlayer_THEN_all_affinities_zero", () => {
    const data = playerData("a", 1800, manyGames("JUNGLE", "SOLO_DUO", 10));
    const rolePlayer = toRolePlayer(data, []);
    expect(rolePlayer.affinities.JUNGLE).toBe(0);
  });
});
