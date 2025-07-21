
import * as Tone from 'tone';

let masterVolume = 0.5;
let musicVolume = 0.3;
let sfxVolume = 0.7;

const masterBus = new Tone.Volume(Tone.gainToDb(masterVolume)).toDestination();
const musicBus = new Tone.Volume(Tone.gainToDb(musicVolume)).connect(masterBus);
const sfxBus = new Tone.Volume(Tone.gainToDb(sfxVolume)).connect(masterBus);

// --- Volume Controls ---
export const setMasterVolume = (level: number) => {
  masterVolume = level;
  masterBus.volume.value = Tone.gainToDb(masterVolume);
};
export const getMasterVolume = () => masterVolume;

export const setMusicVolume = (level: number) => {
  musicVolume = level;
  musicBus.volume.value = Tone.gainToDb(musicVolume);
};
export const getMusicVolume = () => musicVolume;

export const setSfxVolume = (level: number) => {
  sfxVolume = level;
  sfxBus.volume.value = Tone.gainToDb(sfxVolume);
};
export const getSfxVolume = () => sfxVolume;

// --- Sound Effects ---
const createSynth = (oscillatorType: string = 'sine') => {
  return new Tone.Synth({
    oscillator: { type: oscillatorType as any },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 },
  }).connect(sfxBus);
};

const buttonSynth = createSynth();
const activateSynth = createSynth('triangle');
const deactivateSynth = createSynth('sawtooth');
const successSynth = createSynth('sine');
const warningSynth = createSynth('square');

export const playButtonClick = () => {
  Tone.start();
  buttonSynth.triggerAttackRelease('C4', '8n');
};

export const playMiningActivate = () => {
  activateSynth.triggerAttackRelease('C5', '16n');
};

export const playMiningDeactivate = () => {
  deactivateSynth.triggerAttackRelease('G3', '8n');
};

export const playSuccess = () => {
  successSynth.triggerAttackRelease('C5', '8n', Tone.now());
  successSynth.triggerAttackRelease('E5', '8n', Tone.now() + 0.1);
  successSynth.triggerAttackRelease('G5', '8n', Tone.now() + 0.2);
};

export const playWarning = () => {
  warningSynth.triggerAttackRelease('A4', '16n');
};

// --- Ambient Music & Hum ---

export const startAmbientMusic = async () => {
  await Tone.start();
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.9, decay: 0.4, sustain: 0.1, release: 7 },
  }).connect(musicBus);

  const pattern = new Tone.Pattern((time, note) => {
    synth.triggerAttackRelease(note, '2n', time);
  }, ['C2', 'G2', 'D3', 'A2'], 'randomWalk');
  
  pattern.interval = '2m';
  pattern.start(0);
  Tone.Transport.start();

  return () => {
    pattern.stop();
    Tone.Transport.stop();
    synth.dispose();
  };
};

export const startMiningHum = async () => {
  await Tone.start();
  const noise = new Tone.Noise('brown').start();
  const autoFilter = new Tone.AutoFilter({
    frequency: '8m',
    baseFrequency: 200,
    octaves: 2
  }).connect(sfxBus).start();
  noise.connect(autoFilter);

  return () => {
    noise.stop();
    autoFilter.stop();
    noise.dispose();
    autoFilter.dispose();
  };
};

// --- Audio Support Detection ---
export const isSupported = () => {
  try {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  } catch (e) {
    return false;
  }
};
