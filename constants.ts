
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800;
export const ROAD_WIDTH = 440;
// Better centered lanes: Road starts at 80, ends at 520. Centers: 135, 245, 355, 465
export const LANES = [135, 245, 355, 465];

export const PLAYER_SIZE = { width: 45, height: 85 };
export const NPC_CAR_SIZE = { width: 45, height: 85 };
export const OBSTACLE_SIZE = { width: 55, height: 55 };
export const BONUS_SIZE = { width: 35, height: 35 };

export const LEVEL_DURATION = 30; 
export const MAX_LEVELS = 5;
export const INITIAL_LIVES = 3;
export const INVINCIBILITY_DURATION = 5; 
export const RECOVERY_INVINCIBILITY_DURATION = 5; // Increased to 5s (2s pause + 3s play)
export const RECOVERY_PAUSE_DURATION = 2; 

export const LEVEL_CONFIGS = [
  { speed: 2.2, trafficDensity: 0.015, obstacleDensity: 0.005, bonusDensity: 0.005 },
  { speed: 3.2, trafficDensity: 0.02, obstacleDensity: 0.007, bonusDensity: 0.005 },
  { speed: 4.2, trafficDensity: 0.025, obstacleDensity: 0.009, bonusDensity: 0.005 },
  { speed: 5.2, trafficDensity: 0.032, obstacleDensity: 0.012, bonusDensity: 0.005 },
  { speed: 6.2, trafficDensity: 0.04, obstacleDensity: 0.016, bonusDensity: 0.005 },
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
};
