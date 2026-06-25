# Bell-curve MMR and varied balancing

## Problem

The inhouse rating and the team balancer both have issues:

1. **Rating is not grounded in reality.** `PlayerRatingCalculator` computes a ranked
   rating as `tier^1.7 + division*0.1 + LP/1000`. The `^1.7` makes tier gaps grow toward
   the top, which is directionally reasonable, but the curve is arbitrary. It is not tied
   to how players are actually distributed across ranks, so the spacing between tiers does
   not reflect real skill differences.

2. **Balancing is deterministic.** `balanceLobby` computes the lobby rating standard
   deviation and then either snake-drafts (SD > 5) or 1:1-drafts a rating-sorted list.
   For a fixed lobby this always produces the exact same teams. There is no variety across
   re-rolls, and the snake/1:1 draft is a crude heuristic rather than a search for the
   fairest split.

## Goals

- Derive each player's inhouse MMR from where their rank falls in the **real population
  distribution**, so the MMR step between two adjacent tiers reflects how many players sit
  between them. Crowded middle tiers (Gold/Platinum/Emerald) should be close together;
  sparse tail tiers (Iron, Master+) should be far apart.
- Make the balancer produce **several genuinely fair but different** team splits, so
  re-rolling a lobby yields variety without sacrificing balance.

## Non-goals

- No change to the Riot fetch flow, the API route contracts, or the frontend. The balancer
  still takes a `Lobby` and returns the same `BalancedTeams` shape.
- No live fetching of distribution data at runtime (see Data source below).

## Core idea: percentile to z-score, then convex expansion

A player's rank tells us what fraction of the population they are above. Converting that
cumulative fraction (a percentile) through the **inverse normal CDF** yields a z-score: a
position on the bell curve of the player base.

A pure z-score alone does not match the real skill geometry of the ladder. Because the
middle tiers (Silver/Gold/Platinum) hold the overwhelming majority of players and the apex
tiers are nearly empty, a pure percentile model makes a Bronze->Silver step roughly equal
to a Diamond->Master step and crams Grandmaster and Challenger together. That contradicts
how the game actually plays: skill differentials widen sharply at the top (Diamond IV to
Diamond I is a larger skill gap than the entire Silver-to-Platinum span).

To capture this we apply a **convex (exponential) expansion** to the z-score, and this is
the single MMR formula used for every player (ranked and unranked):

```
mmr(z) = RATING_BASE + RATING_SCALE * exp(EXPANSION_K * z)
```

`exp` compresses the low/middle of the ladder and stretches the top, so each successive
tier step grows and the growth accelerates through Diamond into the apex tiers. The model
stays grounded in the real distribution (via the z-score) while matching the lived skill
curve (via the expansion).

### Chosen parameters and validation

Using the captured NA1 distribution with `EXPANSION_K = 0.9`, anchored so the Iron IV
midpoint is ~800 and the Challenger midpoint is ~3500 (`RATING_BASE` ~= 793,
`RATING_SCALE` ~= 98):

- Tier-to-tier gaps grow monotonically toward the top: Bronze->Silver ~30,
  Gold->Platinum ~73, Diamond->Master ~472, Master->Grandmaster ~860.
- Diamond->Master is ~14x Bronze->Silver; Grandmaster->Challenger is ~22x.
- Diamond IV to Diamond I (~258) exceeds the full Silver-to-Platinum span (~98), and even
  the two-division Diamond IV to Diamond II climb (~134) exceeds it. This matches the lived
  reality that climbing within Diamond is a harder skill jump than crossing the entire
  Silver-to-Platinum range.

`EXPANSION_K` is a single tunable knob: higher values (e.g. 1.05) make the top even more
dominant at the cost of low/middle resolution; lower values (e.g. 0.75) keep more
separation across Silver/Gold/Platinum. The anchors are cosmetic and do not affect balance
fairness, which depends only on relative spacing.

## Data source

Live-fetching the distribution (e.g. dpm.lol) from a Next.js server route is blocked by
Cloudflare's managed challenge; only an authenticated browser session with the cleared
challenge cookie can read it. Therefore the distribution is stored as a **committed
snapshot** in `lib/riot/rankDistribution.ts`.

