import { Divisions } from "@/lib/riot/division";
import { Tiers } from "@/lib/riot/tier";
import Image from "next/image";
import { useEffect, useState } from "react";

interface PlayerCardProps {
  playerName: string;
  summonerLevel: number;
  profileIconId: number;
  tier: string;
  division: string;
  leaguePoints: number;
}

export default function PlayerCard(props: PlayerCardProps) {
  const [version, setVersion] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>(
    props.tier || "UNRANKED"
  );
  const nonDivisionTiers = ["CHALLENGER", "GRANDMASTER", "MASTER", "UNRANKED"];

  const PFP_URL = `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${props.profileIconId}.png`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://ddragon.leagueoflegends.com/api/versions.json"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        setVersion(result[0]);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTier(e.target.value);
  };

  return (
    <div className="flex flex-row h-1/5 space-x-5 m-2">
      <div>
        <Image
          src={PFP_URL}
          alt="profileIcon"
          width={125}
          height={125}
          className="rounded-md"
        />
      </div>
      <div className="flex flex-col w-52 items-start text-center space-y-1 justify-center">
        <h1 className="font-beaufort text-xl text-[#C89B3C]">
          {props.playerName}
        </h1>
        <form className="font-beaufort text-lg">
          <div className="flex flex-row space-x-3 items-start">
            <select
              id="rank"
              name="rank"
              value={selectedTier}
              onChange={handleTierChange}
              className="from-[#091428] to-[#0A1428] bg-gradient-to-r text-[#C89B3C] p-1 rounded-md"
            >
              {Object.keys(Tiers)
                .filter((key) => isNaN(Number(key)))
                .map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
            </select>

            {!nonDivisionTiers.includes(selectedTier) && (
              <select
                id="division"
                name="division"
                defaultValue={props.division || "IV"}
                className="from-[#091428] to-[#0A1428] bg-gradient-to-r text-[#C89B3C] p-1 rounded-md"
              >
                {Object.keys(Divisions)
                  .filter((key) => isNaN(Number(key)))
                  .map((division) => (
                    <option key={division} value={division}>
                      {division}
                    </option>
                  ))}
              </select>
            )}
          </div>
          <div className="flex flex-row text-[#F0E6D2] space-x-2 items-center">
            <h1 className="m-1">Level:</h1>
            <input
              type="text"
              id="summonerLevel"
              name="summonerLevel"
              value={props.summonerLevel}
              className="w-10 h-8 text-center from-[#091428] to-[#0A1428] bg-gradient-to-r"
            />
            <h1 className="m-1">LP:</h1>
            <input
              type="text"
              id="leaguePoints"
              name="leaguePoints"
              value={props.leaguePoints}
              className="w-10 h-8 text-center from-[#091428] to-[#0A1428] bg-gradient-to-r"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
