<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 87971fd (added confirm lobby page)
import { ClientError } from "./errors";

const JOIN_LOG = "GameName #Tag joined the lobby";
const JOINED = "joined";
const LEFT = "left";

<<<<<<< HEAD
=======
>>>>>>> 783a4b9 (refactoring)
=======
>>>>>>> 87971fd (added confirm lobby page)
export function generatePlaceholder(): string {
  let placeHolder: string = "";
  const limit = 13;
  for (let i = 0; i < limit; i++) {
<<<<<<< HEAD
<<<<<<< HEAD
    if (i != limit - 1) placeHolder += JOIN_LOG + "\n";
    else placeHolder += JOIN_LOG;
=======
    if (i != limit - 1) placeHolder += "GameName#Tag has joined the lobby\n";
    else placeHolder += "GameName#Tag has joined the lobby";
>>>>>>> 783a4b9 (refactoring)
=======
    if (i != limit - 1) placeHolder += JOIN_LOG + "\n";
    else placeHolder += JOIN_LOG;
>>>>>>> 87971fd (added confirm lobby page)
  }
  return placeHolder;
}

export const parsePlayersFromChatLog = (chatLog: string): string[] => {
  const newPlayers: string[] = [];
  const lines = chatLog.split("\n");

  lines.forEach((line) => {
<<<<<<< HEAD
<<<<<<< HEAD
    const joinMatch = extractPlayerName(line, JOINED);
    const leaveMatch = extractPlayerName(line, LEFT);
=======
    const joinMatch = extractPlayerName(line, "joined");
    const leaveMatch = extractPlayerName(line, "left");
>>>>>>> 783a4b9 (refactoring)
=======
    const joinMatch = extractPlayerName(line, JOINED);
    const leaveMatch = extractPlayerName(line, LEFT);
>>>>>>> 87971fd (added confirm lobby page)

    if (joinMatch && !newPlayers.includes(joinMatch)) {
      newPlayers.push(joinMatch);
    }

    if (leaveMatch) {
      removePlayerFromList(newPlayers, leaveMatch);
    }
  });

  return newPlayers;
};

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 87971fd (added confirm lobby page)
export function validatePlayerList(playerList: string[]) {
  if (playerList.length < 2) {
    throw new ClientError(
      `Number of players must be 2 or more. Please add more players and try again.`
    );
  }
  if (playerList.length > 10) {
    throw new ClientError(
      `Number of players must be 10 or less. Please remove extra players and try again.`
    );
  }
}

<<<<<<< HEAD
const extractPlayerName = (line: string, action: string): string | null => {
  const actionText = ` ${action} the lobby`;

  if (line.endsWith(actionText)) {
    const trimmedLine = line
      .substring(0, line.length - actionText.length)
      .trim();

    const hashIndex = trimmedLine.lastIndexOf("#");
    if (hashIndex !== -1) {
      const playerName = trimmedLine.substring(0, hashIndex).trim();
      const tag = trimmedLine.substring(hashIndex + 1).trim();

      if (playerName && tag) {
        return `${playerName}#${tag}`;
      }
    }
  }

  return null;
=======
const extractPlayerName = (line: string, action: string): string | null => {
  const match = line.match(new RegExp(`(.+?#\\w+) ${action} the lobby`));
  return match ? match[1] : null;
>>>>>>> 783a4b9 (refactoring)
=======
const extractPlayerName = (line: string, action: string): string | null => {
  const actionText = ` ${action} the lobby`;

  if (line.endsWith(actionText)) {
    const trimmedLine = line
      .substring(0, line.length - actionText.length)
      .trim();

    const hashIndex = trimmedLine.lastIndexOf("#");
    if (hashIndex !== -1) {
      const playerName = trimmedLine.substring(0, hashIndex).trim();
      const tag = trimmedLine.substring(hashIndex + 1).trim();

      if (playerName && tag) {
        return `${playerName}#${tag}`;
      }
    }
  }

  return null;
>>>>>>> 87971fd (added confirm lobby page)
};

const removePlayerFromList = (players: string[], playerName: string) => {
  const playerIndex = players.indexOf(playerName);
  if (playerIndex !== -1) {
    players.splice(playerIndex, 1);
  }
};
