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

export function getTierEnum(tier: string): Tiers {
  switch (tier.toUpperCase()) {
    case "CHALLENGER":
      return Tiers.CHALLENGER;
    case "GRANDMASTER":
      return Tiers.GRANDMASTER;
    case "MASTER":
      return Tiers.MASTER;
    case "DIAMOND":
      return Tiers.DIAMOND;
    case "EMERALD":
      return Tiers.EMERALD;
    case "PLATINUM":
      return Tiers.PLATINUM;
    case "GOLD":
      return Tiers.GOLD;
    case "SILVER":
      return Tiers.SILVER;
    case "BRONZE":
      return Tiers.BRONZE;
    case "IRON":
      return Tiers.IRON;
    default:
      return Tiers.UNRANKED;
  }
}