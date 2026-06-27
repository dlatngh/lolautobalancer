import Image from "next/image";
import { ROLES, Role } from "@/lib/roleBalance/roles";
import { RoleAssignment, RoleBalancedTeams } from "@/lib/roleBalance/roleBalancer";
import type { PlayerInfo } from "@/lib/balanceLobby";
import PlayerBorder from "@/components/teams/PlayerBorder";

const POSITION_ICON_BASE =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions";

const ROLE_ICON_URLS: { [role in Role]: string } = {
  TOP: `${POSITION_ICON_BASE}/icon-position-top.png`,
  JUNGLE: `${POSITION_ICON_BASE}/icon-position-jungle.png`,
  MID: `${POSITION_ICON_BASE}/icon-position-middle.png`,
  ADC: `${POSITION_ICON_BASE}/icon-position-bottom.png`,
  SUPPORT: `${POSITION_ICON_BASE}/icon-position-utility.png`,
};

// A player is "off-role" when their affinity for the assigned role is well below
// their strongest role (affinities are normalized so the best role is 1.0).
const OFF_ROLE_AFFINITY_THRESHOLD = 0.34;

// Flag a player as a one-trick when their champion+lane concentration is high.
const ONE_TRICK_DISPLAY_THRESHOLD = 0.4;

interface RoleTeamsProps {
  teams: RoleBalancedTeams;
  playerInfoByName: { [playerName: string]: PlayerInfo };
}

function orderByRole(team: RoleAssignment[]): RoleAssignment[] {
  return ROLES.map((role) => team.find((assignment) => assignment.role === role)!);
}

function TeamRow({
  team,
  playerInfoByName,
}: {
  team: RoleAssignment[];
  playerInfoByName: { [playerName: string]: PlayerInfo };
}) {
  const orderedAssignments = orderByRole(team);

  return (
    <div className="grid grid-cols-5 gap-x-5">
      {orderedAssignments.map((assignment) => {
        const isMainRole = assignment.affinity >= 0.999;
        const isOffRole = assignment.affinity < OFF_ROLE_AFFINITY_THRESHOLD;
        const isOneTrick = assignment.oneTrickFactor >= ONE_TRICK_DISPLAY_THRESHOLD;
        const reductionPercent = Math.round(
          (1 - assignment.effectiveMmr / assignment.baseMmr) * 100
        );
        return (
          <div key={assignment.role} className="flex flex-col items-center">
            <PlayerBorder
              playerName={assignment.name}
              playerInfo={playerInfoByName[assignment.name]}
            />
            <span className="mt-1 font-spiegel text-xs text-[#A09B8C] text-center">
              Base {Math.round(assignment.baseMmr)} · Eff{" "}
              {Math.round(assignment.effectiveMmr)}
              {reductionPercent > 0 && (
                <span className="text-[#E84057]"> (−{reductionPercent}%)</span>
              )}
            </span>
            <Image
              src={ROLE_ICON_URLS[assignment.role]}
              alt={assignment.role}
              width={48}
              height={48}
              className="mt-2"
            />
            <div className="mt-1 flex h-4 items-center justify-center gap-2 font-beaufort uppercase text-xs tracking-widest">
              {isMainRole && <span className="text-[#46D08F]">Main</span>}
              {isOffRole && <span className="text-[#E84057]">Off-role</span>}
              {isOneTrick && <span className="text-[#3FB6D3]">One-trick</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RoleTeams({ teams, playerInfoByName }: RoleTeamsProps) {
  return (
    <div className="flex flex-col space-y-4 py-10">
      <TeamRow team={teams.team1} playerInfoByName={playerInfoByName} />
      <div className="flex justify-center items-center">
        <h1
          className="font-beaufort text-5xl bg-gradient-to-tr
        from-[#C89B3C] via-[#785A28] to-[#C89B3C] inline-block text-transparent bg-clip-text"
        >
          VS
        </h1>
      </div>
      <TeamRow team={teams.team2} playerInfoByName={playerInfoByName} />
    </div>
  );
}
