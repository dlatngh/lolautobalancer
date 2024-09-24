import { fetchElo } from "@/lib/riot/fetchElo";
import { NextResponse } from "next/server";

type Data = {
  status: number;
  message: string;
  lobby?: any;
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
