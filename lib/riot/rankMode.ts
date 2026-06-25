// Which ranked queues a player's inhouse rating is drawn from.
//   HIGHEST  - the highest rank the player reached across Solo/Duo and Flex.
//   SOLO_DUO - the player's Solo/Duo rank only.
export type RankMode = "HIGHEST" | "SOLO_DUO";

export const DEFAULT_RANK_MODE: RankMode = "HIGHEST";
