import { Corners, GameEntity } from './models';
export const EVENTS = {
  ALL: 'all',
  FPS: 'fps',
  INIT: 'init',
  RENDER_START: 'renderStart',
  RENDER_END: 'renderEnd',
  IMAGE_LOADED: 'imageLoaded',
  RENDER_SPRITE: 'renderSprite',
  ANIMATION_END: 'animationEnd',
  ATTACK: 'attack',
  ATTACK_COMMAND: 'attackCommand',
  COLLISION: 'collision',
} as const;

export type EVENT_KEY = keyof typeof EVENTS;
export type EVENT_NAME = typeof EVENTS[EVENT_KEY];

export type EVENT_MAPPING = {
  [EVENTS.ALL]: any;
  [EVENTS.FPS]: { fps: number; };
  [EVENTS.INIT]: {
    mainCanvas: HTMLCanvasElement;
    mainCanvasContext: CanvasRenderingContext2D;
  };
  [EVENTS.RENDER_START]: null;
  [EVENTS.RENDER_END]: null;
  [EVENTS.IMAGE_LOADED]: { imagePath: string; };
  [EVENTS.RENDER_SPRITE]: {
    spriteData: {
      canvasX: number;
      canvasY: number;
      canvasWidth: number;
      canvasHeight: number;
      spriteX: number;
      spriteY: number;
      spriteWidth: number;
      spriteHeight: number;
    };
    entity: GameEntity;
  }
  [EVENTS.ANIMATION_END]: { entity: GameEntity; name: string };
  [EVENTS.ATTACK]: null;
  [EVENTS.ATTACK_COMMAND]: null;
  [EVENTS.COLLISION]: { entity: GameEntity; collidedCorners: Corners[keyof Corners][] };
}

export type EventListener<T extends EVENT_NAME> = (eventName: T, payload: EVENT_MAPPING[T]) => void;


class EventEmitter {
  public static ALL = EVENTS.ALL;
  private listeners: { [k in EVENT_NAME]?: EventListener<k>[] } = {
    [EventEmitter.ALL]: [] as EventListener<typeof EVENTS.ALL>[],
  };

  on = <T extends EVENT_NAME>(eventName: T, listener: EventListener<T>) => {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    this.listeners[eventName]!.push(listener);
  }

  once = <T extends EVENT_NAME>(eventName: T, listener: EventListener<T>) => {
    let newListener: EventListener<T> = (name, payload) => {
      listener(name, payload);
      this.off(name, newListener);
    }
    this.on(eventName, newListener);
  }

  emit = <T extends EVENT_NAME>(eventName: T, payload: EVENT_MAPPING[T]) => {

    const listeners = this.listeners[eventName];

    if (listeners) {
      const listenerLen = listeners.length;
      for (let i = 0; i < listenerLen; i++) {
        listeners[i](eventName, payload);
      }
    }
    const allListeners = this.listeners[EventEmitter.ALL];
    if (allListeners) {
      const allListenerLen = allListeners.length;
      for (let i = 0; i < allListenerLen; i++) {
        allListeners[i](eventName as any, payload);
      }
    }
  }

  off = <T extends EVENT_NAME>(eventName: T, listener: EventListener<T>) => {
    const listeners = this.listeners[eventName];

    if (listeners) {
      this.listeners[eventName] = listeners.filter(l => l !== listener) as any;
    }
  }
}

export { EventEmitter };
