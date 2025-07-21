import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Volume2, VolumeX, Settings, X, Speaker } from 'lucide-react';
import * as soundGenerator from '../utils/soundGenerator';

interface SoundSettingsProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SoundSettings: React.FC<SoundSettingsProps> = ({ isVisible, onClose }) => {
  const [masterVolume, setMasterVolume] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Load saved settings
    const savedVolume = localStorage.getItem('gridGuardianVolume');
    const savedMuted = localStorage.getItem('gridGuardianMuted');
    
    if (savedVolume) {
      const volume = parseInt(savedVolume);
      setMasterVolume(volume);
      soundGenerator.setMasterVolume(volume / 100);
    }
    
    if (savedMuted) {
      const muted = savedMuted === 'true';
      setIsMuted(muted);
      if (muted) {
        soundGenerator.setMasterVolume(0);
      }
    }

    setIsSupported(true);
  }, []);

  const handleVolumeChange = (value: number[]) => {
    const volume = value[0];
    setMasterVolume(volume);
    
    if (!isMuted) {
      soundGenerator.setMasterVolume(volume / 100);
    }
    
    localStorage.setItem('gridGuardianVolume', volume.toString());
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (newMuted) {
      soundGenerator.setMasterVolume(0);
    } else {
      soundGenerator.setMasterVolume(masterVolume / 100);
    }
    
    localStorage.setItem('gridGuardianMuted', newMuted.toString());
  };

  const testSound = () => {
    soundGenerator.playButtonClick();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 text-white border border-slate-600 rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold">Sound Settings</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {!isSupported ? (
            <div className="text-center py-8">
              <Speaker className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-400 mb-4">Audio not supported in this browser</p>
              <Button onClick={handleClose} className="bg-aex-green hover:bg-green-600 text-white">
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Master Volume */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-200">Master Volume</label>
                  <span className="text-sm text-slate-400 font-mono">{masterVolume}%</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-slate-400 hover:text-white p-2 hover:bg-slate-700"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  
                  <Slider
                    value={[masterVolume]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={5}
                    className="flex-1"
                    disabled={isMuted}
                  />
                </div>
                
                {isMuted && (
                  <p className="text-xs text-orange-400 mt-2">🔇 Sound is muted</p>
                )}
              </div>

              {/* Sound Effects Info */}
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <h4 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                  <Speaker className="w-4 h-4" />
                  Audio Features
                </h4>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-aex-green rounded-full"></span>
                    Button clicks and UI interactions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-aex-green rounded-full"></span>
                    Mining facility activation sounds
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-aex-green rounded-full"></span>
                    Continuous mining operation hum
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-aex-green rounded-full"></span>
                    Grid warning and alert sounds
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-aex-green rounded-full"></span>
                    Success and completion chimes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-aex-green rounded-full"></span>
                    Ambient futuristic atmosphere
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center gap-3">
                <Button
                  onClick={testSound}
                  variant="outline"
                  className="border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white"
                  disabled={isMuted}
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Test Sound
                </Button>
                
                <Button
                  onClick={handleClose}
                  className="bg-aex-green hover:bg-green-600 text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

