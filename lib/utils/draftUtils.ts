import { PlayerInfo } from "../balanceLobby";

export function sortPlayersByRating(playerRatingMap: {
  [player: string]: number;
}): string[] {
  return Object.entries(playerRatingMap)
    .sort(([, ratingA], [, ratingB]) => ratingB - ratingA)
    .map(([playerName]) => playerName);
}

export function snakeDraft(
  sortedPlayers: string[],
  lobby: { [playerName: string]: PlayerInfo }
) {
  console.log("Snake drafting...");
  const team1: { [playerName: string]: PlayerInfo }[] = [];
  const team2: { [playerName: string]: PlayerInfo }[] = [];

  let isTeam1Turn = true;
  let pickCount = 1;
  let i = 0;

  while (i < sortedPlayers.length) {
    if (isTeam1Turn) {
      for (let j = 0; j < pickCount && i < sortedPlayers.length; j++) {
        const playerName = sortedPlayers[i];
        team1.push({ [playerName]: lobby[playerName] });
        i++;
      }
    } else {
      for (let j = 0; j < pickCount && i < sortedPlayers.length; j++) {
        const playerName = sortedPlayers[i];
        team2.push({ [playerName]: lobby[playerName] });
        i++;
      }
    }
    isTeam1Turn = !isTeam1Turn;
    pickCount = 2;
  }
  return { team1, team2 };
}

export function oneByOneDraft(
  sortedPlayers: string[],
  lobby: { [playerName: string]: PlayerInfo }
) {
  console.log("1:1 drafting...");

  const team1: { [playerName: string]: PlayerInfo }[] = [];
  const team2: { [playerName: string]: PlayerInfo }[] = [];

  sortedPlayers.forEach((playerName, index) => {
    const playerInfo = lobby[playerName];
    const team = index % 2 === 0 ? team1 : team2;
    team.push({
      [playerName]: playerInfo,
    });
  });

  return { team1, team2 };
}
