import { ANIMATION_SPEED_MULTIPLIER } from '../constants';
import { GameEntityState, GameState, GameEntity, GameSprite, Direction, Frame, Status } from '../models';
import { frameMatchesEntity } from '../sprites';
import { EventEmitter, EVENTS } from '../events';


let id = 0;

export class Entity implements GameEntity {
  public id = id++;
  public sprite?: GameSprite;
  public parent?: GameEntity | undefined;
  public status: Status = {
    health: 0,
    experience: 0,
    level: 1,
  };

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

    spriteFrameEntries = Object.entries(entity.sprite?.spriteFrames).filter(frameMatchesEntity(entity, direction));

    const [spriteFrameName, spriteFrameValue] = spriteFrameEntries.find(([name, value]) => {
      if (!name) {
        throw new Error('Failed to load sprite sheet');
      }

      let found = null;
      if (entityState.currentAnimationName === name && entityState.animationToEnd && entityState.animationFrameX === 0) {
        entityState.lastAnimationName = name;
        // TODO investigate delayed animation ending
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


