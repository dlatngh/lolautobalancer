import {
  getPuuidByAccount,
  getRankByPuuid,
  getSummonerByPuuid,
} from "./riotApiLibrary";
import { RankMode } from "./rankMode";

export async function fetchElo(playerList: string[], rankMode: RankMode) {
  const playersData = await Promise.all(
    playerList.map(async (player) => {
      try {
        const puuid = await getPuuidByAccount(player);
        const summonerInfo = await getSummonerByPuuid(puuid);
        const league = await getRankByPuuid(puuid, rankMode);

        const summoner = {
          summonerLevel: summonerInfo.summonerLevel,
          profileIconId: summonerInfo.profileIconId,
        };

        const rankSummary = league
          ? `${league.tier} ${league.division} ${league.leaguePoints}LP`
          : "UNRANKED";
        console.log(
          `[fetchElo] ${player}: ${rankSummary}, level ${summoner.summonerLevel}`
        );

        return {
          playerName: player,
          summonerInfo: summoner,
          leagueInfo: league,
        };
      } catch (error) {
        console.error(
          "Something went wrong while communicating with Riot while fetching",
          player,
          error,
        );
        return {
          playerName: player,
          summonerInfo: null,
          leagueInfo: null,
        };
      }
    }),
  );
  return playersData;
}
