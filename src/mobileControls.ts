import { BrowserElements } from './browserElements';

class Joystick {
  public joyStickElements?: {
    stick: HTMLDivElement;
    container: HTMLDivElement;
  };

  constructor() { }

  init(elements: BrowserElements) {
    this.joyStickElements = {
      stick: elements.joystick,
      container: elements.joystickContainer
    }
  }

  public get center () {
    const clientRect = this.joyStickElements?.container.getBoundingClientRect();
    if (!clientRect) {
      return {
        x: 0,
        y: 0
      };
    }
    return {
      x: ((clientRect.left + clientRect.right) / 2),
      y: ((clientRect.top + clientRect.bottom) / 2),
    };
  }

  public moveJoyStick = (moveX: number, moveY: number) => {
    const containerCenter = this.center;
    const x = clamp(moveX - containerCenter.x, -this.joyStickElements!.container.clientWidth / 2, this.joyStickElements!.container.clientWidth / 2);
    const y = clamp(moveY - containerCenter.y, -this.joyStickElements!.container.clientHeight / 2, this.joyStickElements!.container.clientHeight / 2);
    this!.joyStickElements!.stick.style.transform = `translate(${x}px, ${y}px)`;
    return {
      x,
      y
    };
  };
}

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

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
    chatNext: false,
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
    const { x, y } = this.joyStick.center;
    this.listeners.joystick.forEach(listener => {
      listener({
        type: 'joystick',
        x,
        y,
      });
    });
  };

  public handleJoyStickMove = (moveX: number, moveY: number) => {
    const { x, y } = this.joyStick.moveJoyStick(moveX, moveY);
    this.state.xMove = x;
    this.state.yMove = y;
    this.listeners.joystick.forEach(listener => {
      listener({
        type: 'joystick',
        x,
        y,
      })
    });
  }

  public handleJoyStickRelease = () => {
    const joyStickCenter = this.joyStick.center;
    const { x, y } = this.joyStick.moveJoyStick(joyStickCenter.x, joyStickCenter.y);
    this.state.xMove = x;
    this.state.yMove = y;
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
    document.addEventListener('mousemove', (event) => {
      if (this.joystickClicked) {
        this.handleJoyStickMove(event.clientX, event.clientY);
      }
    });

    document.addEventListener('mouseup', (_event) => {
      if (this.joystickClicked) {
        this.joystickClicked = false;
        this.handleJoyStickRelease();
      }
      if (this.state.attack) {
        this.state.attack = false;
      }
    });

    this.joyStick.joyStickElements?.stick.addEventListener('touchend', (event) => {
      event.preventDefault();
      this.handleJoyStickRelease();
    });

    this.actionElements.attack.addEventListener('touchstart', (_event) => {
      this.state.attack = true;
      this.state.chatNext = true;
      this.listeners.action.forEach(listener => {
        listener({
          type: 'action',
          actionType: 'attack-down'
        });
      });
    });

    this.actionElements.attack.addEventListener('mousedown', (_event) => {
      this.state.attack = true;
      this.state.chatNext = true;
    });

    this.actionElements.attack.addEventListener('touchmove', (event) => {
      event.preventDefault();
    })

    this.actionElements.attack.addEventListener('touchend', (event) => {
      event.preventDefault();
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
