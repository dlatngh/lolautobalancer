"use client";
import PlayerBorder from "@/components/teams/PlayerBorder";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { BalancedTeams, PlayerInfo } from "@/lib/balanceLobby";
import { useEffect, useState } from "react";

type Lobby = { [playerName: string]: PlayerInfo };

function reconstructLobby(teams: BalancedTeams): Lobby {
  const allPlayerEntries = [...teams.team1, ...teams.team2];
  const lobby: Lobby = {};
  for (const playerEntry of allPlayerEntries) {
    const playerName = Object.keys(playerEntry)[0];
    lobby[playerName] = playerEntry[playerName];
  }
  return lobby;
}

export default function Teams() {
  const [teams, setTeams] = useState<BalancedTeams | null>(null);
  const [blueTeam, setBlueTeam] = useState<
    { [playerName: string]: PlayerInfo }[] | null
  >(null);
  const [redTeam, setRedTeam] = useState<
    { [playerName: string]: PlayerInfo }[] | null
  >(null);

  useEffect(() => {
    try {
      const storedTeams = sessionStorage.getItem("balancedTeams");
      console.log("[teams] loaded from sessionStorage:", storedTeams);
      if (storedTeams) {
        setTeams(JSON.parse(storedTeams));
      }
    } catch (error) {
      console.error("Error reading balanced teams:", error);
    }
  }, []);

  useEffect(() => {
    if (teams) {
      setBlueTeam(teams.team1 ?? null);
      setRedTeam(teams.team2 ?? null);
    }
  }, [teams]);

  const rerollTeams = async () => {
    if (!teams) {
      return;
    }
    const lobby = reconstructLobby(teams);
    try {
      const response = await fetch("/api/lobby/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobby }),
      });
      if (!response.ok) {
        throw new Error("Failed to reroll teams");
      }
      const responseJson = await response.json();
      const rerolledTeams = responseJson.teams;
      console.log("[teams] rerolled teams:", rerolledTeams);
      setTeams(rerolledTeams);
      sessionStorage.setItem("balancedTeams", JSON.stringify(rerolledTeams));
    } catch (error) {
      console.error("Error rerolling teams:", error);
    }
  };

  return (
    <div className="flex flex-col space-y-4 py-10">
      <div className="grid grid-cols-5 gap-x-5">
        {blueTeam?.map((player, idx) => (
          <div key={idx} className="">
            <PlayerBorder
              playerName={Object.keys(player)[0]}
              playerInfo={player[Object.keys(player)[0]]}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center items-center">
        <h1
          className="font-beaufort text-5xl bg-gradient-to-tr
        from-[#C89B3C] via-[#785A28] to-[#C89B3C] inline-block text-transparent bg-clip-text"
        >
          VS
        </h1>
      </div>
      <div className="grid grid-cols-5 gap-x-5">
        {redTeam?.map((player, idx) => (
          <div key={idx}>
            <PlayerBorder
              playerName={Object.keys(player)[0]}
              playerInfo={player[Object.keys(player)[0]]}
            />
          </div>
        ))}
      </div>
      {teams && (
        <div className="flex items-center justify-center pt-8">
          <PrimaryButton action={() => rerollTeams()} buttonName="Reroll" />
        </div>
      )}
    </div>
  );
}
