export enum Tiers {
  CHALLENGER = 10,
  GRANDMASTER = 9,
  MASTER = 8,
  DIAMOND = 7,
  EMERALD = 6,
  PLATINUM = 5,
  GOLD = 4,
  SILVER = 3,
  BRONZE = 2,
  IRON = 1,
  UNRANKED = 0,
}

export function getTierValue(tier: keyof typeof Tiers): number {
  return Tiers[tier];
}
