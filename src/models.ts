export type Player = {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
};

export type Controls = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export type GameState = {
  player: Player,
  controls: Controls
};
