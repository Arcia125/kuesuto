import { GameEntityState, GameState, GameEntity, SpriteJSON } from '../models';
import playerSpriteJSONRAW from '../data/spriteJSON/kuesuto-player.json';
import { EventEmitter } from '../events';
import { Movement } from '../capabilities/movement';
import { Control } from '../capabilities/control';
import { SpriteEntity } from "./spriteEntity";


export class PlayerEntity extends SpriteEntity {
  public static NAME = 'player';
  public movementCapability = new Movement(this);
  public controlCability = new Control(this);

  public constructor(public state: GameEntityState, public children: GameEntity[], emitter: EventEmitter) {
    super(state, PlayerEntity.NAME, children, emitter, playerSpriteJSONRAW as SpriteJSON, './kuesuto-player.png');
    this;
  }

  public update = (gameState: GameState, _timeStamp: number) => {
    super.update(gameState, _timeStamp);

    this.controlCability.update(gameState, _timeStamp);
    this.movementCapability.update(gameState, _timeStamp);

    this.state.attacking = gameState.controls.attack;
  };
}
