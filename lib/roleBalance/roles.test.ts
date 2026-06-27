import { describe, expect, it } from "vitest";
import { ROLES, roleFromPosition } from "./roles";

describe("roleFromPosition", () => {
  it("test_GIVEN_riot_positions_WHEN_roleFromPosition_THEN_maps_to_five_roles", () => {
    expect(roleFromPosition("TOP")).toBe("TOP");
    expect(roleFromPosition("JUNGLE")).toBe("JUNGLE");
    expect(roleFromPosition("MIDDLE")).toBe("MID");
    expect(roleFromPosition("BOTTOM")).toBe("ADC");
    expect(roleFromPosition("UTILITY")).toBe("SUPPORT");
  });

  it("test_GIVEN_unknown_or_empty_position_WHEN_roleFromPosition_THEN_returns_null", () => {
    expect(roleFromPosition("")).toBeNull();
    expect(roleFromPosition("Invalid")).toBeNull();
    expect(roleFromPosition("AFK")).toBeNull();
  });

  it("test_GIVEN_ROLES_WHEN_read_THEN_has_five_distinct_roles", () => {
    expect(ROLES).toHaveLength(5);
    expect(new Set(ROLES).size).toBe(5);
  });
});
