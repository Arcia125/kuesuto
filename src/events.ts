type EventListener<T = any> = (eventName: string, payload?: T) => void;

class EventEmitter {
  public static ALL = 'all';
  private events: Record<string, EventListener[]> = {
    [EventEmitter.ALL]: [],
  };

  on<T>(eventName: string, listener: EventListener<T>) {
    // const isAll = eventName === 'all';
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(listener);
  }


  emit<T>(eventName: string, payload?: T) {

    const listeners = this.events[eventName];

    if (listeners) {
      listeners.forEach(listener => listener(eventName, payload));
    }
    const allListeners = this.events[EventEmitter.ALL];
    if (allListeners) {
      allListeners.forEach(listener => listener(eventName, payload));
    }
  }

  off<T>(eventName: string, listener: EventListener<T>) {
    const listeners = this.events[eventName];

    if (listeners) {
      this.events[eventName] = listeners.filter(l => l !== listener);
    }
  }
}

export { EventEmitter };
