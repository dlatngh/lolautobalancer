import { Constants, LolApi, RiotApi } from "twisted";
import { getTierValue, Tiers } from "./tier";
import { Divisions, getDivisionValue } from "./division";
import { RankMode } from "./rankMode";

const api = new RiotApi();
const lolApi = new LolApi();

type LeagueInfo = {
  tier: keyof typeof Tiers;
  division: keyof typeof Divisions;
  leaguePoints: number;
};

// The fields we read off each ranked league entry returned by Riot. Declared
// locally so we do not depend on the twisted package's internal DTO exports.
type RankedLeagueEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
};

export async function getPuuidByAccount(playerName: string) {
  const [gameName, tagLine] = parsePlayerName(playerName);
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
    profileIconId: response.profileIconId,
  };
  return playerMap;
}

// Riot removed the encrypted summoner id from the Summoner-V4 by-puuid response,
// so ranked data is fetched from the League-V4 by-puuid endpoint directly.
export async function getRankByPuuid(puuid: string, rankMode: RankMode) {
  const resByPuuid = await lolApi.League.byPUUID(
    puuid,
    Constants.Regions.AMERICA_NORTH
  );
  if (!resByPuuid.response || resByPuuid.response.length === 0) {
    console.debug("Summoner is not ranked.");
    return;
  }
  const eligibleLeagues = extractLeagueInfo(resByPuuid.response, rankMode);
  if (eligibleLeagues.length === 0) {
    console.debug("Summoner has no rank for the selected mode.");
    return;
  }
  if (eligibleLeagues.length === 1) {
    return eligibleLeagues[0];
  }
  console.debug("Summoner has multiple eligible ranks. Getting the highest.");
  return getHighestLeague(eligibleLeagues);
}

function parsePlayerName(playerName: string): [string, string] {
  playerName = cleanPlayerName(playerName);
  const gameName = playerName.split("#")[0];
  const tagLine = playerName.split("#")[1];
  return [gameName, tagLine];
}

function cleanPlayerName(playerName: string): string {
  return playerName
    .split("")
    .filter((char) => {
      const charCode = char.charCodeAt(0);
      return charCode !== 0x2066 && charCode !== 0x2069;
    })
    .join("");
}

function extractLeagueInfo(
  leagues: RankedLeagueEntry[],
  rankMode: RankMode
): LeagueInfo[] {
  const extractedLeagueInfo = leagues
    .map((entry) => {
      if (!isEligibleQueue(entry.queueType, rankMode)) {
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

function isEligibleQueue(queueType: string, rankMode: RankMode): boolean {
  if (queueType === Constants.Queues.RANKED_SOLO_5x5) {
    return true;
  }
  if (rankMode === "HIGHEST" && queueType === Constants.Queues.RANKED_FLEX_SR) {
    return true;
  }
  return false;
}
