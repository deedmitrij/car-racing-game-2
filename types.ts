
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
  BONUS = 'BONUS'
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
}

export interface GameState {
  status: GameStatus;
  playerName: string;
  level: number;
  lives: number;
  timeLeft: number;
  score: number;
  isInvincible: boolean; // From Bonus
  invincibilityTime: number;
  recoveryInvincibilityTime: number; // For blinking after crash
  recoveryTime: number; // The pause duration
}
