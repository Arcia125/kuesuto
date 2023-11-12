import {  } from '../position';
import { findPath, PathNode } from '@arcia125/pather';
import { Collision } from './collision';
import { PlayerEntity } from '../entities/playerEntity';
import {
  Capability,
  GameEntity,
  GameState,
  Position
} from '../models';
import { positionFromTileCoord, tileDistanceTo, positionToTileCoord, fromTileCoord } from '../position';

export class Aggro implements Capability {
  public isAggroed = false;
  public isReturning = false;
  private minDiffTolerance = 10;
  private path: PathNode[] | undefined;
  public aggroStart = {
    x: 0,
    y: 0,
  };

  public constructor(public entity: GameEntity, public range: number) {

  }

  public moveTowards = (gameState: GameState, position: Position) => {
    // this.entity.state.moving = true;

    // const xDiff = position.x - this.entity.state.x;
    // const yDiff = position.y - this.entity.state.y
    // if (Math.abs(xDiff) > this.minDiffTolerance) {
    //   this.entity.state.xDir = Math.sign(xDiff);
    // } else {
    //   this.entity.state.xDir = 0;
    // }
    // if (Math.abs(yDiff) > this.minDiffTolerance) {
    //   this.entity.state.yDir = Math.sign(yDiff);
    // } else {
    //   this.entity.state.yDir = 0;
    // }

    if (this.isReturning) {
      if (tileDistanceTo(this.entity.state, position) < 2) {
        this.isReturning = false;
      }
    }

    this.path = findPath({
      startPos: positionToTileCoord({
        x: this.entity.state.x,
        y: this.entity.state.y
      }),
      endPos: positionToTileCoord({
        x: position.x,
        y: position.y,
      }),
      isDone: (node, endNode) => Math.abs(node.position.x - endNode.position.x) <= 2 && Math.abs(node.position.y - endNode.position.y) <= 2,
      wouldCollide: (node) => Collision.checkCollision(gameState, {
        ...this.entity,
        state: {
          ...this.entity.state,
          x: fromTileCoord(node.position.x),
          y: fromTileCoord(node.position.y),
        },
      }).collidedCorners.length > 0,
      isOutOfBounds: (node) => gameState.map.isTileOutOfBounds(node),
    });
    if (!this.path) {
      return;
    }
    if (!this.path[0]) {
      return;
    }
    const newPos = positionFromTileCoord({
      x: this.path[0].position.x,
      y: this.path[0].position.y,
    });
    this.entity.state.moving = true;

    const xDiff = newPos.x - this.entity.state.x;
    const yDiff = newPos.y - this.entity.state.y
    if (Math.abs(xDiff) > this.minDiffTolerance) {
      this.entity.state.xDir = Math.sign(xDiff);
    } else {
      this.entity.state.xDir = 0;
    }
    if (Math.abs(yDiff) > this.minDiffTolerance) {
      this.entity.state.yDir = Math.sign(yDiff);
    } else {
      this.entity.state.yDir = 0;
    }

  }

  public update = (gameState: GameState, _timeStamp: number) => {
    if (this.entity.status.dead) {
      return;
    }
    const player = PlayerEntity.find(gameState);

    // debugger;
    // const path = findPath(gameState, { x: this.entity.state.x, y: this.entity.state.y, w: 1, h: 1 } , player.state);

    // debugger;
    // console.log(path);
    if ((Math.abs(player.state.x - this.entity.state.x)) + (Math.abs(player.state.y - this.entity.state.y)) < this.range) {
      if (this.isAggroed) {
        this.moveTowards(gameState, player.state);
      } else {
        this.isAggroed = true;
        if (!this.aggroStart.x && !this.aggroStart.y) {
          this.aggroStart = {
            x: this.entity.state.x,
            y: this.entity.state.y,
          };
        }
      }
    } else if (this.isAggroed) {
      this.isReturning = true;
      this.isAggroed = false;
    } else if (this.isReturning) {
      this.moveTowards(gameState, this.aggroStart);
    } else {
      this.entity.state.moving = false;
      this.entity.state.xDir = 0;
      this.entity.state.yDir = 0;
    }
  };
}
