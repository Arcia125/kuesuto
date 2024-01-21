import { BrowserElements } from './browserElements';

class Joystick {
  public joyStickElements?: {
    stick: HTMLDivElement;
    container: HTMLDivElement;
  };

  constructor() {

  }

  init(elements: BrowserElements) {
    this.joyStickElements = {
      stick: elements.joystick,
      container: elements.joystickContainer
    }

  }
}

const clamp = (num: number, min: number, max: number) => {
  return Math.min(Math.max(num, min), max);
};

type MobileControlEvent = {
  type: 'joystick';
  x?: number | null;
  y?: number | null;
} | {
  type: 'action';
  actionType: 'attack-down' | 'attack-up';
}

export class MobileControls {
  joyStick: Joystick;
  public actionElements?: {
    attack: HTMLButtonElement;
  };
  private listeners: Record<MobileControlEvent['type'], ((event: MobileControlEvent) => void)[]>;
  public state = {
    xMove: 0,
    yMove: 0,
    attack: false,
  };
  public joystickClicked = false;
  public constructor() {
    this.joyStick = new Joystick();
    this.listeners = {
      joystick: [],
      action: []
    };
  }

  public handleJoyStickClick = () => {
    const clientRect = this.joyStick.joyStickElements?.stick.getBoundingClientRect();
    if (!clientRect) {
      return;
    }
    this.listeners.joystick.forEach(listener => {
      listener({
        type: 'joystick',
        x: (clientRect.left + clientRect.right) / 2,
        y: (clientRect.top + clientRect.bottom) / 2,
      });
    });
  };

  public handleJoyStickMove = (moveX: number, moveY: number) => {
    const clientRect = this.joyStick.joyStickElements?.container.getBoundingClientRect();
    if (!clientRect) {
      return;
    }
    let x = 0, y = 0;

    x = clamp(moveX - ((clientRect.left + clientRect.right) / 2), -this.joyStick.joyStickElements!.container.clientWidth / 2, this.joyStick.joyStickElements!.container.clientWidth / 2);
    y = clamp(moveY - ((clientRect.top + clientRect.bottom) / 2), -this.joyStick.joyStickElements!.container.clientHeight / 2, this.joyStick.joyStickElements!.container.clientHeight / 2);
    this.state.xMove = x;
    this.state.yMove = y;

    this!.joyStick!.joyStickElements!.stick.style.transform = `translate(${x}px, ${y}px)`;
    this.listeners.joystick.forEach(listener => {
      listener({
        type: 'joystick',
        x,
        y,
      })
    });
  }

  public handleJoyStickRelease = () => {
    let x = 0, y = 0;

    this.state.xMove = 0;
    this.state.yMove = 0;
    this!.joyStick!.joyStickElements!.stick.style.transform = `translate(${x}px, ${y}px)`;
    this.listeners.joystick.forEach(listener => {
      listener({
        type: 'joystick',
        x,
        y,
      })
    });
  };

  public init = (elements: BrowserElements) => {
    this.joyStick?.init(elements);
    this.actionElements = {
      attack: elements.attackButton,
    };
    this.joyStick.joyStickElements?.stick.addEventListener('touchstart', (_event) => {
      this.handleJoyStickClick();
    });
    this.joyStick.joyStickElements?.stick.addEventListener('mousedown', (_event) => {
      this.joystickClicked = true;
      this.handleJoyStickClick();
    });
    this.joyStick.joyStickElements?.stick.addEventListener('touchmove', (event) => {
      event.preventDefault();

      const touch = event.touches[0] || event.changedTouches[0];
      this.handleJoyStickMove(touch.pageX, touch.pageY);
    });
    this.joyStick.joyStickElements?.stick.addEventListener('mousemove', (event) => {
      if (this.joystickClicked) {
        this.handleJoyStickMove(event.clientX, event.clientY);
      }
    });

    this.joyStick.joyStickElements?.stick.addEventListener('mouseup', (_event) => {
      this.joystickClicked = false;
      this.handleJoyStickRelease();
    });

    this.joyStick.joyStickElements?.stick.addEventListener('touchend', (event) => {
      event.preventDefault();
      this.handleJoyStickRelease();
    });

    this.actionElements.attack.addEventListener('touchstart', (_event) => {
      this.state.attack = true;
      this.listeners.action.forEach(listener => {
        listener({
          type: 'action',
          actionType: 'attack-down'
        });
      });
    });

    this.actionElements.attack.addEventListener('touchmove', (event) => {
      event.preventDefault();
    })

    this.actionElements.attack.addEventListener('touchend', (event) => {
      event.preventDefault();
      // alert('touchend');
      this.state.attack = false;
      this.listeners.action.forEach(listener => {
        listener({
          type: 'action',
          actionType: 'attack-up'
        });
      });
    });
  }

  on = (eventName: MobileControlEvent['type'], handler: (event: MobileControlEvent) => void) => {
    this.listeners[eventName].push(handler);
  }
}
