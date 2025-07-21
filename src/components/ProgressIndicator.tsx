import React from 'react';
import { Difficulty } from '../types';
import { HighScoreManager, ScoreThreshold } from '../utils/highScoreSystem';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Trophy, Target, Star } from 'lucide-react';

interface ProgressIndicatorProps {
  difficulty: Difficulty;
  currentScore: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  difficulty,
  currentScore,
}) => {
  const highScore = HighScoreManager.getHighScore(difficulty);
  const nextThreshold = HighScoreManager.getNextThreshold(difficulty, currentScore);
  const currentThreshold = HighScoreManager.getCurrentThreshold(difficulty, currentScore);
  const pointsToNext = HighScoreManager.getPointsToNextThreshold(difficulty, currentScore);

  if (!nextThreshold) {
    // Player has achieved all thresholds
    return (
      <Card className="bg-gradient-to-r from-purple-900/50 to-yellow-900/50 border-yellow-400 p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-bold">Master Grid Guardian!</span>
          <Trophy className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">
            All Achievements Unlocked!
          </div>
          <div className="text-sm text-slate-300">
            You have mastered every challenge
          </div>
        </div>
      </Card>
    );
  }

  const progressToNext = currentThreshold 
    ? ((currentScore - currentThreshold.score) / (nextThreshold.score - currentThreshold.score)) * 100
    : (currentScore / nextThreshold.score) * 100;

  const isNewHighScore = currentScore > highScore;

  return (
    <Card className={`p-4 transition-all duration-300 ${
      isNewHighScore 
        ? 'bg-gradient-to-r from-yellow-900/50 to-green-900/50 border-yellow-400 shadow-lg shadow-yellow-400/30' 
        : 'bg-slate-800/50 border-slate-700'
    }`}>
      <div className="space-y-3">
        {/* High Score Indicator */}
        {isNewHighScore && (
          <div className="flex items-center justify-center gap-2 animate-pulse">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm">
              NEW HIGH SCORE!
            </span>
            <Star className="w-4 h-4 text-yellow-400" />
          </div>
        )}

        {/* Current Achievement */}
        {currentThreshold && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{currentThreshold.icon}</span>
            <div>
              <div className={`font-bold ${currentThreshold.color}`}>
                {currentThreshold.title}
              </div>
              <div className="text-xs text-slate-400">Current Level</div>
            </div>
          </div>
        )}

        {/* Progress to Next Achievement */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-accent-blue" />
              <span className="text-sm font-medium">Next: {nextThreshold.title}</span>
            </div>
            <span className="text-xs text-slate-400">
              {pointsToNext.toLocaleString()} points to go
            </span>
          </div>
          
          <Progress 
            value={Math.min(100, Math.max(0, progressToNext))} 
            className="h-2"
          />
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {currentScore.toLocaleString()} / {nextThreshold.score.toLocaleString()}
            </span>
            <span className={`font-bold ${nextThreshold.color}`}>
              {nextThreshold.icon} {nextThreshold.title}
            </span>
          </div>
        </div>

        {/* High Score Display */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-600">
          <span className="text-xs text-slate-400">Personal Best ({difficulty}):</span>
          <span className="text-sm font-bold text-aex-green">
            ¥{highScore.toLocaleString()}
          </span>
        </div>
      </div>
    </Card>
  );
};