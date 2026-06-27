"use client";

import { useState } from "react";
import { parsePlayersFromChatLog } from "@/lib/utils/playerManager";
import { loadFreshProfiles, saveProfiles } from "@/lib/roleBalance/profileCacheClient";
import { RoleBalancedTeams } from "@/lib/roleBalance/roleBalancer";
import { PlayerRoleData } from "@/lib/roleBalance/playerRoleData";
import type { PlayerInfo } from "@/lib/balanceLobby";
import { QueueCategory, QUEUE_CATEGORIES } from "@/lib/roleBalance/queueWeights";
import Loading from "@/app/loading";
import ErrorAlert from "@/components/ErrorAlert";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ParsedPlayer from "@/components/ParsedPlayer";
import Delete from "@/components/ui/Delete";
import RoleTeams from "@/components/role-balance/RoleTeams";
import QueueSelector from "@/components/role-balance/QueueSelector";
import ProgressBar from "@/components/role-balance/ProgressBar";
import { generatePlaceholder } from "@/lib/utils/playerManager";
import Divider from "@/components/ui/Divider";

const REQUIRED_PLAYER_COUNT = 10;

export default function RoleBalancePage() {
  const [chatLog, setChatLog] = useState<string>("");
  const [parsedPlayers, setParsedPlayers] = useState<string[]>([]);
  const [players, setPlayers] = useState<PlayerRoleData[]>([]);
  const [selectedQueues, setSelectedQueues] = useState<QueueCategory[]>([
    ...QUEUE_CATEGORIES,
  ]);
  const [teams, setTeams] = useState<RoleBalancedTeams | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchPercent, setFetchPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  const handleChatLogChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedChatLog = e.target.value;
    setChatLog(updatedChatLog);
    const detected = parsePlayersFromChatLog(updatedChatLog);
    setParsedPlayers(detected);
  };

  const handleRemovePlayer = (playerName: string) => {
    setParsedPlayers((prev) => prev.filter((name) => name !== playerName));
  };

  const handleReset = () => {
    setChatLog("");
    setParsedPlayers([]);
    setTeams(null);
    setPlayers([]);
  };

  const showError = (message: string) => {
    setError(message);
    setIsErrorOpen(true);
  };

  const fetchMissingProfiles = async (missingNames: string[]): Promise<PlayerRoleData[]> => {
    const response = await fetch("/api/role-balance/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerList: missingNames }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch player profiles from Riot.");
    }

    const responseJson = await response.json();

    if (responseJson.status !== 200) {
      throw new Error(responseJson.message || "Failed to initialize player profiles.");
    }

    return responseJson.players as PlayerRoleData[];
  };

  const fetchBalancedTeams = async (
    allPlayers: PlayerRoleData[],
    queues: QueueCategory[]
  ): Promise<RoleBalancedTeams> => {
    const response = await fetch("/api/role-balance/balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players: allPlayers, selectedQueues: queues }),
    });

    if (!response.ok) {
      throw new Error("Failed to balance teams.");
    }

    const responseJson = await response.json();

    if (responseJson.status !== 200) {
      throw new Error(responseJson.message || "Failed to balance teams.");
    }

    return responseJson.teams as RoleBalancedTeams;
  };

  // Fetches the not-yet-cached players one at a time, advancing the progress bar
  // and caching each as it completes (so a partial fetch still persists).
  const fetchMissingWithProgress = async (
    missingNames: string[]
  ): Promise<PlayerRoleData[]> => {
    const fetchedPlayers: PlayerRoleData[] = [];
    setFetchPercent(0);

    for (const name of missingNames) {
      const [data] = await fetchMissingProfiles([name]);
      saveProfiles([data], window.localStorage, Date.now());
      fetchedPlayers.push(data);
      setFetchPercent((fetchedPlayers.length / missingNames.length) * 100);
    }

    return fetchedPlayers;
  };

  const handleBalance = async () => {
    if (parsedPlayers.length !== REQUIRED_PLAYER_COUNT) {
      showError(
        `Exactly ${REQUIRED_PLAYER_COUNT} players are required. You have ${parsedPlayers.length}.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { cached, missing } = loadFreshProfiles(
        parsedPlayers,
        window.localStorage,
        Date.now()
      );

      let fetched: PlayerRoleData[] = [];
      if (missing.length > 0) {
        fetched = await fetchMissingWithProgress(missing);
      }

      const allPlayers = [...cached, ...fetched];
      setPlayers(allPlayers);

      const balancedTeams = await fetchBalancedTeams(allPlayers, selectedQueues);
      setTeams(balancedTeams);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      showError(message);
    } finally {
      setLoading(false);
      setFetchPercent(null);
    }
  };

  const handleReroll = async () => {
    if (players.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rerolledTeams = await fetchBalancedTeams(players, selectedQueues);
      setTeams(rerolledTeams);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQueue = async (category: QueueCategory) => {
    const isSelected = selectedQueues.includes(category);
    if (isSelected && selectedQueues.length === 1) {
      return;
    }

    const updatedQueues = isSelected
      ? selectedQueues.filter((queue) => queue !== category)
      : [...selectedQueues, category];
    setSelectedQueues(updatedQueues);

    if (!teams || players.length !== REQUIRED_PLAYER_COUNT) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rebalancedTeams = await fetchBalancedTeams(players, updatedQueues);
      setTeams(rebalancedTeams);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const playerCountClass =
    parsedPlayers.length !== REQUIRED_PLAYER_COUNT && parsedPlayers.length > 0
      ? "text-[#cc0000]"
      : "";

  const playerInfoByName: { [playerName: string]: PlayerInfo } = {};
  for (const player of players) {
    playerInfoByName[player.name] = player.playerInfo;
  }

  return (
    <>
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center sm:pt-16 lg:px-0 justify-center">
        <div className="flex flex-col items-center text-5xl font-bold lg:text-6xl font-beaufort text-[#C89B3C]">
          <h1 className="uppercase">Role Balance</h1>
          <p className="mt-5 font-spiegel text-[#A09B8C] font-medium text-md sm:text-lg">
            Balance your 5v5 lobby by role using each player&apos;s match history
            affinities. Paste your lobby chat log below.
          </p>
        </div>
      </div>
      <Divider />
      <div className="flex flex-col">
        {loading ? (
          fetchPercent !== null ? (
            <ProgressBar percent={fetchPercent} label="Fetching match history" />
          ) : (
            <Loading />
          )
        ) : (
          <>
            {!teams && (
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
                  />
                </div>
                <div className="flex flex-col m-auto sm:space-y-2 w-96 h-96">
                  <div className="flex flex-row justify-between">
                    <h1 className="uppercase font-bold font-beaufort text-[#A09B8C] text-lg">
                      Players{" "}
                      <span className={playerCountClass}>
                        ({parsedPlayers.length})
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
                    {parsedPlayers.map((playerName, i) => (
                      <div
                        key={i}
                        className={`flex justify-between items-center h-[10%] border-[#C89B3C] ${
                          i !== parsedPlayers.length - 1 ? "border-b" : ""
                        }`}
                      >
                        <ParsedPlayer playerName={playerName} />
                        <button onClick={() => handleRemovePlayer(playerName)}>
                          <Delete />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {teams && (
              <RoleTeams teams={teams} playerInfoByName={playerInfoByName} />
            )}

            <div className="flex flex-col items-center py-10 pb-16 space-y-6">
              <QueueSelector selected={selectedQueues} onToggle={handleToggleQueue} />
              <div className="flex items-center justify-center space-x-6">
                {!teams && (
                  <PrimaryButton action={handleBalance} buttonName="Balance" />
                )}
                {teams && (
                  <>
                    <PrimaryButton action={handleReroll} buttonName="Re-roll" />
                    <PrimaryButton action={handleReset} buttonName="New Lobby" />
                  </>
                )}
              </div>
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
    </>
  );
}
