import React, { useEffect, useState } from 'react';
import { ScoreThreshold } from '../utils/highScoreSystem';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Trophy, Star, Zap } from 'lucide-react';

interface CelebrationModalProps {
  isVisible: boolean;
  achievement: ScoreThreshold | null;
  isNewHighScore: boolean;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isVisible,
  achievement,
  isNewHighScore,
  onClose,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !achievement) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
          {[...Array(30)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute text-2xl animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            >
              ⭐
            </div>
          ))}
        </div>
      )}

      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-yellow-400 p-8 max-w-md w-full text-center shadow-2xl shadow-yellow-400/30 animate-in zoom-in duration-500">
        <div className="mb-6">
          {isNewHighScore && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy className="w-8 h-8 text-yellow-400 animate-bounce" />
              <span className="text-2xl font-bold text-yellow-400 animate-pulse">
                NEW HIGH SCORE!
              </span>
              <Trophy className="w-8 h-8 text-yellow-400 animate-bounce" />
            </div>
          )}
          
          <div className="text-6xl mb-4 animate-bounce">{achievement.icon}</div>
          
          <h2 className={`text-3xl font-bold mb-2 ${achievement.color} animate-pulse`}>
            {achievement.title}
          </h2>
          
          <p className="text-lg text-slate-300 mb-6">
            {achievement.description}
          </p>

          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold">Achievement Unlocked!</span>
            <Star className="w-5 h-5 text-yellow-400" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-aex-green" />
              <span className="text-sm text-slate-300">
                You have mastered the art of grid management!
              </span>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-aex-green to-accent-blue hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Continue Playing
          </Button>
        </div>
      </Card>
    </div>
  );
};