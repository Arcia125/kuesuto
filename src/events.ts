export type EventListener<T = any> = (eventName: string, payload?: T) => void;

class EventEmitter {
  public static ALL = 'all';
  private listeners: Record<string, EventListener[]> = {
    [EventEmitter.ALL]: [],
  };

  on = <T>(eventName: string, listener: EventListener<T>) => {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    this.listeners[eventName].push(listener);
  }

  once = <T>(eventName: string, listener: EventListener<T>) => {
    let newListener = (name: string, payload: T | undefined) => {
      listener(name, payload);
      this.off(name, newListener);
    }
    this.on(eventName, newListener);
  }

  emit = <T>(eventName: string, payload?: T) => {

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
        allListeners[i](eventName, payload);
      }
    }
  }

  off = <T>(eventName: string, listener: EventListener<T>) => {
    const listeners = this.listeners[eventName];

    if (listeners) {
      this.listeners[eventName] = listeners.filter(l => l !== listener);
    }
  }
}

export { EventEmitter };
