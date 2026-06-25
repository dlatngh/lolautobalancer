import { PlayerInfo } from "@/lib/balanceLobby";
import Image from "next/image";
import { useEffect, useState } from "react";

interface PlayerProps {
  playerName: string;
  playerInfo: PlayerInfo;
}

export default function PlayerBorder(props: PlayerProps) {
  const [version, setVersion] = useState("");
  const PFP_URL = `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${props.playerInfo.profileIconId}.png`;
  const BORDER = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/uikit/themed-borders/theme-${getBorderTier()}-border.png`;

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

  function getBorderTier() {
    const level = props.playerInfo.summonerLevel;
    if (level < 30) {
      return 1;
    }
    return Math.min(Math.floor((level - 30) / 25) + 2, 21);
  }

  function getRankSrc() {
    const rank = props.playerInfo.tier;
    if (rank.length === 0) {
      return "Unranked";
    }
    return rank.charAt(0).toUpperCase() + rank.slice(1).toLowerCase();
  }

  return (
    <div className="flex m-auto border-4 border-[#785A28] px-5 py-6 outline-2 outline-gradient-to-r outline-black bg-[#010A13] bg-opacity-80 ">
      <div className="inline-flex flex-col items-center justify-center text-white text-center max-w-64 max-h-96 m-auto py-5 mt-10">
        <div className="relative">
          <Image
            src={PFP_URL}
            alt="profileIcon"
            width={125}
            height={125}
            className="border-4 border-[#C89B3C] rounded-full"
          />
          <Image
            src={BORDER}
            alt="tier"
            width={600}
            height={600}
            className="absolute top-0 scale-[200%]"
          />
          {props.playerInfo.tier.length === 0 ? (
            <p className="absolute bg-[#32281E] font-beaufort font-md border-2 px-3 border-[#785A28] drop-shadow-lg right-0 left-0 m-auto w-fit">
              {props.playerInfo.summonerLevel}
            </p>
          ) : (
            <p className="absolute bg-[#32281E] font-beaufort font-md border-2 px-3 border-[#785A28] drop-shadow-lg right-0 left-0 m-auto w-fit">
              {props.playerInfo.division}
            </p>
          )}
        </div>
        <Image
          src={`/rank/tiers/${getRankSrc()}.png`}
          alt="tier"
          width={200}
          height={125}
          className="-mt-2"
        />
        <h1 className="font-beaufort text-xl text-[#C8AA6E]">
          {props.playerName}
        </h1>
      </div>
    </div>
  );
}
