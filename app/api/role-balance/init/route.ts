import { fetchElo } from "@/lib/riot/fetchElo";
import { fetchRoleProfiles } from "@/lib/riot/fetchRoleProfiles";
import { buildLobbyFromPlayers } from "@/lib/utils/buildLobby";
import { PlayerRatingCalculator } from "@/lib/PlayerRatingCalculator";
import { PlayerRoleData } from "@/lib/roleBalance/playerRoleData";
import { DEFAULT_RANK_MODE } from "@/lib/riot/rankMode";
import { NextResponse } from "next/server";

type Payload = { playerList: string[] };

type Data = {
  status: number;
  message: string;
  players?: PlayerRoleData[];
};

export async function POST(request: Request) {
  let response: Data;
  try {
    const { playerList }: Payload = await request.json();
    console.log(`[roleBalance/init] fetching ${playerList.length} player(s): ${playerList.join(", ")}`);

    const fetchedPlayers = await fetchElo(playerList, DEFAULT_RANK_MODE);
    const lobby = buildLobbyFromPlayers(fetchedPlayers);
    const profilesByName = await fetchRoleProfiles(playerList);

    const players: PlayerRoleData[] = playerList.map((name) => ({
      name,
      baseMmr: new PlayerRatingCalculator(lobby[name]).getRating(),
      playerInfo: lobby[name],
      categoryProfiles: profilesByName[name],
    }));

    response = { status: 200, message: "success", players };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[roleBalance/init] failed:", error);
    response = { status: 500, message: "Internal Server Error." };
    return NextResponse.json(response);
  }
}
