
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800;
export const ROAD_WIDTH = 440;
export const LANES = [140, 240, 340, 440];

export const PLAYER_SIZE = { width: 45, height: 85 };
export const NPC_CAR_SIZE = { width: 45, height: 85 };
export const OBSTACLE_SIZE = { width: 55, height: 55 };
export const BONUS_SIZE = { width: 35, height: 35 };

export const LEVEL_DURATION = 30; 
export const MAX_LEVELS = 5;
export const INITIAL_LIVES = 3;
export const INVINCIBILITY_DURATION = 5; 
export const RECOVERY_INVINCIBILITY_DURATION = 3; 
export const RECOVERY_PAUSE_DURATION = 2; 

// Speed adjusted to scale from ~1 to ~5 across levels
export const LEVEL_CONFIGS = [
  { speed: 1.8, trafficDensity: 0.015, obstacleDensity: 0.005, bonusDensity: 0.005 },
  { speed: 2.8, trafficDensity: 0.02, obstacleDensity: 0.007, bonusDensity: 0.005 },
  { speed: 3.8, trafficDensity: 0.025, obstacleDensity: 0.009, bonusDensity: 0.005 },
  { speed: 4.8, trafficDensity: 0.032, obstacleDensity: 0.012, bonusDensity: 0.005 },
  { speed: 5.8, trafficDensity: 0.04, obstacleDensity: 0.016, bonusDensity: 0.005 },
];

export const LEVEL_THEMES = [
  { road: '#0f172a', border: '#3b82f6', grid: '#1e293b', npc: ['#ff0055', '#00ff66', '#7000ff', '#ff8800'] }, // Level 1 (Classic Blue)
  { road: '#061706', border: '#22c55e', grid: '#064e3b', npc: ['#84cc16', '#10b981', '#fbbf24', '#ffffff'] }, // Level 2 (Neon Green)
  { road: '#170617', border: '#d946ef', grid: '#4a044e', npc: ['#f472b6', '#818cf8', '#2dd4bf', '#ffffff'] }, // Level 3 (Cyber Purple)
  { road: '#170f06', border: '#f97316', grid: '#431407', npc: ['#ef4444', '#eab308', '#ffffff', '#94a3b8'] }, // Level 4 (Lava Orange)
  { road: '#1e1e1e', border: '#fbbf24', grid: '#422006', npc: ['#fde047', '#ffffff', '#cbd5e1', '#00f2ff'] }, // Level 5 (Royal Gold)
];

export const COLORS = {
  PLAYER: '#00f2ff',
  INVINCIBLE: '#ffcc00',
  OBSTACLE: '#475569',
};
