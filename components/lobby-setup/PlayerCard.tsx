import { Divisions } from "@/lib/riot/division";
import { Tiers } from "@/lib/riot/tier";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface PlayerCardProps {
  playerName: string;
  summonerLevel: number;
  profileIconId: number;
  tier: string;
  division: string;
  leaguePoints: number | null;
  onChange: (formData: FormDataType) => void;
}

export interface FormDataType {
  tier: string;
  division: string;
  leaguePoints: number | null;
  summonerLevel: number;
  profileIconId: number;
}

const areFormDataEqual = (a: FormDataType, b: FormDataType) => {
  return (
    a.tier === b.tier &&
    a.division === b.division &&
    a.leaguePoints === b.leaguePoints &&
    a.summonerLevel === b.summonerLevel &&
    a.profileIconId === b.profileIconId
  );
};

export default function PlayerCard(props: PlayerCardProps) {
  const [version, setVersion] = useState("");
  const [formData, setFormData] = useState({
    tier: props.tier || "UNRANKED",
    division: props.division || "",
    leaguePoints: props.leaguePoints,
    summonerLevel: props.summonerLevel,
    profileIconId: props.profileIconId,
  });

  const previousFormData = useRef(formData);
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

  useEffect(() => {
    if (!areFormDataEqual(formData, previousFormData.current)) {
      previousFormData.current = formData;
      props.onChange(formData);
    }
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="flex flex-row h-1/5 space-x-5 items-center py-1 px-3">
      <div>
        <Image
          src={PFP_URL}
          alt="profileIcon"
          width={125}
          height={125}
          className="border-2 border-[#C89B3C] rounded-full"
        />
      </div>
      <div className="inline-flex flex-col min-w-60 items-start text-center space-y-1 justify-center">
        <h1 className="font-beaufort text-xl text-[#C89B3C]">
          {props.playerName}
        </h1>
        <form className="font-beaufort text-lg">
          <div className="flex flex-row space-x-3 items-start">
            <select
              id="rank"
              name="tier"
              value={formData.tier}
              onChange={handleSelectChange}
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

            {!nonDivisionTiers.includes(formData.tier) && (
              <select
                id="division"
                name="division"
                value={formData.division}
                onChange={handleSelectChange}
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
              value={formData.summonerLevel}
              onChange={handleInputChange}
              className="w-10 h-8 text-center from-[#091428] to-[#0A1428] bg-gradient-to-r"
            />
            {formData.tier !== "UNRANKED" && (
              <>
                <h1 className="m-1">LP:</h1>
                <input
                  type="text"
                  id="leaguePoints"
                  name="leaguePoints"
                  value={formData.leaguePoints ?? ""}
                  onChange={handleInputChange}
                  className="w-10 h-8 text-center from-[#091428] to-[#0A1428] bg-gradient-to-r"
                />
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
