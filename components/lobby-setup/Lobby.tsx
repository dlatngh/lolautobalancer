"use client";

import { useSearchParams } from "next/navigation";
import PlayerCard from "./PlayerCard";
import { useEffect, useState } from "react";

type Player = {
  playerName: string;
  summonerInfo?: {
    summonerLevel?: number;
    profileIconId?: number;
  } | null;
  leagueInfo?: {
    tier?: string;
    division?: string;
    leaguePoints?: number;
  } | null;
};

export default function Lobby() {
  const lobbyParams = useSearchParams();
  const lobbyString = lobbyParams.get("lobby");
  const [lobby, setLobby] = useState<Player[]>([]);

  useEffect(() => {
    if (lobbyString) {
      try {
        const parsedLobby = JSON.parse(lobbyString) as Player[];
        setLobby(parsedLobby);
      } catch (error) {
        console.error("Failed to parse lobby data:", error);
      }
    }
  }, [lobbyString]);

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-row items-center justify-center space-x-10">
        <div className="grid grid-cols-2 uppercase content-evenly bg-[#010A13] border-y border-[#C89B3C]">
          {lobby.map((player, i) => (
            <div
              key={i}
              className={`flex border-l border-r border-[#C89B3C] px-16 py-3 m-auto
            `}
            >
              <PlayerCard
                playerName={player.playerName}
                summonerLevel={player.summonerInfo?.summonerLevel ?? 0}
                profileIconId={player.summonerInfo?.profileIconId ?? 0}
                tier={player.leagueInfo?.tier ?? ""}
                division={player.leagueInfo?.division ?? ""}
                leaguePoints={player.leagueInfo?.leaguePoints ?? 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
