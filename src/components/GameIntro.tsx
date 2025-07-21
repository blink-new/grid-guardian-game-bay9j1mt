import React from 'react';
import { Button } from './ui/button';
import { Volume2, HelpCircle, Trophy, Zap, Target, Flame, Star } from 'lucide-react';
import { Difficulty } from '../types';

interface GameIntroProps {
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onShowTutorial: () => void;
  onShowLeaderboard: () => void;
  onShowSoundSettings: () => void;
}

const difficultyInfo = {
  Easy: {
    icon: <Star className="w-6 h-6" />,
    description: "Perfect for beginners",
    details: "Forgiving grid conditions, slower pace",
    color: "bg-aex-green hover:bg-green-600",
    textColor: "text-aex-green",
    glowColor: "shadow-green-500/50",
    borderColor: "border-green-500/30"
  },
  Normal: {
    icon: <Target className="w-6 h-6" />,
    description: "Balanced challenge",
    details: "Standard grid volatility, moderate pace",
    color: "bg-accent-blue hover:bg-blue-600",
    textColor: "text-accent-blue",
    glowColor: "shadow-blue-500/50",
    borderColor: "border-blue-500/30"
  },
  Hard: {
    icon: <Flame className="w-6 h-6" />,
    description: "Expert level",
    details: "Volatile grid, fast pace, high stakes",
    color: "bg-danger-red hover:bg-red-600",
    textColor: "text-danger-red",
    glowColor: "shadow-red-500/50",
    borderColor: "border-red-500/30"
  }
};

export const GameIntro: React.FC<GameIntroProps> = ({ 
  onSelectDifficulty, 
  onShowTutorial, 
  onShowLeaderboard,
  onShowSoundSettings 
}) => {
  return (
    <div className="min-h-screen grid-guardian-bg flex flex-col items-center justify-center p-4 text-white relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border border-aex-green rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 border border-accent-blue rounded-full"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 border border-warning-orange rounded-full"></div>
      </div>

      {/* Header */}
      <div className="text-center mb-12 z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Zap className="w-12 h-12 text-aex-green" />
          <h1 className="text-6xl font-bold text-aex-green">Grid Guardian</h1>
        </div>
        <p className="text-2xl text-slate-300 mb-2">An Agile EnergyX Simulation</p>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Manage a Bitcoin mining facility to balance Japan's power grid. 
          Use renewable energy wisely and prevent blackouts!
        </p>
      </div>

      {/* Difficulty Selection */}
      <div className="w-full max-w-2xl z-10">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Choose Your Challenge</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(difficultyInfo) as Difficulty[]).map((difficulty) => {
            const info = difficultyInfo[difficulty];
            return (
              <div
                key={difficulty}
                className={`bg-slate-800/80 border-2 ${info.borderColor} rounded-lg p-6 hover:bg-slate-700/80 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${info.glowColor} backdrop-blur-sm group`}
              >
                <div className="text-center mb-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${info.color} mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg ${info.glowColor}`}>
                    {info.icon}
                  </div>
                  <h3 className={`text-2xl font-bold ${info.textColor} mb-2 group-hover:text-white transition-colors duration-300`}>{difficulty}</h3>
                  <p className="text-slate-300 text-sm mb-1 group-hover:text-slate-200 transition-colors duration-300">{info.description}</p>
                  <p className="text-slate-400 text-xs group-hover:text-slate-300 transition-colors duration-300">{info.details}</p>
                </div>
                
                <Button 
                  onClick={() => onSelectDifficulty(difficulty)}
                  className={`w-full py-3 text-lg font-semibold ${info.color} text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl`}
                >
                  Start {difficulty}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Info */}
      <div className="mt-12 text-center max-w-xl z-10">
        <div className="bg-slate-800/60 border border-slate-600 rounded-lg p-6 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-aex-green mb-3">Game Objective</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Balance renewable energy supply with city demand over 24 virtual hours (60 seconds real-time). 
            Activate your mining facility during energy surplus to earn profit and prevent waste. 
            Deactivate during shortages to avoid blackouts!
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-3">
        <Button 
          onClick={() => onSelectDifficulty('Easy')}
          variant="outline"
          className="border-slate-500 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-aex-green transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-green-500/30"
        >
          <HelpCircle className="w-5 h-5 mr-2" />
          How to Play
        </Button>
        <Button 
          onClick={onShowLeaderboard}
          variant="outline"
          className="border-slate-500 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-yellow-400 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-yellow-500/30"
        >
          <Trophy className="w-5 h-5 mr-2" />
          Leaderboard
        </Button>
        <Button 
          onClick={onShowSoundSettings}
          variant="outline"
          className="border-slate-500 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-accent-blue transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/30"
        >
          <Volume2 className="w-5 h-5 mr-2" />
          Sound Settings
        </Button>
      </div>

      {/* AEX Branding */}
      <div className="absolute bottom-8 left-8 text-slate-500 text-sm">
        <p>Powered by Agile EnergyX</p>
        <p className="text-xs">© 2025 Grid Guardian Simulation</p>
      </div>
    </div>
  );
};