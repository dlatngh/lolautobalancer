"use client";

import { useState } from "react";
import ParsedPlayer from "@/components/ParsedPlayer";
import { placeholder } from "@/lib/utils";
import Delete from "./Delete";

export default function PlayerBox() {
  const [players, setPlayers] = useState<string[]>([]);
  const [chatLog, setChatLog] = useState<string>("");

  const handleChatLogChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const chatLog = e.target.value;
    setChatLog(chatLog);

    const newPlayers: string[] = [];
    const lines = chatLog.split("\n");

    lines.forEach((line) => {
      const joinMatch = line.match(/(.+?#\w+) joined the lobby/);
      const leaveMatch = line.match(/(.+?#\w+) left the lobby/);
      if (joinMatch) {
        const playerName = joinMatch[1];
        if (!newPlayers.includes(playerName)) {
          newPlayers.push(playerName);
        }
      }

      if (leaveMatch) {
        const playerName = leaveMatch[1];
        const playerIndex = newPlayers.indexOf(playerName);
        if (playerIndex !== -1) {
          newPlayers.splice(playerIndex, 1);
        }
      }
    });

    setPlayers(newPlayers);
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

  return (
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
          placeholder={placeholder()}
          value={chatLog}
          onChange={handleChatLogChange}
        ></textarea>
      </div>
      <div className="flex flex-col m-auto sm:space-y-2 w-96 h-96">
        <div className="flex flex-row justify-between">
          <h1 className="uppercase font-bold font-beaufort text-[#A09B8C] text-lg">
            Players ({players.length})
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
              className={`flex justify between items-center h-[10%] border-[#C89B3C] ${
                i !== players.length - 1 ? "border-b" : ""
              }`}
            >
              <ParsedPlayer key={i} playerName={playerName} i={i} />
              <button onClick={() => removePlayer(playerName)}>
                <Delete />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
