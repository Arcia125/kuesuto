import { EventEmitter, EVENTS } from '../events';
import { GameState, ISaveSystem, NarrativeFlagValue } from '../models';

const SAVE_KEY = 'kuesuto-save-v1';

type SaveData = {
  version: 1;
  mapName: string;
  flags: Record<string, NarrativeFlagValue>;
  player: {
    x: number;
    y: number;
    health: number;
    maxHealth: number;
    level: number;
    experience: number;
  };
};

/**
 * localStorage save/continue. Saves automatically when something meaningful changes
 * (narrative flag, level up, map transition, heal) plus a slow periodic tick, and
 * loads from the start menu ('C'). Enemies respawn on load — only the player and the
 * story are persisted.
 */
export class SaveSystem implements ISaveSystem {
  public skipUpdate = ['init' as const, 'paused' as const, 'menu' as const];
  private dirty = false;
  private lastSaveAt = 0;
  // Stats to apply once the player entity exists (spawning happens after load).
  private pendingPlayer: SaveData['player'] | null = null;

  public constructor(emitter: EventEmitter) {
    const markDirty = () => { this.dirty = true; };
    emitter.on(EVENTS.NARRATIVE_FLAG_SET, markDirty);
    emitter.on(EVENTS.LEVEL_UP, markDirty);
    emitter.on(EVENTS.AREA_TRANSITION_COMPLETE, markDirty);
    emitter.on(EVENTS.HEAL, markDirty);
  }

  public hasSave = (): boolean => {
    try {
      return !!window.localStorage.getItem(SAVE_KEY);
    } catch {
      return false;
    }
  };

  // Called from the start menu: applies flags and the map immediately, defers the
  // player patch until the spawn system has created them.
  public requestLoad = (gameState: GameState): boolean => {
    let data: SaveData;
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      data = JSON.parse(raw);
      if (data.version !== 1) return false;
    } catch {
      return false;
    }
    for (const [key, value] of Object.entries(data.flags)) {
      gameState.systems.narrativeFlags.setFlag(key, value);
    }
    if (gameState.map.tileMaps[data.mapName]) {
      gameState.map.setActiveMap(data.mapName);
    }
    this.pendingPlayer = data.player;
    return true;
  };

  private save(gameState: GameState) {
    const player = gameState.entities.find(e => e.name === 'player');
    if (!player || player.status.dead) return;
    const data: SaveData = {
      version: 1,
      mapName: gameState.map.activeMap.name,
      flags: gameState.systems.narrativeFlags.getAllFlags(),
      player: {
        x: player.state.x,
        y: player.state.y,
        health: player.status.health,
        maxHealth: player.status.maxHealth,
        level: player.status.level,
        experience: player.status.experience,
      },
    };
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // Storage full/blocked: saving is best-effort.
    }
  }

  public update = (gameState: GameState, timeStamp: number) => {
    if (this.pendingPlayer) {
      const player = gameState.entities.find(e => e.name === 'player');
      if (player) {
        player.state.x = this.pendingPlayer.x;
        player.state.y = this.pendingPlayer.y;
        player.status.health = this.pendingPlayer.health;
        player.status.maxHealth = this.pendingPlayer.maxHealth;
        player.status.level = this.pendingPlayer.level;
        player.status.experience = this.pendingPlayer.experience;
        this.pendingPlayer = null;
      }
      return;
    }
    if (!gameState.systems.gameState.inStates(['running'])) return;
    // Event-driven saves, plus a slow heartbeat so position is roughly current.
    if (this.dirty || timeStamp - this.lastSaveAt > 15000) {
      this.dirty = false;
      this.lastSaveAt = timeStamp;
      this.save(gameState);
    }
  };
}
