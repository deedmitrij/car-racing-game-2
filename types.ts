
export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  COLLISION_PAUSE = 'COLLISION_PAUSE',
  LEVEL_CLEAR = 'LEVEL_CLEAR',
  GAME_OVER = 'GAME_OVER',
  WIN = 'WIN'
}

export enum EntityType {
  NPC_CAR = 'NPC_CAR',
  OBSTACLE = 'OBSTACLE',
  BONUS = 'BONUS',
  POLICE_CAR = 'POLICE_CAR',
  OIL_SPILL = 'OIL_SPILL'
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  position: Vector2D;
  width: number;
  height: number;
  speed: number;
  color: string;
  targetLaneX?: number; // Used for Police AI steering
}

export interface HighScore {
  name: string;
  score: number;
}

export interface GameState {
  status: GameStatus;
  playerName: string;
  level: number;
  lives: number;
  timeLeft: number;
  score: number;
  isInvincible: boolean;
  invincibilityTime: number;
  recoveryInvincibilityTime: number;
  recoveryTime: number;
  highScores: HighScore[];
  lastNearMissTime: number;
  isSkidding: boolean;
  skidTime: number;
  skidDirection: number; // -1 for left, 1 for right
}
