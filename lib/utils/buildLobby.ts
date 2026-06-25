import { PlayerInfo } from "../balanceLobby";
import { fetchElo } from "../riot/fetchElo";

type FetchedPlayers = Awaited<ReturnType<typeof fetchElo>>;

type Lobby = { [playerName: string]: PlayerInfo };

// Turns the raw player data returned by fetchElo into the lobby shape that
// balanceLobby consumes. Unranked or failed lookups fall back to empty rank
// fields, which the rating calculator treats as UNRANKED.
export function buildLobbyFromPlayers(players: FetchedPlayers): Lobby {
  const lobby: Lobby = {};
  for (const player of players) {
    lobby[player.playerName] = {
      tier: player.leagueInfo?.tier || "",
      division: player.leagueInfo?.division || "",
      leaguePoints: player.leagueInfo?.leaguePoints ?? 0,
      summonerLevel: player.summonerInfo?.summonerLevel ?? 0,
      profileIconId: player.summonerInfo?.profileIconId ?? 0,
    };
  }
  return lobby;
}
