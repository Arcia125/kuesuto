import { worldToCamera } from './position';
import { getImage } from './images';
import { getSpriteScale, drawSprite } from './sprites';
import tileMapJSONRaw from './data/spriteJSON/kuesuto-tilemap.json';
import forrestWorldMap from './data/maps/kuesuto-world.json';
import { EventEmitter } from './events';
import { GameMap, GameMapState, GameState, Position, TileMap, TileMapJSON, WorldMap, TileLayer } from './models';
import { positionIndexFromArray } from './array';
import { getBoundingRect } from './rectangle';
import { Collision } from './capabilities/collision';

export class GameTileMap implements TileMap {
  public constructor(public tileMapJSON: TileMapJSON, public tileSets: Record<string, HTMLImageElement>, public worldMaps: Record<string, WorldMap>, public sourceMap: Record<string, TileMapJSON>) {

  }

  public getTilesAt = (mapName: string, position: Position) => {
    const tileLayers = this.worldMaps[mapName].layers.filter(layer => layer.type === 'tilelayer') as TileLayer[];
    return tileLayers.map((layer: TileLayer) => {

      const positionIndex = positionIndexFromArray(layer.data.length, layer.width, position);
      return {
        layer,
        tile: layer.data[positionIndex]
      };
    }, []);
  }
}

export class RenderableMap implements GameMap {
  public tileMaps: Record<string, GameTileMap>;
  public activeMap: { name: string; tileMap: TileMap; worldMap: WorldMap; };
  public constructor(public state: GameMapState, public emitter: EventEmitter) {
    const forrestTileMapPath = './kuesuto-tilemap.png';
    this.tileMaps = {
      forrest: new GameTileMap(tileMapJSONRaw, {
        forrest: getImage(() => {
          emitter.emit('imageLoaded', {
            imagePath: forrestTileMapPath
          });
        }, forrestTileMapPath)
      }, {
        forrest: forrestWorldMap as WorldMap
      }, {
        'ks-tilemap.tsx': tileMapJSONRaw
      }),
    }

    this.activeMap = {
      name: 'forrest',
      tileMap: this.tileMaps.forrest,
      worldMap: this.tileMaps.forrest.worldMaps.forrest,
    };
  }

  public getTilesAt = (position: Position) => {
    return this.activeMap.tileMap.getTilesAt(this.activeMap.name, position);
  };

  private getObjectLayer = () => this.activeMap.worldMap.layers.find(layer => layer.type === 'objectgroup');

  public getObjectStartLocation = (objectName: string) => {
    const objectLayer = this.getObjectLayer();
    if (objectLayer?.type !== 'objectgroup') {
      throw new Error('missing object layer');
    }
    const objectStartLocation = objectLayer.objects.find(object => object.name === objectName);
    if (!objectStartLocation) {
      throw new Error('missing object start location');
    }
    return objectStartLocation;
  };

