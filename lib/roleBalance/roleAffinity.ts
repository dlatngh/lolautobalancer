import { Role, ROLES } from "./roles";
import {
  AggregatedProfile,
  PerformanceMetric,
  PERFORMANCE_METRICS,
  RoleRecord,
} from "./roleProfile";

// Tunables.
export const PERFORMANCE_PSEUDO_COUNT = 4; // weighted games needed before performance leaves baseline
export const OFF_ROLE_PENALTY = 0.15; // max effective-MMR reduction on a never-played role

// Off-role affinity floor contributed by performance: a role's performance maps
// to a multiplier in [PERFORMANCE_FLOOR, 1], so poor performance never fully
// zeroes a role they actually play, and strong performance keeps it viable.
const PERFORMANCE_FLOOR = 0.6;

// How hard a full one-trick (one champion, one lane) is penalized on off-roles.
// Off-role affinity is multiplied by (1 - oneTrickFactor * ONE_TRICK_PENALTY).
const ONE_TRICK_PENALTY = 0.8;

// Extra off-role effective-MMR reduction for a full one-trick, on top of
// OFF_ROLE_PENALTY. A one-trick forced off their lane loses more MMR than a
// flexible player would.
const ONE_TRICK_MMR_PENALTY = 0.2;

// Per-role "full marks" value for each averaged metric. Normalizing by role keeps
// every metric fair across roles: a support's vision or CC and a carry's gold or
// damage each count as a full signal within their own role, rather than biasing
// affinity toward whichever roles naturally post big raw numbers. KDA is
// role-agnostic, so its reference is the same for every role.
const METRIC_REFERENCE: { [metric in PerformanceMetric]: { [role in Role]: number } } = {
  kda:                 { TOP: 4, JUNGLE: 4, MID: 4, ADC: 4, SUPPORT: 4 },
  gpm:                 { TOP: 380, JUNGLE: 360, MID: 400, ADC: 420, SUPPORT: 260 },
  killingSprees:       { TOP: 3, JUNGLE: 3, MID: 4, ADC: 4, SUPPORT: 2 },
  largestKillingSpree: { TOP: 3, JUNGLE: 3, MID: 4, ADC: 4, SUPPORT: 2 },
  totalDamage:         { TOP: 180000, JUNGLE: 190000, MID: 200000, ADC: 220000, SUPPORT: 90000 },
  visionScore:         { TOP: 22, JUNGLE: 35, MID: 24, ADC: 22, SUPPORT: 60 },
  ccTime:              { TOP: 25, JUNGLE: 30, MID: 20, ADC: 15, SUPPORT: 40 },
};

// Blend weights across every performance signal. Win rate and first bloods are
// rates; the metrics are per-role-normalized. All weights sum to 1.
const WINRATE_WEIGHT = 0.3;
const FIRST_BLOOD_KILL_WEIGHT = 0.05;
const FIRST_BLOOD_ASSIST_WEIGHT = 0.05;
const METRIC_WEIGHT: { [metric in PerformanceMetric]: number } = {
  kda: 0.15,
  gpm: 0.1,
  killingSprees: 0.05,
  largestKillingSpree: 0.05,
  totalDamage: 0.1,
  visionScore: 0.08,
  ccTime: 0.07,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// Per-role performance in [0, 1]: the weighted blend of win rate, first bloods,
// and per-role-normalized metrics, shrunk toward 0.5 on small samples.
function rolePerformance(role: Role, record: RoleRecord): number {
  const games = record.weightedGames;
  if (games === 0) {
    return 0;
  }

  const winRate = record.weightedWins / games;
  const firstBloodKillRate = record.weightedFirstBloodKills / games;
  const firstBloodAssistRate = record.weightedFirstBloodAssists / games;

  let rawPerformance =
    WINRATE_WEIGHT * winRate +
    FIRST_BLOOD_KILL_WEIGHT * firstBloodKillRate +
    FIRST_BLOOD_ASSIST_WEIGHT * firstBloodAssistRate;

  for (const metric of PERFORMANCE_METRICS) {
    const average = record.weightedMetricSums[metric] / games;
    const normalized = clamp01(average / METRIC_REFERENCE[metric][role]);
    rawPerformance += METRIC_WEIGHT[metric] * normalized;
  }

  return (
    (games * rawPerformance + PERFORMANCE_PSEUDO_COUNT * 0.5) /
    (games + PERFORMANCE_PSEUDO_COUNT)
  );
}

// How concentrated the player is on a single champion and a single lane, in
// [0, 1]. A one-champion, one-lane player approaches 1; a flexible player is
// near 0. Used to steepen the off-role drop-off for one-tricks.
function oneTrickFactor(
  gamesByRole: { [role in Role]: number },
  totalGames: number,
  championGames: { [champion: string]: number }
): number {
  if (totalGames === 0) {
    return 0;
  }
  const mostPlayedRoleGames = Math.max(...ROLES.map((role) => gamesByRole[role]));
  const championCounts = Object.values(championGames);
  const mostPlayedChampionGames = championCounts.length > 0 ? Math.max(...championCounts) : 0;

  const laneConcentration = mostPlayedRoleGames / totalGames;
  const championConcentration = mostPlayedChampionGames / totalGames;
  return clamp01(laneConcentration) * clamp01(championConcentration);
}

export function roleAffinities(profile: AggregatedProfile): { [role in Role]: number } {
  const gamesByRole = {} as { [role in Role]: number };
  for (const role of ROLES) {
    gamesByRole[role] = profile.roles[role].weightedGames;
  }
  const totalGames = ROLES.reduce((sum, role) => sum + gamesByRole[role], 0);

  const affinities = {} as { [role in Role]: number };
  if (totalGames === 0) {
    for (const role of ROLES) {
      affinities[role] = 0;
    }
    return affinities;
  }

  const primaryGames = Math.max(...ROLES.map((role) => gamesByRole[role]));
  const primaryRole = ROLES.find((role) => gamesByRole[role] === primaryGames)!;
  const oneTrickMultiplier =
    1 - ONE_TRICK_PENALTY * oneTrickFactor(gamesByRole, totalGames, profile.championGames);

  for (const role of ROLES) {
    if (gamesByRole[role] === 0) {
      affinities[role] = 0;
      continue;
    }
    if (role === primaryRole) {
      affinities[role] = 1;
      continue;
    }
    const gameShare = gamesByRole[role] / primaryGames;
    const performance = rolePerformance(role, profile.roles[role]);
    const performanceMultiplier = PERFORMANCE_FLOOR + (1 - PERFORMANCE_FLOOR) * performance;
    affinities[role] = gameShare * performanceMultiplier * oneTrickMultiplier;
  }

  return affinities;
}

// The player's one-trick factor (0 = flexible, 1 = full one-champion/one-lane),
// exposed so it can be stored on the player and feed the off-role MMR penalty.
export function playerOneTrickFactor(profile: AggregatedProfile): number {
  const gamesByRole = {} as { [role in Role]: number };
  for (const role of ROLES) {
    gamesByRole[role] = profile.roles[role].weightedGames;
  }
  const totalGames = ROLES.reduce((sum, role) => sum + gamesByRole[role], 0);
  return oneTrickFactor(gamesByRole, totalGames, profile.championGames);
}

export function effectiveMmr(
  baseMmr: number,
  affinity: number,
  oneTrickFactor: number = 0
): number {
  const penalty = OFF_ROLE_PENALTY + oneTrickFactor * ONE_TRICK_MMR_PENALTY;
  return baseMmr * (1 - penalty * (1 - affinity));
}
