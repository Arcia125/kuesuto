import { LevelUpEntity } from '../entities/levelUpEntity';
import { DarkWizardEntity } from '../entities/darkWizardEntity';
import { INIT_PLAYER_SPEED_X, INIT_PLAYER_SPEED_Y } from '../constants';
import { GameState, ObjectGroupLayer } from '../models';
import { EventEmitter } from '../events';
import { ISpawnSystem } from '../models';
import { SlimeEntity } from '../entities/slimeEntity';
import { RENDERING_SCALE } from '../constants';
import { PlayerEntity } from '../entities/playerEntity';
import { SwordEntity } from '../entities/swordEntity';

export class SpawnSystem implements ISpawnSystem {
  private spawnedFromMap = false;
  private static readonly entityClasses = {
    [SlimeEntity.NAME]: SlimeEntity,
    [DarkWizardEntity.NAME]: DarkWizardEntity
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


  public constructor(private emitter: EventEmitter) {

  }

  public update(gameState: GameState, _timestamp: number): void {
    if (!this.spawnedFromMap && gameState.systems.gameState.inStates(['running'])) {
      this.spawnFromMapData(gameState);
      this.spawnedFromMap = true;
    }
  }

  private static getEntityType = (obj: ObjectGroupLayer['objects'][0]) => {
    return obj.properties.find(property => property.name === 'type')?.value;
  }

  private static getEntityClass = (object: ObjectGroupLayer['objects'][0]) => {
    return SpawnSystem.entityClasses[SpawnSystem.getEntityType(object)];
  }



  private spawnFromMapData(gameState: GameState): void {

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

    gameState.camera.follow(playerEntity);

    gameState.entities.push(playerEntity);

    const startLocationsObject = gameState.map.getObjectStartLocations('Enemy').concat(gameState.map.getObjectStartLocations('Dark Wizard'));

    if (!startLocationsObject.length) {
      throw new TypeError('Missing entity');
    }
    startLocationsObject.forEach(entityObj => {

      const EntityClass = SpawnSystem.getEntityClass(entityObj);

      if (EntityClass) {
        const entity = new EntityClass({
          x: entityObj.x * RENDERING_SCALE,
          y: entityObj.y * RENDERING_SCALE,
          ...SpawnSystem.defaultGameEntityState,
        }, [], this.emitter
        );
        gameState.entities.push(entity);
        entity.state.x = entityObj.x * RENDERING_SCALE;
        entity.state.y = entityObj.y * RENDERING_SCALE;
      } else {
        throw new TypeError(`Unknown entity type ${SpawnSystem.getEntityType(entityObj)}`);
      }
    });

  }
}
