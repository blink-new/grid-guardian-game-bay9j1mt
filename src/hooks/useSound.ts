import { useCallback, useRef, useEffect } from 'react';

interface SoundConfig {
  volume?: number;
  loop?: boolean;
  preload?: boolean;
}

interface SoundHook {
  play: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  isPlaying: boolean;
}

export const useSound = (url: string, config: SoundConfig = {}): SoundHook => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  const { volume = 0.5, loop = false, preload = true } = config;

  useEffect(() => {
    if (preload) {
      audioRef.current = new Audio(url);
      audioRef.current.volume = volume;
      audioRef.current.loop = loop;
      audioRef.current.preload = 'auto';

      const audio = audioRef.current;
      
      const handleEnded = () => {
        isPlayingRef.current = false;
      };

      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [url, volume, loop, preload]);

  const play = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.volume = volume;
      audioRef.current.loop = loop;
    }

    const audio = audioRef.current;
    
    // Reset to beginning if already playing
    audio.currentTime = 0;
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlayingRef.current = true;
        })
        .catch((error) => {
          console.warn('Audio play failed:', error);
        });
    }
  }, [url, volume, loop]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      isPlayingRef.current = false;
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  }, []);

  return {
    play,
    stop,
    setVolume,
    isPlaying: isPlayingRef.current,
  };
};

// Hook for managing multiple sounds
export const useSoundManager = () => {
  const soundsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const createSound = useCallback((id: string, url: string, config: SoundConfig = {}) => {
    const { volume = 0.5, loop = false } = config;
    
    const audio = new Audio(url);
    audio.volume = volume;
    audio.loop = loop;
    audio.preload = 'auto';
    
    soundsRef.current.set(id, audio);
    
    return audio;
  }, []);

  const playSound = useCallback((id: string) => {
    const audio = soundsRef.current.get(id);
    if (audio) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn(`Audio play failed for ${id}:`, error);
        });
      }
    }
  }, []);

  const stopSound = useCallback((id: string) => {
    const audio = soundsRef.current.get(id);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const stopAllSounds = useCallback(() => {
    soundsRef.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, []);

  const setVolume = useCallback((id: string, volume: number) => {
    const audio = soundsRef.current.get(id);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  const setGlobalVolume = useCallback((volume: number) => {
    soundsRef.current.forEach((audio) => {
      audio.volume = Math.max(0, Math.min(1, volume));
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const sounds = soundsRef.current;
    return () => {
      sounds.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      sounds.clear();
    };
  }, []);

  return {
    createSound,
    playSound,
    stopSound,
    stopAllSounds,
    setVolume,
    setGlobalVolume,
  };
};