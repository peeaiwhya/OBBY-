export type BlockType = 'solid' | 'hazard' | 'goal' | 'bounce';

export interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  type: BlockType;
  color?: string;
}

export interface LevelData {
  title: string;
  description: string;
  backgroundColor: string;
  playerStart: { x: number; y: number };
  blocks: Block[];
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  color: string;
}

export const GRAVITY = 0.6;
export const FRICTION = 0.8;
export const MOVE_SPEED = 1.0; // Acceleration
export const MAX_SPEED = 6;
export const JUMP_FORCE = -12;
export const BOUNCE_FORCE = -18;

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;