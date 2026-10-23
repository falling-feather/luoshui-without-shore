import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourney, enterJourney, sendMessage, tickJourney, visitChapter } from '../src/experience/journey.ts';
import { directScene } from '../src/experience/direction.ts';

test('凌波驻步改变步态，而不是再切一次近景或暂停整条旅程',()=>{
  const s=createJourney();enterJourney(s,'dance');
  assert.equal(directScene(s).danceStep,1);
  s.focused=true;
  const cue=directScene(s);
  assert.equal(cue.danceStep,0);
  assert.equal(cue.cameraAttention,0);
  tickJourney(s,1,0);
  assert.ok(s.elapsed>.9);
});
test('长绝回望只留下回眸，不能追回已离去的距离',()=>{
  const s=createJourney();enterJourney(s,'farewell');s.position=.75;
  const first=directScene(s);s.focused=true;const second=directScene(s);
  assert.equal(first.departure,second.departure);
  assert.equal(second.cameraAttention,0);
  assert.equal(second.gaze,1);
  assert.ok(second.wind<.4);
});
test('回望的文字只能来自实际完成的传辞，中断过程不生成记忆',()=>{
  const s=createJourney();enterJourney(s,'message');sendMessage(s);tickJourney(s,3,0);
  visitChapter(s,'memory');assert.equal(directScene(s).memoryQuote,null);
  visitChapter(s,'message');sendMessage(s);tickJourney(s,21,0);
  visitChapter(s,'memory');assert.equal(directScene(s).memoryQuote,'抗琼珶以和予');
});
