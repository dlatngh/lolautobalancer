import { LolApi, RiotApi } from "twisted";

// A single shared, throttled client is used for every Riot call. twisted tracks
// the dev key's rate limit per client instance, so using separate instances lets
// each one spend the full budget independently and flood the key. One shared,
// concurrency-capped instance keeps the whole app under the limit and waits out
// 429s instead of throwing them.
const RIOT_CONFIG = {
  rateLimitRetry: true,
  rateLimitRetryAttempts: 10,
  concurrency: 10,
  debug: {
    // Log when twisted is waiting out a 429 so a slow fetch is visibly the rate
    // limit rather than a hang.
    logRatelimits: true,
  },
};

export const lolApi = new LolApi(RIOT_CONFIG);
export const riotApi = new RiotApi(RIOT_CONFIG);
