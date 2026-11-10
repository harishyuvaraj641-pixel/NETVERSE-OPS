import {MusicTrack} from './utils/helper';

/** Game configuration schema following html_constants_schema guidelines. */
export const CONFIG = {
  // --- Game ---
  title: {
    value: 'Netverse Ops',
    type: 'string',
    label: 'Game Title',
    group: 'Game',
  },
  baseCanvasWidth: {
    value: 1280,
    type: 'number',
    label: 'Base Canvas Width',
    group: 'Game',
  },
  baseCanvasHeight: {
    value: 720,
    type: 'number',
    label: 'Base Canvas Height',
    group: 'Game',
  },

  // --- System ---
  targetFPS: {
    value: 60,
    type: 'number',
    label: 'Target FPS',
    group: 'System',
  },
  stepMs: {
    value: 1000 / 60,
    type: 'number',
    label: 'Step MS',
    group: 'System',
  },
  maxSubSteps: {
    value: 5,
    type: 'number',
    label: 'Max Sub Steps',
    group: 'System',
  },

  // --- Theme ---
  backgroundColor: {
    value: '#05070f',
    type: 'color',
    label: 'Background Color',
    group: 'Theme',
  },
  primaryColor: {
    value: '#06b6d4',
    type: 'color',
    label: 'Primary Color',
    group: 'Theme',
  },
  fontFamily: {
    value: 'Inter, system-ui, sans-serif',
    type: 'string',
    label: 'Font Family',
    group: 'Theme',
  },

  // --- Audio ---
  defaultMusicVolume: {
    value: 0.35,
    type: 'number',
    label: 'Default Music Volume',
    group: 'Audio',
    min: 0,
    max: 1,
    step: 0.05,
  },
  defaultSfxVolume: {
    value: 0.65,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'Audio',
    min: 0,
    max: 1,
    step: 0.05,
  },
  backgroundMusicUrl: {
    value:
      'https://storage.googleapis.com/assets-gen-playground/musiclibrary/grid_runner.mp3',
    type: 'string',
    label: 'Background Music URL',
    group: 'Audio',
  },

  // --- Camera ---
  fov: {
    value: 75,
    type: 'number',
    label: 'Field of View',
    group: 'Camera',
    min: 50,
    max: 100,
    step: 5,
  },
  cameraX: {
    value: 0,
    type: 'number',
    label: 'Camera X',
    group: 'Camera',
  },
  cameraY: {
    value: 1.65,
    type: 'number',
    label: 'Camera Y',
    group: 'Camera',
  },
  cameraZ: {
    value: 0,
    type: 'number',
    label: 'Camera Z',
    group: 'Camera',
  },

  // --- Visuals & Physical Lighting (ACES Filmic) ---
  ambientColor: {
    value: '#1e293b',
    type: 'color',
    label: 'Ambient Light Color',
    group: 'Visuals',
  },
  ambientIntensity: {
    value: 1.6,
    type: 'number',
    label: 'Ambient Intensity',
    group: 'Visuals',
    min: 0.5,
    max: 4.0,
    step: 0.1,
  },
  sunColor: {
    value: '#93c5fd',
    type: 'color',
    label: 'Sun Color',
    group: 'Visuals',
  },
  sunIntensity: {
    value: 3.2,
    type: 'number',
    label: 'Sun Intensity',
    group: 'Visuals',
    min: 1.0,
    max: 8.0,
    step: 0.2,
  },
  hemiSkyColor: {
    value: '#38bdf8',
    type: 'color',
    label: 'Hemisphere Sky Color',
    group: 'Visuals',
  },
  hemiGroundColor: {
    value: '#0f172a',
    type: 'color',
    label: 'Hemisphere Ground Color',
    group: 'Visuals',
  },
  hemiIntensity: {
    value: 0.75,
    type: 'number',
    label: 'Hemisphere Intensity',
    group: 'Visuals',
    min: 0.1,
    max: 2.0,
    step: 0.05,
  },

  // --- Physics & FPS Controls ---
  gravity: {
    value: -9.81,
    type: 'number',
    label: 'Gravity',
    group: 'Physics',
    min: -20,
    max: -5,
    step: 0.5,
  },
  playerSpeed: {
    value: 5.0,
    type: 'number',
    label: 'Player Walk Speed',
    group: 'Physics',
    min: 2.0,
    max: 10.0,
    step: 0.5,
  },
  playerSprintSpeed: {
    value: 8.0,
    type: 'number',
    label: 'Player Sprint Speed',
    group: 'Physics',
    min: 4.0,
    max: 14.0,
    step: 0.5,
  },
  jumpForce: {
    value: 4.8,
    type: 'number',
    label: 'Jump Force',
    group: 'Physics',
    min: 2.0,
    max: 9.0,
    step: 0.4,
  },
  interactionDistance: {
    value: 4.0,
    type: 'number',
    label: 'Interaction Distance',
    group: 'Rules',
    min: 2.0,
    max: 7.0,
    step: 0.5,
  },
  mouseSensitivity: {
    value: 1.6,
    type: 'number',
    label: 'Mouse Look Sensitivity',
    group: 'Controls',
    min: 0.5,
    max: 3.5,
    step: 0.1,
  },
  initialNetworkHealth: {
    value: 85,
    type: 'number',
    label: 'Initial Network Health',
    group: 'Rules',
    min: 50,
    max: 100,
    step: 5,
  },
};

// Merge customized config values if present (injected by Playground)
const {playgroundConfig} = globalThis as {
  playgroundConfig?: Record<string, unknown>;
};
if (playgroundConfig) {
  for (const [key, value] of Object.entries(playgroundConfig)) {
    if (key in CONFIG) {
      Object.assign(CONFIG[key as keyof typeof CONFIG], {value});
    }
  }
}

/** Type helper for reading values in game code. */
export type ConfigKey = keyof typeof CONFIG;

/**
 * Gets a configuration value by key.
 * @param key The configuration key.
 * @return The configuration value.
 */
export function getConfig<K extends ConfigKey>(
  key: K,
): (typeof CONFIG)[K]['value'] {
  return CONFIG[key].value;
}

/** Background music tracks available for the game to use. */
export const AVAILABLE_MUSIC_TRACKS: readonly MusicTrack[] = [
  {
    name: 'grid_runner',
    url: 'https://storage.googleapis.com/assets-gen-playground/musiclibrary/grid_runner.mp3',
    description:
      'A cyberpunk-style track with a fast-paced, high-energy beat. Perfect for high-tech digital twin simulator.',
  },
  {
    name: 'automated_dream',
    url: 'https://storage.googleapis.com/assets-gen-playground/musiclibrary/automated_dream.mp3',
    description:
      'An intellectually stimulating track with a concrete feel, good for network analysis.',
  },
];
