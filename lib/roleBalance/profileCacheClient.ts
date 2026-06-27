import { PlayerRoleData } from "./playerRoleData";

// Tunable: how long a browser-cached profile stays usable before a refetch.
export const ROLE_PROFILE_CLIENT_TTL_MS = 24 * 60 * 60 * 1000;

// The cached profile is the selection-independent PlayerRoleData (raw per-queue
// history), so changing the queue selection never invalidates the cache. The
// version suffix is bumped whenever the cached shape or its fetch semantics
// change; v5 added per-match champion + expanded performance stats to the
// cached profile, so older entries are discarded.
const STORAGE_KEY = "roleBalance.profiles.v5";

// The subset of the Web Storage API this helper needs. Injected so the helper
// is SSR-safe and unit-testable with an in-memory fake.
export type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type CacheEntry = { data: PlayerRoleData; fetchedAt: number };
type CacheMap = { [playerName: string]: CacheEntry };

export type CacheLookup = {
  cached: PlayerRoleData[];
  missing: string[];
};

function readCacheMap(storage: StorageLike): CacheMap {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as CacheMap;
  } catch {
    return {};
  }
}

export function loadFreshProfiles(
  playerNames: string[],
  storage: StorageLike,
  now: number
): CacheLookup {
  const cacheMap = readCacheMap(storage);
  const cached: PlayerRoleData[] = [];
  const missing: string[] = [];

  for (const name of playerNames) {
    const entry = cacheMap[name];
    const isFresh = entry && now - entry.fetchedAt < ROLE_PROFILE_CLIENT_TTL_MS;
    if (isFresh) {
      cached.push(entry.data);
    } else {
      missing.push(name);
    }
  }

  return { cached, missing };
}

export function saveProfiles(
  players: PlayerRoleData[],
  storage: StorageLike,
  now: number
): void {
  const cacheMap = readCacheMap(storage);
  for (const player of players) {
    cacheMap[player.name] = { data: player, fetchedAt: now };
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(cacheMap));
}
