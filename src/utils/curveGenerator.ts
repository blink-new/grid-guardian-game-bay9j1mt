import { Difficulty } from '../types';

const BASE_CITY_DEMAND = [
  20, 18, 17, 16, 17, 20, 25, 35, 50, 65, 75, 80, 78, 75, 70, 68, 72, 85, 95, 90, 80, 60, 40, 25
];

const BASE_RENEWABLE_SUPPLY = [
  0, 0, 0, 0, 0, 5, 15, 30, 50, 70, 85, 95, 100, 98, 90, 75, 55, 30, 10, 5, 0, 0, 0, 0
];

const interpolate = (curve: number[], points: number): number[] => {
  const newCurve: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const index = t * (curve.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    const value = curve[lower] * (1 - weight) + curve[upper] * weight;
    newCurve.push(value);
  }
  return newCurve;
};

const randomizeCurve = (curve: number[], amount: number): number[] => {
  return curve.map(point => point + (Math.random() - 0.5) * amount);
};

export const generateRandomizedCurves = (difficulty: Difficulty) => {
  const points = 100; // Number of points for the game duration
  let demandVolatility = 5;
  let supplyVolatility = 5;

  switch (difficulty) {
    case 'Easy':
      demandVolatility = 3;
      supplyVolatility = 3;
      break;
    case 'Normal':
      demandVolatility = 6;
      supplyVolatility = 6;
      break;
    case 'Hard':
      demandVolatility = 10;
      supplyVolatility = 10;
      break;
  }

  const cityDemand = randomizeCurve(interpolate(BASE_CITY_DEMAND, points), demandVolatility);
  const renewableSupply = randomizeCurve(interpolate(BASE_RENEWABLE_SUPPLY, points), supplyVolatility);

  return { cityDemand, renewableSupply };
};