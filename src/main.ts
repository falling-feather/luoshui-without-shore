import { gsap } from 'gsap';
import './style.css';
import { CHAPTERS, LIBRARY, chapterById } from './content.ts';
import type { ChapterId, WorkId } from './content.ts';
import { createJourney, enterJourney, visitChapter, setSuspended, sendMessage, finishJourney, restartJourney, nudgeJourney, EXCHANGE_DURATION } from './experience/journey.ts';
import { PlaybackClock } from './experience/playback-clock.ts';
import { PoeticWorld } from './scene/world.ts';
import { Soundscape } from './audio/soundscape.ts';
import { shell, home, gallery, scene, library, about, ending, icon } from './pages.ts';

type Route =
  | {view:'home'|'gallery'|'about'|'ending'}
  | {view:'experience';chapter:ChapterId}
  | {view:'library';work:WorkId;section?:ChapterId};
const $ = <T extends HTMLElement = HTMLElement>(selector:string) => {
  const result=document.querySelector<T>(selector);
  if(!result)throw new Error('缺少页面元素：'+selector);
  return result;
};
$('#app').innerHTML=shell();
const page=$('#page'),host=$('#world'),transition=$('#transition');
const settings=$<HTMLDialogElement>('#settings-dialog');
const state=createJourney(),clock=new PlaybackClock(state,performance.now()),audio=new Soundscape();
let world:PoeticWorld|null=null,route:Route={view:'home'},ready=false,paused=false,transitioning=false;
let reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let navTimeline:gsap.core.Timeline|null=null,toastTimer=0,readingScroll=0;
let previousFrame=performance.now(),visualTime=0,paintedLetter='',raf=0;
const held=new Set<string>();

