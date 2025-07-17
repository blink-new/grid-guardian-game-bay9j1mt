// Web Audio API sound generator for Grid Guardian
// Creates synthetic sounds without requiring external audio files

export class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeAudio();
  }

  private async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3; // Master volume
      this.isInitialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext || !this.masterGain) {
      await this.initializeAudio();
    }

    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Button click sound - crisp and satisfying
  async playButtonClick() {
    await this.ensureAudioContext();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Sharp click sound
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
    
    filterNode.type = 'highpass';
    filterNode.frequency.value = 200;

    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Mining activation sound - power-up effect
  async playMiningActivate() {
    await this.ensureAudioContext();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(filterNode);
    filterNode.connect(this.masterGain);

    // Rising power-up sound
    oscillator1.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.3);
    
    oscillator2.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.3);

    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(2000, this.audioContext.currentTime);
    filterNode.frequency.exponentialRampToValueAtTime(4000, this.audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator1.start(this.audioContext.currentTime);
    oscillator2.start(this.audioContext.currentTime);
    oscillator1.stop(this.audioContext.currentTime + 0.3);
    oscillator2.stop(this.audioContext.currentTime + 0.3);
  }

  // Mining deactivation sound - power-down effect
  async playMiningDeactivate() {
    await this.ensureAudioContext();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Falling power-down sound
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.4);

    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(3000, this.audioContext.currentTime);
    filterNode.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.4);

    gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  // Mining hum - continuous background sound when miners are active
  async startMiningHum(): Promise<() => void> {
    await this.ensureAudioContext();
    if (!this.audioContext || !this.masterGain) return () => {};

    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();
    const lfoOscillator = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    // Main hum oscillators
    oscillator1.frequency.value = 60; // Low hum
    oscillator2.frequency.value = 120; // Harmonic

    // LFO for subtle modulation
    lfoOscillator.frequency.value = 0.5;
    lfoGain.gain.value = 5;

    lfoOscillator.connect(lfoGain);
    lfoGain.connect(oscillator1.frequency);

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(filterNode);
    filterNode.connect(this.masterGain);

    filterNode.type = 'lowpass';
    filterNode.frequency.value = 200;

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.5);

    oscillator1.start();
    oscillator2.start();
    lfoOscillator.start();

    // Return stop function
    return () => {
      if (this.audioContext) {
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
        setTimeout(() => {
          oscillator1.stop();
          oscillator2.stop();
          lfoOscillator.stop();
        }, 500);
      }
    };
  }

  // Warning sound for blackout risk
  async playWarning() {
    await this.ensureAudioContext();
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Urgent warning beep
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  // Success chime for game completion
  async playSuccess() {
    await this.ensureAudioContext();
    if (!this.audioContext || !this.masterGain) return;

    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    for (let i = 0; i < frequencies.length; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filterNode = this.audioContext.createBiquadFilter();

      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.frequency.value = frequencies[i];
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 2000;

      const startTime = this.audioContext.currentTime + (i * 0.15);
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    }
  }

  // Ambient background music - subtle futuristic atmosphere
  async startAmbientMusic(): Promise<() => void> {
    await this.ensureAudioContext();
    if (!this.audioContext || !this.masterGain) return () => {};

    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    const filterNode = this.audioContext.createBiquadFilter();

    // Ambient chord progression
    const frequencies = [130.81, 164.81, 196.00, 246.94]; // C3, E3, G3, B3

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.03, this.audioContext!.currentTime + 2 + index);

      oscillator.connect(gainNode);
      gainNode.connect(filterNode);

      oscillators.push(oscillator);
      gainNodes.push(gainNode);
    });

    filterNode.type = 'lowpass';
    filterNode.frequency.value = 800;
    filterNode.connect(this.masterGain);

    oscillators.forEach(osc => osc.start());

    // Return stop function
    return () => {
      if (this.audioContext) {
        gainNodes.forEach(gain => {
          gain.gain.linearRampToValueAtTime(0, this.audioContext!.currentTime + 2);
        });
        setTimeout(() => {
          oscillators.forEach(osc => osc.stop());
        }, 2000);
      }
    };
  }

  // Set master volume
  setMasterVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Check if audio is supported
  isSupported(): boolean {
    return this.isInitialized && !!this.audioContext;
  }
}

// Singleton instance
export const soundGenerator = new SoundGenerator();