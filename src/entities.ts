import { ANIMATION_SPEED_MULTIPLIER } from './constants';
import { GameEntityState, GameState, GameEntity, SpriteJSON, GameSprite, Direction, Frame } from './models';
import { Sprite, getSpriteScale, frameMatchesEntity } from './sprites';
import playerSpriteJSONRAW from './spriteJSON/kuesuto-player.json';
import swordSpriteJSONRAW from './spriteJSON/kuesuto-sword.json';
import { EventEmitter, EventListener, EVENTS } from './events';


let id = 0;

export class Entity implements GameEntity {
  public id = id++;
  public sprite?: GameSprite;
  public parent?: GameEntity | undefined;

  public static getDirection(entityState: GameEntityState): Direction {
    const facingUp = entityState.yDir < 0;
    const facingDown = entityState.yDir > 0;
    const facingRight = entityState.xDir > 0;
    const facingLeft = entityState.xDir < 0;

    const direction = facingUp ? 'up' :
      facingDown ? 'down' :
        facingRight ? 'right' :
          facingLeft ? 'left' : 'down';
    return direction;
  }

  public static getSpritePos (gameState: GameState, direction: 'up' | 'down' | 'left' | 'right', entity: GameEntity) {
    if (!entity.sprite) throw new Error("No sprite on entity");

    const entityState = entity.state;

    let spriteFrameEntries;

    spriteFrameEntries = Object.entries(entity.sprite?.spriteFrames).filter(frameMatchesEntity(entityState, direction));

    const [spriteFrameName, spriteFrameValue] = spriteFrameEntries.find(([name, value]) => {
      if (!name) {
        throw new Error('Failed to load sprite sheet');
      }

      let found = null;
      if (entityState.currentAnimationName === name && entityState.animationToEnd && entityState.animationFrameX === 0) {
        entityState.lastAnimationName = name;
        gameState.emitter.emit(EVENTS.ANIMATION_END, { entity, name });
        entityState.animationToEnd = false;
        found = false;
      }
      if (entityState.lastAnimationName === name && spriteFrameEntries.length > 1) {
        found = false;
      }
      if (entityState.animationFrameX >= (value.frames.length - 1)) {
        entityState.animationToEnd = true;
        if (found !== false) {
          found = true;
        }
      } else {
        if (found !== false) {
          found = true;
        }
      }

      if (found) {
        const timeSinceLastFrame = gameState.time.lastFrameTimeMs - entityState.animationFrameXStart;

        if (entityState.animationFrameX >= value.frames.length) {
          entityState.animationFrameX = 0;
        }
        if (timeSinceLastFrame > value.frames[entityState.animationFrameX]?.duration * ANIMATION_SPEED_MULTIPLIER) {
          entityState.animationFrameXStart = gameState.time.lastFrameTimeMs;
          entityState.animationFrameX++;

          if (entityState.animationFrameX >= value.frames.length) {
            entityState.animationFrameX = 0;
          }

        }
      }

      return found;

    }) || spriteFrameEntries[0];
    if (spriteFrameName === '') {
      throw new Error('Sprite frame name not found');
    }

    if (!spriteFrameValue) {
      throw new Error('Sprite frame value not found');
    }

    entityState.currentAnimationName = spriteFrameName;

    return spriteFrameValue.frames[entityState.animationFrameX];
  };

  public constructor(public state: GameEntityState, public name: string, public children: GameEntity[], public emitter: EventEmitter) {
    this.children.forEach(child => {
      child.setParent(this);
    });
  }

  public setChild = (child: GameEntity) => {
    this.children.push(child);
    child.setParent(this);
  }

  public setParent = (parent: GameEntity) => {
    this.parent = parent;
  }

  public getDirection() {
    return Entity.getDirection(this.state);
  }

  public getSpritePos = (gameState: GameState): Frame => {
    return Entity.getSpritePos(gameState, this.getDirection(), this);
  }

