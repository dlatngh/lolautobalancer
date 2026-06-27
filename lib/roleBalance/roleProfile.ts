import { Role, ROLES } from "./roles";
import { QueueCategory, QUEUE_CATEGORIES, QUEUE_WEIGHTS } from "./queueWeights";

// Averaged per-match performance stats. Each is normalized per role in
// roleAffinity, so adding a metric here only means giving it a reference and a
// weight there.
export type PerformanceMetric =
  | "kda"
  | "gpm"
  | "killingSprees"
  | "largestKillingSpree"
  | "totalDamage"
  | "visionScore"
  | "ccTime";

export const PERFORMANCE_METRICS: PerformanceMetric[] = [
  "kda",
  "gpm",
  "killingSprees",
  "largestKillingSpree",
  "totalDamage",
  "visionScore",
  "ccTime",
];

export type MetricValues = { [metric in PerformanceMetric]: number };

export type MatchSample = {
  role: Role;
  queue: QueueCategory;
  champion: string;
  win: boolean;
  firstBloodKill: boolean;
  firstBloodAssist: boolean;
  metrics: MetricValues;
};

function zeroMetrics(): MetricValues {
  const values = {} as MetricValues;
  for (const metric of PERFORMANCE_METRICS) {
    values[metric] = 0;
  }
  return values;
}

// Raw, unweighted per-role tallies for one queue category.
export type RawRoleRecord = {
  games: number;
  wins: number;
  firstBloodKills: number;
  firstBloodAssists: number;
  metricSums: MetricValues;
};

// Queue-weighted per-role tallies, summed across the selected categories.
export type RoleRecord = {
  weightedGames: number;
  weightedWins: number;
  weightedFirstBloodKills: number;
  weightedFirstBloodAssists: number;
  weightedMetricSums: MetricValues;
};

export type RoleProfile = { [role in Role]: RoleRecord };

export type ChampionGames = { [champion: string]: number };

// Per category we keep both the per-role tallies and a champion-games tally
// (used to measure one-trick concentration). Kept separate per category so the
// queue selection can be applied later without refetching.
export type CategoryProfile = {
  roles: { [role in Role]: RawRoleRecord };
  championGames: ChampionGames;
};

export type CategoryProfiles = { [category in QueueCategory]: CategoryProfile };

// The selected categories collapsed into one weighted profile.
export type AggregatedProfile = {
  roles: RoleProfile;
  championGames: ChampionGames;
};

export function emptyRoleProfile(): RoleProfile {
  const profile = {} as RoleProfile;
  for (const role of ROLES) {
    profile[role] = {
      weightedGames: 0,
      weightedWins: 0,
      weightedFirstBloodKills: 0,
      weightedFirstBloodAssists: 0,
      weightedMetricSums: zeroMetrics(),
    };
  }
  return profile;
}

export function emptyCategoryProfiles(): CategoryProfiles {
  const profiles = {} as CategoryProfiles;
  for (const category of QUEUE_CATEGORIES) {
    const roles = {} as { [role in Role]: RawRoleRecord };
    for (const role of ROLES) {
      roles[role] = {
        games: 0,
        wins: 0,
        firstBloodKills: 0,
        firstBloodAssists: 0,
        metricSums: zeroMetrics(),
      };
    }
    profiles[category] = { roles, championGames: {} };
  }
  return profiles;
}

export function buildCategoryProfiles(samples: MatchSample[]): CategoryProfiles {
  const profiles = emptyCategoryProfiles();
  for (const sample of samples) {
    const categoryProfile = profiles[sample.queue];
    const record = categoryProfile.roles[sample.role];
    record.games += 1;
    record.wins += sample.win ? 1 : 0;
    record.firstBloodKills += sample.firstBloodKill ? 1 : 0;
    record.firstBloodAssists += sample.firstBloodAssist ? 1 : 0;
    for (const metric of PERFORMANCE_METRICS) {
      record.metricSums[metric] += sample.metrics[metric];
    }
    categoryProfile.championGames[sample.champion] =
      (categoryProfile.championGames[sample.champion] ?? 0) + 1;
  }
  return profiles;
}

// Collapse the selected categories into one weighted profile, applying each
// category's queue weight. Unselected categories contribute nothing.
export function aggregateSelectedProfiles(
  categoryProfiles: CategoryProfiles,
  selectedCategories: QueueCategory[]
): AggregatedProfile {
  const roles = emptyRoleProfile();
  const championGames: ChampionGames = {};

  for (const category of selectedCategories) {
    const weight = QUEUE_WEIGHTS[category];
    const categoryProfile = categoryProfiles[category];

    for (const role of ROLES) {
      const raw = categoryProfile.roles[role];
      const aggregate = roles[role];
      aggregate.weightedGames += weight * raw.games;
      aggregate.weightedWins += weight * raw.wins;
      aggregate.weightedFirstBloodKills += weight * raw.firstBloodKills;
      aggregate.weightedFirstBloodAssists += weight * raw.firstBloodAssists;
      for (const metric of PERFORMANCE_METRICS) {
        aggregate.weightedMetricSums[metric] += weight * raw.metricSums[metric];
      }
    }

    for (const [champion, games] of Object.entries(categoryProfile.championGames)) {
      championGames[champion] = (championGames[champion] ?? 0) + weight * games;
    }
  }

  return { roles, championGames };
}

export function buildRoleProfile(samples: MatchSample[]): AggregatedProfile {
  return aggregateSelectedProfiles(buildCategoryProfiles(samples), QUEUE_CATEGORIES);
}
