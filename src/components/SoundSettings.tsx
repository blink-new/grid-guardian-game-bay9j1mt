import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { Volume2, VolumeX, Settings } from 'lucide-react';
import { soundGenerator } from '../utils/soundGenerator';

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

    setIsSupported(soundGenerator.isSupported());
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

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 bg-slate-800 border-slate-600 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Sound Settings</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ×
          </Button>
        </div>

        {!isSupported ? (
          <div className="text-center py-4">
            <p className="text-slate-400 mb-4">Audio not supported in this browser</p>
            <Button onClick={onClose} className="aex-green-bg hover:bg-green-600 text-white">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Master Volume */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-200">Master Volume</label>
                <span className="text-sm text-slate-400">{masterVolume}%</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-white p-2"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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
            </div>

            {/* Sound Effects Info */}
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-slate-200 mb-2">Sound Effects</h4>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Button clicks and interactions</li>
                <li>• Mining activation/deactivation</li>
                <li>• Continuous mining hum</li>
                <li>• Grid warning alerts</li>
                <li>• Success completion chime</li>
                <li>• Subtle ambient atmosphere</li>
              </ul>
            </div>

            {/* Test Sound */}
            <div className="flex justify-between items-center">
              <Button
                onClick={testSound}
                variant="outline"
                className="border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-white"
                disabled={isMuted}
              >
                Test Sound
              </Button>
              
              <Button
                onClick={onClose}
                className="aex-green-bg hover:bg-green-600 text-white"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SoundSettings;