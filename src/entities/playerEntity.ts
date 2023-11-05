import { Collision } from './../capabilities/collision';
import { GameEntityState, GameState, GameEntity, SpriteJSON } from '../models';
import playerSpriteJSONRAW from '../data/spriteJSON/kuesuto-player.json';
import { EventEmitter } from '../events';
import { Movement } from '../capabilities/movement';
import { Control } from '../capabilities/control';
import { SpriteEntity } from "./spriteEntity";
import { Attack } from '../capabilities/attack';


export class PlayerEntity extends SpriteEntity {
  public static NAME = 'player';
  public movementCapability = new Movement(this);
  public controlCability = new Control(this);
  public collisionCapability = new Collision(this, this.movementCapability);
  public attackCapability = new Attack(this);

  public constructor(public state: GameEntityState, public children: GameEntity[], emitter: EventEmitter) {
    super(state, PlayerEntity.NAME, children, emitter, playerSpriteJSONRAW as SpriteJSON, './kuesuto-player.png');
    this.status.health = 200;
  }

  public update = (gameState: GameState, _timeStamp: number) => {
    super.update(gameState, _timeStamp);

    this.controlCability.update(gameState, _timeStamp);
    this.movementCapability.update(gameState, _timeStamp);
    this.collisionCapability.update(gameState, _timeStamp);
    this.attackCapability.update(gameState, _timeStamp);
  };

  // public attack = (gameState: GameState, _timeStamp: number) => {
  //   const weapon = this.children.find(child => child instanceof WeaponEntity);
  //   this.attackCapability.
  // };
}
