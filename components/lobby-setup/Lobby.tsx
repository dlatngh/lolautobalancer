"use client";

import { useRouter, useSearchParams } from "next/navigation";
import PlayerCard from "./PlayerCard";
import { useEffect, useState } from "react";
import PrimaryButton from "../ui/PrimaryButton";

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

type PlayerFormData = {
  tier: string;
  division: string;
  leaguePoints: number | null;
  summonerLevel: number;
};

export default function Lobby() {
  const lobbyParams = useSearchParams();
  const lobbyString = lobbyParams.get("lobby");
  const [lobby, setLobby] = useState<Player[]>([]);
  const router = useRouter();

  const [playerForms, setPlayerForms] = useState<
    Record<string, PlayerFormData>
  >({});

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

  const handleSubmit = async () => {
    const lobbyData = lobby.reduce((acc, player) => {
      const formData = playerForms[player.playerName] || {
        tier: player.leagueInfo?.tier || "",
        division: player.leagueInfo?.division || "",
        leaguePoints: player.leagueInfo?.leaguePoints || 0,
        summonerLevel: player.summonerInfo?.summonerLevel || 0,
        profileIconId: player.summonerInfo?.profileIconId,
      };
      acc[player.playerName] = formData;
      return acc;
    }, {} as Record<string, PlayerFormData>);

    try {
      const response = await fetch("/api/lobby/balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lobby: lobbyData }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit lobby data");
      }
      const responseJson = await response.json();
      console.log(responseJson);
      const teams = responseJson.teams;
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teams }),
      });
      if (!res.ok) {
        throw new Error("Failed to submit teams");
      }
      router.push(`/teams`);
    } catch (error) {
      console.error("Error submitting lobby:", error);
    }
  };

  const handlePlayerFormChange = (
    playerName: string,
    formData: PlayerFormData
  ) => {
    setPlayerForms((prevForms) => ({
      ...prevForms,
      [playerName]: formData,
    }));
  };

  return (
    <div className="flex flex-col w-full space-y-12">
      <div className="m-auto">
        <div className="grid grid-cols-2 uppercase content-evenly bg-[#010A13] border-y border-[#C89B3C]">
          {lobby.map((player, i) => (
            <div
              key={i}
              className={`border-x border-[#C89B3C] m-auto 
            `}
            >
              <PlayerCard
                playerName={player.playerName}
                summonerLevel={player.summonerInfo?.summonerLevel ?? 0}
                profileIconId={player.summonerInfo?.profileIconId ?? 0}
                tier={player.leagueInfo?.tier ?? ""}
                division={player.leagueInfo?.division ?? ""}
                leaguePoints={player.leagueInfo?.leaguePoints ?? 0}
                onChange={(formData) =>
                  handlePlayerFormChange(player.playerName, formData)
                }
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center pb-16">
        <PrimaryButton action={handleSubmit} buttonName="Balance" />
      </div>
    </div>
  );
}
