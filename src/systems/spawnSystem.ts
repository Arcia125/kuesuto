import { LevelUpEntity } from '../entities/levelUpEntity';
import { DarkWizardEntity } from '../entities/darkWizardEntity';
import { INIT_PLAYER_SPEED_X, INIT_PLAYER_SPEED_Y } from '../constants';
import { GameState, ObjectGroupLayer } from '../models';
import { EventEmitter, EVENTS } from '../events';
import { ISpawnSystem } from '../models';
import { SlimeEntity } from '../entities/slimeEntity';
import { CorruptedSlimeEntity } from '../entities/corruptedSlimeEntity';
import { FastSlimeEntity } from '../entities/fastSlimeEntity';
import { InteractableZoneEntity } from '../entities/interactableZoneEntity';
import { TransitionTriggerEntity } from '../entities/transitionTriggerEntity';
import { VillagerKeeperEntity, VillagerChildEntity, VillagerHunterEntity, VillagerCarterEntity } from '../entities/villagerEntity';
import { RENDERING_SCALE } from '../constants';
import { PlayerEntity } from '../entities/playerEntity';
import { SwordEntity } from '../entities/swordEntity';
import { HeartPickupEntity } from '../entities/heartPickupEntity';

export class SpawnSystem implements ISpawnSystem {
  private spawnedMaps: Record<string, boolean> = {};
  private static readonly entityClasses: Record<string, any> = {
    [SlimeEntity.NAME]: SlimeEntity,
    [DarkWizardEntity.NAME]: DarkWizardEntity,
    [CorruptedSlimeEntity.NAME]: CorruptedSlimeEntity,
    [FastSlimeEntity.NAME]: FastSlimeEntity,
    [VillagerKeeperEntity.NAME]: VillagerKeeperEntity,
    [VillagerChildEntity.NAME]: VillagerChildEntity,
    [VillagerHunterEntity.NAME]: VillagerHunterEntity,
    [VillagerCarterEntity.NAME]: VillagerCarterEntity,
  };

  private static readonly defaultGameEntityState = {
    xDir: 0,
    yDir: 0,
    speedX: INIT_PLAYER_SPEED_X * 0.8,
    speedY: INIT_PLAYER_SPEED_Y * 0.8,
    scaleX: 1,
    scaleY: 1,
    mass: 5,
    visible: true,
    moving: false,
    attacking: false,
    currentAnimationName: '',
    lastAnimationName: '',
    animationToEnd: false,
    animationFrameX: 0,
    animationFrameXStart: 0,
  }


  private pendingHearts: { x: number; y: number }[] = [];

  public constructor(private emitter: EventEmitter) {
    emitter.on(EVENTS.AREA_TRANSITION_COMPLETE, (_eventName, payload) => {
      this.spawnedMaps[payload.mapName] = false;
    });
    // Slain slimes sometimes drop a heart (spawned next update, when gameState is
    // in hand). Corrupted ones always drop — they're the quest fights.
    emitter.on(EVENTS.DEATH, (_eventName, { entity }) => {
      const chance = entity.name === CorruptedSlimeEntity.NAME ? 1 : 0.35;
      if ([SlimeEntity.NAME, FastSlimeEntity.NAME, CorruptedSlimeEntity.NAME].includes(entity.name) && Math.random() < chance) {
        this.pendingHearts.push({ x: entity.state.x, y: entity.state.y });
      }
    });
  }

  public update(gameState: GameState, _timestamp: number): void {
    const currentMap = gameState.map.activeMap.name;
    if (!this.spawnedMaps[currentMap] && gameState.systems.gameState.inStates(['running'])) {
      this.spawnFromMapData(gameState);
      this.spawnedMaps[currentMap] = true;
    }
    if (this.pendingHearts.length) {
      for (const drop of this.pendingHearts) {
        gameState.entities.push(new HeartPickupEntity({
          ...SpawnSystem.defaultGameEntityState,
          x: drop.x,
          y: drop.y,
        }, this.emitter));
      }
      this.pendingHearts = [];
    }
  }

  private static getEntityType = (obj: ObjectGroupLayer['objects'][0]) => {
    return obj.properties.find(property => property.name === 'type')?.value;
  }

  private static getEntityClass = (object: ObjectGroupLayer['objects'][0]) => {
    return SpawnSystem.entityClasses[SpawnSystem.getEntityType(object)];
  }

