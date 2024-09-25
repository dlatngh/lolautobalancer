import { fetchElo } from "@/lib/riot/fetchElo";
import { NextResponse } from "next/server";
type SummonerInfo = {
  summonerLevel: number;
  profileIconId: number;
} | null;

type LeagueInfo = {
  tier: string;
  division: string;
  leaguePoints: number;
} | null;

type Player = {
  playerName: string;
  summonerInfo: SummonerInfo;
  leagueInfo?: LeagueInfo;
};

type Data = {
  status: number;
  message: string;
  lobby?: Player[];
};

type Payload = {
  [key: string]: string[];
};

export async function POST(request: Request) {
  let playerList: string[];
  let response: Data;
  try {
    const res: Payload = await request.json();
    playerList = res["playerList"];
    const lobby = await fetchElo(playerList);
    response = {
      status: 200,
      message: "success",
      lobby,
    };
    return NextResponse.json(response);
  } catch (error) {
    response = {
      status: 500,
      message: "Internal Server Error.",
    };
    return NextResponse.json(response);
  }
}
