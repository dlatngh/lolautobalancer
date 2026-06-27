import {
  balanceByRole,
  RoleAssignment,
  RoleBalancedTeams,
} from "@/lib/roleBalance/roleBalancer";
import { PlayerRoleData, toRolePlayer } from "@/lib/roleBalance/playerRoleData";
import { QueueCategory } from "@/lib/roleBalance/queueWeights";
import { NextResponse } from "next/server";

function effectiveTotal(team: RoleAssignment[]): number {
  return Math.round(team.reduce((sum, assignment) => sum + assignment.effectiveMmr, 0));
}

function logBalance(teams: RoleBalancedTeams, selectedQueues: QueueCategory[]): void {
  const team1Total = effectiveTotal(teams.team1);
  const team2Total = effectiveTotal(teams.team2);
  console.log(
    `[roleBalance] queues=[${selectedQueues.join(",")}] ` +
      `team1=${team1Total} team2=${team2Total} gap=${Math.abs(team1Total - team2Total)}`
  );
}

type Payload = {
  players: PlayerRoleData[];
  selectedQueues: QueueCategory[];
};

type Data = {
  status: number;
  message: string;
  teams?: RoleBalancedTeams;
};

export async function POST(request: Request) {
  let response: Data;
  try {
    const { players, selectedQueues }: Payload = await request.json();
    const rolePlayers = players.map((player) => toRolePlayer(player, selectedQueues));
    const teams = balanceByRole(rolePlayers);
    logBalance(teams, selectedQueues);
    response = { status: 200, message: "success", teams };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[roleBalance/balance] failed:", error);
    response = { status: 500, message: "Internal Server Error." };
    return NextResponse.json(response);
  }
}
