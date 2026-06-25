import balanceLobby, { BalancedTeams } from "@/lib/balanceLobby";
import { NextResponse } from "next/server";

type Data = {
  status: number;
  message: string;
  teams?: BalancedTeams;
};

type Payload = {
  [key: string]: string[];
};

export async function POST(request: Request) {
  let lobby = {};
  let response: Data;
  try {
    const res: Payload = await request.json();
    lobby = res["lobby"];
    const teams = balanceLobby(lobby);
    response = {
      status: 200,
      message: "success",
      teams,
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
