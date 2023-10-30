export class Action {

  constructor(public effect: () => void, public undo: () => void) {
    effect();
  }
}
