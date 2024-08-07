import { getRectCorners } from '../rectangle';
import { EVENTS } from '../events';
import { getSpriteScale } from '../sprites';
import { Capability, Corners, GameEntity, GameState, Rect } from '../models';
import { Movement } from './movement';
import { toTileCoord } from '../position';

export class Collision implements Capability {
  public static NAME = 'Collision';
  public static SOURCE_NAME = 'Collision.tsx';

  public static checkTileCollision(gameState: GameState, entityOrRect: GameEntity | Rect): Corners[keyof Corners][] {
    const pos = (entityOrRect as any).state ? (entityOrRect as GameEntity).state : entityOrRect;
    const corners = getRectCorners({ x: toTileCoord((pos as Rect).x), y: toTileCoord((pos as Rect).y), h: 1, w: 1 });

    const collidedCorners = [];
    for (let i = 0; i < corners.length; i++) {

      const x = corners[i].x;
      const y = corners[i].y;

      const tiles = gameState.map.getTilesAt({ x, y });
      const collisionLayer = tiles.find(tile => tile.layer.name === Collision.NAME);
      if (collisionLayer?.tile && collisionLayer.tile !== 0) {
        collidedCorners.push(corners[i]);
      }
    }
    return collidedCorners;
  };

  public static checkTiles(gameState: GameState, entity: GameEntity): Corners[keyof Corners][] {
    const corners = getRectCorners({ x: toTileCoord(entity.state.x), y: toTileCoord(entity.state.y), h: 1, w: 1 });
    const collidedCorners = [];
    for (let i = 0; i < corners.length; i++) {

      const x = corners[i].x;
      const y = corners[i].y;

      const tiles = gameState.map.getTilesAt({ x, y });
      // gameState.map.getCollisionShapesAt({ x, y });
      const collisionLayer = tiles.find(tile => tile.layer.name === Collision.NAME);
      if (collisionLayer?.tile && collisionLayer.tile !== 0) {
        collidedCorners.push(corners[i]);
      }
    }
    return collidedCorners;
  }

  public static checkEntityCollision(gameState: GameState, entity: GameEntity): { collidedCorners: Corners[keyof Corners][], entities: GameEntity[] } {
    const entityCount = gameState.entities.length;
    const tileSize = getSpriteScale();
    const corners = getRectCorners({ x: entity.state.x, y: entity.state.y, h: tileSize, w: tileSize });
    let collidedCorners = [];
    let entities = [];
    for (let i = 0; i < entityCount; i++) {
      if (!gameState.entities[i]) {
        break;
      }
      if (gameState.entities[i].name === entity.name) {
        continue;
      }
      if (entity.status.dead) {
        continue;
      }
      const foreignEntity = gameState.entities[i];
      if (foreignEntity.status.dead) {
        continue
      }
      const foreignEntityCorners = getRectCorners({ x: foreignEntity.state.x, y: foreignEntity.state.y, h: tileSize, w: tileSize });
      // top-left corner collides foreign entity
      if (corners[0].x > foreignEntityCorners[0].x && corners[0].x < foreignEntityCorners[1].x && corners[0].y > foreignEntityCorners[0].y && corners[0].y < foreignEntityCorners[2].y) {
        collidedCorners.push(corners[0]);
        entities.push(foreignEntity);
      }
      // top-right corner collides foreign entity
      if (corners[1].x > foreignEntityCorners[0].x && corners[1].x < foreignEntityCorners[1].x && corners[1].y > foreignEntityCorners[0].y && corners[1].y < foreignEntityCorners[2].y) {
        collidedCorners.push(corners[1]);
        entities.push(foreignEntity);
      }
      // bottom-right corner collides foreign entity
      if (corners[2].x > foreignEntityCorners[0].x && corners[2].x < foreignEntityCorners[1].x && corners[2].y > foreignEntityCorners[0].y && corners[2].y < foreignEntityCorners[2].y) {
        collidedCorners.push(corners[2]);
        entities.push(foreignEntity);
      }
      // bottom-left corner collides foreign entity
      if (corners[3].x > foreignEntityCorners[0].x && corners[3].x < foreignEntityCorners[1].x && corners[3].y > foreignEntityCorners[0].y && corners[3].y < foreignEntityCorners[2].y) {
        collidedCorners.push(corners[3]);
        entities.push(foreignEntity);
      }
    }
    return {
      collidedCorners,
      entities,
    };
  }

  public static checkCollision = (gameState: GameState, entity: GameEntity) => {
    let collidedCorners: Corners[keyof Corners][] = [];
    let entities: GameEntity[] = [];
    collidedCorners = collidedCorners.concat(Collision.checkTileCollision(gameState, entity))
    const entityCollisionResults = Collision.checkEntityCollision(gameState, entity);

    Collision.checkTiles(gameState, entity);
    collidedCorners = collidedCorners.concat(entityCollisionResults.collidedCorners);
    entities = entities.concat(entityCollisionResults.entities);
    return {
      collidedCorners,
      entities,
    };
  };

  public constructor(public entity: GameEntity, public movementCapability?: Movement) {}

  public update = (gameState: GameState, _timeStamp: number) => {
    const {
      collidedCorners,
      entities,
    } = Collision.checkCollision(gameState, this.entity)
    if (collidedCorners.length) {
      gameState.emitter.emit(EVENTS.COLLISION, {
        entity: this.entity,
        collidedCorners,
        entities,
      });
      this.movementCapability?.action?.undo();
    }

    // const tileset = gameState.map.activeMap.worldMap.tilesets.find(tileset => tileset.source === gameState.map.activeMap.tileMap.sourceMap[Collision.SOURCE_NAME]);
  }
}
