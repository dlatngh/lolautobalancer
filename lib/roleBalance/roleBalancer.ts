import { Role, ROLES } from "./roles";
import { effectiveMmr } from "./roleAffinity";

export type RolePlayer = {
  name: string;
  baseMmr: number;
  affinities: { [role in Role]: number };
  oneTrickFactor: number;
};

export type RoleAssignment = {
  name: string;
  role: Role;
  baseMmr: number;
  effectiveMmr: number;
  affinity: number;
  oneTrickFactor: number;
};

export type RoleBalancedTeams = {
  team1: RoleAssignment[];
  team2: RoleAssignment[];
};

const TEAM_SIZE = 5;
const LOBBY_SIZE = 10;

// Tunables for the combined balance objective. The score blends normalized
// (0..1) costs: overall team-MMR balance, even expected lane wins, the worst
// single lane mismatch, and role comfort. Lower is better.
const LANE_SCALE = 400; // effective-MMR gap giving ~73% lane win probability
const GAP_REFERENCE = 1500; // total-MMR gap that maps to the maximum imbalance
const WEIGHT_TOTAL = 1.0;
const WEIGHT_WINS = 0.5;
const WEIGHT_STOMP = 0.5;
// Comfort: strongly prefer lower-MMR players on their main role and let higher-MMR
// players take the off-roles. Weighted on par with team balance so it is a strong
// (but still tradeable) priority.
const WEIGHT_COMFORT = 1.0;
// Even the strongest player's off-role carries this minimum comfort cost, so the
// balancer prefers keeping everyone on their main role unless off-roling actually
// improves balance (e.g. a wide-MMR lobby), rather than off-roling gratuitously.
const MIN_OFFROLE_WEIGHT = 0.15;
const SCORE_TOLERANCE = 0.05; // normalized-score slack kept for re-roll variety

// Probability the first player wins their lane given the effective-MMR gap,
// using a logistic (Elo-style) curve.
export function laneWinProbability(effectiveDiff: number): number {
  return 1 / (1 + Math.exp(-effectiveDiff / LANE_SCALE));
}

// Combined lane/balance cost for one full assignment. team1Lane[k] / team2Lane[k]
// are the effective MMRs of the two players who play ROLES[k] against each other.
export function assignmentScore(team1Lane: number[], team2Lane: number[]): number {
  const laneCount = team1Lane.length;
  let team1Total = 0;
  let team2Total = 0;
  let expectedTeam1Wins = 0;
  let worstStomp = 0;

  for (let lane = 0; lane < laneCount; lane++) {
    team1Total += team1Lane[lane];
    team2Total += team2Lane[lane];
    const winProbability = laneWinProbability(team1Lane[lane] - team2Lane[lane]);
    expectedTeam1Wins += winProbability;
    worstStomp = Math.max(worstStomp, Math.abs(winProbability - 0.5));
  }

  const evenWins = laneCount / 2;
  const totalImbalance = Math.min(Math.abs(team1Total - team2Total) / GAP_REFERENCE, 1);
  const winsImbalance = Math.abs(expectedTeam1Wins - evenWins) / evenWins;
  const stompImbalance = worstStomp / 0.5;

  return (
    WEIGHT_TOTAL * totalImbalance +
    WEIGHT_WINS * winsImbalance +
    WEIGHT_STOMP * stompImbalance
  );
}

// One ordering of a team's five players, where the player at index k plays
// ROLES[k]. Precomputed once per team subset and reused across splits.
type TeamOrdering = {
  players: RolePlayer[];
  laneEffective: number[];
  // Sum over this team's players of offRole * weakWeight: high when low-MMR
  // players are pushed off their main role.
  comfortCost: number;
};

type Split = {
  team1Orderings: TeamOrdering[];
  team2Orderings: TeamOrdering[];
};

export function balanceByRole(
  players: RolePlayer[],
  tolerance: number = SCORE_TOLERANCE
): RoleBalancedTeams {
  if (players.length !== LOBBY_SIZE) {
    throw new Error(`Role balance requires exactly ${LOBBY_SIZE} players.`);
  }

  const weakWeightByName = computeWeakWeights(players);
  const totalWeakWeight = players.reduce(
    (sum, player) => sum + weakWeightByName[player.name],
    0
  );

  const splits = enumerateSplits(players, weakWeightByName);
  const bestScore = findBestScore(splits, totalWeakWeight);
  return selectRandomAcceptable(splits, totalWeakWeight, bestScore + tolerance);
}

