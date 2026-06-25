const LOWER_BREAKPOINT = 0.02425;
const UPPER_BREAKPOINT = 1 - LOWER_BREAKPOINT;
const PROBABILITY_EPSILON = 1e-9;

const CENTRAL_NUMERATOR = [
  -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
  1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
];
const CENTRAL_DENOMINATOR = [
  -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
  6.680131188771972e1, -1.328068155288572e1,
];
const TAIL_NUMERATOR = [
  -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
  -2.549732539343734, 4.374664141464968, 2.938163982698783,
];
const TAIL_DENOMINATOR = [
  7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
  3.754408661907416,
];

export function inverseNormalCDF(probability: number): number {
  const p = clampProbability(probability);
  if (p < LOWER_BREAKPOINT) {
    return lowerTail(Math.sqrt(-2 * Math.log(p)));
  }
  if (p > UPPER_BREAKPOINT) {
    return -lowerTail(Math.sqrt(-2 * Math.log(1 - p)));
  }
  return central(p);
}

function central(p: number): number {
  const q = p - 0.5;
  const r = q * q;
  const numerator =
    (((((CENTRAL_NUMERATOR[0] * r + CENTRAL_NUMERATOR[1]) * r +
      CENTRAL_NUMERATOR[2]) *
      r +
      CENTRAL_NUMERATOR[3]) *
      r +
      CENTRAL_NUMERATOR[4]) *
      r +
      CENTRAL_NUMERATOR[5]) *
    q;
  const denominator =
    ((((CENTRAL_DENOMINATOR[0] * r + CENTRAL_DENOMINATOR[1]) * r +
      CENTRAL_DENOMINATOR[2]) *
      r +
      CENTRAL_DENOMINATOR[3]) *
      r +
      CENTRAL_DENOMINATOR[4]) *
      r +
    1;
  return numerator / denominator;
}

function lowerTail(q: number): number {
  const numerator =
    ((((TAIL_NUMERATOR[0] * q + TAIL_NUMERATOR[1]) * q + TAIL_NUMERATOR[2]) *
      q +
      TAIL_NUMERATOR[3]) *
      q +
      TAIL_NUMERATOR[4]) *
      q +
    TAIL_NUMERATOR[5];
  const denominator =
    (((TAIL_DENOMINATOR[0] * q + TAIL_DENOMINATOR[1]) * q +
      TAIL_DENOMINATOR[2]) *
      q +
      TAIL_DENOMINATOR[3]) *
      q +
    1;
  return numerator / denominator;
}

function clampProbability(probability: number): number {
  const lowerBound = PROBABILITY_EPSILON;
  const upperBound = 1 - PROBABILITY_EPSILON;
  return Math.min(Math.max(probability, lowerBound), upperBound);
}
