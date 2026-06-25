import { fetchElo } from "@/lib/riot/fetchElo";
import { DEFAULT_RANK_MODE, RankMode } from "@/lib/riot/rankMode";
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
  playerList: string[];
  rankMode?: RankMode;
};

export async function POST(request: Request) {
  let playerList: string[];
  let response: Data;
  try {
    const res: Payload = await request.json();
    playerList = res.playerList;
    const rankMode = res.rankMode ?? DEFAULT_RANK_MODE;
    const lobby = await fetchElo(playerList, rankMode);
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