function parseRoute():Route {
  let parts:string[];
  try{parts=decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');}catch{return {view:'home'};}
  if(parts[0]==='chapter'&&chapterById(parts[1]))return {view:'experience',chapter:parts[1] as ChapterId};
  if(parts[0]==='library'){
    const work=LIBRARY.find(w=>w.id===parts[1])?.id??'luoshen';
    return {view:'library',work,section:chapterById(parts[2])?.id};
  }
  if(parts[0]==='gallery'||parts[0]==='about')return {view:parts[0]};
  if(parts[0]==='ending'&&state.mode==='finished')return {view:'ending'};
  return {view:'home'};
}
function navigate(hash:string){if(location.hash===hash)showRoute(parseRoute());else location.hash=hash;}
function tell(message:string){
  window.clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');
  toastTimer=window.setTimeout(()=>$('#toast').classList.remove('visible'),4500);
}
function syncPause(){
  const hidden=document.visibilityState==='hidden'||!document.hasFocus();
  setSuspended(state,!ready||paused||transitioning||settings.open||route.view!=='experience'||hidden);
  $('#pause-veil').hidden=!paused;
  $('#pause').setAttribute('aria-pressed',String(paused));
  $('#pause').setAttribute('aria-label',paused?'继续诗境':'暂停诗境');
  $('#pause').innerHTML=icon(paused?'play':'pause');
}
function stopInput(){held.clear();clock.changeDirection(0,performance.now());}
function direction(){return (held.has('ArrowRight')||held.has('KeyD')?1:0)-(held.has('ArrowLeft')||held.has('KeyA')?1:0);}
function renderPage(next:Route){
  const previous=route;route=next;paintedLetter='';paused=false;
  cancelAnimationFrame(readingScroll);
  document.body.dataset.view=next.view;
  document.body.dataset.chapter=state.chapter;
  page.scrollTop=0;
  switch(next.view){
    case 'home':page.innerHTML=home(ready);world?.activate('return');break;
    case 'gallery':page.innerHTML=gallery(world?.thumbnails??new Map(),ready,state.visited);break;
    case 'experience':{
      if(state.mode==='cover')enterJourney(state,next.chapter);
      else if(state.chapter!==next.chapter||state.mode==='finished'){state.mode='exploring';visitChapter(state,next.chapter);}
      page.innerHTML=scene(chapterById(next.chapter)!);world?.activate(next.chapter);
      document.body.dataset.chapter=next.chapter;
      $('#world').setAttribute('aria-label',chapterById(next.chapter)!.name+'：'+chapterById(next.chapter)!.meaning);
      break;
    }
    case 'library':page.innerHTML=library(next.work,next.section??state.chapter);break;
    case 'about':page.innerHTML=about();break;
    case 'ending':page.innerHTML=ending(state,world?.thumbnails??new Map());world?.activate('memory');break;
  }
  const title=next.view==='experience'?chapterById(next.chapter)!.name:next.view==='library'?'诗文册':next.view==='gallery'?'六境':next.view==='about'?'缘起':next.view==='ending'?'卷末':'相望';
  document.title='洛水无岸 · '+title;
  document.querySelectorAll<HTMLElement>('[data-view]').forEach(el=>{
    if(el.dataset.view===next.view)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
  });
  if(next.view==='library'&&next.work==='luoshen'&&next.section){
    const chapter=chapterById(next.section)!;
    readingScroll=requestAnimationFrame(()=>$('#reading-'+chapter.section).scrollIntoView({block:'start',behavior:'instant'}));
  }
  if(previous.view!==next.view||next.view==='experience')page.focus({preventScroll:true});
  if(!ready&&next.view==='experience')page.querySelectorAll<HTMLButtonElement>('button').forEach(button=>button.disabled=true);
  clock.reset(performance.now());syncPause();
  const reveals=Array.from(page.querySelectorAll('.reveal'));
  if(!reduced&&reveals.length)gsap.fromTo(reveals,{opacity:0,y:20},{opacity:1,y:0,duration:1.05,stagger:.07,ease:'power2.out',clearProps:'transform'});
}
function showRoute(next:Route,initial=false){
  stopInput();navTimeline?.kill();
  if(initial||reduced){transitioning=false;transition.hidden=true;gsap.set(transition,{opacity:0});renderPage(next);return;}
  transitioning=true;syncPause();
  transition.hidden=false;
  const name=next.view==='experience'?chapterById(next.chapter)!.name:next.view==='library'?'诗文':next.view==='gallery'?'六境':next.view==='ending'?'回望':'洛水';
  $('#transition-name').textContent=name;
  navTimeline=gsap.timeline().to(transition,{opacity:1,duration:.32,ease:'power1.in'})
    .call(()=>renderPage(next)).to(transition,{opacity:0,duration:.65,ease:'power2.out',delay:.07})
    .call(()=>{transition.hidden=true;transitioning=false;syncPause();});
}
function sceneAction(){
  if(route.view!=='experience'||state.suspended||!ready)return;
  clock.advance(performance.now());
  if(state.chapter==='message'){
    if(sendMessage(state)){audio.reveal(2);paintedLetter='';}
  }else if(state.chapter==='memory'){
    if(finishJourney(state))navigate('#/ending');
  }else{state.focused=!state.focused;audio.reveal(CHAPTERS.findIndex(ch=>ch.id===state.chapter));}
}
function changeChapter(delta:number){
  if(route.view!=='experience'||!ready)return;
  const index=CHAPTERS.findIndex(ch=>ch.id===state.chapter),next=CHAPTERS[index+delta];
  if(next)navigate('#/chapter/'+next.id);
  else if(delta>0&&finishJourney(state))navigate('#/ending');
}
document.addEventListener('click',event=>{
  const target=(event.target as Element).closest<HTMLElement>('button[data-action],a[data-action],button[data-chapter]');
  if(!target)return;
  if(target instanceof HTMLButtonElement&&target.disabled)return;
  if(target.dataset.chapter){navigate('#/chapter/'+target.dataset.chapter);return;}
  switch(target.dataset.action){
    case 'enter':navigate('#/chapter/return');break;
    case 'scene':sceneAction();break;
    case 'next':changeChapter(1);break;
    case 'previous':changeChapter(-1);break;
    case 'resume':paused=false;clock.reset(performance.now());syncPause();break;
    case 'restart':restartJourney(state);navigate('#/chapter/return');break;
  }
});
$('#sound').addEventListener('click',async()=>{
  try{
    const enabled=await audio.toggle();
    $('#sound').setAttribute('aria-pressed',String(enabled));$('#sound').setAttribute('aria-label',enabled?'关闭声景':'开启声景');
    $('#sound').innerHTML=icon(enabled?'sound':'mute');
  }catch(error){console.error(error);tell('声音尚未开启，请再次轻触声景按钮。');}
});
$('#pause').addEventListener('click',()=>{paused=!paused;stopInput();clock.reset(performance.now());syncPause();});
$('#settings').addEventListener('click',()=>{stopInput();settings.showModal();syncPause();});
$('#settings-close').addEventListener('click',()=>settings.close());
settings.addEventListener('close',()=>{clock.reset(performance.now());syncPause();});
settings.addEventListener('cancel',()=>{clock.reset(performance.now());});
$<HTMLInputElement>('#reduced').checked=reduced;
$('#reduced').addEventListener('change',event=>{reduced=(event.target as HTMLInputElement).checked;world?.setReducedMotion(reduced);document.body.classList.toggle('reduced-motion',reduced);});
$('#volume').addEventListener('input',event=>audio.setVolume(Number((event.target as HTMLInputElement).value)/100));
$('#retry').addEventListener('click',()=>location.reload());
window.addEventListener('hashchange',()=>showRoute(parseRoute()));
window.addEventListener('blur',()=>{stopInput();syncPause();});
window.addEventListener('focus',()=>{clock.reset(performance.now());syncPause();});
document.addEventListener('visibilitychange',()=>{stopInput();clock.reset(performance.now());syncPause();});
window.addEventListener('keydown',event=>{
  const tag=(event.target as HTMLElement).tagName;
  if(settings.open||tag==='INPUT'||tag==='TEXTAREA')return;
  if(event.code==='Escape'||event.code==='KeyP'||(event.code==='Space'&&tag!=='BUTTON'&&tag!=='A')){
    event.preventDefault();if(event.repeat)return;paused=!paused;stopInput();clock.reset(performance.now());syncPause();return;
  }
  if(route.view!=='experience'||state.suspended)return;
  if(['ArrowRight','ArrowLeft','KeyA','KeyD'].includes(event.code)){
    event.preventDefault();held.add(event.code);clock.changeDirection(direction(),performance.now());
  }
  if(event.code==='KeyE'&&!event.repeat){event.preventDefault();sceneAction();}
});
window.addEventListener('keyup',event=>{
  if(held.delete(event.code))clock.changeDirection(direction(),performance.now());
});
window.addEventListener('wheel',event=>{
  if(route.view!=='experience'||state.suspended||event.target instanceof Element&&event.target.closest('dialog'))return;
  event.preventDefault();clock.advance(performance.now());
  nudgeJourney(state,Math.max(-160,Math.min(160,event.deltaY))*.0006);
},{passive:false});

let drag:{x:number;y:number;lastX:number;lastY:number;distance:number;lastRipple:number}|null=null;
window.addEventListener('pointerdown',event=>{
  const button=(event.target as HTMLElement).closest<HTMLElement>('[data-walk]');
  if(button&&route.view==='experience'&&!state.suspended){event.preventDefault();clock.changeDirection(Number(button.dataset.walk),performance.now());button.setPointerCapture(event.pointerId);return;}
  if(route.view!=='experience'||state.suspended||(event.target as HTMLElement).closest('button,a,input,dialog'))return;
  drag={x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,distance:0,lastRipple:0};
  world?.disturb(event.clientX/window.innerWidth,event.clientY/window.innerHeight,1);
});
window.addEventListener('pointermove',event=>{
  world?.setPointer(event.clientX/window.innerWidth,event.clientY/window.innerHeight);
  if(!drag||route.view!=='experience'||state.suspended)return;
  const dx=event.clientX-drag.lastX,dy=event.clientY-drag.lastY;
  drag.distance+=Math.hypot(dx,dy);
  if(state.chapter!=='message'){clock.advance(performance.now());nudgeJourney(state,(-dy+dx*.3)*.0015);}
  if(performance.now()-drag.lastRipple>70){
    world?.disturb(event.clientX/window.innerWidth,event.clientY/window.innerHeight,Math.min(1,Math.hypot(dx,dy)*.04+.35));drag.lastRipple=performance.now();
  }
  drag.lastX=event.clientX;drag.lastY=event.clientY;
});
window.addEventListener('pointerup',event=>{
  if(drag&&route.view==='experience'&&state.chapter==='message'&&!state.suspended&&drag.distance>10){
    if(world?.disturb(event.clientX/window.innerWidth,event.clientY/window.innerHeight,1))sceneAction();
  }
  drag=null;clock.changeDirection(direction(),performance.now());
});
window.addEventListener('pointercancel',()=>{drag=null;stopInput();});
function updateSceneUI(){
  if(route.view!=='experience'||!ready)return;
  const percent=Math.round(state.position*100);
  $('#river-fill').style.width=percent+'%';$('#river-cursor').style.left=percent+'%';
  $('.river-position').setAttribute('aria-valuenow',String(percent));
  if(state.chapter==='message'){
    const phase=state.letter.phase, key=phase+':'+state.letter.serial;
    if(key!==paintedLetter){
      paintedLetter=key;
      document.body.dataset.letter=phase;
      const copy={waiting:'余解玉佩相邀，洛神举琼珶相答。',outbound:'玉佩之请，随微波去。',arrival:'请已抵达，她举袖相答。',answer:'琼珶之答，自彼岸归来。',settled:'一请一答。相望，仍隔一水。'}[phase];
      $('#letter-status').textContent=copy;
      $<HTMLButtonElement>('#scene-action').disabled=!['waiting','settled'].includes(phase);
      $('#scene-action').innerHTML=phase==='outbound'?'玉佩随波去':phase==='arrival'?'请已至彼岸':phase==='answer'?'琼珶正相答':phase==='settled'?'重温这一往复 '+icon('arrow'):'以玉佩相邀 '+icon('arrow');
      document.querySelectorAll<HTMLElement>('[data-exchange-step]').forEach(el=>el.classList.toggle('active',el.dataset.exchangeStep===phase));
      if(phase==='answer')audio.answer();
    }
    $('#letter-fill').style.width=Math.min(100,state.letter.elapsed/EXCHANGE_DURATION*100)+'%';
  }else{
    const button=$('#scene-action');
    if(state.chapter!=='memory')button.setAttribute('aria-pressed',String(state.focused));
    const chapter=chapterById(state.chapter)!;
    const label='actionBack' in chapter?(state.focused?chapter.actionBack:chapter.action):null;
    if(label&&button.dataset.actionLabel!==label){button.dataset.actionLabel=label;button.innerHTML=label+' '+icon('arrow');}
    const hint=document.querySelector('.scene-hint');
    if(hint&&'attentionPrompt' in chapter)hint.textContent=state.focused?chapter.attentionPrompt:chapter.prompt;
  }
}
function frame(now:number){
  const dt=Math.min(.075,Math.max(0,(now-previousFrame)/1000));previousFrame=now;
  clock.advance(now);
  const visible=document.visibilityState!=='hidden',focused=document.hasFocus();
  const painting=route.view==='home'||route.view==='experience'||route.view==='ending';
  if(visible&&painting&&!paused&&!settings.open&&!transitioning&&focused)visualTime+=dt;
  if(world&&visible&&painting&&focused&&!paused&&!settings.open){
    world.render(state,dt,visualTime,route.view==='home');
  }
  audio.update(state,paused||settings.open||!visible||!focused||route.view==='library'||route.view==='about'||route.view==='gallery');
  updateSceneUI();
  if(import.meta.env.DEV){
    host.dataset.fps=(world?.fps??0).toFixed(1);host.dataset.focus=String(focused);
    host.dataset.letter=state.letter.phase;host.dataset.position=state.position.toFixed(4);host.dataset.elapsed=state.elapsed.toFixed(1);
  }
  raf=requestAnimationFrame(frame);
}
showRoute(parseRoute(),true);raf=requestAnimationFrame(frame);
async function boot(){
  try{
    $('#load-label').textContent='准备诗文字形';
    await document.fonts.load('400 20px "Luo Serif"', '洛水无岸归途惊鸿通辞凌波长绝回望解玉佩以要之抗琼珶和予此岸彼请答余洛神这一往复已留在上');
    world=await PoeticWorld.create(host,(label,ratio)=>{
      $('#load-label').textContent=label;$('#load-percent').textContent=Math.round(ratio*100)+'%';$('#load-fill').style.width=ratio*100+'%';
    });
    world.setReducedMotion(reduced);ready=true;document.body.dataset.ready='true';
    renderPage(route);
    gsap.to('#loader',{opacity:0,duration:.5,onComplete:()=>{$('#loader').hidden=true;}});
  }catch(error){
    console.error('诗境准备失败',error);$('#load-label').textContent='诗境暂未展开，请重新载入。';$('#retry').hidden=false;
  }
}
void boot();
if(import.meta.hot)import.meta.hot.dispose(()=>{cancelAnimationFrame(raf);navTimeline?.kill();world?.dispose();void audio.dispose();});
