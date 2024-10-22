"use client";
import PlayerBorder from "@/components/teams/PlayerBorder";
import { BalancedTeams, PlayerInfo } from "@/lib/balanceLobby";
import { useEffect, useState } from "react";

export default function Teams() {
  const [teams, setTeams] = useState<BalancedTeams | null>(null);
  const [blueTeam, setBlueTeam] = useState<
    { [playerName: string]: PlayerInfo }[] | null
  >(null);
  const [redTeam, setRedTeam] = useState<
    { [playerName: string]: PlayerInfo }[] | null
  >(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const resonse = await fetch("api/teams");
        const data = await resonse.json();
        const balancedTeams = JSON.parse(data.balancedTeams);
        setTeams(balancedTeams.teams);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    if (teams) {
      setBlueTeam(teams.team1 ?? null);
      setRedTeam(teams.team2 ?? null);
    }
  }, [teams]);
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
    </div>
  );
}
