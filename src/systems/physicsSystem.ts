import { Collision } from '../capabilities/collision';
import { EventEmitter, EVENTS, EVENT_MAPPING } from '../events';
import { Force, ForceEntry, GameEntity, GameState, IPhysicsSystem } from '../models';
import { directionVectorBetween } from '../position';
import { getSpriteScale } from '../sprites';


export class PhysicsSystem implements IPhysicsSystem {
  public skipUpdate = ['init' as const, 'start' as const, 'paused' as const, 'menu' as const];
  private forceEntries: ForceEntry[] = [];

  public constructor(emitter: EventEmitter) {
    emitter.on(EVENTS.ATTACK, (_eventName, payload) => this.handleAttack(payload))
  }

  private handleAttack = ({ attacker, target }: EVENT_MAPPING[typeof EVENTS.ATTACK]) => {
    this.applyForce(target, {
      direction: directionVectorBetween(attacker.state, target.state),
      magnitude: 700
    });
  };

  private registerForce = (forceEntry: ForceEntry) => this.forceEntries.push(forceEntry);

  public applyForce = (entity: GameEntity, force: Force) => {
    if (entity.status.immortal) return;
    this.registerForce({ entity, force });
  }

  public update = (gameState: GameState, _timestamp: number) => {
    for (let i = 0; i < this.forceEntries.length; i++) {
      const forceEntry = this.forceEntries[i];
      const { entity, force } = forceEntry;
      let angle = Math.atan2(force.direction.y / getSpriteScale(), force.direction.x / getSpriteScale());
      let xForce = Math.cos(angle) * ((force.magnitude * 0.01) / entity.state.mass) * gameState.time.delta;
      let yForce = Math.sin(angle) * ((force.magnitude * 0.01) / entity.state.mass) * gameState.time.delta;

      let newX = entity.state.x + xForce;
      let newY = entity.state.y + yForce;
      if (Collision.checkCollision(gameState, {
        ...entity,
        state: {
          ...entity.state,
          x: newX,
          y: newY,
        }
      }).collidedCorners.length) {
        xForce *= -1;
        yForce *= -1;
        newX = entity.state.x + xForce;
        newY = entity.state.y + yForce;
        force.direction.x *= -1;
        force.direction.y *= -1;
      }
      entity.state.x = newX;
      entity.state.y = newY;
      force.magnitude -= Math.abs(xForce) + Math.abs(yForce);
      if (force.magnitude <= 10) {
        this.forceEntries.splice(i, 1);
      }
    }
  }
}
