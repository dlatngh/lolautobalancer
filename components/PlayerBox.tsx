"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ParsedPlayer from "@/components/ParsedPlayer";
import Delete from "./ui/Delete";
import {
  generatePlaceholder,
  parsePlayersFromChatLog,
  validatePlayerList,
} from "@/lib/utils/playerManager";
import { ClientError } from "@/lib/utils/errors";
import ErrorAlert from "./ErrorAlert";
import Loading from "@/app/loading";
import PrimaryButton from "./ui/PrimaryButton";
import { DEFAULT_RANK_MODE, RankMode } from "@/lib/riot/rankMode";

export default function PlayerBox() {
  const [players, setPlayers] = useState<string[]>([]);
  const [chatLog, setChatLog] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rankMode, setRankMode] = useState<RankMode>(DEFAULT_RANK_MODE);
  const router = useRouter();

  const handleChatLogChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedChatLog = e.target.value;
    setChatLog(updatedChatLog);

    const parsedPlayers = parsePlayersFromChatLog(updatedChatLog);
    setPlayers(parsedPlayers);
  };

  const handleReset = () => {
    setPlayers([]);
    setChatLog("");
  };

  const removePlayer = (playerName: string) => {
    setPlayers((prevPlayers) =>
      prevPlayers.filter((player) => player !== playerName)
    );
  };

  const initializeLobby = async () => {
    const playerList = players;
    try {
      validatePlayerList(playerList);
      setLoading(true);
      const request = await fetch("/api/lobby/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerList, rankMode }),
      });

      const response = await request.json();

      if (response.status === 200) {
        const lobby = encodeURIComponent(JSON.stringify(response.lobby));
        router.push(`/lobby?lobby=${lobby}`);
      } else {
        console.error("Error:", response.message);
      }
    } catch (error) {
      if (error instanceof ClientError) {
        setError(error.message);
        setIsErrorOpen(true);
      } else {
        console.error("Request failed", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const rankModeOptions: { value: RankMode; label: string }[] = [
    { value: "HIGHEST", label: "Highest (Solo/Flex)" },
    { value: "SOLO_DUO", label: "Solo/Duo only" },
  ];

  return (
    <div className="flex flex-col">
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="flex flex-row items-center justify-center space-x-10">
            <div className="flex flex-col m-auto sm:space-y-2 w-96 h-96">
              <label
                htmlFor="chatLog"
                className="uppercase font-bold font-beaufort text-[#A09B8C] text-lg"
              >
                Paste Chat Log Here
              </label>
              <textarea
                id="chatLog"
                className="w-full cursor-text h-full resize-none my-2 text-lg text-[#A09B8C] font-spiegel p-2 outline outline-gradient-to-r from-[#091428] to-[#0A1428] outline-[#C89B3C] bg-gradient-to-r"
                rows={10}
                placeholder={generatePlaceholder()}
                value={chatLog}
                onChange={handleChatLogChange}
              ></textarea>
            </div>
            <div className="flex flex-col m-auto sm:space-y-2 w-96 h-96">
              <div className="flex flex-row justify-between">
                <h1 className="uppercase font-bold font-beaufort text-[#A09B8C] text-lg">
                  Players{" "}
                  <span
                    className={`${
                      players.length > 10 || players.length < 2
                        ? "text-[#cc0000]"
                        : ""
                    }`}
                  >
                    ({players.length})
                  </span>
                </h1>
                <div
                  className="uppercase font-bold font-beaufort text-[#A09B8C] text-lg cursor-pointer"
                  onClick={handleReset}
                >
                  Reset
                </div>
              </div>
              <div className="w-full h-full text-[#A09B8C] font-spiegel px-2 outline outline-gradient-to-r from-[#091428] to-[#0A1428] outline-[#C89B3C] bg-gradient-to-r overflow-auto">
                {players.map((playerName, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center h-[10%] border-[#C89B3C] ${
                      i !== players.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <ParsedPlayer playerName={playerName} />
                    <button onClick={() => removePlayer(playerName)}>
                      <Delete />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-2 pt-10">
            <span className="uppercase font-bold font-beaufort text-[#A09B8C] text-sm">
              Rank source
            </span>
            <div className="inline-flex border border-[#C89B3C] font-beaufort uppercase text-sm">
              {rankModeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRankMode(option.value)}
                  className={`px-5 py-2 ${
                    option.value === "SOLO_DUO"
                      ? "border-l border-[#C89B3C]"
                      : ""
                  } ${
                    rankMode === option.value
                      ? "bg-[#C89B3C] text-[#091428]"
                      : "text-[#C89B3C] hover:bg-[#1E2328]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center py-10 pb-16">
            <PrimaryButton action={initializeLobby} buttonName="Create Lobby" />
          </div>
          {isErrorOpen && (
            <ErrorAlert
              title="Error"
              message={error || "An unexpected error occurred."}
              onClose={() => setIsErrorOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
