import { PlayerRatingCalculator } from "./PlayerRatingCalculator";
import {
  snakeDraft,
  oneByOneDraft,
  sortPlayersByRating,
} from "./utils/draftUtils";
import { calculateMean, calculateStandardDeviation } from "./utils/mathUtils";

export type PlayerInfo = {
  tier: string;
  division: string | null;
  leaguePoints: number | null;
  summonerLevel: number;
  profileIconId?: number;
};

type Lobby = {
  [playerName: string]: PlayerInfo;
};

export type BalancedTeams = {
  team1: { [playerName: string]: PlayerInfo }[];
  team2: { [playerName: string]: PlayerInfo }[];
};

const THRESHOLD = 10;

export default function balanceLobby(lobby: Lobby): BalancedTeams {
  const playerRatingMap = calculatePlayerRatings(lobby);
  const ratings = Object.values(playerRatingMap);

  const mean = calculateMean(ratings);
  const sd = calculateStandardDeviation(ratings, mean);

  const sortedPlayers = sortPlayersByRating(playerRatingMap);

  const teams =
    sd > THRESHOLD
      ? snakeDraft(sortedPlayers, lobby)
      : oneByOneDraft(sortedPlayers, lobby);

  return teams;
}

function calculatePlayerRatings(lobby: Lobby): { [player: string]: number } {
  return Object.keys(lobby).reduce((ratingMap, player) => {
    const playerInfo = lobby[player];
    const playerRatingCalculator = new PlayerRatingCalculator(playerInfo);
    ratingMap[player] = playerRatingCalculator.getRating();
    return ratingMap;
  }, {} as { [player: string]: number });
}