The snapshot is the fraction of the ranked population in each tier+division (Iron IV
through Challenger), captured once from the dpm.lol soloq NA distribution JSON. Refreshing
it later is a single-edit operation. The fractions are normalized so the full table sums
to 1.

Captured NA1 snapshot (dpm.lol soloq, `updatedAt` 2026-06-24, `totalPlayers` 1,327,750).
Values are `percentOfPlatform` (percent of all ranked players), listed in ascending rank
order:

| Tier     | IV     | III    | II     | I      |
| -------- | ------ | ------ | ------ | ------ |
| Iron     | 0.4140 | 0.4197 | 0.9030 | 1.7899 |
| Bronze   | 4.7965 | 3.9923 | 4.2271 | 4.4343 |
| Silver   | 6.0693 | 5.4179 | 4.8555 | 5.7491 |
| Gold     | 8.2203 | 5.9594 | 4.7452 | 4.8942 |
| Platinum | 6.2376 | 4.9112 | 3.5967 | 2.4801 |
| Emerald  | 4.6915 | 2.5595 | 1.7958 | 2.3508 |
| Diamond  | 1.5008 | 0.6311 | 0.9628 | 0.5801 |

Apex tiers (single fraction, no divisions): Master 0.7361, Grandmaster 0.0552,
Challenger 0.0227.

The table stores these as fractions (value / 100). The implementation normalizes by the
table's own sum so rounding does not break the cumulative-fraction math.

