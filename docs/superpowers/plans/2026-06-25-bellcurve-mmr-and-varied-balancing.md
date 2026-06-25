# Bell-curve MMR and varied balancing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the arbitrary inhouse rating with a population-distribution-derived MMR (bell-curve percentile, convex-expanded so elite ranks dominate), and make the team balancer return varied-but-fair splits instead of one deterministic result.

**Architecture:** Each player's rank maps to a cumulative population percentile from a committed NA distribution snapshot. The percentile goes through the inverse normal CDF to a z-score, then through a convex expansion `RATING_BASE + RATING_SCALE * exp(EXPANSION_K * z)` so tier gaps grow toward the top. Balancing enumerates all equal-as-possible team splits, keeps those within a tolerance of the fairest, and randomly picks one.

**Tech Stack:** TypeScript, Next.js (existing), Vitest (new, test-only).

> **Repo owner does their own commits.** Do NOT run `git commit` or `git add`. Each task ends with a verification checkpoint; leave changes in the working tree for the owner to review and commit.

---

### Task 1: Vitest setup

**Files:**
- Modify: `package.json`
- Create: `lib/utils/smoke.test.ts` (temporary, deleted at end of task)

- [ ] **Step 1: Add Vitest dev dependency**

Run: `yarn add -D vitest`
Expected: `vitest` appears under `devDependencies` in `package.json` and `yarn.lock` updates.

- [ ] **Step 2: Add the test script**

