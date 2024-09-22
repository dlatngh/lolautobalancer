"use client";

import { useState } from "react";
import ParsedPlayer from "@/components/ParsedPlayer";
import Delete from "./Delete";
import {
  generatePlaceholder,
  parsePlayersFromChatLog,
} from "@/lib/utils/playerManager";

export default function PlayerBox() {
  const [players, setPlayers] = useState<string[]>([]);
  const [chatLog, setChatLog] = useState<string>("");

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
          placeholder={generatePlaceholder()}
          value={chatLog}
          onChange={handleChatLogChange}
        ></textarea>
      </div>
      <div className="flex flex-col m-auto sm:space-y-2 w-96 h-96">
        <div className="flex flex-row justify-between">
          <h1 className="uppercase font-bold font-beaufort text-[#A09B8C] text-lg">
            Players{" "}
            <span className={`${players.length > 10 ? "text-[#cc0000]" : ""}`}>
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
              className={`flex justify between items-center h-[10%] border-[#C89B3C] ${
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
  );
}
