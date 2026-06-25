import { PlayerRatingCalculator } from "./PlayerRatingCalculator";
import { PlayerMmr, pickBalancedSplit, TeamNames } from "./utils/teamPartition";

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
  logPlayerRatings(playersWithMmr);

  const split = pickBalancedSplit(playersWithMmr, BALANCE_TOLERANCE);
  logTeamBalance(split, playersWithMmr);

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

function logPlayerRatings(players: PlayerMmr[]): void {
  const ratings = players.map(
    (player) => `${player.name}=${Math.round(player.mmr)}`
  );
  console.log("[balance] player MMR:", ratings.join(", "));
}

function logTeamBalance(split: TeamNames, players: PlayerMmr[]): void {
  const mmrByName = new Map(players.map((player) => [player.name, player.mmr]));
  const totalOf = (names: string[]) =>
    names.reduce((sum, name) => sum + (mmrByName.get(name) ?? 0), 0);

  const team1Total = Math.round(totalOf(split.team1));
  const team2Total = Math.round(totalOf(split.team2));
  console.log(
    `[balance] team1=${team1Total} team2=${team2Total} gap=${Math.abs(
      team1Total - team2Total
    )}`
  );
}
