export type PlayerMmr = {
  name: string;
  mmr: number;
};

type Split = {
  team1: PlayerMmr[];
  team2: PlayerMmr[];
};

export type TeamNames = {
  team1: string[];
  team2: string[];
};

export function pickBalancedSplit(
  players: PlayerMmr[],
  tolerance: number
): TeamNames {
  const splits = enumerateSplits(players);
  const gaps = splits.map(ratingGap);
  const bestGap = Math.min(...gaps);
  const acceptableSplits = splits.filter(
    (_, index) => gaps[index] <= bestGap + tolerance
  );
  const chosen = acceptableSplits[randomIndex(acceptableSplits.length)];
  return {
    team1: chosen.team1.map((player) => player.name),
    team2: chosen.team2.map((player) => player.name),
  };
}

function enumerateSplits(players: PlayerMmr[]): Split[] {
  if (players.length === 0) {
    return [{ team1: [], team2: [] }];
  }
  const team1Size = Math.ceil(players.length / 2);
  const [anchor, ...rest] = players;
  return combinations(rest, team1Size - 1).map((partialTeam1) => ({
    team1: [anchor, ...partialTeam1],
    team2: rest.filter((player) => !partialTeam1.includes(player)),
  }));
}

function combinations<T>(items: T[], choose: number): T[][] {
  if (choose === 0) {
    return [[]];
  }
  if (choose > items.length) {
    return [];
  }
  const [first, ...rest] = items;
  const withFirst = combinations(rest, choose - 1).map((combo) => [
    first,
    ...combo,
  ]);
  const withoutFirst = combinations(rest, choose);
  return [...withFirst, ...withoutFirst];
}

function ratingGap(split: Split): number {
  return Math.abs(teamTotal(split.team1) - teamTotal(split.team2));
}

function teamTotal(team: PlayerMmr[]): number {
  return team.reduce((sum, player) => sum + player.mmr, 0);
}

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}
