import { describe, expect, it } from "vitest";
import { PlayerMmr, pickBalancedSplit } from "./teamPartition";

function roster(...mmrValues: number[]): PlayerMmr[] {
  return mmrValues.map((mmr, index) => ({ name: `p${index}`, mmr }));
}

function mmrOfName(name: string, players: PlayerMmr[]): number {
  return players.find((player) => player.name === name)!.mmr;
}

describe("pickBalancedSplit", () => {
  it("test_GIVEN_even_lobby_WHEN_pickBalancedSplit_THEN_teams_are_equal_size", () => {
    const result = pickBalancedSplit(roster(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), 0);
    expect(result.team1.length).toBe(5);
    expect(result.team2.length).toBe(5);
  });

  it("test_GIVEN_odd_lobby_WHEN_pickBalancedSplit_THEN_team_sizes_differ_by_one", () => {
    const result = pickBalancedSplit(roster(1, 2, 3, 4, 5), 0);
    expect(Math.abs(result.team1.length - result.team2.length)).toBe(1);
  });

  it("test_GIVEN_zero_tolerance_WHEN_pickBalancedSplit_THEN_returns_the_optimal_split", () => {
    // For [1,2,3,4] the only zero-gap split is {1,4} vs {2,3}.
    const players = roster(1, 2, 3, 4);
    const result = pickBalancedSplit(players, 0);
    const team1Sum = result.team1.reduce((sum, name) => sum + mmrOfName(name, players), 0);
    const team2Sum = result.team2.reduce((sum, name) => sum + mmrOfName(name, players), 0);
    expect(team1Sum).toBe(team2Sum);
  });

  it("test_GIVEN_tolerance_allowing_ties_WHEN_pickBalancedSplit_repeatedly_THEN_multiple_distinct_splits_occur", () => {
    const players = roster(1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000);
    const seenSplits = new Set<string>();
    for (let run = 0; run < 100; run++) {
      const result = pickBalancedSplit(players, 0);
      seenSplits.add([...result.team1].sort().join(","));
    }
    expect(seenSplits.size).toBeGreaterThan(1);
  });

  it("test_GIVEN_single_player_WHEN_pickBalancedSplit_THEN_does_not_throw", () => {
    const result = pickBalancedSplit(roster(1500), 0);
    expect(result.team1.length + result.team2.length).toBe(1);
  });
});
