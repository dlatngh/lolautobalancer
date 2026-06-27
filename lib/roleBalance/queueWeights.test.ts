import { describe, expect, it } from "vitest";
import { QUEUE_WEIGHTS, queueCategory } from "./queueWeights";

describe("queueCategory", () => {
  it("test_GIVEN_tracked_queue_ids_WHEN_queueCategory_THEN_maps_to_category", () => {
    expect(queueCategory(420)).toBe("SOLO_DUO");
    expect(queueCategory(440)).toBe("FLEX");
    expect(queueCategory(400)).toBe("NORMAL");
  });

  it("test_GIVEN_excluded_casual_queue_ids_WHEN_queueCategory_THEN_returns_null", () => {
    expect(queueCategory(430)).toBeNull(); // blind pick
    expect(queueCategory(490)).toBeNull(); // quickplay
    expect(queueCategory(480)).toBeNull(); // swiftplay
  });

  it("test_GIVEN_untracked_queue_id_WHEN_queueCategory_THEN_returns_null", () => {
    expect(queueCategory(450)).toBeNull(); // ARAM
    expect(queueCategory(1700)).toBeNull(); // Arena
  });

  it("test_GIVEN_weights_WHEN_read_THEN_soloduo_gt_flex_gt_normal", () => {
    expect(QUEUE_WEIGHTS.SOLO_DUO).toBeGreaterThan(QUEUE_WEIGHTS.FLEX);
    expect(QUEUE_WEIGHTS.FLEX).toBeGreaterThan(QUEUE_WEIGHTS.NORMAL);
  });
});
