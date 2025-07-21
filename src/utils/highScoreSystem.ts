import { Difficulty } from '../types';

export interface HighScore {
  score: number;
  difficulty: Difficulty;
  date: string;
  achievements: string[];
}

export interface ScoreThreshold {
  score: number;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const SCORE_THRESHOLDS: Record<Difficulty, ScoreThreshold[]> = {
  Easy: [
    { score: 5000, title: 'Grid Apprentice', description: 'You\'re learning the basics!', icon: '🌱', color: 'text-green-400' },
    { score: 10000, title: 'Energy Balancer', description: 'You understand the grid!', icon: '⚖️', color: 'text-blue-400' },
    { score: 15000, title: 'Renewable Champion', description: 'Master of clean energy!', icon: '🌟', color: 'text-yellow-400' },
    { score: 20000, title: 'Grid Guardian', description: 'Ultimate grid protector!', icon: '🛡️', color: 'text-purple-400' },
  ],
  Normal: [
    { score: 8000, title: 'Grid Apprentice', description: 'You\'re learning the basics!', icon: '🌱', color: 'text-green-400' },
    { score: 15000, title: 'Energy Balancer', description: 'You understand the grid!', icon: '⚖️', color: 'text-blue-400' },
    { score: 25000, title: 'Renewable Champion', description: 'Master of clean energy!', icon: '🌟', color: 'text-yellow-400' },
    { score: 35000, title: 'Grid Guardian', description: 'Ultimate grid protector!', icon: '🛡️', color: 'text-purple-400' },
  ],
  Hard: [
    { score: 12000, title: 'Grid Apprentice', description: 'You\'re learning the basics!', icon: '🌱', color: 'text-green-400' },
    { score: 20000, title: 'Energy Balancer', description: 'You understand the grid!', icon: '⚖️', color: 'text-blue-400' },
    { score: 35000, title: 'Renewable Champion', description: 'Master of clean energy!', icon: '🌟', color: 'text-yellow-400' },
    { score: 50000, title: 'Grid Guardian', description: 'Ultimate grid protector!', icon: '🛡️', color: 'text-purple-400' },
  ],
};

export class HighScoreManager {
  private static readonly STORAGE_KEY = 'gridGuardianHighScores';

  static getHighScores(): Record<Difficulty, HighScore | null> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading high scores:', error);
    }
    
    return {
      Easy: null,
      Normal: null,
      Hard: null,
    };
  }

  static saveHighScore(difficulty: Difficulty, score: number, achievements: string[]): boolean {
    try {
      const highScores = this.getHighScores();
      const currentHigh = highScores[difficulty];
      
      if (!currentHigh || score > currentHigh.score) {
        highScores[difficulty] = {
          score,
          difficulty,
          date: new Date().toISOString(),
          achievements,
        };
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(highScores));
        return true; // New high score!
      }
    } catch (error) {
      console.error('Error saving high score:', error);
    }
    
    return false;
  }

  static getHighScore(difficulty: Difficulty): number {
    const highScores = this.getHighScores();
    return highScores[difficulty]?.score || 0;
  }

  static getNextThreshold(difficulty: Difficulty, currentScore: number): ScoreThreshold | null {
    const thresholds = SCORE_THRESHOLDS[difficulty];
    return thresholds.find(threshold => threshold.score > currentScore) || null;
  }

  static getCurrentThreshold(difficulty: Difficulty, currentScore: number): ScoreThreshold | null {
    const thresholds = SCORE_THRESHOLDS[difficulty];
    let current: ScoreThreshold | null = null;
    
    for (const threshold of thresholds) {
      if (currentScore >= threshold.score) {
        current = threshold;
      } else {
        break;
      }
    }
    
    return current;
  }

  static getPointsToNextThreshold(difficulty: Difficulty, currentScore: number): number {
    const nextThreshold = this.getNextThreshold(difficulty, currentScore);
    return nextThreshold ? nextThreshold.score - currentScore : 0;
  }

  static getAllAchievements(difficulty: Difficulty, currentScore: number): ScoreThreshold[] {
    const thresholds = SCORE_THRESHOLDS[difficulty];
    return thresholds.filter(threshold => currentScore >= threshold.score);
  }
}