import balanceLobby, { BalancedTeams, PlayerInfo } from "@/lib/balanceLobby";
import { fetchElo } from "@/lib/riot/fetchElo";
import { DEFAULT_RANK_MODE, RankMode } from "@/lib/riot/rankMode";
import { buildLobbyFromPlayers } from "@/lib/utils/buildLobby";
import { ClientError } from "@/lib/utils/errors";
import {
  parsePlayersFromChatLog,
  validatePlayerList,
} from "@/lib/utils/playerManager";
import { NextResponse } from "next/server";

type Payload = {
  chatLog?: string;
  rankMode?: RankMode;
};

type Data = {
  status: number;
  message: string;
  teams?: BalancedTeams;
  lobby?: { [playerName: string]: PlayerInfo };
};

const BOT_SECRET_HEADER = "x-bot-secret";

function isAuthorized(request: Request): boolean {
  const expectedSecret = process.env.BOT_SHARED_SECRET;
  if (!expectedSecret) {
    return false;
  }
  return request.headers.get(BOT_SECRET_HEADER) === expectedSecret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ status: 401, message: "Unauthorized." });
  }
  try {
    const { chatLog, rankMode }: Payload = await request.json();
    const playerList = parsePlayersFromChatLog(chatLog ?? "");
    validatePlayerList(playerList);

    const players = await fetchElo(playerList, rankMode ?? DEFAULT_RANK_MODE);
    const lobby = buildLobbyFromPlayers(players);
    const teams = balanceLobby(lobby);

    const response: Data = { status: 200, message: "success", teams, lobby };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ClientError) {
      return NextResponse.json({ status: 400, message: error.message });
    }
    console.error("Error in /api/balance:", error);
    return NextResponse.json({ status: 500, message: "Internal Server Error." });
  }
}