  private spawnInteractableZone(gameState: GameState, entityObj: ObjectGroupLayer['objects'][0]): void {
    const phrasesRaw = entityObj.properties.find(p => p.name === 'phrases')?.value || '';
    const phrases = phrasesRaw.split('|').map((s: string) => s.trim()).filter(Boolean);
    if (!phrases.length) return;

    const entity = new InteractableZoneEntity(
      {
        ...SpawnSystem.defaultGameEntityState,
        x: entityObj.x * RENDERING_SCALE,
        y: entityObj.y * RENDERING_SCALE,
        visible: false,
      },
      [],
      gameState.emitter,
      phrases
    );
    gameState.entities.push(entity);
  }

  private spawnFromMapData(gameState: GameState): void {
    // Only spawn player on the first map load
    const hasPlayer = gameState.entities.some(e => e.name === PlayerEntity.NAME);
    if (!hasPlayer) {
      const playerStartLocationObject = gameState.map.getObjectStartLocation('Player Start Location');

      const playerEntity = new PlayerEntity({
        ...SpawnSystem.defaultGameEntityState,
        x: playerStartLocationObject.x * RENDERING_SCALE,
        y: playerStartLocationObject.y * RENDERING_SCALE,
        mass: 20,
      }, [
        new SwordEntity({
          ...SpawnSystem.defaultGameEntityState,
          x: 0,
          y: 0,
        }, [], this.emitter),
        new LevelUpEntity({
          ...SpawnSystem.defaultGameEntityState,
          x: 0,
          y: 0,
          visible: false,
        }, this.emitter)
      ], this.emitter);

      if (gameState.debugSettings.freecam) {
        // Map-viewer ghost: fast, unkillable, walks through everything (see Collision).
        playerEntity.state.speedX *= 2.5;
        playerEntity.state.speedY *= 2.5;
        playerEntity.status.immortal = true;
      }

      gameState.camera.follow(playerEntity);
      gameState.entities.push(playerEntity);
    }

    // Spawn enemies and NPCs
    const startLocationsObject = gameState.map.getObjectStartLocations('Enemy')
      .concat(gameState.map.getObjectStartLocations('Dark Wizard'))
      .concat(gameState.map.getObjectStartLocations('Npc'));

    startLocationsObject.forEach(entityObj => {
      const EntityClass = SpawnSystem.getEntityClass(entityObj);

      if (EntityClass) {
        const children = 'getDefaultChildren' in EntityClass && EntityClass.getDefaultChildren(this.emitter, { ...SpawnSystem.defaultGameEntityState }) || [];
        const entity = new EntityClass({
          x: entityObj.x * RENDERING_SCALE,
          y: entityObj.y * RENDERING_SCALE,
          ...SpawnSystem.defaultGameEntityState,
        }, children, this.emitter
        );
        gameState.entities.push(entity);
        entity.state.x = entityObj.x * RENDERING_SCALE;
        entity.state.y = entityObj.y * RENDERING_SCALE;
      } else {
        console.warn(`Unknown entity type ${SpawnSystem.getEntityType(entityObj)}`);
      }
    });

    // Spawn interactable zones
    const zoneObjects = gameState.map.getObjectStartLocations('InteractableZone');
    zoneObjects.forEach(zoneObj => {
      this.spawnInteractableZone(gameState, zoneObj);
    });

    // Spawn area-transition triggers
    const transitionObjects = gameState.map.getObjectStartLocations('Transition');
    transitionObjects.forEach(transitionObj => {
      this.spawnTransitionTriggers(gameState, transitionObj);
    });
  }

  private spawnTransitionTriggers(gameState: GameState, transitionObj: ObjectGroupLayer['objects'][0]): void {
    const targetMap = transitionObj.properties.find(p => p.name === 'targetMap')?.value;
    const entryPoint = transitionObj.properties.find(p => p.name === 'entryPoint')?.value;
    if (!targetMap || !entryPoint) return;

    // Gates can be wide (the forrest gate is 16 tiles across). A collision box is a
    // single tile, so tile the gate with one trigger per tile to make it reliably
    // crossable wherever the player walks through it.
    const TILE = 16;
    const width = transitionObj.width || TILE;
    const height = transitionObj.height || TILE;
    for (let dx = 0; dx < width; dx += TILE) {
      for (let dy = 0; dy < height; dy += TILE) {
        const entity = new TransitionTriggerEntity(
          {
            ...SpawnSystem.defaultGameEntityState,
            x: (transitionObj.x + dx) * RENDERING_SCALE,
            y: (transitionObj.y + dy) * RENDERING_SCALE,
            visible: false,
          },
          [],
          gameState.emitter,
          targetMap,
          entryPoint,
        );
        gameState.entities.push(entity);
      }
    }
  }
}
