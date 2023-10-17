type EventListener<T = any> = (eventName: string, payload?: T) => void;

class EventEmitter {
  public static ALL = 'all';
  private listeners: Record<string, EventListener[]> = {
    [EventEmitter.ALL]: [],
  };

  on<T>(eventName: string, listener: EventListener<T>) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    this.listeners[eventName].push(listener);
  }


  emit<T>(eventName: string, payload?: T) {

    const listeners = this.listeners[eventName];

    if (listeners) {
      listeners.forEach(listener => listener(eventName, payload));
    }
    const allListeners = this.listeners[EventEmitter.ALL];
    if (allListeners) {
      allListeners.forEach(listener => listener(eventName, payload));
    }
  }

  off<T>(eventName: string, listener: EventListener<T>) {
    const listeners = this.listeners[eventName];

    if (listeners) {
      this.listeners[eventName] = listeners.filter(l => l !== listener);
    }
  }
}

export { EventEmitter };
