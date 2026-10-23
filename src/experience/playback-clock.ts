import { tickJourney } from './journey.ts';
import type { Journey } from './journey.ts';

/**
 * Integrates the previous input before changing it. Input is not lost when the
 * browser delays a painted frame until after keyup or pointerup.
 */
export class PlaybackClock {
  private last: number;
  private direction = 0;
  private expires = Infinity;
  private state: Journey;
  time = 0;

  constructor(state: Journey, now: number) { this.state = state; this.last = now; }

  advance(now: number) {
    if (now <= this.last) return;
    const previous = this.last;
    this.last = now;
    if (this.state.suspended) return;
    const movingEnd = Math.min(now, this.expires);
    if (movingEnd > previous) this.integrate((movingEnd - previous) / 1000, this.direction);
    if (now > Math.max(previous, movingEnd)) this.integrate((now - Math.max(previous, movingEnd)) / 1000, 0);
    this.time += (now - previous) / 1000;
  }

  private integrate(seconds: number, direction: number) {
    let remaining = seconds;
    while (remaining > .000001) {
      const step = Math.min(remaining, .25);
      tickJourney(this.state, step, direction);
      remaining -= step;
    }
  }

  changeDirection(direction: number, now: number, expires = Infinity) {
    this.advance(now);
    this.direction = direction;
    this.expires = expires;
  }

  reset(now: number) {
    this.last = now;
    this.direction = 0;
    this.expires = Infinity;
  }
}