  public render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: GameState) => {
    const gridWidth = canvas.width;
    const gridHeight = canvas.height;
    const gridCellSize = Math.ceil(getSpriteScale(canvas));
    const canvasWidth = Math.ceil(getSpriteScale(canvas) * this.state.scaleX);
    const canvasHeight = Math.ceil(getSpriteScale(canvas) * this.state.scaleY);

    const cameraBox = getBoundingRect(gameState.camera, 'center');
    const renderXOffset = Math.max(cameraBox.left, 0);
    const renderYOffset = Math.max(cameraBox.top, 0);


    // let i = 0;
    // Rows
    for (let x = Math.max(renderXOffset - gridCellSize, 0); x <= gridWidth + renderXOffset + gridCellSize; x += gridCellSize) {

      // Columns
      for (let y = Math.max(renderYOffset - gridCellSize, 0); y <= gridHeight + renderYOffset + gridCellSize; y += gridCellSize) {
        // will need to offset x and y by the camera offset once camera has moved
        // const tiles = this.tileMaps.forrest.getTilesAt('forrest', { x: Math.ceil(x / gridCellSize), y: Math.ceil(y / gridCellSize) });
        // const tiles = this.activeMap.tileMap.getTilesAt(this.activeMap.name, { x: Math.ceil(x / gridCellSize), y: Math.ceil(y / gridCellSize) });
        const tiles = this.getTilesAt({ x: Math.ceil(x / gridCellSize), y: Math.ceil(y / gridCellSize) });

        // Tiles[Row,Column]
        for (let tI = 0; tI < tiles.length; tI++) {
          if (tiles[tI].layer.name === Collision.NAME || tiles[tI].tile === 0) {
            // drawSprite(ctx, canvas, this.tileMaps.forrest.tileSets.forrest, {
            //   spriteX: frame.frame.x,
            //   spriteY: frame.frame.y,
            //   spriteWidth: frame.frame.w,
            //   spriteHeight: frame.frame.h,
            //   // rounded to prevent gaps between tiles
            //   canvasX: Math.round(cameraPos.x - renderXOffset % gridCellSize),
            //   // rounded to prevent gaps between tiles
            //   canvasY: Math.round(cameraPos.y - renderYOffset % gridCellSize),
            //   canvasWidth,
            //   canvasHeight,
            // });
            if (gameState.debugSettings.drawEntityHitboxes && tiles[tI].tile !== 0) {
              const cameraPos = worldToCamera({ x, y }, gameState.camera);
              ctx.beginPath();
              ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
              ctx.rect(Math.round(cameraPos.x - renderXOffset % gridCellSize), Math.round(cameraPos.y - renderYOffset % gridCellSize), canvasWidth, canvasHeight);
              ctx.fill();
              ctx.closePath();
            }
            continue;
          }
          // if (i === 0) {
          //   console.log({
          //     canvasX: Math.ceil(x - renderXOffset - renderXOffset % gridCellSize),
          //     canvasY: Math.ceil(y - renderYOffset - renderYOffset % gridCellSize),
          //     x,
          //     y,
          //     renderXOffset,
          //     renderYOffset,
          //     cameraBox
          //   });
          // }
          // i++;

          // const tileset = this.tileMaps.forrest.worldMaps.forrest.tilesets.find(ts => ts.firstgid <= tiles[tI].tile);
          const tileset = this.activeMap.worldMap.tilesets.find(ts => ts.firstgid <= tiles[tI].tile);
          if (!tileset) {

            // TODO: fix out of bounds for the bottom and right edges of the map (maybe let camera go past edge, but render black or some fallback)
            console.error('tileset not found');
            continue;
          }


          // const tilemapJSON = this.tileMaps.forrest.sourceMap[tileset.source];
          const tilemapJSON = this.activeMap.tileMap.sourceMap[tileset.source];
          const frame = tilemapJSON.frames[tiles[tI].tile - 1];
          const cameraPos = worldToCamera({ x, y }, gameState.camera);
          drawSprite(ctx, canvas, this.tileMaps.forrest.tileSets.forrest, {
            spriteX: frame.frame.x,
            spriteY: frame.frame.y,
            spriteWidth: frame.frame.w,
            spriteHeight: frame.frame.h,
            // rounded to prevent gaps between tiles
            canvasX: Math.round(cameraPos.x - renderXOffset % gridCellSize),
            // rounded to prevent gaps between tiles
            canvasY: Math.round(cameraPos.y - renderYOffset % gridCellSize),
            canvasWidth,
            canvasHeight,
          });
        }
        // drawSprite(
        //   ctx,
        //   canvas,
        //   this.tiles.spriteSheet,
        //   {
        //     spriteX: grassFrame.frame.x,
        //     spriteY: grassFrame.frame.y,
        //     spriteWidth: grassFrame.frame.w,
        //     spriteHeight: grassFrame.frame.h,
        //     canvasX: x,
        //     canvasY: y,
        //     canvasWidth,
        //     canvasHeight,
        //   }
        // );
      }
    }
  };
}
