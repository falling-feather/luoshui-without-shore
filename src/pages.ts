import { CHAPTERS, LIBRARY, EXCHANGE, LUOSHEN } from './content.ts';
import type { Chapter, ChapterId, WorkId } from './content.ts';
import type { Journey } from './experience/journey.ts';

const paths = {
  arrow:'M4 12h16m-6-6 6 6-6 6',
  sound:'m4 9 4 0 5-4v14l-5-4H4zM17 8q5 4 0 8m3-11q8 7 0 14',
  mute:'m4 9 4 0 5-4v14l-5-4H4zM17 9l5 6m0-6-5 6',
  close:'m6 6 12 12M18 6 6 18',
  pause:'M8 5v14M16 5v14',
  play:'m8 5 11 7-11 7z',
  settings:'M4 7h16M4 17h16M9 4v6m6 4v6',
  wave:'M2 11q4-8 8 0t12 0M2 17q4-8 8 0t12 0',
  book:'M3 4q5-2 9 1 4-3 9-1v15q-5-2-9 1-4-3-9-1zM12 5v15',
};
export const icon = (id:keyof typeof paths) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[id]+'"/></svg>';
const arrow=icon('arrow');
export function shell() {
  return '<div id="world" class="world" role="img" aria-label="可行卷的洛水诗境"></div><div class="world-shade" aria-hidden="true"></div>'+
    '<header class="masthead"><a class="wordmark" href="#/home" aria-label="洛水无岸卷首"><span class="brand-seal">洛</span><span>洛水无岸<small>THE RIVER WITHOUT SHORE</small></span></a>'+
    '<nav class="main-nav" aria-label="作品导航"><a href="#/home" data-view="home">入卷</a><a href="#/gallery" data-view="gallery">六境</a><a href="#/library/luoshen" data-view="library">诗文册</a><a href="#/about" data-view="about">缘起</a></nav>'+
    '<div class="tools"><button id="sound" class="tool" aria-label="开启声景" aria-pressed="false">'+icon('mute')+'</button><button id="pause" class="tool" aria-label="暂停诗境" aria-pressed="false">'+icon('pause')+'</button><button id="settings" class="tool" aria-label="观看设置">'+icon('settings')+'</button></div></header>'+
    '<main id="page" tabindex="-1"></main><div class="page-transition" id="transition" aria-hidden="true" hidden><span id="transition-name"></span><i></i></div>'+
    '<div id="loader" class="loader" role="status"><span id="load-label">正在构筑洛水</span><span id="load-percent">0%</span><i><b id="load-fill"></b></i><button id="retry" hidden>重新展开</button></div>'+
    '<div class="pause-veil" id="pause-veil" hidden><span class="eyebrow">一 息</span><h2>风水暂歇</h2><p>你的行迹，停在这一刻。</p><button data-action="resume" class="outline-button">继续观卷 '+arrow+'</button></div>'+
    '<dialog id="settings-dialog" class="settings-dialog"><button class="close-button" id="settings-close" aria-label="关闭观看设置">'+icon('close')+'</button><span class="eyebrow">观 看</span><h2>留一段宁静</h2><label>声景音量<input id="volume" type="range" min="0" max="100" value="45"></label><label>减弱镜头与微粒运动<input id="reduced" type="checkbox"></label><p>滚动、左右方向键或轻划可行卷。<br>空格驻足，E 与当前诗境互动。<br>诗文册可以随时打开，返回后接续。</p></dialog>'+
    '<p class="toast" id="toast" role="status" aria-live="polite"></p>';
}
export function home(ready:boolean) {
  return '<section class="home-page"><div class="home-copy reveal"><span class="eyebrow">曹 植 · 洛 神 赋</span><h1>洛水<span>无岸</span></h1><p class="home-lead">相望有回应，<br>相逢仍隔一水。</p><button class="primary-button" data-action="enter" data-requires-world '+(ready?'':'disabled')+'>循水入卷 '+arrow+'</button><a class="quiet-link" href="#/gallery">或从六境中，择一处停留</a></div>'+
    '<div class="home-verse reveal"><span>翩若惊鸿</span><span>婉若游龙</span><small>曹植《洛神赋》</small></div>'+
    '<div class="home-foot"><span>一部可进入的交互诗境</span><a href="#/library/luoshen">从暮色，读至天明 '+arrow+'</a><span>六境 · 四篇诗赋</span></div></section>';
}
export function gallery(thumbnails:Map<ChapterId,string>,ready:boolean,visited:Set<ChapterId>) {
  return '<section class="gallery-page page-scroll"><div class="page-intro reveal"><span class="eyebrow">SIX SCENES · 一水六境</span><h1>沿水，入境。</h1><p>从归途至回望，文字有了可停留的地方。</p></div><div class="chapter-grid">'+CHAPTERS.map(ch=>
    '<button class="chapter-card reveal" data-chapter="'+ch.id+'" data-requires-world '+(ready?'':'disabled')+' style="--accent:'+ch.accent+'"><div class="card-image">'+(thumbnails.has(ch.id)?'<img src="'+thumbnails.get(ch.id)+'" alt="'+ch.name+'三维诗境取景" />':'<div class="card-pending"></div>')+'<span class="card-number">'+ch.numeral+'</span><span class="card-enter">入此境 '+arrow+'</span></div><div class="card-caption"><h2>'+ch.name+'</h2><span>'+ch.subtitle+'</span><i>'+(visited.has(ch.id)?'曾行至':'')+'</i></div></button>').join('')+
    '</div><footer class="page-foot">可依次行卷，也可独入一境。每次停留，都有它自己的时间。</footer></section>';
}
export function scene(ch:Chapter) {
  const columns=ch.verse.flatMap(line=>line.split(/[，。；]/).filter(Boolean));
  return '<section class="scene-page" aria-label="'+ch.name+'诗境"><div class="scene-title reveal"><span class="eyebrow">'+ch.numeral+' / '+ch.english+'</span><h1>'+ch.name+'</h1><p>'+ch.meaning+'</p><a href="#/library/luoshen/'+ch.id+'" class="quiet-link">'+icon('book')+' 读这一段</a></div>'+
    '<blockquote class="scene-verse reveal" aria-label="'+ch.verse.join('')+'">'+columns.map(l=>'<span>'+l+'</span>').join('')+'<cite>曹植 · 洛神赋</cite></blockquote>'+
    (ch.id==='message'?'<div class="correspondence reveal"><span class="eyebrow">'+EXCHANGE.request.symbol+'之请 · '+EXCHANGE.response.symbol+'之答</span><div class="exchange-steps" aria-label="一请一答"><span data-exchange-step="outbound">寄请</span><i>→</i><span data-exchange-step="arrival">抵达</span><i>←</i><span data-exchange-step="answer">相答</span></div><button id="scene-action" data-action="scene" class="primary-button">'+ch.action+' '+arrow+'</button><p id="letter-status" aria-live="polite">余解玉佩相邀，洛神举琼珶相答。</p><div class="letter-track" aria-hidden="true"><i id="letter-fill"></i></div></div>':
      '<button id="scene-action" data-action="scene" class="scene-action reveal">'+ch.action+' '+arrow+'</button>')+
    '<div class="scene-footer"><div class="scene-navigation"><button class="step-button" data-action="previous" aria-label="上一境" '+(ch.id===CHAPTERS[0].id?'disabled':'')+'>←</button><a href="#/gallery" aria-label="展开六境目录">'+ch.numeral+' <i>／ 陆</i></a><button class="step-button" data-action="next" aria-label="'+(ch.id==='memory'?'收卷回望':'下一境')+'">→</button></div>'+
    '<p class="scene-hint">'+ch.prompt+'</p><div class="move-controls"><button data-walk="-1" aria-label="按住向后行卷">←</button><span>行卷</span><button data-walk="1" aria-label="按住向前行卷">→</button></div></div>'+
    '<div class="river-position" role="progressbar" aria-label="当前诗境行卷位置" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="river-fill"></i><b id="river-cursor"></b></div></section>';
}
export function library(workId:WorkId,chapter:ChapterId) {
  const work=LIBRARY.find(w=>w.id===workId)!;
  return '<section class="library-page page-scroll"><aside class="library-index"><span class="eyebrow">汉 魏 · 诗 文 册</span><h1>纸上<br>有回声。</h1><nav aria-label="诗文目录">'+LIBRARY.map(w=>'<a href="#/library/'+w.id+'/'+chapter+'" '+(w.id===workId?'aria-current="page"':'')+'><span>'+w.title+'</span><small>'+w.author+' · '+w.genre+'</small></a>').join('')+'</nav><a class="quiet-link return-to-scene" href="#/chapter/'+chapter+'">返回'+CHAPTERS.find(c=>c.id===chapter)!.name+'之境 '+arrow+'</a></aside>'+
    '<article class="reading"><header class="reading-head"><span class="eyebrow">'+work.author+' · '+work.era+' · '+work.genre+'</span><h2>'+work.title+'</h2><p>'+work.lead+'</p></header><p class="reading-preface">'+work.introduction+'</p>'+
    work.sections.map((section,i)=>'<section class="reading-section" id="reading-'+i+'"><h3><span>'+String(i+1).padStart(2,'0')+'</span>'+section.title+'</h3>'+section.lines.map(line=>'<p>'+line+'</p>').join('')+'</section>').join('')+
    '<footer class="reading-note"><h3>本作的阅读与改编</h3><p>'+work.note+'</p><p>章节题名、解释和场景转译为本作创作。引文保留作者与出处，原作中的相遇、思妇与怀乡分别呈现。</p><a href="'+work.source+'" target="_blank" rel="noopener">'+work.sourceLabel+' ↗</a></footer></article></section>';
}
export function about() {
  return '<section class="about-page page-scroll"><div class="about-title reveal"><span class="eyebrow">缘 起 · ARTIST’S NOTE</span><h1>有水，<br>便有相望。</h1><span class="about-seal">洛</span></div><div class="about-text reveal"><p class="about-opening">一次偶然的停驻，<br>使归途成为了一场相逢。</p><p>《洛水无岸》从曹植《洛神赋》出发，把归途、惊见、通辞、凌波、别离与回望展开为六段可进入的诗境。</p><p>你可以沿岸行卷，驻足近察，也可以循赋中的“余”，将玉佩之请托付给水。水有去处，心意有回应，彼岸仍有它自己的距离。</p><p>我们尝试让文字参与风、水、衣袂和目光的运动，让一次观看，也成为作品的一部分。</p><div class="about-rule"></div><h2>文字与画卷</h2><p>主线据曹植《洛神赋》，诗文册另收曹植《七哀诗》、曹丕《燕歌行》其一、王粲《登楼赋》。均采用简体与整理标点，解释及场景编排为本作创作。</p><p>手卷叙事参考故宫博物院藏《洛神赋图》宋摹本的人物复现与连续构图。本作不将传世摹本称作顾恺之亲笔，也不以传说替代已知文本。</p><div class="source-links"><a href="https://zh.wikisource.org/wiki/洛神賦" target="_blank" rel="noopener">曹植《洛神赋》原文 ↗</a><a href="https://www.dpm.org.cn/collection/paint/234597.html" target="_blank" rel="noopener">故宫《洛神赋图》藏品说明 ↗</a></div><h2>观看</h2><p>滚动、方向键或轻划行卷；轻触水面留下涟漪。“通辞”之境以玉佩相邀，等待洛神以琼珶相答。空格暂停，E 与当前诗境互动。声音可自行开启，观看设置可减弱镜头与微粒运动。</p><a class="primary-button ink-button" href="#/gallery">选择一境 '+arrow+'</a></div></section>';
}
export function ending(state:Journey,thumbnails:Map<ChapterId,string>) {
  const visited=CHAPTERS.filter(ch=>state.visited.has(ch.id));
  const minutes=Math.floor(state.elapsed/60),seconds=Math.floor(state.elapsed%60);
  const path=state.trail.map((point,i)=>{
    const ch=CHAPTERS.findIndex(c=>c.id===point.chapter);
    return (i===0?'M':'L')+(12+ch*90+point.position*70).toFixed(1)+','+(24+Math.sin(point.position*Math.PI*2+ch)*10).toFixed(1);
  }).join(' ');
  return '<section class="ending-page page-scroll"><div class="ending-intro reveal"><span class="eyebrow">卷 末 · 足 往 神 留</span><h1>行过的水，<br>成为心上的岸。</h1><p>“'+LUOSHEN[5].lines[5]+'”</p><small>曹植《洛神赋》</small></div><div class="memory-strip">'+visited.map(ch=>'<a href="#/chapter/'+ch.id+'"><img src="'+thumbnails.get(ch.id)+'" alt="回访'+ch.name+'诗境" /><span>'+ch.numeral+' · '+ch.name+'</span></a>').join('')+'</div><div class="ending-record"><svg viewBox="0 0 550 55" aria-label="本次实际行卷轨迹" role="img"><path d="'+path+'" fill="none" stroke="currentColor" stroke-width="1" /></svg><p>行至'+visited.length+'境 · 驻足'+state.stops.length+'处 · 微波传辞'+state.messages.length+'次 · '+minutes+'分'+seconds+'秒</p><span>只记下，这一次真实发生的停留。</span><div class="ending-actions"><button class="primary-button" data-action="restart">重行全卷 '+arrow+'</button><a class="quiet-link" href="#/library/luoshen">再读一遍《洛神赋》</a></div></div></section>';
}
