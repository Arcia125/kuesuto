import { Collision } from './../capabilities/collision';
import { GameEntityState, GameState, GameEntity, SpriteJSON } from '../models';
import playerSpriteJSONRAW from '../data/spriteJSON/kuesuto-player.json';
import { EventEmitter } from '../events';
import { Movement } from '../capabilities/movement';
import { Control } from '../capabilities/control';
import { Attack } from '../capabilities/attack';
import { Entity } from './entities';
import { Sprite } from '../sprites';


export class PlayerEntity extends Entity {
  public static NAME = 'player';
  public movementCapability = new Movement(this);
  public controlCability = new Control(this);
  public collisionCapability = new Collision(this, this.movementCapability);
  public attackCapability = new Attack(this);

  public static find(gameState: GameState) {
    const player = gameState.entities.find(entity => entity.name === PlayerEntity.NAME);
    if (!player) {
      throw new Error('Could not find player');
    }
    return player;
  }

  public constructor(public state: GameEntityState, public children: GameEntity[], emitter: EventEmitter) {
    super(state, PlayerEntity.NAME, children, emitter);
    this.sprite = new Sprite(playerSpriteJSONRAW as SpriteJSON, './kuesuto-player.png', emitter);
    this.status.health = 200;
  }

  public update = (gameState: GameState, _timeStamp: number) => {
    this.controlCability.update(gameState, _timeStamp);
    this.movementCapability.update(gameState, _timeStamp);
    this.collisionCapability.update(gameState, _timeStamp);
    this.attackCapability.update(gameState, _timeStamp);
    super.update(gameState, _timeStamp);
  };

  // public attack = (gameState: GameState, _timeStamp: number) => {
  //   const weapon = this.children.find(child => child instanceof WeaponEntity);
  //   this.attackCapability.
  // };
}
