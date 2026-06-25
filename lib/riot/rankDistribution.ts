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
