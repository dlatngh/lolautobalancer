export function generatePlaceholder(): string {
  let placeHolder: string = "";
  const limit = 13;
  for (let i = 0; i < limit; i++) {
    if (i != limit - 1) placeHolder += "GameName#Tag has joined the lobby\n";
    else placeHolder += "GameName#Tag has joined the lobby";
  }
  return placeHolder;
}

export const parsePlayersFromChatLog = (chatLog: string): string[] => {
  const newPlayers: string[] = [];
  const lines = chatLog.split("\n");

  lines.forEach((line) => {
    const joinMatch = extractPlayerName(line, "joined");
    const leaveMatch = extractPlayerName(line, "left");

    if (joinMatch && !newPlayers.includes(joinMatch)) {
      newPlayers.push(joinMatch);
    }

    if (leaveMatch) {
      removePlayerFromList(newPlayers, leaveMatch);
    }
  });

  return newPlayers;
};

const extractPlayerName = (line: string, action: string): string | null => {
  const match = line.match(new RegExp(`(.+?#\\w+) ${action} the lobby`));
  return match ? match[1] : null;
};

const removePlayerFromList = (players: string[], playerName: string) => {
  const playerIndex = players.indexOf(playerName);
  if (playerIndex !== -1) {
    players.splice(playerIndex, 1);
  }
};
