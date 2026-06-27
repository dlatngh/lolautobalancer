export type Role = "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";

export const ROLES: Role[] = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

const POSITION_TO_ROLE: { [position: string]: Role } = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MIDDLE: "MID",
  BOTTOM: "ADC",
  UTILITY: "SUPPORT",
};

export function roleFromPosition(position: string): Role | null {
  return POSITION_TO_ROLE[position] ?? null;
}
