
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800;
export const ROAD_WIDTH = 440;
export const LANES = [135, 245, 355, 465];

export const PLAYER_SIZE = { width: 48, height: 85 };
export const NPC_CAR_SIZE = { width: 48, height: 85 }; // Restored to realistic size
export const OBSTACLE_SIZE = { width: 90, height: 60 }; // Wide blocks to prevent cheating
export const BONUS_SIZE = { width: 35, height: 35 };
export const OIL_SIZE = { width: 70, height: 50 };

export const LEVEL_DURATION = 30; 
export const MAX_LEVELS = 5;
export const INITIAL_LIVES = 3;
export const INVINCIBILITY_DURATION = 5; 
export const RECOVERY_INVINCIBILITY_DURATION = 5;
export const RECOVERY_PAUSE_DURATION = 2; 

export const NEAR_MISS_THRESHOLD = 22; 
export const NEAR_MISS_POINTS = 500;
export const HIGH_SCORES_KEY = 'NEON_TURBO_HIGH_SCORES';

export const LEVEL_CONFIGS = [
  { speed: 2.0, trafficDensity: 0.015, obstacleDensity: 0.005, bonusDensity: 0.005, oilDensity: 0.005, policeCount: 0 },
  { speed: 3.0, trafficDensity: 0.018, obstacleDensity: 0.007, bonusDensity: 0.005, oilDensity: 0.007, policeCount: 0 },
  { speed: 4.0, trafficDensity: 0.022, obstacleDensity: 0.010, bonusDensity: 0.005, oilDensity: 0.009, policeCount: 1 },
  { speed: 5.0, trafficDensity: 0.028, obstacleDensity: 0.013, bonusDensity: 0.005, oilDensity: 0.011, policeCount: 2 },
  { speed: 6.0, trafficDensity: 0.035, obstacleDensity: 0.016, bonusDensity: 0.005, oilDensity: 0.013, policeCount: 3 },
];

export const LEVEL_THEMES = [
  { road: '#0f172a', border: '#3b82f6', grid: '#1e293b', npc: ['#ff0055', '#00ff66', '#7000ff', '#ff8800'] },
  { road: '#061706', border: '#22c55e', grid: '#064e3b', npc: ['#84cc16', '#10b981', '#fbbf24', '#ffffff'] },
  { road: '#170617', border: '#d946ef', grid: '#4a044e', npc: ['#f472b6', '#818cf8', '#2dd4bf', '#ffffff'] },
  { road: '#170f06', border: '#f97316', grid: '#431407', npc: ['#ef4444', '#eab308', '#ffffff', '#94a3b8'] },
  { road: '#1e1e1e', border: '#fbbf24', grid: '#422006', npc: ['#fde047', '#ffffff', '#cbd5e1', '#00f2ff'] },
];

export const COLORS = {
  PLAYER: '#00f2ff',
  INVINCIBLE: '#ffcc00',
  OBSTACLE: '#475569',
  POLICE_RED: '#ef4444',
  POLICE_BLUE: '#3b82f6',
  OIL: '#0a0a0a'
};
