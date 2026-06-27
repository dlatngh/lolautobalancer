import type { PlayerInfo } from "../balanceLobby";
import { QueueCategory } from "./queueWeights";
import { aggregateSelectedProfiles, CategoryProfiles } from "./roleProfile";
import { playerOneTrickFactor, roleAffinities } from "./roleAffinity";
import { RolePlayer } from "./roleBalancer";

// Everything cached per player that is independent of the queue selection: their
// rank/profile info (for rendering), base MMR, and the raw per-category role
// history. Affinities are derived from this on demand for whatever queues are
// selected, so toggling the selection never requires a refetch.
export type PlayerRoleData = {
  name: string;
  baseMmr: number;
  playerInfo: PlayerInfo;
  categoryProfiles: CategoryProfiles;
};

export function toRolePlayer(
  data: PlayerRoleData,
  selectedCategories: QueueCategory[]
): RolePlayer {
  const profile = aggregateSelectedProfiles(data.categoryProfiles, selectedCategories);
  return {
    name: data.name,
    baseMmr: data.baseMmr,
    affinities: roleAffinities(profile),
    oneTrickFactor: playerOneTrickFactor(profile),
  };
}