// Weakest player -> 1, strongest -> 0, so off-roling a weak player costs more.
function computeWeakWeights(players: RolePlayer[]): { [name: string]: number } {
  const baseMmrs = players.map((player) => player.baseMmr);
  const minMmr = Math.min(...baseMmrs);
  const maxMmr = Math.max(...baseMmrs);
  const range = maxMmr - minMmr;

  const weakWeights: { [name: string]: number } = {};
  for (const player of players) {
    const normalizedMmr = range > 0 ? (player.baseMmr - minMmr) / range : 0;
    weakWeights[player.name] =
      MIN_OFFROLE_WEIGHT + (1 - MIN_OFFROLE_WEIGHT) * (1 - normalizedMmr);
  }
  return weakWeights;
}

function enumerateSplits(
  players: RolePlayer[],
  weakWeightByName: { [name: string]: number }
): Split[] {
  const [anchor, ...rest] = players;
  const team1Partials = combinations(rest, TEAM_SIZE - 1);
  const orderingsBySubsetKey = new Map<string, TeamOrdering[]>();

  const orderingsFor = (subset: RolePlayer[]): TeamOrdering[] => {
    const key = subset.map((player) => player.name).join("|");
    const cached = orderingsBySubsetKey.get(key);
    if (cached) {
      return cached;
    }
    const computed = computeOrderings(subset, weakWeightByName);
    orderingsBySubsetKey.set(key, computed);
    return computed;
  };

  const splits: Split[] = [];
  for (const partial of team1Partials) {
    const team1Players = [anchor, ...partial];
    const team2Players = rest.filter((player) => !partial.includes(player));
    splits.push({
      team1Orderings: orderingsFor(team1Players),
      team2Orderings: orderingsFor(team2Players),
    });
  }
  return splits;
}

function computeOrderings(
  subset: RolePlayer[],
  weakWeightByName: { [name: string]: number }
): TeamOrdering[] {
  return permutations(subset).map((players) => {
    const laneEffective: number[] = [];
    let comfortCost = 0;
    for (let lane = 0; lane < players.length; lane++) {
      const player = players[lane];
      const affinity = player.affinities[ROLES[lane]];
      laneEffective.push(effectiveMmr(player.baseMmr, affinity, player.oneTrickFactor));
      comfortCost += (1 - affinity) * weakWeightByName[player.name];
    }
    return { players, laneEffective, comfortCost };
  });
}

function combinedScore(
  team1: TeamOrdering,
  team2: TeamOrdering,
  totalWeakWeight: number
): number {
  const laneScore = assignmentScore(team1.laneEffective, team2.laneEffective);
  const comfort =
    totalWeakWeight > 0 ? (team1.comfortCost + team2.comfortCost) / totalWeakWeight : 0;
  return laneScore + WEIGHT_COMFORT * comfort;
}

function findBestScore(splits: Split[], totalWeakWeight: number): number {
  let bestScore = Infinity;
  for (const split of splits) {
    for (const team1Ordering of split.team1Orderings) {
      for (const team2Ordering of split.team2Orderings) {
        const score = combinedScore(team1Ordering, team2Ordering, totalWeakWeight);
        if (score < bestScore) {
          bestScore = score;
        }
      }
    }
  }
  return bestScore;
}

function selectRandomAcceptable(
  splits: Split[],
  totalWeakWeight: number,
  threshold: number
): RoleBalancedTeams {
  const acceptable: { team1: TeamOrdering; team2: TeamOrdering }[] = [];
  for (const split of splits) {
    for (const team1Ordering of split.team1Orderings) {
      for (const team2Ordering of split.team2Orderings) {
        if (combinedScore(team1Ordering, team2Ordering, totalWeakWeight) <= threshold) {
          acceptable.push({ team1: team1Ordering, team2: team2Ordering });
        }
      }
    }
  }

  const chosen = acceptable[Math.floor(Math.random() * acceptable.length)];
  return {
    team1: toAssignments(chosen.team1.players),
    team2: toAssignments(chosen.team2.players),
  };
}

function toAssignments(orderedPlayers: RolePlayer[]): RoleAssignment[] {
  return orderedPlayers.map((player, lane) => {
    const role = ROLES[lane];
    const affinity = player.affinities[role];
    return {
      name: player.name,
      role,
      baseMmr: player.baseMmr,
      effectiveMmr: effectiveMmr(player.baseMmr, affinity, player.oneTrickFactor),
      affinity,
      oneTrickFactor: player.oneTrickFactor,
    };
  });
}

function combinations<T>(items: T[], choose: number): T[][] {
  if (choose === 0) {
    return [[]];
  }
  if (choose > items.length) {
    return [];
  }
  const [first, ...rest] = items;
  const withFirst = combinations(rest, choose - 1).map((combo) => [first, ...combo]);
  const withoutFirst = combinations(rest, choose);
  return [...withFirst, ...withoutFirst];
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) {
    return [items];
  }
  const result: T[][] = [];
  for (let index = 0; index < items.length; index++) {
    const rest = [...items.slice(0, index), ...items.slice(index + 1)];
    for (const permutation of permutations(rest)) {
      result.push([items[index], ...permutation]);
    }
  }
  return result;
}
