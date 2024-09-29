export function calculateMean(ratings: number[]): number {
    const total = ratings.reduce((acc, rating) => acc + rating, 0);
    return total / ratings.length;
  }
  
  export function calculateStandardDeviation(ratings: number[], mean: number): number {
    const squaredDifferences = ratings.map((rating) =>
      Math.pow(rating - mean, 2)
    );
    const averageSquareDiff =
      squaredDifferences.reduce((acc, val) => acc + val, 0) / ratings.length;
    return Math.sqrt(averageSquareDiff);
  }
  