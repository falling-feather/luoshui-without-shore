import { CHAPTERS } from '../content.ts';
import type { ChapterId } from '../content.ts';

export const MESSAGE_DURATION = { outbound:6, arrival:2.5, answer:7 } as const;
export const EXCHANGE_DURATION = MESSAGE_DURATION.outbound+MESSAGE_DURATION.arrival+MESSAGE_DURATION.answer;
export const WALK_SPEED = .065;
export type LetterPhase = 'waiting' | 'outbound' | 'arrival' | 'answer' | 'settled';
export interface Journey {
  mode: 'cover' | 'exploring' | 'finished';
  chapter: ChapterId;
  position: number;
  velocity: number;
  idleTime: number;
  elapsed: number;
  suspended: boolean;
  focused: boolean;
  visited: Set<ChapterId>;
  visits: { chapter: ChapterId; time: number }[];
  stops: { chapter: ChapterId; position: number; time: number }[];
  trail: { chapter: ChapterId; position: number; time: number }[];
  letter: { phase: LetterPhase; elapsed: number; serial: number };
  messages: { time: number }[];
}
export function createJourney(): Journey {
  return {
    mode: 'cover', chapter: 'return', position: 0, velocity: 0, idleTime: 0,
    elapsed: 0, suspended: false, focused: false, visited: new Set(), visits: [], stops: [], trail: [],
    letter: { phase: 'waiting', elapsed: 0, serial: 0 }, messages: [],
  };
}
export function enterJourney(s: Journey, chapter: ChapterId = 'return') {
  s.mode = 'exploring';
  visitChapter(s, chapter);
}
export function visitChapter(s: Journey, chapter: ChapterId) {
  s.chapter = chapter;
  s.position = 0; s.velocity = 0; s.idleTime = 0; s.focused = false;
  s.letter.phase = 'waiting'; s.letter.elapsed = 0;
  s.visited.add(chapter);
  s.visits.push({ chapter, time: s.elapsed });
  s.trail.push({ chapter, position: 0, time: s.elapsed });
}
export function setSuspended(s: Journey, value: boolean) {
  s.suspended = value;
  s.velocity = 0;
}
export function nudgeJourney(s: Journey, amount: number) {
  if (s.mode !== 'exploring' || s.suspended || !Number.isFinite(amount) || amount === 0) return;
  const previous = s.position;
  s.position = Math.max(0, Math.min(1, s.position + amount));
  s.velocity = s.position === previous ? 0 : Math.sign(s.position - previous) * WALK_SPEED;
  s.idleTime = 0;
  if(s.position === previous)return;
  s.trail.push({ chapter: s.chapter, position: s.position, time: s.elapsed });
  if (s.trail.length > 1200) s.trail.shift();
}
export function sendMessage(s: Journey) {
  if (s.mode !== 'exploring' || s.suspended || s.chapter !== 'message' ||
      s.letter.phase!=='waiting'&&s.letter.phase!=='settled') return false;
  s.letter = { phase: 'outbound', elapsed: 0, serial: s.letter.serial + 1 };
  return true;
}
function step(s: Journey, dt: number, direction: number) {
  s.elapsed += dt;
  const goal = Math.sign(direction) * WALK_SPEED;
  s.velocity += (goal - s.velocity) * (1 - Math.exp(-dt * 11));
  const next = s.position + s.velocity * dt;
  if((next >= 1 && s.velocity > 0)||(next <= 0 && s.velocity < 0))s.velocity=0;
  s.position = Math.max(0, Math.min(1, next));
  s.idleTime = direction === 0 ? s.idleTime + dt : 0;
  const previous = s.trail.at(-1);
  if (!previous || previous.chapter !== s.chapter || Math.abs(s.position - previous.position) > .009) {
    s.trail.push({ chapter: s.chapter, position: s.position, time: s.elapsed });
    if (s.trail.length > 1200) s.trail.splice(0, s.trail.length - 1200);
  }
  if (s.idleTime >= 1.2) {
    const stop = s.stops.at(-1);
    if (!stop || stop.chapter !== s.chapter || Math.abs(stop.position - s.position) > .06) {
      s.stops.push({ chapter: s.chapter, position: s.position, time: s.elapsed });
    }
  }
  if (s.letter.phase === 'outbound' || s.letter.phase === 'arrival' || s.letter.phase === 'answer') {
    s.letter.elapsed += dt;
    if (s.letter.elapsed >= MESSAGE_DURATION.outbound) s.letter.phase = 'arrival';
    if (s.letter.elapsed >= MESSAGE_DURATION.outbound+MESSAGE_DURATION.arrival) s.letter.phase = 'answer';
    if (s.letter.elapsed >= EXCHANGE_DURATION) {
      s.letter.phase = 'settled';
      s.messages.push({ time: s.elapsed });
    }
  }
}
export function tickJourney(s: Journey, delta: number, direction = 0) {
  if (s.mode !== 'exploring' || s.suspended || !Number.isFinite(delta) || delta <= 0) return;
  let rest = delta;
  while (rest > .0000001) {
    const dt = Math.min(1 / 60, rest);
    step(s, dt, direction);
    rest -= dt;
  }
}
export function finishJourney(s: Journey) {
  if (s.mode !== 'exploring' || s.chapter !== CHAPTERS.at(-1)!.id || s.suspended) return false;
  s.mode = 'finished'; s.velocity = 0;
  return true;
}
export function restartJourney(s: Journey) { Object.assign(s, createJourney()); }
