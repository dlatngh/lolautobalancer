export enum Divisions {
  I = 4,
  II = 3,
  III = 2,
  IV = 1,
}
export function getDivisionValue(division: keyof typeof Divisions): number {
  return Divisions[division];
}
