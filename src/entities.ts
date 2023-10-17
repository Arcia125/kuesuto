import { GameEntityState, GameState, GameEntity, SpriteJSON, GameSprite } from './models';
import { Sprite } from './sprites';
import playerSpriteJSONRAW from './player.json';
import { EventEmitter } from './events';


let id = 0;

export class Entity implements GameEntity {
  public id = id++;
  public sprite?: GameSprite;
  public constructor(public state: GameEntityState, public name: string, public emitter: EventEmitter) {

  }

  public update(_gameState: GameState, _timeStamp: number) {
  }
}

export class SpriteEntity extends Entity {
  public constructor(public state: GameEntityState, public name: string, public emitter: EventEmitter, spriteJSON: SpriteJSON, imagePath: string) {
    super(state, name, emitter);
    this.sprite = new Sprite(spriteJSON, imagePath, emitter);
  }
}

export class PlayerEntity extends SpriteEntity {
  public static NAME = 'player';

  public constructor(public state: GameEntityState, emitter: EventEmitter) {
    super(state, PlayerEntity.NAME, emitter, playerSpriteJSONRAW as SpriteJSON, './player.png');
    // this.spriteSheet = getImage(() => console.log('loaded player'), './player.png');
    // this.spriteJSON = playerSpriteJSONRAW as SpriteJSON;
    // this.spriteFrames = getSpriteFrames(this.spriteJSON);
  }

  public update = (gameState: GameState, _timeStamp: number) => {
    let moving = false;
    let yDir = this.state.yDir;
    let xDir = this.state.xDir;
    let movedX = false;
    let movedY = false;
    if (gameState.controls.up) {
      // this.state.y -= (this.state.speedY * gameState.time.delta);
      yDir = -1;
      moving = true;
      movedY = true;
    }
    if (gameState.controls.down) {
      // this.state.y += (this.state.speedY * gameState.time.delta);
      yDir = 1;
      moving = true;
      movedY = true;
    }
    if (gameState.controls.left) {
      // this.state.x -= (this.state.speedX * gameState.time.delta);
      xDir = -1;
      moving = true;
      movedX = true;
    }
    if (gameState.controls.right) {
      // this.state.x += (this.state.speedX * gameState.time.delta);
      xDir = 1;
      moving = true;
      movedX = true;
    }


    if (moving) {
      const angle = Math.atan2(yDir, xDir);
      this.state.x += (Math.cos(angle) * this.state.speedX * gameState.time.delta);
      this.state.y += (Math.sin(angle) * this.state.speedY * gameState.time.delta);
    }

    this.state.moving = moving;

    if (movedX && !movedY) {
      yDir = 0;
    } else if (movedY && !movedX) {
      xDir = 0;
    }
    this.state.yDir = yDir;
    this.state.xDir = xDir;
  }
}
