import { PlayerInfo } from "./balanceLobby";
import {
  getCumulativeFractionBelow,
  getFractionOf,
} from "./riot/rankDistribution";
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
    getCumulativeFractionBelow(Tiers.GOLD, Divisions.IV),
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
    const cumulativeBelow = getCumulativeFractionBelow(
      this.tier,
      this.division,
    );
    const fractionOfRank = getFractionOf(this.tier, this.division);
    const percentile =
      cumulativeBelow + this.positionWithinRank() * fractionOfRank;
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
      this.UNRANKED_MAX_LEVEL_PROGRESS,
    );
    return (
      this.UNRANKED_Z_FLOOR +
      levelProgress * (this.UNRANKED_Z_CEIL - this.UNRANKED_Z_FLOOR)
    );
  }

  private expand(zScore: number): number {
    return (
      this.RATING_BASE + this.RATING_SCALE * Math.exp(this.EXPANSION_K * zScore)
    );
  }
}
