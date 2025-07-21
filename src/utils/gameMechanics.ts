import { DIFFICULTY_SETTINGS, Difficulty } from '../types';

/**
 * Determines if current time is during peak demand period
 */
export const isPeakDemandPeriod = (gameTimeMinutes: number): boolean => {
  // Peak hours: 17:00-21:00 (evening peak)
  return gameTimeMinutes >= 17 && gameTimeMinutes <= 21;
};

/**
 * Determines if current time is during shoulder hours (good for mining)
 */
export const isShoulderHours = (gameTimeMinutes: number): boolean => {
  // Shoulder hours: 09:00-17:00 and 21:00-23:00
  return (gameTimeMinutes >= 9 && gameTimeMinutes < 17) || 
         (gameTimeMinutes > 21 && gameTimeMinutes < 23);
};

/**
 * Gets the warning level based on grid load
 */
export const getWarningLevel = (gridLoad: number, difficulty: Difficulty): 'none' | 'caution' | 'danger' | 'blackout' => {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  
  if (gridLoad <= -50) return 'blackout';
  if (gridLoad <= settings.dangerThreshold) return 'danger';
  if (gridLoad <= settings.cautionThreshold) return 'caution';
  return 'none';
};

/**
 * Calculates BTC revenue with time-based multipliers
 */
export const calculateBTCRevenue = (
  baseRevenue: number, 
  gameTimeMinutes: number, 
  difficulty: Difficulty,
  miningLoad: number
): number => {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  let revenue = baseRevenue;
  
  // Apply shoulder hour bonus
  if (isShoulderHours(gameTimeMinutes)) {
    revenue *= settings.shoulderHourMultiplier;
  }
  
  // Apply mining load percentage
  revenue *= (miningLoad / 100);
  
  return revenue;
};

/**
 * Calculates emergency grid support bonus for NOT mining during peak demand
 */
export const calculateGridSupportBonus = (
  gameTimeMinutes: number,
  difficulty: Difficulty,
  isMining: boolean
): number => {
  if (!isPeakDemandPeriod(gameTimeMinutes) || isMining) {
    return 0;
  }
  
  const settings = DIFFICULTY_SETTINGS[difficulty];
  return settings.emergencyGridSupportBonus;
};

/**
 * Gets the next mining load level in the cycle
 */
export const getNextMiningLoad = (currentLoad: number): number => {
  const levels = [0, 25, 50, 75, 100];
  const currentIndex = levels.indexOf(currentLoad);
  return levels[(currentIndex + 1) % levels.length];
};

/**
 * Gets visual representation of mining load
 */
export const getMiningLoadDisplay = (load: number): string => {
  switch (load) {
    case 0: return 'OFF';
    case 25: return '25%';
    case 50: return '50%';
    case 75: return '75%';
    case 100: return '100%';
    default: return 'OFF';
  }
};

/**
 * Gets the appropriate warning message for the current grid state
 */
export const getWarningMessage = (warningLevel: string): string => {
  switch (warningLevel) {
    case 'caution':
      return 'Grid Stress Detected';
    case 'danger':
      return 'Critical Grid Load!';
    case 'blackout':
      return 'BLACKOUT IMMINENT!';
    default:
      return '';
  }
};

/**
 * Gets warning color class for UI
 */
export const getWarningColor = (warningLevel: string): string => {
  switch (warningLevel) {
    case 'caution':
      return 'text-yellow-400';
    case 'danger':
      return 'text-orange-400';
    case 'blackout':
      return 'text-red-400';
    default:
      return 'text-green-400';
  }
};