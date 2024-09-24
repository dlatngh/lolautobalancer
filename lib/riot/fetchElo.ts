import {
  getPuuidByAccount,
  getRankBySummonerId,
  getSummonerByPuuid,
} from "./riotApiLibrary";

export async function fetchElo(playerList: string[]) {
<<<<<<< HEAD
  const playersData = await Promise.all(
=======
  let playersData = await Promise.all(
>>>>>>> 87971fd (added confirm lobby page)
    playerList.map(async (player) => {
      try {
        const puuid = await getPuuidByAccount(player);
        const summonerInfo = await getSummonerByPuuid(puuid);
        const league = await getRankBySummonerId(summonerInfo.summonerId);
        
        const summoner = {
          summonerLevel: summonerInfo.summonerLevel,
          profileIconId: summonerInfo.profileIconId,
        };

        return {
          playerName: player,
          summonerInfo: summoner,
          leagueInfo: league,
        };
      } catch (error) {
        console.error(
          "Something went wrong while communicating with Riot while fetching",
          player
        );
        return {
          playerName: player,
          summonerInfo: null,
          leagueInfo: null,
        };
      }
    })
  );
  console.log(playersData);
  return playersData;
}