Note on the apex tiers: Grandmaster and Challenger are hard-capped by player **count**
(Challenger = top 300 players, Grandmaster = next 700;
https://support.riotgames.com/league-of-legends/gameplay/master-grandmaster-and-challenger-the-apex-tiers),
not by an LP threshold. Their population fractions are therefore administrative caps that
shrink as the total playerbase grows, not organic percentiles. This does not change the
math (they still sit at the extreme top tail and the convex expansion produces their large
skill gaps), but whoever refreshes the snapshot should understand these two rows behave
differently from the LP-gated tiers below them. The small apex fractions are themselves a
symptom of the steep top-end skill curve: climbing into them is hard precisely because the
skill differential there is large, which is what the convex expansion encodes.

## Design

### New: `lib/utils/normalDistribution.ts`

A pure `inverseNormalCDF(p: number): number` using Acklam's approximation. Input is a
probability in `(0, 1)`; output is the corresponding z-score. Inputs are clamped just
inside `(0, 1)` to avoid infinities at the extremes.

### New: `lib/riot/rankDistribution.ts`

- The committed distribution table: for each tier, the fraction of population per division
  (apex tiers Master/Grandmaster/Challenger have a single fraction with no divisions).
- `getCumulativeFractionBelow(tier, division)`: sums the population fraction of every
  rank strictly below the given tier+division, walking from Iron IV upward in rank order
  (note: Emerald sits between Platinum and Diamond, matching live game ordering).
- `getFractionOf(tier, division)`: the fraction occupied by that exact tier+division (or
  whole apex tier).

### Rewrite: `lib/PlayerRatingCalculator.ts`

For a ranked player:

1. `cumBelow = getCumulativeFractionBelow(tier, division)`
2. `fraction = getFractionOf(tier, division)`
3. Position within the band by LP (0-100): `p = cumBelow + (LP / 100) * fraction`.
   - For apex tiers with no division, LP can exceed 100; cap the within-band position at
     just under the band's top so the percentile stays inside the band.
4. `z = inverseNormalCDF(p)`, then `mmr = expand(z)` where
   `expand(z) = RATING_BASE + RATING_SCALE * exp(EXPANSION_K * z)` (see Core idea).

`EXPANSION_K`, `RATING_BASE`, and `RATING_SCALE` are the expansion constants documented in
Core idea. The anchors are cosmetic; balancing only depends on relative spacing.

For an unranked player, the rating grows with summoner level but is clamped to a band that
sits entirely below Gold and bottoms out below Iron IV. Unranked accounts in customs are
treated as weaker than the lowest ranked player, with account level as the only available
signal of experience.

- `z_ceil = inverseNormalCDF(getCumulativeFractionBelow(GOLD, IV))` — the z-score of the
  weakest Gold player (Gold IV at 0 LP, the ~43rd percentile in the captured snapshot,
  z ≈ -0.17). The unranked curve approaches but never reaches this, so an unranked player
  is always below any Gold player.
- `z_floor = UNRANKED_Z_FLOOR` — a constant below the weakest Iron IV, so a fresh low-level
  account sits below every ranked player.
- `t = min(1 - exp(-summonerLevel / LEVEL_TAU), UNRANKED_MAX_LEVEL_PROGRESS)` — a tapering
  growth factor that rises quickly at low levels and flattens at high levels. The hard cap
  (`UNRANKED_MAX_LEVEL_PROGRESS`, e.g. 0.97) keeps `t` strictly below 1 even at extreme
  levels (the raw taper saturates to exactly 1.0 in floating point around level 5000), so
  the Gold ceiling is never reached and an unranked player always rates below Gold IV.
- `z = z_floor + t * (z_ceil - z_floor)`, then `mmr = expand(z)` — fed through the same
  convex expansion as ranked players, replacing the old separate log-level formula.

`UNRANKED_Z_FLOOR`, `LEVEL_TAU`, and `UNRANKED_MAX_LEVEL_PROGRESS` are tuned during
implementation.

### Rewrite: `lib/balanceLobby.ts` and new `lib/utils/teamPartition.ts`

`teamPartition.ts`:

1. `enumerateSplits(playerNames)`: every way to divide the lobby into two teams whose sizes
   differ by at most one. Each unordered split is generated once (anchor the first player to
   team 1 to avoid mirror duplicates). For 10 players this is 126 splits.
2. For each split, compute `gap = |team1TotalMmr - team2TotalMmr|`.
3. `bestGap = min(gap)`. Keep every split with `gap <= bestGap + BALANCE_TOLERANCE`
   (tolerance in MMR points).
4. Randomly select one of the kept splits and return it as `BalancedTeams`.

`balanceLobby.ts` becomes: compute the rating map, build the MMR totals, call the partition
search, return the chosen split. The standard-deviation branch and the snake/1:1 drafts are
removed.

### Removed

- `lib/utils/draftUtils.ts` (snake/1:1 drafts and rating sort) — superseded by
  `teamPartition.ts`.
- `lib/utils/mathUtils.ts` (mean/standard deviation) — no longer used once the SD branch
  is gone. Remove if nothing else references it.

## Testing (Vitest)

Add Vitest as a dev dependency with a `test` script. Tests in `test_GIVEN_WHEN_THEN`
format for the pure logic:

- `inverseNormalCDF` is monotonically increasing, is ~0 at p=0.5, and is symmetric about
  0.5.
- MMR spacing property (the convex-expansion behavior): the Diamond->Master gap and the
  Grandmaster->Challenger gap are each several times larger than the Bronze->Silver gap,
  and both the Diamond IV -> Diamond I span and the two-division Diamond IV -> Diamond II
  climb exceed the full Silver -> Platinum span.
- MMR is monotonic in rank: a strictly higher rank/division/LP always yields a higher MMR.
- `getCumulativeFractionBelow` returns 0 for the lowest rank and approaches 1 near the top.
- Unranked bounds: a high-level unranked player rates below the weakest Gold player, and a
  low-level unranked player rates below the weakest Iron IV player.
- Partition search only ever returns a split whose gap is within tolerance of the optimum,
  and returns equal-as-possible team sizes.

## Files touched

- New: `lib/utils/normalDistribution.ts`
- New: `lib/riot/rankDistribution.ts`
- New: `lib/utils/teamPartition.ts`
- Rewrite: `lib/PlayerRatingCalculator.ts`
- Rewrite: `lib/balanceLobby.ts`
- Remove: `lib/utils/draftUtils.ts`, `lib/utils/mathUtils.ts` (if unreferenced)
- `package.json`: add Vitest dev dependency and `test` script
- New: test files alongside the logic

## Open items

- Default values to set during implementation and tune against real lobbies:
  `EXPANSION_K` (~0.75), `RATING_BASE` (~780), `RATING_SCALE` (~171), `UNRANKED_Z_FLOOR`,
  `LEVEL_TAU`, and `BALANCE_TOLERANCE`.
