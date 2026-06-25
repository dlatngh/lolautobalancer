export enum Divisions {
  I = 4,
  II = 3,
  III = 2,
  IV = 1,
}
export function getDivisionValue(division: keyof typeof Divisions): number {
  return Divisions[division];
}

export function getDivisionEnum(division: string): Divisions | null {
  switch (division.toUpperCase()) {
    case "I":
      return Divisions.I;
    case "II":
      return Divisions.II;
    case "III":
      return Divisions.III;
    case "IV":
      return Divisions.IV;
    default:
      return null;
  }
}
