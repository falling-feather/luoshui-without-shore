import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourney, enterJourney, sendMessage, setSuspended, tickJourney, visitChapter } from '../src/experience/journey.ts';

test('玉佩之请先抵达彼岸，停留后才有琼珶之答，答复返抵才计一次完成',()=>{
  const s=createJourney();enterJourney(s,'message');
  assert.equal(sendMessage(s),true);
  tickJourney(s,6.1);
  assert.equal(s.letter.phase,'arrival');
  assert.equal(s.messages.length,0);
  tickJourney(s,2.5);
  assert.equal(s.letter.phase,'answer');
  assert.equal(s.messages.length,0);
  tickJourney(s,7);
  assert.equal(s.letter.phase,'settled');
  assert.equal(s.messages.length,1);
  tickJourney(s,30);
  assert.equal(s.messages.length,1);
});

test('抵达阶段的暂停、阅读接续及中断仍服从同一实际旅程',()=>{
  const s=createJourney();enterJourney(s,'message');sendMessage(s);
  tickJourney(s,6.4);const before=s.letter.elapsed;
  setSuspended(s,true);tickJourney(s,40);
  assert.equal(s.letter.elapsed,before);assert.equal(s.letter.phase,'arrival');
  setSuspended(s,false);tickJourney(s,1);
  assert.equal(s.letter.phase,'arrival');
  visitChapter(s,'memory');assert.equal(s.messages.length,0);
});