In `package.json`, add a `test` script to the `scripts` block so it reads:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
```

- [ ] **Step 3: Write a smoke test**

Create `lib/utils/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("vitest smoke", () => {
  it("test_GIVEN_runner_WHEN_executing_THEN_runs_assertions", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run the smoke test**

Run: `yarn test`
Expected: PASS, 1 test passed.

- [ ] **Step 5: Delete the smoke test**

Delete `lib/utils/smoke.test.ts`. It exists only to prove the runner works.

- [ ] **Step 6: Checkpoint**

Confirm `package.json` has the `test` script and `yarn test` ran green. Leave changes for review.

---

### Task 2: Inverse normal CDF

**Files:**
- Create: `lib/utils/normalDistribution.ts`
- Test: `lib/utils/normalDistribution.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/utils/normalDistribution.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { inverseNormalCDF } from "./normalDistribution";

describe("inverseNormalCDF", () => {
  it("test_GIVEN_median_probability_WHEN_inverseNormalCDF_THEN_returns_near_zero", () => {
    expect(Math.abs(inverseNormalCDF(0.5))).toBeLessThan(1e-6);
  });

  it("test_GIVEN_symmetric_probabilities_WHEN_inverseNormalCDF_THEN_outputs_are_negatives", () => {
    expect(inverseNormalCDF(0.25)).toBeCloseTo(-inverseNormalCDF(0.75), 6);
  });

  it("test_GIVEN_increasing_probabilities_WHEN_inverseNormalCDF_THEN_output_strictly_increases", () => {
    const probabilities = [0.05, 0.2, 0.4, 0.6, 0.8, 0.95];
    const outputs = probabilities.map(inverseNormalCDF);
    for (let i = 1; i < outputs.length; i++) {
      expect(outputs[i]).toBeGreaterThan(outputs[i - 1]);
    }
  });

  it("test_GIVEN_known_quantile_WHEN_inverseNormalCDF_THEN_matches_reference", () => {
    expect(inverseNormalCDF(0.975)).toBeCloseTo(1.959964, 4);
  });

  it("test_GIVEN_out_of_range_probability_WHEN_inverseNormalCDF_THEN_is_clamped_and_finite", () => {
    expect(Number.isFinite(inverseNormalCDF(0))).toBe(true);
    expect(Number.isFinite(inverseNormalCDF(1))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test normalDistribution`
Expected: FAIL — cannot find module `./normalDistribution` / `inverseNormalCDF` is not a function.

- [ ] **Step 3: Write the implementation**

Create `lib/utils/normalDistribution.ts`:

```ts
const LOWER_BREAKPOINT = 0.02425;
const UPPER_BREAKPOINT = 1 - LOWER_BREAKPOINT;
const PROBABILITY_EPSILON = 1e-9;

const CENTRAL_NUMERATOR = [
  -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
  1.38357751867269e2, -3.066479806614716e1, 2.506628277459239e0,
];
const CENTRAL_DENOMINATOR = [
  -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
  6.680131188771972e1, -1.328068155288572e1,
];
const TAIL_NUMERATOR = [
  -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
  -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
];
const TAIL_DENOMINATOR = [
  7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
  3.754408661907416e0,
];

export function inverseNormalCDF(probability: number): number {
  const p = clampProbability(probability);
  if (p < LOWER_BREAKPOINT) {
    return lowerTail(Math.sqrt(-2 * Math.log(p)));
  }
  if (p > UPPER_BREAKPOINT) {
    return -lowerTail(Math.sqrt(-2 * Math.log(1 - p)));
  }
  return central(p);
}

function central(p: number): number {
  const q = p - 0.5;
  const r = q * q;
  const numerator =
    (((((CENTRAL_NUMERATOR[0] * r + CENTRAL_NUMERATOR[1]) * r +
      CENTRAL_NUMERATOR[2]) * r + CENTRAL_NUMERATOR[3]) * r +
      CENTRAL_NUMERATOR[4]) * r + CENTRAL_NUMERATOR[5]) * q;
  const denominator =
    ((((CENTRAL_DENOMINATOR[0] * r + CENTRAL_DENOMINATOR[1]) * r +
      CENTRAL_DENOMINATOR[2]) * r + CENTRAL_DENOMINATOR[3]) * r +
      CENTRAL_DENOMINATOR[4]) * r + 1;
  return numerator / denominator;
}

function lowerTail(q: number): number {
  const numerator =
    ((((TAIL_NUMERATOR[0] * q + TAIL_NUMERATOR[1]) * q + TAIL_NUMERATOR[2]) * q +
      TAIL_NUMERATOR[3]) * q + TAIL_NUMERATOR[4]) * q + TAIL_NUMERATOR[5];
  const denominator =
    (((TAIL_DENOMINATOR[0] * q + TAIL_DENOMINATOR[1]) * q +
      TAIL_DENOMINATOR[2]) * q + TAIL_DENOMINATOR[3]) * q + 1;
  return numerator / denominator;
}

function clampProbability(probability: number): number {
  const lowerBound = PROBABILITY_EPSILON;
  const upperBound = 1 - PROBABILITY_EPSILON;
  return Math.min(Math.max(probability, lowerBound), upperBound);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test normalDistribution`
Expected: PASS, 5 tests.

- [ ] **Step 5: Checkpoint**

Confirm green. Leave changes for review.

---

### Task 3: Apex-tier helper and rank distribution table

**Files:**
- Modify: `lib/riot/tier.ts` (add `isApexTier`)
- Create: `lib/riot/rankDistribution.ts`
- Test: `lib/riot/rankDistribution.test.ts`

- [ ] **Step 1: Add `isApexTier` to `lib/riot/tier.ts`**

Append to `lib/riot/tier.ts` (after the existing `getTierEnum` function):

```ts
export function isApexTier(tier: Tiers): boolean {
  return tier >= Tiers.MASTER;
}
```

- [ ] **Step 2: Write the failing test**

Create `lib/riot/rankDistribution.test.ts`:

```ts
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `yarn test rankDistribution`
Expected: FAIL — cannot find module `./rankDistribution`.

- [ ] **Step 4: Write the implementation**

Create `lib/riot/rankDistribution.ts`. Percentages are `percentOfPlatform` from the dpm.lol NA1 soloq snapshot (`updatedAt` 2026-06-24), listed lowest rank to highest:

```ts
import { Divisions } from "./division";
import { isApexTier, Tiers } from "./tier";

type DistributionEntry = {
  tier: Tiers;
  division: Divisions | null;
  populationPercent: number;
};

const RANK_DISTRIBUTION: DistributionEntry[] = [
  { tier: Tiers.IRON, division: Divisions.IV, populationPercent: 0.4140 },
  { tier: Tiers.IRON, division: Divisions.III, populationPercent: 0.4197 },
  { tier: Tiers.IRON, division: Divisions.II, populationPercent: 0.9030 },
  { tier: Tiers.IRON, division: Divisions.I, populationPercent: 1.7899 },
  { tier: Tiers.BRONZE, division: Divisions.IV, populationPercent: 4.7965 },
  { tier: Tiers.BRONZE, division: Divisions.III, populationPercent: 3.9923 },
  { tier: Tiers.BRONZE, division: Divisions.II, populationPercent: 4.2271 },
  { tier: Tiers.BRONZE, division: Divisions.I, populationPercent: 4.4343 },
  { tier: Tiers.SILVER, division: Divisions.IV, populationPercent: 6.0693 },
  { tier: Tiers.SILVER, division: Divisions.III, populationPercent: 5.4179 },
  { tier: Tiers.SILVER, division: Divisions.II, populationPercent: 4.8555 },
  { tier: Tiers.SILVER, division: Divisions.I, populationPercent: 5.7491 },
  { tier: Tiers.GOLD, division: Divisions.IV, populationPercent: 8.2203 },
  { tier: Tiers.GOLD, division: Divisions.III, populationPercent: 5.9594 },
  { tier: Tiers.GOLD, division: Divisions.II, populationPercent: 4.7452 },
  { tier: Tiers.GOLD, division: Divisions.I, populationPercent: 4.8942 },
  { tier: Tiers.PLATINUM, division: Divisions.IV, populationPercent: 6.2376 },
  { tier: Tiers.PLATINUM, division: Divisions.III, populationPercent: 4.9112 },
  { tier: Tiers.PLATINUM, division: Divisions.II, populationPercent: 3.5967 },
  { tier: Tiers.PLATINUM, division: Divisions.I, populationPercent: 2.4801 },
  { tier: Tiers.EMERALD, division: Divisions.IV, populationPercent: 4.6915 },
  { tier: Tiers.EMERALD, division: Divisions.III, populationPercent: 2.5595 },
  { tier: Tiers.EMERALD, division: Divisions.II, populationPercent: 1.7958 },
  { tier: Tiers.EMERALD, division: Divisions.I, populationPercent: 2.3508 },
  { tier: Tiers.DIAMOND, division: Divisions.IV, populationPercent: 1.5008 },
  { tier: Tiers.DIAMOND, division: Divisions.III, populationPercent: 0.6311 },
  { tier: Tiers.DIAMOND, division: Divisions.II, populationPercent: 0.9628 },
  { tier: Tiers.DIAMOND, division: Divisions.I, populationPercent: 0.5801 },
  { tier: Tiers.MASTER, division: null, populationPercent: 0.7361 },
  { tier: Tiers.GRANDMASTER, division: null, populationPercent: 0.0552 },
  { tier: Tiers.CHALLENGER, division: null, populationPercent: 0.0227 },
];

const TOTAL_PERCENT = RANK_DISTRIBUTION.reduce(
  (sum, entry) => sum + entry.populationPercent,
  0
);

export function getFractionOf(tier: Tiers, division: Divisions | null): number {
  const index = indexOfRank(tier, division);
  return RANK_DISTRIBUTION[index].populationPercent / TOTAL_PERCENT;
}

export function getCumulativeFractionBelow(
  tier: Tiers,
  division: Divisions | null
): number {
  const index = indexOfRank(tier, division);
  const percentBelow = RANK_DISTRIBUTION.slice(0, index).reduce(
    (sum, entry) => sum + entry.populationPercent,
    0
  );
  return percentBelow / TOTAL_PERCENT;
}

function indexOfRank(tier: Tiers, division: Divisions | null): number {
  const apex = isApexTier(tier);
  const exactIndex = RANK_DISTRIBUTION.findIndex(
    (entry) => entry.tier === tier && (apex || entry.division === division)
  );
  if (exactIndex !== -1) {
    return exactIndex;
  }
  return RANK_DISTRIBUTION.findIndex((entry) => entry.tier === tier);
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `yarn test rankDistribution`
Expected: PASS, 5 tests.

- [ ] **Step 6: Checkpoint**

Confirm green. Leave changes for review.

---

### Task 4: Rewrite the player rating calculator

**Files:**
- Rewrite: `lib/PlayerRatingCalculator.ts`
- Test: `lib/PlayerRatingCalculator.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/PlayerRatingCalculator.test.ts`:

```ts
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
    const goldFloor = ratingOf({ tier: "GOLD", division: "IV", leaguePoints: 0 });
    expect(unranked).toBeLessThan(goldFloor);
  });

  it("test_GIVEN_fresh_unranked_WHEN_rating_THEN_rates_below_weakest_iron", () => {
    const unranked = ratingOf({ tier: "UNRANKED", summonerLevel: 1 });
    const ironFloor = ratingOf({ tier: "IRON", division: "IV", leaguePoints: 0 });
    expect(unranked).toBeLessThan(ironFloor);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test PlayerRatingCalculator`
Expected: FAIL — current calculator uses the old `tier^1.7` model, so the elite-step and unranked-bound assertions fail.

- [ ] **Step 3: Write the implementation**

Replace the entire contents of `lib/PlayerRatingCalculator.ts`:

```ts
import { PlayerInfo } from "./balanceLobby";
import { getCumulativeFractionBelow, getFractionOf } from "./riot/rankDistribution";
import { Divisions, getDivisionEnum } from "./riot/division";
import { getTierEnum, isApexTier, Tiers } from "./riot/tier";
import { inverseNormalCDF } from "./utils/normalDistribution";

export class PlayerRatingCalculator {
  private tier: Tiers;
  private division: Divisions | null;
  private leaguePoints: number;
  private summonerLevel: number;

  private readonly EXPANSION_K = 0.9;
  private readonly RATING_BASE = 793;
  private readonly RATING_SCALE = 98;
  private readonly APEX_LP_REFERENCE = 1000;
  private readonly UNRANKED_Z_FLOOR = -7;
  private readonly LEVEL_TAU = 120;
  private readonly UNRANKED_MAX_LEVEL_PROGRESS = 0.97;
  private readonly UNRANKED_Z_CEIL = inverseNormalCDF(
    getCumulativeFractionBelow(Tiers.GOLD, Divisions.IV)
  );

  constructor(playerInfo: PlayerInfo) {
    this.tier = getTierEnum(playerInfo.tier);
    this.division = playerInfo.division
      ? getDivisionEnum(playerInfo.division)
      : null;
    this.leaguePoints = playerInfo.leaguePoints ?? 0;
    this.summonerLevel = playerInfo.summonerLevel;
  }

  public getRating(): number {
    const skillZScore =
      this.tier === Tiers.UNRANKED
        ? this.unrankedZScore()
        : this.rankedZScore();
    return this.expand(skillZScore);
  }

  private rankedZScore(): number {
    const cumulativeBelow = getCumulativeFractionBelow(this.tier, this.division);
    const fractionOfRank = getFractionOf(this.tier, this.division);
    const percentile = cumulativeBelow + this.positionWithinRank() * fractionOfRank;
    return inverseNormalCDF(percentile);
  }

  private positionWithinRank(): number {
    const cap = 0.999;
    if (isApexTier(this.tier)) {
      return Math.min(this.leaguePoints / this.APEX_LP_REFERENCE, cap);
    }
    return Math.min(this.leaguePoints / 100, cap);
  }

  private unrankedZScore(): number {
    const taperedProgress = 1 - Math.exp(-this.summonerLevel / this.LEVEL_TAU);
    const levelProgress = Math.min(
      taperedProgress,
      this.UNRANKED_MAX_LEVEL_PROGRESS
    );
    return (
      this.UNRANKED_Z_FLOOR +
      levelProgress * (this.UNRANKED_Z_CEIL - this.UNRANKED_Z_FLOOR)
    );
  }

  private expand(zScore: number): number {
    return this.RATING_BASE + this.RATING_SCALE * Math.exp(this.EXPANSION_K * zScore);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test PlayerRatingCalculator`
Expected: PASS, 8 tests.

- [ ] **Step 5: Checkpoint**

Confirm green. Leave changes for review.

---

### Task 5: Team partition search

**Files:**
- Create: `lib/utils/teamPartition.ts`
- Test: `lib/utils/teamPartition.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/utils/teamPartition.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test teamPartition`
Expected: FAIL — cannot find module `./teamPartition`.

- [ ] **Step 3: Write the implementation**

Create `lib/utils/teamPartition.ts`:

```ts
export type PlayerMmr = {
  name: string;
  mmr: number;
};

type Split = {
  team1: PlayerMmr[];
  team2: PlayerMmr[];
};

export type TeamNames = {
  team1: string[];
  team2: string[];
};

export function pickBalancedSplit(
  players: PlayerMmr[],
  tolerance: number
): TeamNames {
  const splits = enumerateSplits(players);
  const gaps = splits.map(ratingGap);
  const bestGap = Math.min(...gaps);
  const acceptableSplits = splits.filter(
    (_, index) => gaps[index] <= bestGap + tolerance
  );
  const chosen = acceptableSplits[randomIndex(acceptableSplits.length)];
  return {
    team1: chosen.team1.map((player) => player.name),
    team2: chosen.team2.map((player) => player.name),
  };
}

function enumerateSplits(players: PlayerMmr[]): Split[] {
  if (players.length === 0) {
    return [{ team1: [], team2: [] }];
  }
  const team1Size = Math.ceil(players.length / 2);
  const [anchor, ...rest] = players;
  return combinations(rest, team1Size - 1).map((partialTeam1) => ({
    team1: [anchor, ...partialTeam1],
    team2: rest.filter((player) => !partialTeam1.includes(player)),
  }));
}

function combinations<T>(items: T[], choose: number): T[][] {
  if (choose === 0) {
    return [[]];
  }
  if (choose > items.length) {
    return [];
  }
  const [first, ...rest] = items;
  const withFirst = combinations(rest, choose - 1).map((combo) => [
    first,
    ...combo,
  ]);
  const withoutFirst = combinations(rest, choose);
  return [...withFirst, ...withoutFirst];
}

function ratingGap(split: Split): number {
  return Math.abs(teamTotal(split.team1) - teamTotal(split.team2));
}

function teamTotal(team: PlayerMmr[]): number {
  return team.reduce((sum, player) => sum + player.mmr, 0);
}

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test teamPartition`
Expected: PASS, 5 tests.

- [ ] **Step 5: Checkpoint**

Confirm green. Leave changes for review.

---

### Task 6: Rewrite the balancer and remove dead helpers

**Files:**
- Rewrite: `lib/balanceLobby.ts`
- Delete: `lib/utils/draftUtils.ts`
- Delete: `lib/utils/mathUtils.ts`

- [ ] **Step 1: Rewrite `lib/balanceLobby.ts`**

Replace the entire contents of `lib/balanceLobby.ts`:

```ts
import { PlayerRatingCalculator } from "./PlayerRatingCalculator";
import { PlayerMmr, pickBalancedSplit } from "./utils/teamPartition";

export type PlayerInfo = {
  tier: string;
  division: string | null;
  leaguePoints: number | null;
  summonerLevel: number;
  profileIconId: number;
};

type Lobby = {
  [playerName: string]: PlayerInfo;
};

export type BalancedTeams = {
  team1: { [playerName: string]: PlayerInfo }[];
  team2: { [playerName: string]: PlayerInfo }[];
};

const BALANCE_TOLERANCE = 100;

export default function balanceLobby(lobby: Lobby): BalancedTeams {
  const playersWithMmr = toPlayerMmrList(lobby);
  const split = pickBalancedSplit(playersWithMmr, BALANCE_TOLERANCE);
  return {
    team1: split.team1.map((name) => ({ [name]: lobby[name] })),
    team2: split.team2.map((name) => ({ [name]: lobby[name] })),
  };
}

function toPlayerMmrList(lobby: Lobby): PlayerMmr[] {
  return Object.keys(lobby).map((name) => ({
    name,
    mmr: new PlayerRatingCalculator(lobby[name]).getRating(),
  }));
}
```

- [ ] **Step 2: Delete the superseded helpers**

Run: `rm lib/utils/draftUtils.ts lib/utils/mathUtils.ts`
Expected: both files removed.

- [ ] **Step 3: Verify nothing else imports the deleted helpers**

Run: `grep -rn "draftUtils\|mathUtils\|snakeDraft\|oneByOneDraft\|sortPlayersByRating\|calculateMean\|calculateStandardDeviation" app lib components`
Expected: no matches. If any appear, they are stale references to remove — but per the current code only `balanceLobby.ts` used them, and it was just rewritten.

- [ ] **Step 4: Run the full test suite**

Run: `yarn test`
Expected: PASS — all suites from Tasks 2-5 green.

- [ ] **Step 5: Checkpoint**

Confirm green. Leave changes for review.

---

### Task 7: Typecheck, build, and manual verification

**Files:**
- None (verification only)

- [ ] **Step 1: Typecheck via build**

Run: `yarn build`
Expected: Next.js build succeeds with no TypeScript errors. The `app/api/lobby/balance/route.ts` route still compiles because `balanceLobby` keeps the same signature and `BalancedTeams` shape.

- [ ] **Step 2: Lint**

Run: `yarn lint`
Expected: no new lint errors in the changed files.

- [ ] **Step 3: Run the full suite once more**

Run: `yarn test`
Expected: all tests pass.

- [ ] **Step 4: Manual smoke test (golden path)**

Run: `yarn dev`, open `http://localhost:3000`, paste a lobby chat log of 10 players with a mix of ranks, and balance.
Expected: two teams of 5 render, and the totals look close. Balancing the same lobby several times produces noticeably different team compositions (variety), all of which still look fair.

- [ ] **Step 5: Manual edge cases**

- Lobby with a Challenger/Master alongside low-elo players: the high-elo player visibly anchors one team and the split compensates with several mid players on the other side.
- Lobby with unranked players: they are treated as low-rated (below Gold) and do not get placed as if they were strong.
- Odd player count (e.g. 9 or 11): teams differ in size by one and the app does not error.

- [ ] **Step 6: Checkpoint**

Confirm build, lint, and tests are green and the manual checks pass. Leave all changes for the owner to review and commit.

---

## Notes on tunable constants

All in code as named constants, safe to adjust without touching logic:

- `EXPANSION_K` (`PlayerRatingCalculator.ts`, default 0.9) — how hard the top of the ladder is stretched. Raise (e.g. 1.05) for even more elite dominance, lower (e.g. 0.75) for more mid-tier resolution. At 0.9, D4->D2 is ~37% bigger than the Silver->Platinum span and Diamond->Master is ~14x Bronze->Silver.
- `RATING_BASE` / `RATING_SCALE` — cosmetic anchors for how the MMR number reads; do not affect fairness.
- `APEX_LP_REFERENCE` — LP spread within Master/GM/Challenger bands.
- `UNRANKED_Z_FLOOR` / `LEVEL_TAU` — how low a fresh account starts and how fast unranked rating rises with level toward the just-below-Gold ceiling.
- `BALANCE_TOLERANCE` (`balanceLobby.ts`, default 100) — MMR points of slack above the fairest split that still count as "fair enough" to randomize among. Larger = more variety, looser balance.
