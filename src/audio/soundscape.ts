import { CHAPTERS } from '../content.ts';
import type { Journey } from '../experience/journey.ts';
import { WALK_SPEED } from '../experience/journey.ts';
import { directScene } from '../experience/direction.ts';

/** Original synthesized water, bowed tones and plucked strings. */
export class Soundscape {
  private context:AudioContext|null=null;
  private master:GainNode|null=null;
  private water:GainNode|null=null;
  private filter:BiquadFilterNode|null=null;
  private wind:GainNode|null=null;
  private wet:ConvolverNode|null=null;
  private voices:OscillatorNode[]=[];
  private enabled=false;
  private volume=.45;
  private nextNote=0;
  private noteIndex=0;
  private chapter=-1;
  get isEnabled(){return this.enabled;}
  async toggle(){
    if(!this.context)this.create();
    if(this.context!.state==='suspended')await this.context!.resume();
    this.enabled=!this.enabled;
    this.master!.gain.setTargetAtTime(this.enabled?this.volume*.32:0,this.context!.currentTime,.6);
    return this.enabled;
  }
  setVolume(value:number){this.volume=Math.max(0,Math.min(1,value));}
  private create(){
    const ctx=this.context=new AudioContext(),master=this.master=ctx.createGain();
    master.gain.value=0;master.connect(ctx.destination);
    const buffer=ctx.createBuffer(2,ctx.sampleRate*7,ctx.sampleRate);
    let seed=83;
    const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296*2-1;};
    for(let c=0;c<2;c++){
      const data=buffer.getChannelData(c);let last=0;
      for(let i=0;i<data.length;i++){last=(last+rnd()*.02)/1.02;data[i]=last*3.5;}
    }
    const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
    const filter=this.filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1200;
    const high=ctx.createBiquadFilter();high.type='highpass';high.frequency.value=160;
    const gain=this.water=ctx.createGain();gain.gain.value=.32;
    source.connect(filter).connect(high).connect(gain).connect(master);source.start();
    const air=ctx.createBiquadFilter();air.type='bandpass';air.frequency.value=830;air.Q.value=.38;
    this.wind=ctx.createGain();this.wind.gain.value=.07;
    const airPan=ctx.createStereoPanner();airPan.pan.value=-.45;
    source.connect(air).connect(this.wind).connect(airPan).connect(master);
    const ir=ctx.createBuffer(2,ctx.sampleRate*3,ctx.sampleRate);
    for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=rnd()*Math.pow(1-i/d.length,3)*.35;}
    this.wet=ctx.createConvolver();this.wet.buffer=ir;
    const reverb=ctx.createGain();reverb.gain.value=.18;this.wet.connect(reverb).connect(master);
    [146.83,220].forEach((f,i)=>{
      const osc=ctx.createOscillator(),voice=ctx.createGain();
      osc.type='sine';osc.frequency.value=f;osc.detune.value=i===0?-5:4;voice.gain.value=.055;
      osc.connect(voice).connect(master);osc.start();this.voices.push(osc);
    });
  }
  private pluck(frequency:number,intensity=.5,pan=0){
    if(!this.context||!this.master||!this.enabled)return;
    const ctx=this.context,period=Math.round(ctx.sampleRate/frequency),size=Math.round(ctx.sampleRate*3.2);
    const loop=new Float32Array(period),buffer=ctx.createBuffer(1,size,ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<period;i++)loop[i]=(Math.sin(i*12.9898)*43758.5453%1)*.6;
    for(let i=0;i<size;i++){const k=i%period;data[i]=loop[k];loop[k]=.497*(loop[k]+loop[(k+1)%period]);}
    const source=ctx.createBufferSource();source.buffer=buffer;
    const gain=ctx.createGain();gain.gain.value=intensity*.3;
    const panner=ctx.createStereoPanner();panner.pan.value=pan;
    source.connect(gain).connect(panner).connect(this.master);
    if(this.wet)panner.connect(this.wet);
    source.onended=()=>{source.disconnect();gain.disconnect();panner.disconnect();};source.start();
  }
  reveal(index:number){this.pluck([293.66,329.63,392,440,523.25,293.66][index]??293.66,.65,-.2);}
  answer(){this.pluck(587.33,.42,.68);this.pluck(440,.16,.3);}
  update(state:Readonly<Journey>,suspended:boolean){
    if(!this.context||!this.master)return;
    const now=this.context.currentTime,index=CHAPTERS.findIndex(c=>c.id===state.chapter),motion=Math.abs(state.velocity)/WALK_SPEED,cue=directScene(state);
    this.master.gain.setTargetAtTime(this.enabled&&!suspended?this.volume*.32:0,now,.5);
    this.water!.gain.setTargetAtTime((index===4?.12:index===5?.19:.28)+motion*.12,now,.8);
    this.wind!.gain.setTargetAtTime((index===4?.11:.075)*cue.wind,now,1.1);
    this.filter!.frequency.setTargetAtTime(index===2?1700:index===4?650:1100,now,1);
    if(index!==this.chapter){
      this.chapter=index;this.nextNote=now+2;
      const roots=[146.83,164.81,146.83,196,130.81,146.83];
      this.voices.forEach((v,i)=>v.frequency.setTargetAtTime(roots[index]*(i===0?1:1.5),now,2));
    }
    if(this.enabled&&!suspended&&now>this.nextNote){
      this.nextNote=now+(index===4?12:index===5?10:7.5);
      const phrase=[[293.66,392,440,329.63],[329.63,440,493.88,392],[293.66,440,392,587.33],[392,523.25,440,659.25],[261.63,392,293.66,261.63],[293.66,392,329.63,293.66]];
      this.pluck(phrase[index][this.noteIndex++%4],index===4?.14:.23,Math.sin(this.noteIndex)*.4);
    }
  }
  async dispose(){if(this.context)await this.context.close();}
}
