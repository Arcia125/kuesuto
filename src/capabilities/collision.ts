// import { worldToCamera } from './../position';
import {  getRectCorners } from '../rectangle';
import { EVENTS } from '../events';
import { getSpriteScale } from '../sprites';
import { Capability, GameEntity, GameState } from '../models';
import { Movement } from './movement';

export class Collision implements Capability {
  public static NAME = 'Collision';
  public static SOURCE_NAME = 'Collision.tsx';
  public constructor(public entity: GameEntity, public movementCapability: Movement) {}

  public update = (gameState: GameState, _timeStamp: number) => {
    const tileSize = getSpriteScale(gameState.elements.mainCanvas);
    const corners = getRectCorners({ x: this.entity.state.x / tileSize, y: this.entity.state.y / tileSize, h: 1, w: 1 });

    let collidedCorners = [];
    for (let i = 0; i < corners.length; i++) {



      const x = corners[i].x;
      const y = corners[i].y;
      // console.log({x, y})

      // const cameraPos = worldToCamera({ x, y, }, gameState.camera);
      // window.defferedRender = () => {

      //   console.log({x, y }, cameraPos);
      //   gameState.elements.mainCanvasContext.beginPath();
      //   gameState.elements.mainCanvasContext.arc(cameraPos.x, cameraPos.y, 10, 0, 2*Math.PI);
      //   gameState.elements.mainCanvasContext.fillStyle = '#000';
      //   gameState.elements.mainCanvasContext.fill();


      //   gameState.elements.mainCanvasContext.closePath();
      // };
      const tiles = gameState.map.getTilesAt({ x, y });
      const collisionLayer = tiles.find(tile => tile.layer.name === Collision.NAME);
      if (collisionLayer?.tile && collisionLayer.tile !== 0) {
        collidedCorners.push(corners[i]);
      }
    }

    if (collidedCorners.length) {
      gameState.emitter.emit(EVENTS.COLLISION, {
        entity: this.entity,
        collidedCorners,
      });
      this.movementCapability.action?.undo();
    }

    // const tileset = gameState.map.activeMap.worldMap.tilesets.find(tileset => tileset.source === gameState.map.activeMap.tileMap.sourceMap[Collision.SOURCE_NAME]);
  }
}
