import { PlayerInfo } from "./balanceLobby";
import { Divisions, getDivisionEnum } from "./riot/division";
import { getTierEnum, Tiers } from "./riot/tier";

export class PlayerRatingCalculator {
  private tier: Tiers;
  private division: Divisions | null;
  private leaguePoints: number;
  private summonerLevel: number;

  // N is non-linearity factor
  private readonly N = 1.7;
  private readonly MAX_UNRANKED_RATING = Math.pow(Tiers.IRON, this.N) - 0.01;

  constructor(playerInfo: PlayerInfo) {
    this.tier = getTierEnum(playerInfo.tier);
    this.division = playerInfo.division
      ? getDivisionEnum(playerInfo.division)
      : null;
    this.leaguePoints = playerInfo.leaguePoints ?? 0;
    this.summonerLevel = playerInfo.summonerLevel;
  }

  public getRating(): number {
    return this.calculateFinalRating();
  }

  private calculateFinalRating(): number {
    let baseRating = 0;
    if (this.tier === Tiers.UNRANKED) {
      baseRating = this.calculateUnrankedRating();
    } else {
      baseRating = this.calculateRankedRating();
    }
    return baseRating;
  }

  private calculateRankedRating(): number {
    let rating = 0;
    rating += Math.pow(this.tier, this.N);

    if (this.division !== null) {
      rating += this.division * 0.1;
      rating += this.leaguePoints / 1000;
    } else {
      rating += this.leaguePoints / 100;
    }
    return rating;
  }

  private calculateUnrankedRating(): number {
    const maxLevel = 600;
    const levelRating = Math.log10(this.summonerLevel) / Math.log10(maxLevel);
    return levelRating * this.MAX_UNRANKED_RATING;
  }
}
