import { describe, expect, it } from "vitest";
import {
  loadFreshProfiles,
  ROLE_PROFILE_CLIENT_TTL_MS,
  saveProfiles,
  StorageLike,
} from "./profileCacheClient";
import { PlayerRoleData } from "./playerRoleData";
import { emptyCategoryProfiles } from "./roleProfile";

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

function player(name: string): PlayerRoleData {
  return {
    name,
    baseMmr: 1800,
    playerInfo: {
      tier: "GOLD",
      division: "II",
      leaguePoints: 50,
      summonerLevel: 100,
      profileIconId: 1,
    },
    categoryProfiles: emptyCategoryProfiles(),
  };
}

describe("profileCacheClient", () => {
  it("test_GIVEN_empty_storage_WHEN_loadFreshProfiles_THEN_all_names_missing", () => {
    const result = loadFreshProfiles(["a", "b"], memoryStorage(), 1000);
    expect(result.cached).toEqual([]);
    expect(result.missing).toEqual(["a", "b"]);
  });

  it("test_GIVEN_saved_fresh_profile_WHEN_loadFreshProfiles_THEN_returned_as_cached", () => {
    const storage = memoryStorage();
    saveProfiles([player("a")], storage, 1000);
    const result = loadFreshProfiles(["a", "b"], storage, 2000);
    expect(result.cached.map((p) => p.name)).toEqual(["a"]);
    expect(result.missing).toEqual(["b"]);
  });

  it("test_GIVEN_stale_profile_WHEN_loadFreshProfiles_THEN_treated_as_missing", () => {
    const storage = memoryStorage();
    saveProfiles([player("a")], storage, 1000);
    const result = loadFreshProfiles(["a"], storage, 1000 + ROLE_PROFILE_CLIENT_TTL_MS + 1);
    expect(result.cached).toEqual([]);
    expect(result.missing).toEqual(["a"]);
  });

  it("test_GIVEN_corrupt_storage_WHEN_loadFreshProfiles_THEN_treats_as_empty", () => {
    const storage = memoryStorage();
    storage.setItem("roleBalance.profiles.v3", "{not json");
    const result = loadFreshProfiles(["a"], storage, 1000);
    expect(result.missing).toEqual(["a"]);
  });
});
