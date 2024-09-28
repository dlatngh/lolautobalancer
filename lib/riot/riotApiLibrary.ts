import { Constants, LolApi, RiotApi } from "twisted";
import { SummonerLeagueDto } from "twisted/dist/models-dto";
import { getTierValue, Tiers } from "./tier";
import { Divisions, getDivisionValue } from "./division";

const api = new RiotApi();
const lolApi = new LolApi();

type LeagueInfo = {
  tier: keyof typeof Tiers;
  division: keyof typeof Divisions;
  leaguePoints: number;
};

export async function getPuuidByAccount(playerName: string) {
  const [gameName, tagLine] = splitPlayerName(playerName);
  const resByRiotId = await api.Account.getByRiotId(
    gameName,
    tagLine,
    Constants.RegionGroups.AMERICAS
  );
  return resByRiotId.response.puuid;
}

export async function getSummonerByPuuid(puuid: string) {
  const resByPuuid = await lolApi.Summoner.getByPUUID(
    puuid,
    Constants.Regions.AMERICA_NORTH
  );
  const response = resByPuuid.response;
  const playerMap = {
    summonerLevel: response.summonerLevel,
    summonerId: response.id,
    profileIconId: response.profileIconId,
  };
  return playerMap;
}

export async function getRankBySummonerId(summonerId: string) {
  const resBySummonerId = await lolApi.League.bySummoner(
    summonerId,
    Constants.Regions.AMERICA_NORTH
  );
  if (!resBySummonerId.response || resBySummonerId.response.length === 0) {
    console.debug("Summoner is not ranked.");
    return;
  }
  const leagueList = extractLeagueInfo(resBySummonerId.response);
  if (resBySummonerId.response.length === 1) {
    console.debug("Summoner is only ranked in 1 SR mode.");
    return leagueList[0];
  }
  console.debug("Summoner has multiple ranks. Getting highest ranked league.");
  const highestLeague = getHighestLeague(leagueList);
  return highestLeague;
}

function splitPlayerName(playerName: string): [string, string] {
  const gameName = playerName.split("#")[0];
  const tagLine = playerName.split("#")[1];
  return [gameName, tagLine];
}

function extractLeagueInfo(leagues: SummonerLeagueDto[]): LeagueInfo[] {
  const extractedLeagueInfo = leagues
    .map((entry) => {
      if (!isSummonersRiftQueue(entry.queueType)) {
        return null;
      }
      const tierKey = entry.tier.toUpperCase() as keyof typeof Tiers;
      const divisionKey = entry.rank as keyof typeof Divisions;

      return {
        tier: tierKey,
        division: divisionKey,
        leaguePoints: entry.leaguePoints,
      };
    })
    .filter((info): info is LeagueInfo => info !== null);

  return extractedLeagueInfo;
}

function getHighestLeague(leagueList: LeagueInfo[]): LeagueInfo {
  return leagueList.reduce((highest, current) => {
    const currentTierValue = getTierValue(current.tier);
    const highestTierValue = getTierValue(highest.tier);

    if (currentTierValue > highestTierValue) {
      return current;
    } else if (currentTierValue === highestTierValue) {
      const currentDivisionValue = getDivisionValue(current.division);
      const highestDivisionValue = getDivisionValue(highest.division);

      if (currentDivisionValue > highestDivisionValue) {
        return current;
      } else if (currentDivisionValue === highestDivisionValue) {
        return current.leaguePoints > highest.leaguePoints ? current : highest;
      }
    }
    return highest;
  });
}

function isSummonersRiftQueue(queueType: string): boolean {
  if (
    queueType === Constants.Queues.RANKED_FLEX_SR ||
    queueType === Constants.Queues.RANKED_SOLO_5x5
  ) {
    return true;
  }
  return false;
}
