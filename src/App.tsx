import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { Sun, Wind, Building2, Zap, TrendingUp, AlertTriangle, HelpCircle, Volume2 } from 'lucide-react';
import Tutorial from './components/Tutorial';
import SoundSettings from './components/SoundSettings';
import { soundGenerator } from './utils/soundGenerator';

// Base curves for 24-hour cycle (will be randomized each game)
const BASE_CITY_DEMAND_CURVE = [
  15, 12, 10, 8, 10, 20, 35, 50, 65, 70, 75, 80,
  85, 82, 78, 75, 80, 85, 90, 85, 75, 65, 45, 25
];

const BASE_RENEWABLE_SUPPLY_CURVE = [
  0, 0, 0, 0, 0, 10, 25, 45, 65, 80, 90, 95,
  100, 95, 90, 80, 65, 45, 25, 10, 0, 0, 0, 0
];

// Function to generate randomized curves for each game
const generateRandomizedCurves = () => {
  const cityDemand = BASE_CITY_DEMAND_CURVE.map(value => {
    // Add ±10% random variation to each point (reduced from 15%)
    const variation = (Math.random() - 0.5) * 0.2; // -10% to +10%
    return Math.max(5, Math.min(100, value * (1 + variation)));
  });

  const renewableSupply = BASE_RENEWABLE_SUPPLY_CURVE.map(value => {
    // Add ±12% random variation to renewable supply (reduced from 20%)
    const variation = (Math.random() - 0.5) * 0.24; // -12% to +12%
    return Math.max(0, Math.min(100, value * (1 + variation)));
  });

  return { cityDemand, renewableSupply };
};

const GAME_DURATION = 60000; // 60 seconds
const TICK_INTERVAL = 250; // 4 ticks per second
const AEX_MINING_LOAD = 25; // Reduced from 40 to make it more manageable
const STANDARD_RATE = 10;
const PEAK_RATE = 50;
const BTC_REVENUE = 25;

interface GameState {
  currentTick: number;
  gameTime: string;
  isMiningActive: boolean;
  totalProfit: number;
  wastedEnergy: number;
  gridStabilityScore: number;
  blackoutCount: number;
  isGameOver: boolean;
  gameWon: boolean;
  consecutiveShortage: number;
  cityDemandCurve: number[];
  renewableSupplyCurve: number[];
}

const GridGuardianGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const { cityDemand, renewableSupply } = generateRandomizedCurves();
    return {
      currentTick: 0,
      gameTime: '00:00',
      isMiningActive: false,
      totalProfit: 0,
      wastedEnergy: 0,
      gridStabilityScore: 100,
      blackoutCount: 0,
      isGameOver: false,
      gameWon: false,
      consecutiveShortage: 0,
      cityDemandCurve: cityDemand,
      renewableSupplyCurve: renewableSupply,
    };
  });

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
    // Check localStorage for tutorial completion
    return localStorage.getItem('gridGuardianTutorialCompleted') === 'true';
  });

  // Sound management
  const miningHumStopRef = useRef<(() => void) | null>(null);
  const ambientMusicStopRef = useRef<(() => void) | null>(null);
  const lastWarningTimeRef = useRef<number>(0);

  // Calculate current game values
  const getCurrentValues = useCallback(() => {
    const progress = gameState.currentTick / (GAME_DURATION / TICK_INTERVAL);
    const curveIndex = Math.floor(progress * (gameState.cityDemandCurve.length - 1));
    
    const cityDemand = gameState.cityDemandCurve[curveIndex] || 0;
    const renewableSupply = gameState.renewableSupplyCurve[curveIndex] || 0;
    const aexLoad = gameState.isMiningActive ? AEX_MINING_LOAD : 0;
    const gridLoad = renewableSupply - cityDemand - aexLoad;
    
    return { cityDemand, renewableSupply, aexLoad, gridLoad, progress };
  }, [gameState.currentTick, gameState.isMiningActive, gameState.cityDemandCurve, gameState.renewableSupplyCurve]);

  // Format time display
  const formatGameTime = (tick: number) => {
    const totalTicks = GAME_DURATION / TICK_INTERVAL;
    const hours = Math.floor((tick / totalTicks) * 24);
    const minutes = Math.floor(((tick / totalTicks) * 24 * 60) % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Get grid status - More forgiving ranges for better gameplay
  const getGridStatus = (gridLoad: number) => {
    if (gridLoad > 15) return { status: 'SURPLUS', color: 'warning-orange', zone: 'right' };
    if (gridLoad >= -15) return { status: 'BALANCED', color: 'aex-green', zone: 'center' };
    if (gridLoad >= -40) return { status: 'SHORTAGE', color: 'danger-red', zone: 'left' };
    return { status: 'BLACKOUT RISK!', color: 'danger-red', zone: 'left' };
  };

  // Calculate needle rotation for grid meter
  const getNeedleRotation = (gridLoad: number) => {
    // Map grid load (-50 to +50) to rotation (-90deg to +90deg)
    const clampedLoad = Math.max(-50, Math.min(50, gridLoad));
    return (clampedLoad / 50) * 90;
  };

  // Game tick logic
  useEffect(() => {
    if (!isGameStarted || !isGameActive || gameState.isGameOver) return;

    const interval = setInterval(() => {
      setGameState(prevState => {
        const newTick = prevState.currentTick + 1;
        const newGameTime = formatGameTime(newTick);
        
        // Check if game should end
        if (newTick >= GAME_DURATION / TICK_INTERVAL) {
          return {
            ...prevState,
            currentTick: newTick,
            gameTime: newGameTime,
            isGameOver: true,
            gameWon: true,
          };
        }

        // Calculate current values for this tick
        const progress = newTick / (GAME_DURATION / TICK_INTERVAL);
        const curveIndex = Math.floor(progress * (prevState.cityDemandCurve.length - 1));
        
        const cityDemand = prevState.cityDemandCurve[curveIndex] || 0;
        const renewableSupply = prevState.renewableSupplyCurve[curveIndex] || 0;
        const aexLoad = prevState.isMiningActive ? AEX_MINING_LOAD : 0;
        const gridLoad = renewableSupply - cityDemand - aexLoad;

        // Calculate profit for this tick
        let electricityCost = 0;
        if (gridLoad > 15) {
          electricityCost = -8; // Surplus energy - you get paid more to consume!
        } else if (gridLoad >= -15) {
          electricityCost = STANDARD_RATE; // Balanced - normal rates
        } else if (gridLoad >= -30) {
          electricityCost = PEAK_RATE * 0.8; // Moderate shortage - high but not extreme rates
        } else {
          electricityCost = PEAK_RATE; // Severe shortage - expensive rates
        }

        const btcRevenue = prevState.isMiningActive ? BTC_REVENUE : 0;
        const profitThisTick = btcRevenue - (electricityCost * (aexLoad / 100));
        
        // Calculate wasted energy
        let newWastedEnergy = prevState.wastedEnergy;
        if (gridLoad > 0 && !prevState.isMiningActive) {
          newWastedEnergy += gridLoad;
        }

        // Calculate grid stability - More balanced scoring
        let newStabilityScore = prevState.gridStabilityScore;
        if (gridLoad > -20 && gridLoad < 30) {
          newStabilityScore = Math.min(100, newStabilityScore + 0.2);
        } else if (gridLoad < -40) {
          newStabilityScore = Math.max(0, newStabilityScore - 1.0);
        } else {
          newStabilityScore = Math.max(0, newStabilityScore - 0.3);
        }

        // Check for blackout conditions - Much more forgiving thresholds
        let newConsecutiveShortage = prevState.consecutiveShortage;
        let newBlackoutCount = prevState.blackoutCount;
        let isGameOver = false;

        if (gridLoad < -50) { // Much more forgiving blackout threshold
          newConsecutiveShortage += 1;
          
          // Play warning sound (throttled to avoid spam)
          const now = Date.now();
          if (now - lastWarningTimeRef.current > 2000) {
            soundGenerator.playWarning();
            lastWarningTimeRef.current = now;
          }
          
          if (newConsecutiveShortage >= 24) { // 6 seconds of severe shortage before blackout
            isGameOver = true;
            newBlackoutCount += 1;
          }
        } else {
          newConsecutiveShortage = Math.max(0, newConsecutiveShortage - 1); // Gradually reduce shortage counter
        }

        return {
          ...prevState,
          currentTick: newTick,
          gameTime: newGameTime,
          totalProfit: prevState.totalProfit + profitThisTick,
          wastedEnergy: newWastedEnergy,
          gridStabilityScore: newStabilityScore,
          blackoutCount: newBlackoutCount,
          consecutiveShortage: newConsecutiveShortage,
          isGameOver,
          gameWon: false,
        };
      });
    }, TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [isGameStarted, isGameActive, gameState.isGameOver]);

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
      
      // Play appropriate end sound
      if (gameState.gameWon) {
        soundGenerator.playSuccess();
      }
      
      setTimeout(() => setShowEndScreen(true), 1000);
    }
  }, [gameState.isGameOver, gameState.gameWon]);

  const startGame = async () => {
    if (isButtonDisabled) return;
    
    try {
      setIsButtonDisabled(true);
      console.log('Starting game...');
      soundGenerator.playButtonClick();
      
      if (!hasSeenTutorial) {
        setShowTutorial(true);
        setIsButtonDisabled(false);
        return;
      }
      
      // Start ambient music
      ambientMusicStopRef.current = await soundGenerator.startAmbientMusic();
      
      setIsGameStarted(true);
      setIsGameActive(true);
      setShowEndScreen(false);
      
      // Generate new randomized curves for each game
      const { cityDemand, renewableSupply } = generateRandomizedCurves();
      setGameState({
        currentTick: 0,
        gameTime: '00:00',
        isMiningActive: false,
        totalProfit: 0,
        wastedEnergy: 0,
        gridStabilityScore: 100,
        blackoutCount: 0,
        isGameOver: false,
        gameWon: false,
        consecutiveShortage: 0,
        cityDemandCurve: cityDemand,
        renewableSupplyCurve: renewableSupply,
      });
      setIsButtonDisabled(false);
    } catch (error) {
      console.error('Error starting game:', error);
      setIsButtonDisabled(false);
    }
  };

  const startGameWithoutTutorial = async () => {
    try {
      soundGenerator.playButtonClick();
      
      setHasSeenTutorial(true);
      localStorage.setItem('gridGuardianTutorialCompleted', 'true');
      
      // Start ambient music
      ambientMusicStopRef.current = await soundGenerator.startAmbientMusic();
      
      setIsGameStarted(true);
      setIsGameActive(true);
      setShowEndScreen(false);
      
      // Generate new randomized curves for each game
      const { cityDemand, renewableSupply } = generateRandomizedCurves();
      setGameState({
        currentTick: 0,
        gameTime: '00:00',
        isMiningActive: false,
        totalProfit: 0,
        wastedEnergy: 0,
        gridStabilityScore: 100,
        blackoutCount: 0,
        isGameOver: false,
        gameWon: false,
        consecutiveShortage: 0,
        cityDemandCurve: cityDemand,
        renewableSupplyCurve: renewableSupply,
      });
    } catch (error) {
      console.error('Error starting game without tutorial:', error);
    }
  };

  const completeTutorial = () => {
    soundGenerator.playButtonClick();
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem('gridGuardianTutorialCompleted', 'true');
    startGameWithoutTutorial();
  };

  const skipTutorial = () => {
    soundGenerator.playButtonClick();
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem('gridGuardianTutorialCompleted', 'true');
    startGameWithoutTutorial();
  };

  const showTutorialAgain = () => {
    if (isButtonDisabled) return;
    soundGenerator.playButtonClick();
    setShowTutorial(true);
  };

  const showSoundSettingsModal = () => {
    if (isButtonDisabled) return;
    soundGenerator.playButtonClick();
    setShowSoundSettings(true);
  };

  const closeSoundSettings = () => {
    if (isButtonDisabled) return;
    soundGenerator.playButtonClick();
    setShowSoundSettings(false);
  };

  const toggleMining = async () => {
    console.log('Toggle mining clicked, game over:', gameState.isGameOver);
    if (!gameState.isGameOver) {
      const newMiningState = !gameState.isMiningActive;
      console.log('Toggling mining from', gameState.isMiningActive, 'to', newMiningState);
      
      // Play sound effects
      if (newMiningState) {
        soundGenerator.playMiningActivate();
        // Start mining hum
        miningHumStopRef.current = await soundGenerator.startMiningHum();
      } else {
        soundGenerator.playMiningDeactivate();
        // Stop mining hum
        if (miningHumStopRef.current) {
          miningHumStopRef.current();
          miningHumStopRef.current = null;
        }
      }
      
      setGameState(prev => ({ ...prev, isMiningActive: newMiningState }));
    }
  };

  const resetGame = () => {
    soundGenerator.playButtonClick();
    
    // Stop all sounds
    if (miningHumStopRef.current) {
      miningHumStopRef.current();
      miningHumStopRef.current = null;
    }
    if (ambientMusicStopRef.current) {
      ambientMusicStopRef.current();
      ambientMusicStopRef.current = null;
    }
    
    setIsGameStarted(false);
    setIsGameActive(false);
    setShowEndScreen(false);
    setShowTutorial(false);
    
    // Generate new randomized curves for reset
    const { cityDemand, renewableSupply } = generateRandomizedCurves();
    setGameState({
      currentTick: 0,
      gameTime: '00:00',
      isMiningActive: false,
      totalProfit: 0,
      wastedEnergy: 0,
      gridStabilityScore: 100,
      blackoutCount: 0,
      isGameOver: false,
      gameWon: false,
      consecutiveShortage: 0,
      cityDemandCurve: cityDemand,
      renewableSupplyCurve: renewableSupply,
    });
  };

  const { cityDemand, renewableSupply, gridLoad } = getCurrentValues();
  const gridStatus = getGridStatus(gridLoad);
  const needleRotation = getNeedleRotation(gridLoad);
  const stabilityMultiplier = gameState.gridStabilityScore / 100;
  const finalScore = Math.round(gameState.totalProfit * stabilityMultiplier);

  // Start screen
  if (!isGameStarted && !showEndScreen) {
    return (
      <div className="min-h-screen grid-guardian-bg flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 text-center bg-slate-800/50 border-slate-700">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2 aex-green">Grid Guardian</h1>
            <p className="text-xl text-slate-200 mb-4">グリッド・ガーディアン</p>
            <div className="accent-blue text-lg font-medium mb-6">
              An Agile EnergyX Simulation
            </div>
          </div>
          
          <div className="text-left space-y-4 mb-8 text-slate-200">
            <p>🎯 <strong className="text-white">Mission:</strong> Operate a Bitcoin mining facility to balance the city's power grid over 24 hours</p>
            <p>⚡ <strong className="text-white">Strategy:</strong> Activate miners during energy surplus, deactivate during shortage</p>
            <p>💰 <strong className="text-white">Goal:</strong> Maximize profit while maintaining grid stability</p>
            <p>⏱️ <strong className="text-white">Duration:</strong> 60 seconds real-time = 24 hours simulation</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={startGame}
              disabled={isButtonDisabled}
              className="accent-blue-bg hover:aex-green-bg text-white px-8 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasSeenTutorial ? 'Start Simulation' : 'Start with Tutorial'}
            </Button>
            
            {hasSeenTutorial && (
              <Button 
                onClick={showTutorialAgain}
                disabled={isButtonDisabled}
                variant="outline"
                className="border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Show Tutorial
              </Button>
            )}
            
            {!hasSeenTutorial && (
              <Button 
                onClick={startGameWithoutTutorial}
                disabled={isButtonDisabled}
                variant="outline"
                className="border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skip Tutorial
              </Button>
            )}
          </div>

          <div className="flex justify-center mt-4">
            <Button 
              onClick={showSoundSettingsModal}
              disabled={isButtonDisabled}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Sound Settings
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // End screen
  if (showEndScreen) {
    return (
      <div className="min-h-screen grid-guardian-bg flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 text-center bg-slate-800/50 border-slate-700">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-4">
              {gameState.gameWon ? (
                <span className="aex-green">Mission Complete!</span>
              ) : (
                <span className="danger-red">Grid Blackout!</span>
              )}
            </h1>
          </div>

          <div className="space-y-4 mb-8">
            <div className="text-2xl font-bold">
              Final Score: <span className="accent-blue">¥{finalScore.toLocaleString()}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="text-lg font-semibold">Total Profit</div>
                <div className="text-xl aex-green">¥{Math.round(gameState.totalProfit).toLocaleString()}</div>
              </div>
              
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="text-lg font-semibold">Clean Energy Saved</div>
                <div className="text-xl accent-blue">{Math.round(gameState.wastedEnergy)} kWh</div>
              </div>
              
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="text-lg font-semibold">Grid Stability</div>
                <div className="text-xl warning-orange">{Math.round(gameState.gridStabilityScore)}%</div>
              </div>
            </div>

            <div className="text-slate-200 mt-6">
              {gameState.gameWon ? (
                "Excellent work, Grid Guardian! You've successfully demonstrated how Agile EnergyX uses flexible computing to create value and support Japan's energy future."
              ) : (
                <div className="space-y-2">
                  <p>"The grid couldn't handle the demand. Here are some strategies:"</p>
                  <ul className="text-sm text-left space-y-1 mt-2">
                    <li>• <strong>Morning (6-12):</strong> Activate miners when solar energy rises</li>
                    <li>• <strong>Midday (12-15):</strong> Peak solar - great time for mining</li>
                    <li>• <strong>Evening (17-21):</strong> High demand - deactivate miners</li>
                    <li>• <strong>Night (22-6):</strong> Low demand but no solar - be careful</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={resetGame}
            className="accent-blue-bg hover:bg-blue-600 text-white px-8 py-3 text-lg font-semibold"
          >
            Play Again
          </Button>
        </Card>
      </div>
    );
  }

  // Main game screen
  return (
    <div className={`min-h-screen grid-guardian-bg p-4 ${gameState.consecutiveShortage >= 8 ? 'blackout-flash' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1"></div>
            <h1 className="text-3xl font-bold aex-green">Grid Guardian: An Agile EnergyX Simulation</h1>
            <div className="flex-1 flex justify-end">
              <Button
                onClick={showTutorialAgain}
                variant="outline"
                size="sm"
                className="border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white"
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                Help
              </Button>
            </div>
          </div>
          <div className="flex justify-center items-center gap-8">
            <div className="text-2xl font-mono accent-blue">
              TIME: {gameState.gameTime}
            </div>
            <div className="text-2xl font-bold">
              PROFIT: <span className="aex-green">¥{Math.round(gameState.totalProfit).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" id="energy-gauges">
          {/* Left: Renewable Energy Supply */}
          <Card className="p-6 bg-slate-800/50 border-slate-700">
            <div className="text-center mb-4">
              <div className="flex justify-center items-center gap-2 mb-2">
                <Sun className="w-6 h-6 text-yellow-400" />
                <Wind className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold">Renewable Energy Supply</h3>
              <p className="text-sm text-slate-200">再生可能エネルギー供給</p>
            </div>
            
            <div className="relative h-48 bg-slate-900/50 rounded-lg p-4">
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 bg-gradient-to-t from-green-500 to-green-300 rounded-t-lg transition-all duration-300"
                   style={{ height: `${(renewableSupply / 100) * 160}px` }}>
              </div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
                <div className="text-xl font-bold aex-green">{Math.round(renewableSupply)}%</div>
              </div>
            </div>
          </Card>

          {/* Center: Grid Status Meter */}
          <Card className="p-6 bg-slate-800/50 border-slate-700" id="grid-meter">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">GRID STATUS</h3>
              <p className="text-sm text-slate-200">電力系統ステータス</p>
            </div>
            
            <div className="relative h-48 flex items-center justify-center">
              {/* Semi-circular gauge background */}
              <div className="relative w-40 h-20 overflow-hidden">
                <div className="absolute inset-0 border-8 border-slate-600 rounded-t-full"></div>
                
                {/* Colored zones */}
                <div className="absolute left-0 top-0 w-1/3 h-full bg-gradient-to-r from-red-500/30 to-transparent rounded-tl-full"></div>
                <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-orange-500/30 to-transparent rounded-tr-full"></div>
                <div className="absolute left-1/3 top-0 w-1/3 h-full bg-green-500/30"></div>
                
                {/* Needle */}
                <div 
                  className="absolute bottom-0 left-1/2 w-1 h-16 bg-white origin-bottom transform -translate-x-1/2 transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
                >
                  <div className="absolute top-0 left-1/2 w-3 h-3 bg-white rounded-full transform -translate-x-1/2 -translate-y-1"></div>
                </div>
              </div>
              
              <div className="absolute bottom-0 text-center">
                <div className={`text-lg font-bold ${gridStatus.color}`}>
                  {gridStatus.status}
                </div>
                {gridStatus.status === 'BLACKOUT RISK!' && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <AlertTriangle className="w-4 h-4 danger-red" />
                    <span className="text-sm danger-red">WARNING!</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Right: City Demand */}
          <Card className="p-6 bg-slate-800/50 border-slate-700">
            <div className="text-center mb-4">
              <div className="flex justify-center items-center gap-2 mb-2">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold">City Power Demand</h3>
              <p className="text-sm text-slate-200">都市の電力需要</p>
            </div>
            
            <div className="relative h-48 bg-slate-900/50 rounded-lg p-4">
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all duration-300"
                   style={{ height: `${(cityDemand / 100) * 160}px` }}>
              </div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
                <div className="text-xl font-bold accent-blue">{Math.round(cityDemand)}%</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mining Control */}
          <Card className="p-6 bg-slate-800/50 border-slate-700" id="mining-button">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">AEX Mining Facility Control</h3>
              
              <Button
                onClick={toggleMining}
                disabled={gameState.isGameOver}
                className={`w-full py-6 text-xl font-bold transition-all duration-300 ${
                  gameState.isMiningActive 
                    ? 'aex-green-bg hover:bg-green-600 miner-active-glow' 
                    : 'accent-blue-bg hover:aex-green-bg text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <Zap className={`w-6 h-6 ${gameState.isMiningActive ? 'text-white' : 'text-slate-400'}`} />
                  {gameState.isMiningActive ? 'MINERS ACTIVE' : 'ACTIVATE MINERS'}
                </div>
                <div className="text-sm mt-1">
                  {gameState.isMiningActive ? 'マイナー稼働中' : 'マイナー稼働'}
                </div>
              </Button>

              {gameState.isMiningActive && (
                <div className="mt-4 text-sm text-slate-200">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Mining at {AEX_MINING_LOAD}% capacity
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Secondary Metrics */}
          <Card className="p-6 bg-slate-800/50 border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-center">Performance Metrics</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Stability Multiplier:</span>
                <span className="font-bold accent-blue">x{stabilityMultiplier.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Wasted Clean Energy:</span>
                <span className="font-bold warning-orange">{Math.round(gameState.wastedEnergy)} kWh</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Grid Stability:</span>
                <span className="font-bold aex-green">{Math.round(gameState.gridStabilityScore)}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Current Grid Load:</span>
                <span className={`font-bold ${gridLoad > 0 ? 'warning-orange' : gridLoad < -10 ? 'danger-red' : 'aex-green'}`}>
                  {gridLoad > 0 ? '+' : ''}{Math.round(gridLoad)}
                </span>
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
    </div>
  );
};

export default GridGuardianGame;