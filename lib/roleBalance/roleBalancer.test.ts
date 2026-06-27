import { describe, expect, it } from "vitest";
import {
  assignmentScore,
  balanceByRole,
  laneWinProbability,
  RolePlayer,
} from "./roleBalancer";
import { Role, ROLES } from "./roles";

function playerWhoOnlyPlays(name: string, baseMmr: number, mainRole: Role): RolePlayer {
  const affinities = {} as { [role in Role]: number };
  for (const role of ROLES) {
    affinities[role] = role === mainRole ? 1 : 0;
  }
  return { name, baseMmr, affinities, oneTrickFactor: 0 };
}

function tenPlayers(): RolePlayer[] {
  const mmrs = [2000, 1950, 1900, 1850, 1800, 1750, 1700, 1650, 1600, 1550];
  const roleCycle: Role[] = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
  return mmrs.map((mmr, index) =>
    playerWhoOnlyPlays(`p${index}`, mmr, roleCycle[index % 5])
  );
}

describe("laneWinProbability", () => {
  it("test_GIVEN_equal_lane_WHEN_laneWinProbability_THEN_is_one_half", () => {
    expect(laneWinProbability(0)).toBeCloseTo(0.5);
  });

  it("test_GIVEN_stronger_player_WHEN_laneWinProbability_THEN_above_one_half_and_monotonic", () => {
    expect(laneWinProbability(200)).toBeGreaterThan(0.5);
    expect(laneWinProbability(600)).toBeGreaterThan(laneWinProbability(200));
    expect(laneWinProbability(-200)).toBeLessThan(0.5);
  });
});

describe("assignmentScore", () => {
  it("test_GIVEN_identical_lanes_WHEN_assignmentScore_THEN_zero", () => {
    const lanes = [1500, 1500, 1500, 1500, 1500];
    expect(assignmentScore(lanes, lanes)).toBeCloseTo(0);
  });

  it("test_GIVEN_same_totals_but_lopsided_lanes_WHEN_assignmentScore_THEN_worse_than_even_lanes", () => {
    // Both pairings have identical team totals (7500 vs 7500).
    const evenTeam1 = [1500, 1500, 1500, 1500, 1500];
    const evenTeam2 = [1500, 1500, 1500, 1500, 1500];
    const lopsidedTeam1 = [3000, 3000, 500, 500, 500];
    const lopsidedTeam2 = [500, 500, 3000, 3000, 500];
    expect(assignmentScore(lopsidedTeam1, lopsidedTeam2)).toBeGreaterThan(
      assignmentScore(evenTeam1, evenTeam2)
    );
  });

  it("test_GIVEN_larger_total_gap_WHEN_assignmentScore_THEN_worse", () => {
    const team1 = [1600, 1600, 1600, 1600, 1600];
    const close = [1500, 1500, 1500, 1500, 1500];
    const far = [1000, 1000, 1000, 1000, 1000];
    expect(assignmentScore(team1, far)).toBeGreaterThan(assignmentScore(team1, close));
  });
});

describe("balanceByRole", () => {
  it("test_GIVEN_not_ten_players_WHEN_balanceByRole_THEN_throws", () => {
    expect(() => balanceByRole(tenPlayers().slice(0, 9))).toThrow();
  });

  it("test_GIVEN_ten_players_WHEN_balanceByRole_THEN_each_team_has_five_distinct_roles", () => {
    const result = balanceByRole(tenPlayers());
    for (const team of [result.team1, result.team2]) {
      expect(team).toHaveLength(5);
      const roles = team.map((assignment) => assignment.role);
      expect(new Set(roles).size).toBe(5);
    }
  });

  it("test_GIVEN_ten_players_WHEN_balanceByRole_THEN_all_ten_assigned_once", () => {
    const result = balanceByRole(tenPlayers());
    const names = [...result.team1, ...result.team2].map((a) => a.name).sort();
    expect(names).toEqual(["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"]);
  });

  it("test_GIVEN_loose_tolerance_WHEN_balanceByRole_repeatedly_THEN_produces_varied_assignments", () => {
    const players = tenPlayers();
    const seen = new Set<string>();
    for (let run = 0; run < 12; run++) {
      const result = balanceByRole(players, 0.4);
      const key = result.team1
        .map((a) => `${a.name}:${a.role}`)
        .sort()
        .join("|");
      seen.add(key);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});
