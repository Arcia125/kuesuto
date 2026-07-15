import { GameState, IAreaTitleSystem } from '../models';
import { EventEmitter, EVENTS } from '../events';
import { getImage } from '../images';

const BANNER_PATH = './ks-area-banner.png';

// Canonical area display names (DESIGN.md, "The world"). Maps without an entry
// simply show no card.
const AREA_TITLES: Record<string, string> = {
  prologue: 'Thornwick Waystation',
  forrest: 'Verdelight Glade',
  'ruins-approach': 'Ancient Ruins',
};

/**
 * Shows the area title card: an AI-prerendered banner (public/ks-area-banner.png)
 * with the area's canonical name drawn over it (rendering.ts drawAreaTitle owns the
 * visuals + fade envelope; this system owns WHEN). Triggers on map transitions and
 * on the first frame the game runs (new game, save load, and ?map= deep links all
 * set the map before the state flips to running).
 */
export class AreaTitleSystem implements IAreaTitleSystem {
  public bannerImage: HTMLImageElement;
  public current: { title: string; shownAtMs: number } | null = null;
  private announcedRun = false;

  public constructor(private emitter: EventEmitter) {
    this.bannerImage = getImage(() => {
      this.emitter.emit(EVENTS.IMAGE_LOADED, { imagePath: BANNER_PATH });
    }, BANNER_PATH);
    emitter.on(EVENTS.AREA_TRANSITION_COMPLETE, (_eventName, payload) => {
      this.show(payload.mapName);
    });
    // Back at the start menu (restart flows): the next run announces again.
    emitter.on(EVENTS.GAME_STATE, (_eventName, payload) => {
      if (payload.state === 'start') this.announcedRun = false;
    });
  }

  public show = (mapName: string) => {
    const title = AREA_TITLES[mapName];
    this.current = title ? { title, shownAtMs: Date.now() } : null;
  };

  public update(gameState: GameState, _timeStamp: number): void {
    if (!this.announcedRun && gameState.systems.gameState.inStates(['running'])) {
      this.announcedRun = true;
      this.show(gameState.map.activeMap.name);
    }
  }
}
