export type Difficulty = 'Easy' | 'Normal' | 'Hard';

export type GamePhase = 'intro' | 'playing' | 'gameOver';

export interface GameState {
  currentTick: number;
  gameTime: string;
  isMiningActive: boolean;
  miningLoad: number; // 0, 25, 50, 75, 100 (percentage)
  totalProfit: number;
  wastedEnergy: number;
  gridStabilityScore: number;
  blackoutCount: number;
  isGameOver: boolean;
  gameWon: boolean;
  consecutiveShortage: number;
  cityDemandCurve: number[];
  renewableSupplyCurve: number[];
  gridSupportBonus: number; // Track emergency grid support earnings
  isExpertMode: boolean; // Enable partial load controls
}

export const GAME_DURATION = 60000; // 60 seconds
export const TICK_INTERVAL = 100; // 100ms per tick

export const DIFFICULTY_SETTINGS = {
  Easy: {
    aexLoad: 35,
    btcRevenue: 150,
    peakRate: 50,
    surplusCredit: -5,
    blackoutTicks: 15,
    stabilityGain: 0.5,
    stabilityLoss: 1,
    // Phase 1 improvements
    shoulderHourMultiplier: 1.3, // Higher BTC revenue during shoulder hours
    emergencyGridSupportBonus: 200, // Bonus for not mining during peak demand
    cautionThreshold: -30, // Yellow warning threshold
    dangerThreshold: -40, // Red warning threshold
  },
  Normal: {
    aexLoad: 40,
    btcRevenue: 120,
    peakRate: 80,
    surplusCredit: -10,
    blackoutTicks: 10,
    stabilityGain: 0.4,
    stabilityLoss: 1.5,
    // Phase 1 improvements
    shoulderHourMultiplier: 1.4,
    emergencyGridSupportBonus: 300,
    cautionThreshold: -25,
    dangerThreshold: -35,
  },
  Hard: {
    aexLoad: 45,
    btcRevenue: 100,
    peakRate: 120,
    surplusCredit: -15,
    blackoutTicks: 7,
    stabilityGain: 0.3,
    stabilityLoss: 2,
    // Phase 1 improvements
    shoulderHourMultiplier: 1.5,
    emergencyGridSupportBonus: 400,
    cautionThreshold: -20,
    dangerThreshold: -30,
  },
};