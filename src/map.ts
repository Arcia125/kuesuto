import { getImage } from './images';
import { getSpriteScale, drawSprite } from './sprites';
import tileMapJSONRaw from './data/spriteJSON/kuesuto-tilemap.json';
import forrestWorldMap from './data/maps/kuesuto-world.json';
import { EventEmitter } from './events';
import { GameMap, GameMapState, GameState, Position, TileMap, TileMapJSON, WorldMap, TileLayer } from './models';
import { positionIndexFromArray } from './array';

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
  }

  public render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, _gameState: GameState) => {
    const gridWidth = canvas.width;
    const gridHeight = canvas.height;
    const gridCellSize = Math.ceil(getSpriteScale(canvas));
    // const grassFrame = tileMapJSONRaw.frames['Grass'];
    const canvasWidth = Math.ceil(getSpriteScale(canvas) * this.state.scaleX);
    const canvasHeight = Math.ceil(getSpriteScale(canvas) * this.state.scaleY);
    // console.log

    // Rows
    for (let x = 0; x <= gridWidth; x += gridCellSize) {

      // Columns
      for (let y = 0; y <= gridHeight; y += gridCellSize) {
        // will need to offset x and y by the camera offset once camera has moved
        const tiles = this.tileMaps.forrest.getTilesAt('forrest', { x: Math.ceil(x / gridCellSize), y: Math.ceil(y / gridCellSize) });

        // Tiles[Row,Column]
        for (let tI = 0; tI < tiles.length; tI++) {
          if (tiles[tI].layer.name === 'Collision' || tiles[tI].tile === 0) {
            continue;
          }

          const tileset = this.tileMaps.forrest.worldMaps.forrest.tilesets.find(ts => ts.firstgid <= tiles[tI].tile);
          if (!tileset) {
            throw new Error('tileset not found');
          }

          const tilemapJSON = this.tileMaps.forrest.sourceMap[tileset.source];
          const frame = tilemapJSON.frames[tiles[tI].tile - 1];
          drawSprite(ctx, canvas, this.tileMaps.forrest.tileSets.forrest, {
            spriteX: frame.frame.x,
            spriteY: frame.frame.y,
            spriteWidth: frame.frame.w,
            spriteHeight: frame.frame.h,
            canvasX: x,
            canvasY: y,
            canvasWidth,
            canvasHeight,
          })
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
