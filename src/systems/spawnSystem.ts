import { INIT_PLAYER_SPEED_X, INIT_PLAYER_SPEED_Y } from './../constants';
import { GameState, ObjectGroupLayer } from './../models';
import { EventEmitter } from '../events';
import { ISpawnSystem } from '../models';
import { SlimeEntity } from '../entities/slimeEntity';
import { RENDERING_SCALE } from '../constants';

export class SpawnSystem implements ISpawnSystem {
  private spawnedFromMap = false;
  private static readonly entityClasses = {
    [SlimeEntity.NAME]: SlimeEntity
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

  public spawnFromMapData(gameState: GameState): void {

    const enemyStartLocationObject = gameState.map.getObjectStartLocations('Enemy');

    if (!enemyStartLocationObject.length) {
      throw new TypeError('Missing enemy entity');
    }
    enemyStartLocationObject.forEach(enemy => {

      const EntityClass = SpawnSystem.getEntityClass(enemy);

      if (EntityClass) {
        const entity = new EntityClass({
          x: enemy.x * RENDERING_SCALE,
          y: enemy.y * RENDERING_SCALE,
          ...SpawnSystem.defaultGameEntityState,
        }, [], this.emitter
        );
        gameState.entities.push(entity);
        entity.state.x = enemy.x * RENDERING_SCALE;
        entity.state.y = enemy.y * RENDERING_SCALE;
      } else {
        throw new TypeError(`Unknown enemy type ${SpawnSystem.getEntityType(enemy)}`);
      }
    });
  }
}
