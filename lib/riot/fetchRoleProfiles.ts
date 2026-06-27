import { Constants } from "twisted";
import { lolApi } from "./riotClient";
import { getPuuidByAccount } from "./riotApiLibrary";
import { ROLES, roleFromPosition } from "../roleBalance/roles";
import {
  queueCategory,
  QUEUE_CATEGORIES,
  TRACKED_QUEUE_IDS,
} from "../roleBalance/queueWeights";
import {
  buildCategoryProfiles,
  CategoryProfiles,
  MatchSample,
} from "../roleBalance/roleProfile";

type MatchParticipant = {
  puuid: string;
  teamPosition: string;
  championName: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  goldEarned: number;
  killingSprees: number;
  largestKillingSpree: number;
  totalDamageDealt: number;
  visionScore: number;
  timeCCingOthers: number;
  firstBloodKill: boolean;
  firstBloodAssist: boolean;
};

type MatchInfo = {
  info: {
    queueId: number;
    gameDuration: number;
    participants: MatchParticipant[];
  };
};

export type RoleProfileDeps = {
  getPuuid: (playerName: string) => Promise<string>;
  listMatchIds: (puuid: string, queueId: number) => Promise<string[]>;
  getMatch: (matchId: string) => Promise<MatchInfo>;
  now: () => number;
  cacheTtlMs: number;
};

// How many recent matches to pull per tracked queue. Listing per queue (rather
// than one combined recent list) guarantees each queue category has its own
// samples, so the queue selection meaningfully changes the result instead of an
// infrequently-played queue showing up empty.
const PER_QUEUE_LOOKBACK = 10;
const ROLE_PROFILE_TTL_MS = 6 * 60 * 60 * 100000;

const defaultDeps: RoleProfileDeps = {
  getPuuid: getPuuidByAccount,
  listMatchIds: async (puuid, queueId) => {
    const response = await lolApi.MatchV5.list(
      puuid,
      Constants.RegionGroups.AMERICAS,
      { queue: queueId, count: PER_QUEUE_LOOKBACK }
    );
    return response.response;
  },
  getMatch: async (matchId) => {
    const response = await lolApi.MatchV5.get(
      matchId,
      Constants.RegionGroups.AMERICAS
    );
    return response.response as MatchInfo;
  },
  now: () => Date.now(),
  cacheTtlMs: ROLE_PROFILE_TTL_MS,
};

type CacheEntry = { profile: CategoryProfiles; fetchedAt: number };

// Keyed by deps instance so that each injected deps object (e.g. in tests) has
// its own isolated cache, while production callers sharing the defaultDeps object
// share a single long-lived cache.
const cacheByDeps = new WeakMap<RoleProfileDeps, Map<string, CacheEntry>>();

function getCacheFor(deps: RoleProfileDeps): Map<string, CacheEntry> {
  if (!cacheByDeps.has(deps)) {
    cacheByDeps.set(deps, new Map());
  }
  return cacheByDeps.get(deps)!;
}

export async function fetchRoleProfiles(
  playerNames: string[],
  deps: RoleProfileDeps = defaultDeps
): Promise<{ [playerName: string]: CategoryProfiles }> {
  const profilesByName: { [playerName: string]: CategoryProfiles } = {};

  await Promise.all(
    playerNames.map(async (playerName) => {
      const puuid = await deps.getPuuid(playerName);
      profilesByName[playerName] = await profileForPuuid(playerName, puuid, deps);
    })
  );

  return profilesByName;
}

async function profileForPuuid(
  playerName: string,
  puuid: string,
  deps: RoleProfileDeps
): Promise<CategoryProfiles> {
  const cache = getCacheFor(deps);
  const cached = cache.get(puuid);
  if (cached && deps.now() - cached.fetchedAt < deps.cacheTtlMs) {
    console.log(`[roleProfiles] ${playerName}: cache hit`);
    return cached.profile;
  }

  const samples = await collectSamples(puuid, deps);
  const profile = buildCategoryProfiles(samples);
  cache.set(puuid, { profile, fetchedAt: deps.now() });
  console.log(`[roleProfiles] ${playerName}: ${summarizeProfile(profile)}`);
  return profile;
}

async function collectSamples(
  puuid: string,
  deps: RoleProfileDeps
): Promise<MatchSample[]> {
  const samples: MatchSample[] = [];

  for (const queueId of TRACKED_QUEUE_IDS) {
    const category = queueCategory(queueId);
    if (!category) {
      continue;
    }
    const matchIds = await deps.listMatchIds(puuid, queueId);
    for (const matchId of matchIds) {
      const match = await deps.getMatch(matchId);
      const sample = toSample(match, puuid, category);
      if (sample) {
        samples.push(sample);
      }
    }
  }

  return samples;
}

function summarizeProfile(profile: CategoryProfiles): string {
  return QUEUE_CATEGORIES.map((category) => {
    const games = ROLES.reduce(
      (sum, role) => sum + profile[category].roles[role].games,
      0
    );
    return `${category}=${games}`;
  }).join(" ");
}

function toSample(
  match: MatchInfo,
  puuid: string,
  category: MatchSample["queue"]
): MatchSample | null {
  const participant = match.info.participants.find((p) => p.puuid === puuid);
  if (!participant) {
    return null;
  }
  const role = roleFromPosition(participant.teamPosition);
  if (!role) {
    return null;
  }
  const minutes = Math.max(1, match.info.gameDuration) / 60;
  return {
    role,
    queue: category,
    champion: participant.championName,
    win: participant.win,
    firstBloodKill: participant.firstBloodKill,
    firstBloodAssist: participant.firstBloodAssist,
    metrics: {
      kda: (participant.kills + participant.assists) / Math.max(1, participant.deaths),
      gpm: participant.goldEarned / minutes,
      killingSprees: participant.killingSprees,
      largestKillingSpree: participant.largestKillingSpree,
      totalDamage: participant.totalDamageDealt,
      visionScore: participant.visionScore,
      ccTime: participant.timeCCingOthers,
    },
  };
}
