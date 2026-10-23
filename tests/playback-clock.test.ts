import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourney, enterJourney, setSuspended } from '../src/experience/journey.ts';
import { PlaybackClock } from '../src/experience/playback-clock.ts';

test('绘制回调延迟到松键之后时，仍保留真实按住时长', () => {
  const state = createJourney();
  enterJourney(state);
  const clock = new PlaybackClock(state, 0);
  clock.changeDirection(1, 0);
  clock.changeDirection(0, 3500);
  assert.ok(state.position > .21 && state.position < .23);
  assert.ok(Math.abs(state.elapsed - 3.5) < .001);
});

test('短按的移动期限不因下一帧较晚到达而延长', () => {
  const state = createJourney();
  enterJourney(state);
  const clock = new PlaybackClock(state, 0);
  clock.changeDirection(1, 0, 500);
  clock.advance(3500);
  assert.ok(state.position > .025 && state.position < .045);
  assert.ok(state.idleTime > 2);
});

test('暂停和恢复不补算失焦期间的行走与时间', () => {
  const state = createJourney();
  enterJourney(state);
  const clock = new PlaybackClock(state, 0);
  clock.changeDirection(1, 0);
  setSuspended(state, true);
  clock.advance(5000);
  assert.equal(state.position, 0);
  assert.equal(state.elapsed, 0);
  setSuspended(state, false);
  clock.reset(5000);
  clock.advance(6000);
  assert.equal(state.position, 0);
  assert.ok(Math.abs(state.elapsed - 1) < .001);
});
