import { describe, expect, it } from "vitest";
import { inverseNormalCDF } from "./normalDistribution";

describe("inverseNormalCDF", () => {
  it("test_GIVEN_median_probability_WHEN_inverseNormalCDF_THEN_returns_near_zero", () => {
    expect(Math.abs(inverseNormalCDF(0.5))).toBeLessThan(1e-6);
  });

  it("test_GIVEN_symmetric_probabilities_WHEN_inverseNormalCDF_THEN_outputs_are_negatives", () => {
    expect(inverseNormalCDF(0.25)).toBeCloseTo(-inverseNormalCDF(0.75), 6);
  });

  it("test_GIVEN_increasing_probabilities_WHEN_inverseNormalCDF_THEN_output_strictly_increases", () => {
    const probabilities = [0.05, 0.2, 0.4, 0.6, 0.8, 0.95];
    const outputs = probabilities.map(inverseNormalCDF);
    for (let i = 1; i < outputs.length; i++) {
      expect(outputs[i]).toBeGreaterThan(outputs[i - 1]);
    }
  });

  it("test_GIVEN_known_quantile_WHEN_inverseNormalCDF_THEN_matches_reference", () => {
    expect(inverseNormalCDF(0.975)).toBeCloseTo(1.959964, 4);
  });

  it("test_GIVEN_out_of_range_probability_WHEN_inverseNormalCDF_THEN_is_clamped_and_finite", () => {
    expect(Number.isFinite(inverseNormalCDF(0))).toBe(true);
    expect(Number.isFinite(inverseNormalCDF(1))).toBe(true);
  });
});