  public update(gameState: GameState, timeStamp: number) {
    if (!this.children?.length) {
      return;
    }

    for (let i = 0; i < this.children.length; i++) {
      this.children[i].update(gameState, timeStamp);
    }
  }
}

export class SpriteEntity extends Entity {
  public constructor(public state: GameEntityState, public name: string, public children: GameEntity[], public emitter: EventEmitter, spriteJSON: SpriteJSON, imagePath: string) {
    super(state, name, children, emitter);
    this.sprite = new Sprite(spriteJSON, imagePath, emitter);
  }
}

export class PlayerEntity extends SpriteEntity {
  public static NAME = 'player';

  public constructor(public state: GameEntityState, public children: GameEntity[], emitter: EventEmitter) {
    super(state, PlayerEntity.NAME, children, emitter, playerSpriteJSONRAW as SpriteJSON, './kuesuto-player.png');
  }

  public update = (gameState: GameState, _timeStamp: number) => {
    super.update(gameState, _timeStamp);
    let moving = false;
    let yDir = this.state.yDir;
    let xDir = this.state.xDir;
    let movedX = false;
    let movedY = false;
    if (gameState.controls.up) {
      yDir = -1;
      moving = true;
      movedY = true;
    }
    if (gameState.controls.down) {
      yDir = 1;
      moving = true;
      movedY = true;
    }
    if (gameState.controls.left) {
      xDir = -1;
      moving = true;
      movedX = true;
    }
    if (gameState.controls.right) {
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

    this.state.attacking = gameState.controls.attack;
  }
}

export class WeaponEntity extends SpriteEntity {
  public constructor(public state: GameEntityState, public name: string, public children: GameEntity[], emitter: EventEmitter, spriteJSONRAW: SpriteJSON, spritePath: string) {
    super(state, name, children, emitter, spriteJSONRAW as SpriteJSON, spritePath);
  }
}

export class SwordEntity extends WeaponEntity {
  public static NAME = 'sword';
  private attackListener: EventListener<any> | null = null;
  public constructor(public state: GameEntityState, public children: GameEntity[], public emitter: EventEmitter) {
    super(state, SwordEntity.NAME, children, emitter, swordSpriteJSONRAW as SpriteJSON, './kuesuto-sword.png');
  }

  public update = (gameState: GameState, _timeStamp: number) => {
    super.update(gameState, _timeStamp);
    if (this.parent) {
      this.state.xDir = this.parent.state.xDir;
      this.state.yDir = this.parent.state.yDir;
      const dir = this.parent.getDirection();
      switch (dir) {
        case 'up': {
          this.state.x = this.parent.state.x;
          this.state.y = this.parent.state.y - (getSpriteScale(gameState.elements.mainCanvas) * this.parent.state.scaleY);
          break;
        }
        case 'down': {
          this.state.x = this.parent.state.x;

          this.state.y = this.parent.state.y + (getSpriteScale(gameState.elements.mainCanvas) * this.parent.state.scaleY);
          break;
        }
        case 'right': {
          this.state.x = this.parent.state.x + (getSpriteScale(gameState.elements.mainCanvas) * this.parent.state.scaleX);
          this.state.y = this.parent.state.y;
          break;
        }
        case 'left': {
          this.state.x = this.parent.state.x - (getSpriteScale(gameState.elements.mainCanvas) * this.parent.state.scaleX);
          this.state.y = this.parent.state.y;
          break;
        }
      }
    }
    if (!this.attackListener) {
      const animationListener: EventListener<typeof EVENTS.ANIMATION_END> = (_name, payload) => {
        if (payload.entity === this) {
          gameState.controls.attack = false;
          this.state.attacking = false;
          this.state.visible = false
        }
      };
      this.emitter.on(EVENTS.ANIMATION_END, animationListener);
      this.attackListener = animationListener;
    }
    if (gameState.controls.attack && !this.state.attacking) {
      this.state.attacking = true;
      this.state.visible = true;
    }
  }
}
