import type { Journey } from './journey.ts';
import { EXCHANGE } from '../content.ts';
import { MESSAGE_DURATION } from './journey.ts';

export function directScene(state:Readonly<Journey>) {
  return {
    cameraAttention:['return','apparition','message'].includes(state.chapter)?Number(state.focused):0,
    danceStep:state.chapter==='dance'&&!state.focused?1:0,
    departure:state.chapter==='farewell'?state.position:0,
    gaze:state.chapter==='farewell'&&state.focused?1:0,
    wind:state.chapter==='farewell'?1-state.position*.9:1,
    reply:state.chapter==='message'&&['arrival','answer'].includes(state.letter.phase)?1:0,
    requestProgress:Math.min(1,state.letter.elapsed/MESSAGE_DURATION.outbound),
    responseProgress:Math.max(0,Math.min(1,(state.letter.elapsed-MESSAGE_DURATION.outbound-MESSAGE_DURATION.arrival)/MESSAGE_DURATION.answer)),
    memoryQuote:state.messages.length?EXCHANGE.response.phrase:null,
  };
}
