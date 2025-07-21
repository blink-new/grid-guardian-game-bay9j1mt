import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Difficulty, GamePhase, GameState, DIFFICULTY_SETTINGS, GAME_DURATION, TICK_INTERVAL } from './types';
import { generateRandomizedCurves } from './utils/curveGenerator';
import * as soundGenerator from './utils/soundGenerator';
import { getTriggeredFacts, getRandomFact, EducationalFact } from './utils/educationalFacts';
import { HighScoreManager, ScoreThreshold } from './utils/highScoreSystem';
import { 
  getWarningLevel, 
  calculateBTCRevenue, 
  calculateGridSupportBonus, 
  getNextMiningLoad, 
  getMiningLoadDisplay,
  getWarningMessage,
  getWarningColor
} from './utils/gameMechanics';
import { GameIntro } from './components/GameIntro';
import { Leaderboard } from './components/Leaderboard';
import { SoundSettings } from './components/SoundSettings';
import { Tutorial } from './components/Tutorial';
import { CelebrationModal } from './components/CelebrationModal';
import { ProgressIndicator } from './components/ProgressIndicator';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { HelpCircle, Sun, Wind, Building2, AlertTriangle, Zap, Settings } from 'lucide-react';

const GridGuardianGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('Normal');
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
  const [gameState, setGameState] = useState<GameState>(() => {
    const { cityDemand, renewableSupply } = generateRandomizedCurves(difficulty);
    return {
      currentTick: 0,
      gameTime: '00:00',
      isMiningActive: false,
      miningLoad: 0,
      totalProfit: 0,
      wastedEnergy: 0,
      gridStabilityScore: 100,
      blackoutCount: 0,
      isGameOver: false,
      gameWon: false,
      consecutiveShortage: 0,
      cityDemandCurve: cityDemand,
      renewableSupplyCurve: renewableSupply,
      gridSupportBonus: 0,
      isExpertMode: false,
    };
  });

  const [showTutorial, setShowTutorial] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
    // Check localStorage for tutorial completion
    return localStorage.getItem('gridGuardianTutorialCompleted') === 'true';
  });

  // Educational and engagement features
  const [shownFactIds, setShownFactIds] = useState<Set<string>>(new Set());
  const [lastFactTime, setLastFactTime] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationAchievement, setCelebrationAchievement] = useState<ScoreThreshold | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [lastAchievementScore, setLastAchievementScore] = useState(0);

  const miningHumStopRef = useRef<(() => void) | null>(null);
  const ambientMusicStopRef = useRef<(() => void) | null>(null);
  const lastWarningTimeRef = useRef<number>(0);

  const startGame = useCallback(async (currentDifficulty: Difficulty) => {
    if (isButtonDisabled) return;
    
    try {
      setIsButtonDisabled(true);
      soundGenerator.playButtonClick();
      
      ambientMusicStopRef.current = await soundGenerator.startAmbientMusic();
      
      const { cityDemand, renewableSupply } = generateRandomizedCurves(currentDifficulty);
      setGameState({
        currentTick: 0,
        gameTime: '00:00',
        isMiningActive: false,
        miningLoad: 0,
        totalProfit: 0,
        wastedEnergy: 0,
        gridStabilityScore: 100,
        blackoutCount: 0,
        isGameOver: false,
        gameWon: false,
        consecutiveShortage: 0,
        cityDemandCurve: cityDemand,
        renewableSupplyCurve: renewableSupply,
        gridSupportBonus: 0,
        isExpertMode: false,
      });

      // Reset educational and engagement features
      setShownFactIds(new Set());
      setLastFactTime(0);
      setShowCelebration(false);
      setCelebrationAchievement(null);
      setIsNewHighScore(false);
      setLastAchievementScore(0);

      setGamePhase('playing');
      setIsButtonDisabled(false);
    } catch (error) {
      console.error('Error starting game:', error);
      setIsButtonDisabled(false);
    }
  }, [isButtonDisabled]);

  const selectDifficulty = useCallback((selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    } else {
      startGame(selectedDifficulty);
    }
  }, [hasSeenTutorial, startGame]);

  const toggleMining = useCallback(async () => {
    console.log('Toggle mining clicked, game over:', gameState.isGameOver);
    if (!gameState.isGameOver) {
      if (gameState.isExpertMode) {
        // Expert mode: cycle through partial loads
        const newMiningLoad = getNextMiningLoad(gameState.miningLoad);
        const newMiningState = newMiningLoad > 0;
        
        console.log('Expert mode: changing mining load from', gameState.miningLoad, 'to', newMiningLoad);
        
        // Play sound effects
        if (newMiningState && !gameState.isMiningActive) {
          soundGenerator.playMiningActivate();
          miningHumStopRef.current = await soundGenerator.startMiningHum();
        } else if (!newMiningState && gameState.isMiningActive) {
          soundGenerator.playMiningDeactivate();
          if (miningHumStopRef.current) {
            miningHumStopRef.current();
            miningHumStopRef.current = null;
          }
        } else {
          soundGenerator.playButtonClick(); // Just a click for load changes
        }
        
        setGameState(prev => ({ 
          ...prev, 
          isMiningActive: newMiningState,
          miningLoad: newMiningLoad
        }));
      } else {
        // Normal mode: simple on/off toggle
        const newMiningState = !gameState.isMiningActive;
        const newMiningLoad = newMiningState ? 100 : 0;
        
        console.log('Normal mode: toggling mining from', gameState.isMiningActive, 'to', newMiningState);
        
        // Play sound effects
        if (newMiningState) {
          soundGenerator.playMiningActivate();
          miningHumStopRef.current = await soundGenerator.startMiningHum();
        } else {
          soundGenerator.playMiningDeactivate();
          if (miningHumStopRef.current) {
            miningHumStopRef.current();
            miningHumStopRef.current = null;
          }
        }
        
        setGameState(prev => ({ 
          ...prev, 
          isMiningActive: newMiningState,
          miningLoad: newMiningLoad
        }));
      }
    }
  }, [gameState.isGameOver, gameState.isMiningActive, gameState.miningLoad, gameState.isExpertMode]);

  const toggleExpertMode = useCallback(() => {
    soundGenerator.playButtonClick();
    setGameState(prev => ({
      ...prev,
      isExpertMode: !prev.isExpertMode,
      // Reset to simple on/off when switching modes
      miningLoad: prev.isMiningActive ? 100 : 0
    }));
  }, []);

  const resetGame = useCallback(() => {
    soundGenerator.playButtonClick();
    
    if (miningHumStopRef.current) {
      miningHumStopRef.current();
      miningHumStopRef.current = null;
    }
    if (ambientMusicStopRef.current) {
      ambientMusicStopRef.current();
      ambientMusicStopRef.current = null;
    }
    
    setGamePhase('intro');
    setShowTutorial(false);
    setShowLeaderboard(false);
    setShowSoundSettings(false);
  }, []);

  const completeTutorial = useCallback(() => {
    soundGenerator.playButtonClick();
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem('gridGuardianTutorialCompleted', 'true');
    startGame(difficulty);
  }, [startGame, difficulty]);

  const skipTutorial = useCallback(() => {
    soundGenerator.playButtonClick();
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem('gridGuardianTutorialCompleted', 'true');
    startGame(difficulty);
  }, [startGame, difficulty]);

  const showTutorialAgain = useCallback(() => {
    soundGenerator.playButtonClick();
    setShowTutorial(true);
  }, []);

  const showSoundSettingsModal = useCallback(() => {
    soundGenerator.playButtonClick();
    setShowSoundSettings(true);
  }, []);

  const closeSoundSettings = useCallback(() => {
    soundGenerator.playButtonClick();
    setShowSoundSettings(false);
  }, []);

  const showLeaderboardModal = useCallback(() => {
    soundGenerator.playButtonClick();
    setShowLeaderboard(true);
  }, []);

  const closeLeaderboard = useCallback(() => {
    soundGenerator.playButtonClick();
    setShowLeaderboard(false);
  }, []);

  // Educational fact display function
  const showEducationalFact = useCallback((fact: EducationalFact) => {
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-gradient-to-r from-slate-800 to-slate-900 border border-aex-green shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <span className="text-2xl">{fact.icon}</span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-aex-green">
                {fact.title}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {fact.content}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-slate-600">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-aex-green"
          >
            ✕
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      position: 'top-right',
    });
    
    setShownFactIds(prev => new Set([...prev, fact.id]));
  }, []);

  // Check for achievement unlocks
  const checkAchievements = useCallback((currentScore: number) => {
    const currentThreshold = HighScoreManager.getCurrentThreshold(difficulty, currentScore);
    const lastThreshold = HighScoreManager.getCurrentThreshold(difficulty, lastAchievementScore);
    
    // Check if we've unlocked a new achievement
    if (currentThreshold && (!lastThreshold || currentThreshold.score > lastThreshold.score)) {
      setCelebrationAchievement(currentThreshold);
      setShowCelebration(true);
      soundGenerator.playSuccess();
      setLastAchievementScore(currentScore);
    }
  }, [difficulty, lastAchievementScore]);

  const closeCelebration = useCallback(() => {
    setShowCelebration(false);
    setCelebrationAchievement(null);
  }, []);



  const getCurrentValues = useCallback(() => {
    const progress = gameState.currentTick / (GAME_DURATION / TICK_INTERVAL);
    const curveIndex = Math.floor(progress * (gameState.cityDemandCurve.length - 1));
    
    const cityDemand = gameState.cityDemandCurve[curveIndex] || 0;
    const renewableSupply = gameState.renewableSupplyCurve[curveIndex] || 0;
    const aexLoad = gameState.isMiningActive ? 
      (DIFFICULTY_SETTINGS[difficulty].aexLoad * gameState.miningLoad / 100) : 0;
    const gridLoad = renewableSupply - cityDemand - aexLoad;
    
    return { cityDemand, renewableSupply, aexLoad, gridLoad, progress };
  }, [gameState.currentTick, gameState.isMiningActive, gameState.miningLoad, gameState.cityDemandCurve, gameState.renewableSupplyCurve, difficulty]);

  const formatGameTime = (tick: number) => {
    const totalTicks = GAME_DURATION / TICK_INTERVAL;
    const hours = Math.floor((tick / totalTicks) * 24);
    const minutes = Math.floor(((tick / totalTicks) * 24 * 60) % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getGridStatus = (gridLoad: number) => {
    const warningLevel = getWarningLevel(gridLoad, difficulty);
    
    if (gridLoad > 15) return { 
      status: 'SURPLUS', 
      color: 'warning-orange', 
      zone: 'right',
      warningLevel: 'none',
      warningMessage: ''
    };
    if (gridLoad >= -15) return { 
      status: 'BALANCED', 
      color: 'aex-green', 
      zone: 'center',
      warningLevel: 'none',
      warningMessage: ''
    };
    
    // Use the new graduated warning system
    const warningMessage = getWarningMessage(warningLevel);
    const warningColor = getWarningColor(warningLevel);
    
    if (warningLevel === 'blackout') {
      return { status: 'BLACKOUT RISK!', color: 'danger-red', zone: 'left', warningLevel, warningMessage };
    } else if (warningLevel === 'danger') {
      return { status: 'CRITICAL LOAD', color: 'danger-red', zone: 'left', warningLevel, warningMessage };
    } else if (warningLevel === 'caution') {
      return { status: 'GRID STRESS', color: 'warning-orange', zone: 'left', warningLevel, warningMessage };
    } else {
      return { status: 'SHORTAGE', color: 'danger-red', zone: 'left', warningLevel, warningMessage };
    }
  };

  const getNeedleRotation = (gridLoad: number) => {
    // Map grid load (-50 to +50) to rotation (-90deg to +90deg)
    const clampedLoad = Math.max(-50, Math.min(50, gridLoad));
    return (clampedLoad / 50) * 90;
  };



  // Game tick logic
  useEffect(() => {
    if (gamePhase !== 'playing' || gameState.isGameOver) return;

    const settings = DIFFICULTY_SETTINGS[difficulty];

    const interval = setInterval(() => {
      setGameState(prevState => {
        const newTick = prevState.currentTick + 1;
        const newGameTime = formatGameTime(newTick);
        
        if (newTick >= GAME_DURATION / TICK_INTERVAL) {
          return {
            ...prevState,
            currentTick: newTick,
            gameTime: newGameTime,
            isGameOver: true,
            gameWon: true,
          };
        }

        const progress = newTick / (GAME_DURATION / TICK_INTERVAL);
        const curveIndex = Math.floor(progress * (prevState.cityDemandCurve.length - 1));
        const gameTimeMinutes = (newTick / (GAME_DURATION / TICK_INTERVAL)) * 24;
        
        const cityDemand = prevState.cityDemandCurve[curveIndex] || 0;
        const renewableSupply = prevState.renewableSupplyCurve[curveIndex] || 0;
        const aexLoad = prevState.isMiningActive ? 
          (settings.aexLoad * prevState.miningLoad / 100) : 0;
        const gridLoad = renewableSupply - cityDemand - aexLoad;

        // Enhanced electricity cost calculation
        let electricityCost = 0;
        if (gridLoad > 15) {
          electricityCost = settings.surplusCredit;
        } else if (gridLoad >= -15) {
          electricityCost = 10; // Standard Rate
        } else {
          electricityCost = settings.peakRate;
        }

        // Enhanced BTC revenue calculation with time-based multipliers
        const btcRevenue = prevState.isMiningActive ? 
          calculateBTCRevenue(settings.btcRevenue, gameTimeMinutes, difficulty, prevState.miningLoad) : 0;
        
        // Calculate emergency grid support bonus
        const gridSupportBonus = calculateGridSupportBonus(gameTimeMinutes, difficulty, prevState.isMiningActive);
        
        const profitThisTick = btcRevenue - (electricityCost * (aexLoad / 100)) + gridSupportBonus;
        
        let newWastedEnergy = prevState.wastedEnergy;
        if (gridLoad > 0 && !prevState.isMiningActive) {
          newWastedEnergy += gridLoad;
        }

        let newStabilityScore = prevState.gridStabilityScore;
        if (gridLoad > -20 && gridLoad < 30) {
          newStabilityScore = Math.min(100, newStabilityScore + settings.stabilityGain);
        } else {
          newStabilityScore = Math.max(0, newStabilityScore - settings.stabilityLoss);
        }

        let newConsecutiveShortage = prevState.consecutiveShortage;
        let newBlackoutCount = prevState.blackoutCount;
        let isGameOver = false;

        // Enhanced warning system with graduated warnings
        const warningLevel = getWarningLevel(gridLoad, difficulty);
        
        if (gridLoad < -50) {
          newConsecutiveShortage += 1;
          
          const now = Date.now();
          if (now - lastWarningTimeRef.current > 2000) {
            soundGenerator.playWarning();
            lastWarningTimeRef.current = now;
          }
          
          if (newConsecutiveShortage >= settings.blackoutTicks) {
            isGameOver = true;
            newBlackoutCount += 1;
          }
        } else if (warningLevel === 'danger' || warningLevel === 'caution') {
          // Play softer warnings for caution/danger levels
          const now = Date.now();
          if (now - lastWarningTimeRef.current > 3000) {
            soundGenerator.playButtonClick(); // Softer warning sound
            lastWarningTimeRef.current = now;
          }
          newConsecutiveShortage = Math.max(0, newConsecutiveShortage - 0.5);
        } else {
          newConsecutiveShortage = Math.max(0, newConsecutiveShortage - 1);
        }

        const newState = {
          ...prevState,
          currentTick: newTick,
          gameTime: newGameTime,
          totalProfit: prevState.totalProfit + profitThisTick,
          wastedEnergy: newWastedEnergy,
          gridStabilityScore: newStabilityScore,
          blackoutCount: newBlackoutCount,
          consecutiveShortage: newConsecutiveShortage,
          isGameOver,
          gameWon: !isGameOver,
          gridSupportBonus: prevState.gridSupportBonus + gridSupportBonus,
        };

        // Check for educational facts and achievements
        if (!isGameOver) {
          const gameTimeMinutes = (newTick / (GAME_DURATION / TICK_INTERVAL)) * 24;
          const gridStatus = gridLoad > 15 ? 'surplus' : gridLoad < -15 ? 'shortage' : 'balanced';
          
          // Show educational facts
          const triggeredFacts = getTriggeredFacts(gameTimeMinutes, gridStatus, prevState.isMiningActive, shownFactIds);
          if (triggeredFacts.length > 0) {
            showEducationalFact(triggeredFacts[0]);
          } else if (Date.now() - lastFactTime > 15000) { // Show random fact every 15 seconds
            const randomFact = getRandomFact(shownFactIds);
            if (randomFact) {
              showEducationalFact(randomFact);
              setLastFactTime(Date.now());
            }
          }

          // Check for achievements
          const finalScore = Math.round((prevState.totalProfit + profitThisTick) * (newStabilityScore / 100));
          checkAchievements(finalScore);
        }

        return newState;
      });
    }, TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [gamePhase, gameState.isGameOver, difficulty, shownFactIds, lastFactTime, checkAchievements, showEducationalFact]);

  const { cityDemand, renewableSupply, gridLoad } = getCurrentValues();
  const gridStatus = getGridStatus(gridLoad);
  const needleRotation = getNeedleRotation(gridLoad);
  const stabilityMultiplier = gameState.gridStabilityScore / 100;
  const finalScore = Math.round(gameState.totalProfit * stabilityMultiplier);

  // Show end screen when game is over
  useEffect(() => {
    if (gameState.isGameOver) {
      // Stop all sounds
      if (miningHumStopRef.current) {
        miningHumStopRef.current();
        miningHumStopRef.current = null;
      }
      if (ambientMusicStopRef.current) {
        ambientMusicStopRef.current();
        ambientMusicStopRef.current = null;
      }
      
      // Save high score and check if it's a new record
      const achievements = HighScoreManager.getAllAchievements(difficulty, finalScore);
      const achievementTitles = achievements.map(a => a.title);
      const isNewRecord = HighScoreManager.saveHighScore(difficulty, finalScore, achievementTitles);
      setIsNewHighScore(isNewRecord);
      
      // Play appropriate end sound
      if (gameState.gameWon) {
        soundGenerator.playSuccess();
      }
      
      // Set game phase to gameOver and show leaderboard after a short delay
      setGamePhase('gameOver');
      setTimeout(() => {
        setShowLeaderboard(true);
      }, 500);
    }
  }, [gameState.isGameOver, gameState.gameWon, difficulty, finalScore]);

  // Main game screen
  if (gamePhase === 'playing') {
    return (
      <div className={`min-h-screen grid-guardian-bg p-4 ${gameState.consecutiveShortage >= 8 ? 'blackout-flash' : ''}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1"></div>
              <h1 className="text-3xl font-bold text-aex-green drop-shadow-lg">Grid Guardian: An Agile EnergyX Simulation</h1>
              <div className="flex-1 flex justify-end">
                <Button
                  onClick={showTutorialAgain}
                  variant="outline"
                  size="sm"
                  className="border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/30"
                >
                  <HelpCircle className="w-4 h-4 mr-1" />
                  Help
                </Button>
              </div>
            </div>
            <div className="flex justify-center items-center gap-8">
              <div className="bg-slate-800/60 border border-slate-600 rounded-lg px-4 py-2 backdrop-blur-sm">
                <div className="text-sm text-slate-400 mb-1">Virtual Time</div>
                <div className="text-2xl font-mono text-accent-blue font-bold">
                  {gameState.gameTime}
                </div>
              </div>
              <div className="bg-slate-800/60 border border-slate-600 rounded-lg px-4 py-2 backdrop-blur-sm">
                <div className="text-sm text-slate-400 mb-1">Total Profit</div>
                <div className="text-2xl font-bold">
                  <span className="text-aex-green">¥{Math.round(gameState.totalProfit).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" id="energy-gauges">
            {/* Left: Renewable Energy Supply */}
            <Card className="p-6 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
              <div className="text-center mb-4">
                <div className="flex justify-center items-center gap-2 mb-2">
                  <Sun className={`w-6 h-6 text-yellow-400 ${renewableSupply > 50 ? 'animate-pulse' : ''}`} />
                  <Wind className={`w-6 h-6 text-blue-400 ${renewableSupply > 30 ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                </div>
                <h3 className="text-lg font-semibold">Renewable Energy Supply</h3>
                <p className="text-sm text-slate-200">再生可能エネルギー供給</p>
              </div>
              
              <div className="relative h-48 bg-slate-900/50 rounded-lg p-4 overflow-hidden">
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 bg-gradient-to-t from-green-500 via-green-400 to-green-300 rounded-t-lg transition-all duration-500 ease-out shadow-lg shadow-green-500/50"
                     style={{ height: `${Math.max(0, (renewableSupply / 100) * 160)}px` }}>
                  {renewableSupply > 70 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 animate-pulse"></div>
                  )}
                </div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-xl font-bold text-aex-green drop-shadow-lg">{Math.round(Math.max(0, renewableSupply))}%</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {renewableSupply > 80 ? 'Peak Generation' : renewableSupply > 40 ? 'Good Output' : 'Low Output'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Center: Grid Status Meter */}
            <Card className={`p-6 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 ${gridStatus.status === 'BLACKOUT RISK!' ? 'border-red-500 shadow-lg shadow-red-500/50' : gridStatus.status === 'SURPLUS' ? 'border-orange-500 shadow-lg shadow-orange-500/30' : 'border-green-500 shadow-lg shadow-green-500/30'}`} id="grid-meter">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">GRID STATUS</h3>
                <p className="text-sm text-slate-200">電力系統ステータス</p>
              </div>
              
              <div className="relative h-48 flex items-center justify-center">
                {/* Semi-circular gauge background */}
                <div className="relative w-40 h-20 overflow-hidden">
                  <div className="absolute inset-0 border-8 border-slate-600 rounded-t-full shadow-inner"></div>
                  
                  {/* Colored zones with enhanced gradients */}
                  <div className="absolute left-0 top-0 w-1/3 h-full bg-gradient-to-r from-red-500/40 to-transparent rounded-tl-full"></div>
                  <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-orange-500/40 to-transparent rounded-tr-full"></div>
                  <div className="absolute left-1/3 top-0 w-1/3 h-full bg-green-500/40"></div>
                  
                  {/* Needle with enhanced styling */}
                  <div 
                    className={`absolute bottom-0 left-1/2 w-1 h-16 origin-bottom transform -translate-x-1/2 transition-all duration-500 ease-out shadow-lg ${gridStatus.status === 'BLACKOUT RISK!' ? 'bg-red-400 shadow-red-500/50' : gridStatus.status === 'SURPLUS' ? 'bg-orange-400 shadow-orange-500/50' : 'bg-green-400 shadow-green-500/50'}`}
                    style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
                  >
                    <div className={`absolute top-0 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1 shadow-lg ${gridStatus.status === 'BLACKOUT RISK!' ? 'bg-red-400' : gridStatus.status === 'SURPLUS' ? 'bg-orange-400' : 'bg-green-400'}`}></div>
                  </div>
                </div>
                
                <div className="absolute bottom-0 text-center">
                  <div className={`text-lg font-bold text-${gridStatus.color} drop-shadow-lg ${gridStatus.status === 'BLACKOUT RISK!' ? 'animate-pulse' : ''}`}>
                    {gridStatus.status}
                  </div>
                  {gridStatus.status === 'BLACKOUT RISK!' && (
                    <div className="flex items-center justify-center gap-1 mt-1 animate-bounce">
                      <AlertTriangle className="w-4 h-4 text-danger-red" />
                      <span className="text-sm text-danger-red font-bold">WARNING!</span>
                    </div>
                  )}
                  <div className="text-xs text-slate-400 mt-1">
                    Load: {gridLoad > 0 ? '+' : ''}{Math.round(gridLoad)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Right: City Demand */}
            <Card className="p-6 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
              <div className="text-center mb-4">
                <div className="flex justify-center items-center gap-2 mb-2">
                  <Building2 className={`w-6 h-6 text-blue-400 ${cityDemand > 70 ? 'animate-pulse' : ''}`} />
                </div>
                <h3 className="text-lg font-semibold">City Power Demand</h3>
                <p className="text-sm text-slate-200">都市の電力需要</p>
              </div>
              
              <div className="relative h-48 bg-slate-900/50 rounded-lg p-4 overflow-hidden">
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300 rounded-t-lg transition-all duration-500 ease-out shadow-lg shadow-blue-500/50"
                     style={{ height: `${Math.max(0, (cityDemand / 100) * 160)}px` }}>
                  {cityDemand > 80 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 animate-pulse"></div>
                  )}
                </div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-xl font-bold text-accent-blue drop-shadow-lg">{Math.round(Math.max(0, cityDemand))}%</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {cityDemand > 80 ? 'Peak Demand' : cityDemand > 50 ? 'High Usage' : cityDemand > 20 ? 'Normal Usage' : 'Low Usage'}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <ProgressIndicator difficulty={difficulty} currentScore={finalScore} />
          </div>

          {/* Control Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mining Control */}
            <Card className={`p-6 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 ${gameState.isMiningActive ? 'border-green-500 shadow-lg shadow-green-500/30' : 'border-blue-500 shadow-lg shadow-blue-500/20'}`} id="mining-button">
              <div className="text-center">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">AEX Mining Facility Control</h3>
                  <Button
                    onClick={toggleExpertMode}
                    variant="outline"
                    size="sm"
                    className={`border-slate-500 text-slate-200 hover:scale-105 transition-all duration-300 ${
                      gameState.isExpertMode 
                        ? 'bg-aex-green border-aex-green text-white hover:bg-green-600' 
                        : 'hover:bg-slate-600 hover:text-white'
                    }`}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    {gameState.isExpertMode ? 'Expert' : 'Normal'}
                  </Button>
                </div>
                
                <Button
                  onClick={toggleMining}
                  disabled={gameState.isGameOver}
                  className={`w-full py-6 text-xl font-bold transition-all duration-300 hover:scale-105 shadow-xl ${
                    gameState.isMiningActive 
                      ? 'bg-aex-green hover:bg-green-600 miner-active-glow shadow-green-500/50' 
                      : 'bg-accent-blue hover:bg-aex-green text-white shadow-blue-500/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Zap className={`w-6 h-6 ${gameState.isMiningActive ? 'text-white animate-pulse' : 'text-slate-400'}`} />
                    {gameState.isExpertMode ? 
                      `MINERS ${getMiningLoadDisplay(gameState.miningLoad)}` :
                      (gameState.isMiningActive ? 'MINERS ACTIVE' : 'ACTIVATE MINERS')
                    }
                  </div>
                  <div className="text-sm mt-1">
                    {gameState.isExpertMode ? 
                      `${gameState.miningLoad}% 稼働中` :
                      (gameState.isMiningActive ? 'マイナー稼働中' : 'マイナー稼働')
                    }
                  </div>
                </Button>

                {gameState.isMiningActive && (
                  <div className="mt-4 text-sm text-slate-200 bg-slate-900/50 rounded-lg p-3 border border-green-500/30">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Mining at {gameState.miningLoad}% capacity
                    </div>
                    <div className="text-xs text-slate-400">
                      Power Consumption: {Math.round(DIFFICULTY_SETTINGS[difficulty].aexLoad * gameState.miningLoad / 100)} MW
                    </div>
                  </div>
                )}

                {gameState.isExpertMode && (
                  <div className="mt-3 text-xs text-slate-400 bg-slate-900/30 rounded p-2 border border-slate-600">
                    💡 Expert Mode: Click to cycle through load levels (OFF → 25% → 50% → 75% → 100%)
                  </div>
                )}
              </div>
            </Card>

            {/* Secondary Metrics */}
            <Card className={`p-6 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/20 ${gridStatus.warningLevel === 'caution' ? 'border-yellow-500/50' : gridStatus.warningLevel === 'danger' ? 'border-orange-500/50' : ''}`}>
              <h3 className="text-xl font-semibold mb-4 text-center">Performance Metrics</h3>
              
              {/* Enhanced Warning Display */}
              {gridStatus.warningLevel !== 'none' && gridStatus.warningMessage && (
                <div className={`mb-4 p-3 rounded-lg border text-center ${
                  gridStatus.warningLevel === 'caution' ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400' :
                  gridStatus.warningLevel === 'danger' ? 'bg-orange-900/30 border-orange-500/50 text-orange-400' :
                  'bg-red-900/30 border-red-500/50 text-red-400'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-bold">{gridStatus.warningMessage}</span>
                  </div>
                  <div className="text-xs mt-1 opacity-80">
                    {gridStatus.warningLevel === 'caution' ? 'Monitor grid conditions carefully' :
                     gridStatus.warningLevel === 'danger' ? 'Consider reducing mining load' :
                     'Immediate action required!'}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                  <span className="text-slate-300">Stability Multiplier:</span>
                  <span className="font-bold text-accent-blue text-lg">x{stabilityMultiplier.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                  <span className="text-slate-300">Grid Support Bonus:</span>
                  <span className="font-bold text-aex-green text-lg">¥{Math.round(gameState.gridSupportBonus).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                  <span className="text-slate-300">Wasted Clean Energy:</span>
                  <span className="font-bold text-warning-orange text-lg">{Math.round(gameState.wastedEnergy)} kWh</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                  <span className="text-slate-300">Grid Stability:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500"
                        style={{ width: `${gameState.gridStabilityScore}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-aex-green text-lg">{Math.round(gameState.gridStabilityScore)}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                  <span className="text-slate-300">Current Grid Load:</span>
                  <span className={`font-bold text-lg ${gridLoad > 0 ? 'text-warning-orange' : gridLoad < -10 ? 'text-danger-red' : 'text-aex-green'}`}>
                    {gridLoad > 0 ? '+' : ''}{Math.round(gridLoad)} MW
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                  <span className="text-slate-300">Projected Final Score:</span>
                  <span className="font-bold text-yellow-400 text-lg">¥{finalScore.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Tutorial Overlay */}
        <Tutorial
          isVisible={showTutorial}
          onComplete={completeTutorial}
          onSkip={skipTutorial}
        />

        {/* Sound Settings Overlay */}
        <SoundSettings
          isVisible={showSoundSettings}
          onClose={closeSoundSettings}
        />
        {/* Leaderboard Overlay */}
        <Leaderboard
          isVisible={showLeaderboard}
          onClose={closeLeaderboard}
          playerScore={finalScore}
        />

        {/* Celebration Modal */}
        <CelebrationModal
          isVisible={showCelebration}
          achievement={celebrationAchievement}
          isNewHighScore={isNewHighScore}
          onClose={closeCelebration}
        />
      </div>
    );
  }

  if (gamePhase === 'gameOver') {
    return (
      <div className="min-h-screen grid-guardian-bg p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-aex-green mb-4">Game Complete!</h1>
          <p className="text-xl text-slate-300 mb-6">Final Score: {finalScore.toLocaleString()}</p>
          <Button 
            onClick={resetGame}
            className="bg-accent-blue hover:bg-blue-600 text-white px-8 py-3 text-lg"
          >
            Play Again
          </Button>
        </div>
        <Leaderboard
          isVisible={showLeaderboard}
          onClose={closeLeaderboard}
          playerScore={finalScore}
        />
      </div>
    )
  }

  // Difficulty selection screen
  if (gamePhase === 'intro') {
    return (
      <>
        <GameIntro 
          onSelectDifficulty={selectDifficulty}
          onShowTutorial={showTutorialAgain}
          onShowLeaderboard={showLeaderboardModal}
          onShowSoundSettings={showSoundSettingsModal}
        />
        {showTutorial && <Tutorial
          isVisible={showTutorial}
          onComplete={completeTutorial}
          onSkip={skipTutorial}
        />}
        {showSoundSettings && <SoundSettings
          isVisible={showSoundSettings}
          onClose={closeSoundSettings}
        />}
        {showLeaderboard && <Leaderboard
          isVisible={showLeaderboard}
          onClose={closeLeaderboard}
          playerScore={0}
          isIntroView={true}
        />}
      </>
    );
  }

  return null; // Should not be reached
};

export default GridGuardianGame;