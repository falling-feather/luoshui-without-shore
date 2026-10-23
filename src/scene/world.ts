import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CHAPTERS, EXCHANGE } from '../content.ts';
import type { ChapterId } from '../content.ts';
import type { Journey } from '../experience/journey.ts';
import { directScene } from '../experience/direction.ts';
import { MESSAGE_DURATION, WALK_SPEED } from '../experience/journey.ts';
import { rockVertex, rockFragment, skyVertex, skyFragment, waterShader, mistVertex, mistFragment, grainShader } from './shaders.ts';
import { crag, mountainMass, bankGeometry, bankHeightAt, pineGrove, riverHerbs, curve, random, Silk, RiverSpirit, chariot } from './forms.ts';

const palettes = [
  ['#0d2528','#3b715c','#cbb184','#687b72','#122c35','#183b3a'],
  ['#0e2131','#285967','#e6cda6','#617c87','#0a182b','#143140'],
  ['#06292c','#2f7770','#d4c79c','#527c7b','#061923','#123c3e'],
  ['#0a322b','#4e9368','#d6bd72','#689685','#214d4c','#264f40'],
  ['#302532','#866852','#ecc391','#a18478','#2a2033','#393941'],
  ['#384d50','#758e82','#c3c4a8','#a4b2a7','#5b7378','#6d8b86'],
];
interface Stage {
  group: THREE.Group;
  spirit?: RiverSpirit;
  vehicle?: THREE.Group;
  mist: THREE.Points;
  birds: THREE.Group[];
  base: THREE.Vector3;
  silks:Silk[];
  memories?:{chapter:ChapterId;marker:THREE.Mesh<THREE.TorusGeometry,THREE.MeshBasicMaterial>}[];
}
const V = (x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const MESSAGE_SHORE={from:V(2.3,.18,9),to:V(6.4,3.6,-12.4),figure:V(7.5,0,-12)};
const memoryPoint=(chapter:number,position:number)=>V(Math.sin(chapter*.85-1+position*.5)*5,.035,16-chapter*9-position*6);

export class PoeticWorld {
  private host: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(43,1,.1,320);
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private film: ShaderPass;
  private observer: ResizeObserver;
  private rock: THREE.ShaderMaterial;
  private sky: THREE.ShaderMaterial;
  private gold = new THREE.MeshStandardMaterial({color:'#d8bc81',metalness:.72,roughness:.43,emissive:'#68552f',emissiveIntensity:.2});
  private leaves = new THREE.MeshStandardMaterial({color:'#254e46',roughness:.98,side:THREE.DoubleSide});
  private bark = new THREE.MeshStandardMaterial({color:'#283d39',roughness:.9});
  private water: Reflector;
  private stages = new Map<ChapterId,Stage>();
  private active: ChapterId = 'return';
  private pointer = new THREE.Vector2();
  private ray = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
  private rippleCursor = 0;
  private artTime = 0;
  private previousTime = 0;
  private reduced = false;
  private smoothedFocus = 0;
  private smoothedGaze = 0;
  private smoothedReply = 0;
  private cameraReady = false;
  private correspondence=new THREE.Group();
  private requestLabel:THREE.Sprite;
  private responseLabel:THREE.Sprite;
  private requestToken:THREE.Mesh;
  private responseToken:THREE.Mesh;
  private inscriptionTextures:THREE.Texture[]=[];
  private mineral:THREE.Texture|null=null;
  private route = new THREE.Group();
  private moon = new THREE.Group();
  private memoryTrace=new THREE.Line(new THREE.BufferGeometry().setFromPoints([]),new THREE.LineBasicMaterial({color:'#cfb888',transparent:true,opacity:.55}));
  private memoryQuote:THREE.Sprite;
  private memoryTrailKey='';
  private danceTime=0;
  private danceEnergy=1;
  private shadowFrame=0;
  private pixelBudget = 1_350_000;
  private sampleTime = 0;
  private sampleFrames = 0;
  private shaderErrors = new Set<string>();
  private width = 1280;
  private height = 720;
  readonly thumbnails = new Map<ChapterId,string>();
  fps = 0;

  private constructor(host:HTMLElement) {
    this.host=host;
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.05;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate=false;
    this.renderer.debug.onShaderError=(gl,program,vertex,fragment)=>{
      const reason=gl.getProgramInfoLog(program)||gl.getShaderInfoLog(vertex)||gl.getShaderInfoLog(fragment)||'着色器编译失败';
      this.shaderErrors.add(reason.slice(0,320));
    };
    this.renderer.domElement.setAttribute('aria-hidden','true');
    this.renderer.domElement.className='world-canvas';
    host.append(this.renderer.domElement);
    this.scene.fog=new THREE.FogExp2('#8f9d90',.0048);
    this.scene.add(new THREE.HemisphereLight('#e7e3c6','#15383d',2.4));
    const light=new THREE.DirectionalLight('#f4d3a0',3.0);light.position.set(-20,35,18);light.castShadow=true;
    light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-36,right:36,top:36,bottom:-36,near:1,far:130});
    light.shadow.camera.updateProjectionMatrix();
    light.shadow.bias=-.00035;light.shadow.normalBias=.02;this.scene.add(light);
    const rim=new THREE.DirectionalLight('#9dccc7',1.5);rim.position.set(12,12,-20);this.scene.add(rim);
    this.rock=new THREE.ShaderMaterial({
      vertexShader:rockVertex,fragmentShader:rockFragment,
      uniforms:{uDark:{value:new THREE.Color()},uJade:{value:new THREE.Color()},uGold:{value:new THREE.Color()},uFog:{value:new THREE.Color()},uMineral:{value:null},uTime:{value:0}},
    });
    this.sky=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,vertexShader:skyVertex,fragmentShader:skyFragment,
      uniforms:{uLow:{value:new THREE.Color()},uHigh:{value:new THREE.Color()},uTime:{value:0}}});
    const skyMesh=new THREE.Mesh(new THREE.SphereGeometry(245,40,24),this.sky);skyMesh.renderOrder=-10;this.scene.add(skyMesh);
    this.water=new Reflector(new THREE.PlaneGeometry(430,430),{textureWidth:768,textureHeight:512,clipBias:.004,multisample:0,shader:waterShader});
    this.water.rotation.x=-Math.PI/2;this.water.position.y=-.04;this.scene.add(this.water);
    this.camera.layers.enable(1);
    this.water.getReflectionCamera(this.camera).layers.disable(1);
    const disc=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,
      uniforms:{uColor:{value:new THREE.Color('#d6c39a')}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'uniform vec3 uColor;varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;float m=sin(vUv.x*26.+sin(vUv.y*19.)*2.)*.018;vec3 c=uColor*(1.+m);float a=1.-smoothstep(.96,1.,r);gl_FragColor=vec4(c,a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
    }));
    this.moon.add(disc);
    for(let i=0;i<3;i++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(5.05+i*.22,.012,4,120),new THREE.MeshBasicMaterial({color:'#c5ba8c',transparent:true,opacity:.30-i*.06,fog:false}));
      this.moon.add(ring);
    }
    this.moon.position.set(8,22,-65);this.scene.add(this.moon);
    this.requestLabel=this.inscription(EXCHANGE.request.shore+' · '+EXCHANGE.request.actor+'之请',[EXCHANGE.request.phrase],'#ead6a2');
    this.responseLabel=this.inscription(EXCHANGE.response.shore+' · '+EXCHANGE.response.actor+'之答',[EXCHANGE.response.phrase],'#cce2cb');
    this.memoryQuote=this.inscription('这一往复，已留在水上',[EXCHANGE.request.phrase,EXCHANGE.response.phrase],'#ece3c7');
    this.memoryQuote.position.set(2,1.1,-12);this.memoryQuote.visible=false;
    const jade=new THREE.MeshStandardMaterial({color:'#84b3a0',roughness:.55,metalness:.10});
    this.requestToken=new THREE.Mesh(new THREE.TorusGeometry(.23,.055,8,32),jade);
    this.responseToken=new THREE.Mesh(new THREE.TorusGeometry(.20,.055,8,32),jade);this.responseToken.scale.set(.7,1.25,.7);
    this.correspondence.add(this.requestLabel,this.responseLabel,this.requestToken,this.responseToken);
    this.scene.add(this.correspondence,this.route);
    const target=new THREE.WebGLRenderTarget(1280,720,{type:THREE.HalfFloatType,samples:Math.min(2,this.renderer.capabilities.maxSamples)});
    this.composer=new EffectComposer(this.renderer,target);
    this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UnrealBloomPass(new THREE.Vector2(1280,720),.35,.65,.9);this.composer.addPass(this.bloom);
    this.film=new ShaderPass(grainShader);this.composer.addPass(this.film);this.composer.addPass(new OutputPass());
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();
  }
  static async create(host:HTMLElement,onProgress:(label:string,ratio:number)=>void) {
    const world=new PoeticWorld(host);
    try {
      onProgress('研磨青绿矿色',.03);
      const pigment=world.mineral=await new THREE.TextureLoader().loadAsync(import.meta.env.BASE_URL+'art/mineral-pigment.webp');
      pigment.colorSpace=THREE.SRGBColorSpace;pigment.wrapS=pigment.wrapT=THREE.RepeatWrapping;pigment.anisotropy=Math.min(8,world.renderer.capabilities.getMaxAnisotropy());
      world.rock.uniforms.uMineral.value=pigment;
      for(let i=0;i<CHAPTERS.length;i++){
        onProgress('构筑'+CHAPTERS[i].name+'之境',.08+i*.10);
        const stage=world.buildStage(i);
        world.stages.set(CHAPTERS[i].id,stage);world.scene.add(stage.group);
        stage.group.visible=false;
        await new Promise<void>(resolve=>setTimeout(resolve,0));
      }
      onProgress('展开六境图录',.75);
      for(let i=0;i<CHAPTERS.length;i++){
        world.activate(CHAPTERS[i].id);
        world.updateSilks(world.stages.get(CHAPTERS[i].id)!,0,0);
        world.setCamera(CHAPTERS[i].id,.35,0,true);
        world.renderer.setPixelRatio(1);world.renderer.setSize(480,300,false);
        world.camera.aspect=1.6;world.camera.updateProjectionMatrix();
        await world.renderer.compileAsync(world.scene,world.camera);
        world.renderer.render(world.scene,world.camera);
        if(world.shaderErrors.size)throw new Error('诗境首帧着色器未通过：'+[...world.shaderErrors].join('；'));
        world.thumbnails.set(CHAPTERS[i].id,world.renderer.domElement.toDataURL('image/jpeg',.85));
        onProgress('绘制'+CHAPTERS[i].name+'首帧',.76+i*.035);
      }
      world.activate('return');world.resize();world.setCamera('return',.15,0,true);
      world.composer.render();
      onProgress('六境已就绪',1);
      return world;
    } catch(error) { world.dispose();throw error; }
  }
  private buildStage(index:number):Stage {
    const group=new THREE.Group(),rand=random(1701+index*483),silks:Silk[]=[];
    const addRock=(x:number,z:number,r:number,h:number,angle=0)=>{
      const mesh=new THREE.Mesh(r>2?mountainMass(r,h,rand()*50):crag(r,h,rand()*50),this.rock);
      mesh.position.set(x,-.15,z);mesh.rotation.y=angle;mesh.castShadow=r<18;group.add(mesh);return mesh;
    };
    const addBank=(x:number,z:number,rx:number,rz:number,h:number,trees:number)=>{
      const seed=index+rx,geometry=bankGeometry(rx,rz,h,seed),mesh=new THREE.Mesh(geometry,this.rock);
      mesh.position.set(x,0,z);group.add(mesh);
      const shade=new THREE.Mesh(geometry,new THREE.ShadowMaterial({color:'#16342f',opacity:.30}));
      shade.position.set(x,.004,z);shade.receiveShadow=true;group.add(shade);
      if(trees)group.add(pineGrove(trees,[x,z,rx,rz],h,index*9+trees,this.bark,this.leaves,seed));
      if(trees)group.add(riverHerbs(trees*6,[x,z,rx,rz],h,index*91+trees,this.rock.uniforms.uTime,seed));
      const edge:number[][]=[];
      for(let i=0;i<100;i++){
        const a=i/100*Math.PI*2,fringe=1+.10*Math.sin(a*5+seed)+.06*Math.cos(a*9-seed);
        let lo=.7,hi=1.08;
        for(let n=0;n<10;n++){const r=(lo+hi)*.5; if(bankHeightAt(Math.cos(a)*r*fringe,Math.sin(a)*r*fringe,h,seed)>-.035)lo=r;else hi=r;}
        const r=(lo+hi)*.5;edge.push([x+Math.cos(a)*rx*r*fringe,-.031,z+Math.sin(a)*rz*r*fringe]);
      }
      const shoreline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(edge.map(p=>V(p[0],p[1],p[2]))),new THREE.LineBasicMaterial({color:palettes[index][2],transparent:true,opacity:.24}));
      group.add(shoreline);
    };
    const ridges:number[][][]=[
      [[-38,-42,23,30,.2],[-13,-84,29,27,-.45],[31,-49,22,37,.7],[61,-91,28,25,.1],[-61,-104,35,24,-.3]],
      [[-22,-43,24,17,.3],[25,-80,32,18,-.4],[-55,-91,36,13,.5]],
      [[28,-55,31,24,-.3],[-45,-92,38,15,.3],[55,-111,42,16,0]],
      [[-31,-31,19,27,.4],[30,-46,22,31,-.5],[-7,-79,30,25,.2],[61,-90,32,22,0]],
      [[-49,-79,44,16,.1],[-9,-126,50,12,-.3],[67,-139,45,10,.2]],
      [[-34,-87,30,13,.1],[34,-97,35,16,-.2]],
    ];
    for(const ridge of ridges[index])addRock(ridge[0],ridge[1],ridge[2],ridge[3],ridge[4]);
    let base=V(0,0,-10),memories:Stage['memories'];
    if(index===0){
      addBank(-21,5,15,29,3.1,9);addBank(22,-27,12,20,2.0,7);
      addRock(-28,-16,10,22,.4);addRock(30,-29,10,26,-.25);
      for(let i=0;i<8;i++){const stone=new THREE.Mesh(crag(.6,.18,i),this.rock);stone.position.set(-7+i*.22,.015,13-i*3.1);stone.scale.z=1.4;group.add(stone);}
      base=V(2,0,-19);
    }else if(index===1){
      addBank(-19,3,16,20,2.4,6);addBank(21,-31,9,15,1.3,3);
      addRock(-9,-14,8,5,-.2);base=V(6.4,0,-3);
    }else if(index===2){
      addBank(-22,8,14,20,2.0,4);addBank(20,-23,10,21,1.6,4);
      addRock(20,-34,10,8,.4);
      base=MESSAGE_SHORE.figure.clone();
    }else if(index===3){
      addBank(-25,-2,10,18,1.6,5);addBank(26,-18,10,20,1.2,5);
      addBank(8,-36,6,7,.9,2);base=V(0,0,-1);
      const veil=new THREE.MeshStandardMaterial({color:'#d5dcc4',roughness:.94,metalness:.02,transparent:true,opacity:.36,side:THREE.DoubleSide,depthWrite:false});
      for(let i=0;i<2;i++){const ribbon=new Silk(veil);silks.push(ribbon);group.add(ribbon.mesh);}
    }else if(index===4){
      addBank(-23,-21,12,28,1.1,4);addBank(39,-70,13,29,1.0,2);
      base=V(-4,8,-16);
    }else{
      addBank(-16,-13,11,36,1.2,4);addBank(18,-28,11,35,.9,3);
      addRock(-22,-38,7,10,.3);addRock(25,-50,8,12,-.5);
      memories=CHAPTERS.map((chapter,i)=>{
        const p=memoryPoint(i,0);
        const marker=new THREE.Mesh(new THREE.TorusGeometry(.28,.024,5,42),new THREE.MeshBasicMaterial({color:'#cbb888',transparent:true,opacity:0}));
        marker.rotation.x=-Math.PI/2;marker.position.copy(p);group.add(marker);
        return {chapter:chapter.id,marker};
      });
      group.add(this.memoryTrace,this.memoryQuote);
      base=V(0,0,-40);
    }
    const spirit=index<5?new RiverSpirit(this.gold):undefined;
    if(spirit){spirit.root.position.copy(base);spirit.root.rotation.y=index===1?-.72:index===2?-.62:index===4?2.4:-.15;spirit.root.visible=index!==0;spirit.update(0,{chapter:CHAPTERS[index].id,stride:0,reply:0,gaze:0,dance:index===3?1:0});group.add(spirit.root);}
    let vehicle:THREE.Group|undefined;
    if(index===4){vehicle=chariot(this.gold,this.rock);vehicle.position.copy(base).add(V(0,-.5,0));group.add(vehicle);}
    const mist=this.makePoints(48,rand,64,.026,9,48);mist.position.z=-12;group.add(mist);
    if(index===4){mist.position.y=8;(mist.material as THREE.ShaderMaterial).uniforms.uOpacity.value=.06;}
    const birds:THREE.Group[]=[];
    for(let i=0;i<(index===4?6:3);i++){
      const bird=new THREE.Group(),ink=new THREE.MeshBasicMaterial({color:index===4?'#9a927a':'#294542',fog:true});
      bird.add(curve([[-.6,0,-.15],[-.25,.12,0],[0,0,0],[.25,.12,0],[.6,0,-.15]],.017,ink));
      bird.position.set(-10+i*5,13+(i%3),-28-(i%2)*5);bird.scale.setScalar(.6+rand()*.3);group.add(bird);birds.push(bird);
    }
    return {group,spirit,vehicle,mist,birds,base,silks,memories};
  }

  private makePoints(count:number,rand:()=>number,size:number,opacity:number,y:number,spread:number) {
    const p:number[]=[],seeds:number[]=[];
    for(let i=0;i<count;i++){p.push((rand()-.5)*spread*2,rand()*y+1,-rand()*90+15);seeds.push(rand());}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));
    const m=new THREE.ShaderMaterial({vertexShader:mistVertex,fragmentShader:mistFragment,transparent:true,depthWrite:false,
      uniforms:{uTime:{value:0},uSize:{value:size},uColor:{value:new THREE.Color('#e3d4ae')},uOpacity:{value:opacity}}});
    return new THREE.Points(g,m);
  }
  activate(id:ChapterId) {
    if(this.active===id&&this.cameraReady&&this.stages.get(id)?.group.visible)return;
    this.active=id;this.cameraReady=false;this.smoothedFocus=0;
    this.danceTime=0;this.danceEnergy=1;this.smoothedGaze=0;this.smoothedReply=0;this.renderer.shadowMap.needsUpdate=true;
    for(const [key,stage]of this.stages)stage.group.visible=key===id;
    const index=CHAPTERS.findIndex(c=>c.id===id),p=palettes[index];
    this.rock.uniforms.uDark.value.set(p[0]);this.rock.uniforms.uJade.value.set(p[1]);this.rock.uniforms.uGold.value.set(p[2]);this.rock.uniforms.uFog.value.set(p[3]);
    this.sky.uniforms.uLow.value.set(p[3]);this.sky.uniforms.uHigh.value.set(p[4]);
    const wu=(this.water.material as THREE.ShaderMaterial).uniforms;
    wu.color.value.set(p[5]);wu.uGold.value.set(p[2]);wu.uFog.value.set(p[3]);
    for(const ripple of wu.uRipples.value as THREE.Vector4[])ripple.set(0,0,-100,0);
    this.gold.color.set(p[2]);this.leaves.color.set(p[1]).multiplyScalar(.6);
    (this.scene.fog as THREE.FogExp2).color.set(p[3]);
    this.moon.position.set(index===1?-10:index===2?-4:index===0?-3:8,index===1?12:index===0?16:22,index===1?-55:index===0?-76:index===2?-74:-65);
    this.moon.scale.setScalar(index===1?.60:index===2?.45:index===5?.36:.82);
    this.moon.visible=index!==3&&index!==4;
    this.route.visible=false;this.correspondence.visible=false;
    this.clearRoute();
    if(id==='message'){
      const pts:number[][]=[];for(let j=0;j<=90;j++){const p=this.letterPath(j/90);pts.push([p.x,p.y,p.z]);}this.route.add(curve(pts,.007,this.gold));
    }
    this.host.dataset.chapter=id;
  }
  private clearRoute(){this.route.children.forEach(c=>{if(c instanceof THREE.Mesh)c.geometry.dispose();});this.route.clear();}
  private letterPath(t:number) {
    return V(THREE.MathUtils.lerp(MESSAGE_SHORE.from.x,MESSAGE_SHORE.to.x,t)-Math.sin(Math.PI*t)*.8,
      THREE.MathUtils.lerp(MESSAGE_SHORE.from.y,MESSAGE_SHORE.to.y,THREE.MathUtils.smoothstep(t,.68,1)),
      THREE.MathUtils.lerp(MESSAGE_SHORE.from.z,MESSAGE_SHORE.to.z,t));
  }
  private inscription(heading:string,lines:readonly string[],color:string) {
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=lines.length===1?240:345;
    const c=canvas.getContext('2d')!;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
    c.font='400 38px "Luo Serif",serif';c.strokeStyle='#173b35';c.lineWidth=4;c.strokeText(heading,512,45);c.fillStyle=color;c.fillText(heading,512,45);
    c.font='400 96px "Luo Serif",serif';c.lineWidth=6;
    lines.forEach((line,i)=>{c.strokeText(line,512,142+i*105);c.fillText(line,512,142+i*105);});
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;this.inscriptionTextures.push(map);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthWrite:false,depthTest:false,toneMapped:false,fog:false}));
    sprite.layers.set(1);sprite.renderOrder=5;return sprite;
  }
  private sizeInscription(sprite:THREE.Sprite,pixels:number) {
    const image=sprite.material.map!.image as HTMLCanvasElement;
    const depth=-sprite.position.clone().applyMatrix4(this.camera.matrixWorldInverse).z;
    const unit=2*Math.max(.1,depth)*Math.tan(THREE.MathUtils.degToRad(this.camera.fov*.5))/this.height;
    const height=pixels*THREE.MathUtils.clamp(this.width/1200,.8,1);
    sprite.scale.set(height*image.width/image.height*unit,height*unit,1);
    return height;
  }
  private updateExchange(state:Journey) {
    const l=state.letter,cue=directScene(state);
    const active=this.active==='message'&&state.chapter==='message'&&l.phase!=='waiting';
    this.correspondence.visible=active;
    const u=(this.water.material as THREE.ShaderMaterial).uniforms;
    u.uLetter.value.set(active&&l.phase!=='settled'?l.elapsed:-1,MESSAGE_SHORE.from.x,MESSAGE_SHORE.from.z);
    u.uDestination.value.set(MESSAGE_SHORE.to.x,MESSAGE_SHORE.to.z);
    if(!active)return;
    const place=(label:THREE.Sprite,token:THREE.Mesh,t:number,opacity:number)=>{
      const point=this.letterPath(t);token.position.copy(point);token.rotation.y=this.artTime*.25;token.visible=opacity>0;
      label.position.copy(point).add(V(-t*3.1,.85,0));label.material.opacity=opacity;label.visible=opacity>0;return this.sizeInscription(label,70);
    };
    const settled=l.phase==='settled';
    const requestHeight=place(this.requestLabel,this.requestToken,cue.requestProgress,l.phase==='outbound'||l.phase==='arrival'?1:settled?.50:0);
    const responseHeight=place(this.responseLabel,this.responseToken,1-cue.responseProgress,l.phase==='answer'?1:settled?.80:0);
    if(import.meta.env.DEV){
      const label=l.phase==='answer'||settled?this.responseLabel:this.requestLabel;
      const point=label.position.clone().project(this.camera),aspect=1024/240,height=l.phase==='answer'||settled?responseHeight:requestHeight;
      this.host.dataset.transferBox=[(point.x*.5+.5)*this.width,(.5-point.y*.5)*this.height,aspect*height,height].map(n=>n.toFixed(1)).join(',');
    }
  }
  private setCamera(id:ChapterId,p:number,dt:number,snap=false) {
    const index=CHAPTERS.findIndex(c=>c.id===id);
    let from:THREE.Vector3,to:THREE.Vector3,look:THREE.Vector3,near:THREE.Vector3;
    switch(index){
      case 0:from=V(16,9,30);to=V(6,5.5,17);look=V(-2,3,-11);near=V(8,4.4,17);break;
      case 1:from=V(8,4.3,15);to=V(6.8,4.2,12);look=V(4.5,2.55,-1);near=V(6,3.9,10.5);break;
      case 2:from=V(4.5,2.8,24);to=V(3.1,1.8,19);look=V(1.7,1.2,-5);near=V(3,1.8,16);break;
      case 3:from=V(15,8,23);to=V(-8,5,18);look=V(0,2,-3);near=V(7,3.9,12);break;
      case 4:from=V(15,15,29);to=V(3,19,25);look=V(5,12,-13);near=V(9,15,21);break;
      default:from=V(19,24,35);to=V(0,43,23);look=V(0,0,-9);near=to.clone();break;
    }
    const target=from.lerp(to,p).lerp(near,this.smoothedFocus*.85);
    if(this.width/this.height<.8){target.x=look.x+(target.x-look.x)*.65;target.z+=5;}
    target.x+=this.pointer.x*(this.reduced?0:1.2);
    target.y-=this.pointer.y*(this.reduced?0:.55);
    if(snap||!this.cameraReady){this.camera.position.copy(target);this.cameraReady=true;}else this.camera.position.lerp(target,1-Math.exp(-dt*3));
    this.camera.lookAt(look);
    if(import.meta.env.DEV)this.host.dataset.camera=this.camera.position.toArray().map(value=>value.toFixed(4)).join(',');
  }
  setPointer(x:number,y:number){this.pointer.set(x*2-1,y*2-1);}
  disturb(x:number,y:number,strength=.7) {
    this.ray.setFromCamera(new THREE.Vector2(x*2-1,1-y*2),this.camera);
    const point=this.ray.ray.intersectPlane(this.plane,new THREE.Vector3());
    if(!point||point.distanceTo(this.camera.position)>100)return false;
    const ripples=(this.water.material as THREE.ShaderMaterial).uniforms.uRipples.value as THREE.Vector4[];
    ripples[this.rippleCursor++%ripples.length].set(point.x,point.z,this.artTime,this.reduced?.2:strength);
    return true;
  }
  setReducedMotion(value:boolean){this.reduced=value;this.bloom.strength=value?.20:.35;this.resize();}
  private resize() {
    this.width=Math.max(1,this.host.clientWidth);this.height=Math.max(1,this.host.clientHeight);
    const dpr=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(this.pixelBudget/(this.width*this.height)));
    this.renderer.setPixelRatio(Math.max(.65,dpr));this.renderer.setSize(this.width,this.height,false);
    this.composer.setPixelRatio(Math.max(.65,dpr));this.composer.setSize(this.width,this.height);
    this.camera.aspect=this.width/this.height;this.camera.fov=this.width/this.height<.8?49:43;this.camera.updateProjectionMatrix();
  }
  render(state:Journey,dt:number,time:number,preview=false) {
    const paintDelta=Math.max(0,time-this.previousTime)*(this.reduced?.25:1);
    this.artTime+=paintDelta;this.previousTime=time;
    const active=this.stages.get(this.active);if(!active)return;
    const cue=directScene(state);
    this.rock.uniforms.uTime.value=this.artTime;this.sky.uniforms.uTime.value=this.artTime;
    const wu=(this.water.material as THREE.ShaderMaterial).uniforms,motion=Math.abs(state.velocity)/WALK_SPEED;
    wu.uTiming.value.set(MESSAGE_DURATION.outbound,MESSAGE_DURATION.arrival,MESSAGE_DURATION.answer);
    wu.uTime.value=this.artTime;wu.uMotion.value=motion;
    this.smoothedFocus+=((!preview?cue.cameraAttention:0)-this.smoothedFocus)*(1-Math.exp(-dt*2));
    this.smoothedGaze+=(cue.gaze-this.smoothedGaze)*(1-Math.exp(-paintDelta*3));
    this.smoothedReply+=(cue.reply-this.smoothedReply)*(1-Math.exp(-paintDelta*2.2));
    this.setCamera(this.active,(state.mode==='cover'||preview)?.15:state.position,dt);
    this.camera.updateMatrixWorld();
    if(active.spirit){
      active.spirit.root.position.copy(active.base);
      if(this.active==='dance'){
        this.danceEnergy+=(cue.danceStep-this.danceEnergy)*(1-Math.exp(-paintDelta*2.8));
        this.danceTime+=paintDelta*this.danceEnergy;
        active.spirit.root.position.x+=Math.sin(this.danceTime*.23)*1.35;
        active.spirit.root.position.z+=Math.cos(this.danceTime*.23)*.65;
        active.spirit.root.rotation.y=-.25+Math.sin(this.danceTime*.23)*.24;
      }
      if(this.active==='farewell'){
        active.spirit.root.rotation.y=2.4;
        active.spirit.root.position.add(V(cue.departure*8,cue.departure*4,-cue.departure*36));
        active.vehicle?.position.copy(active.spirit.root.position).add(V(0,-.6,0));
      }
      if(this.active==='return'){active.spirit.root.scale.setScalar(.7);active.spirit.root.visible=!preview&&state.mode!=='cover'&&state.position>.64;}
      active.spirit.update(this.artTime,{chapter:this.active,stride:motion,reply:this.smoothedReply,gaze:this.smoothedGaze,dance:this.danceEnergy});
    }
    this.updateSilks(active,this.active==='dance'?this.danceTime:this.artTime,this.active==='dance'?this.danceEnergy:motion);
    const dancer=active.spirit?.root.position;
    wu.uDance.value.set(this.danceTime,this.active==='dance'?this.danceEnergy:0,dancer?.x??0,dancer?.z??0);
    this.route.visible=this.active==='message'&&['outbound','arrival','answer'].includes(state.letter.phase);
    this.updateMemory(state);
    active.group.children.forEach(child=>{
      if(child instanceof THREE.Points)(child.material as THREE.ShaderMaterial).uniforms.uTime.value=this.artTime;
    });
    active.birds.forEach((bird,i)=>{bird.rotation.z=Math.sin(this.artTime*.7+i)*.10;bird.position.x=-14+i*4+Math.sin(this.artTime*.06+i)*4;});
    this.updateExchange(state);
    if(this.shadowFrame++%3===0)this.renderer.shadowMap.needsUpdate=true;
    this.composer.render();
    if(import.meta.env.DEV){
      this.host.dataset.danceEnergy=this.danceEnergy.toFixed(3);
      this.host.dataset.danceTime=this.danceTime.toFixed(3);
      this.host.dataset.gaze=String(cue.gaze);
      this.host.dataset.memoryQuote=String(cue.memoryQuote);
    }
    if(document.hasFocus()&&dt>.001){this.sampleTime+=dt;this.sampleFrames++;}
    if(this.sampleTime>3){
      this.fps=this.sampleFrames/this.sampleTime;const previous=this.pixelBudget;
      if(this.fps<27)this.pixelBudget=Math.max(600_000,this.pixelBudget*.78);
      else if(this.fps>55)this.pixelBudget=Math.min(1_800_000,this.pixelBudget*1.08);
      if(previous!==this.pixelBudget)this.resize();
      this.sampleTime=0;this.sampleFrames=0;
    }
  }
  private updateSilks(stage:Stage,time:number,motion:number) {
    stage.silks.forEach((silk,i)=>silk.update(t=>{
      const theta=t*Math.PI*1.3+i*2.2+time*.035;
      return V(Math.cos(theta)*(3.4+i*.55),.8+Math.sin(t*Math.PI)*3.4+Math.sin(theta*2+time*.08)*.23,-3+Math.sin(theta)*3.4);
    },.055+motion*.055));
  }
  private updateMemory(state:Journey) {
    if(this.active!=='memory')return;
    const stage=this.stages.get('memory')!;
    for(const item of stage.memories??[])item.marker.material.opacity=state.visited.has(item.chapter)?.7:0;
    const tail=state.trail.at(-1),key=state.trail.length+':'+tail?.chapter+':'+tail?.position+':'+tail?.time;
    if(key!==this.memoryTrailKey){
      this.memoryTrailKey=key;
      const points=state.trail.map(point=>memoryPoint(CHAPTERS.findIndex(ch=>ch.id===point.chapter),point.position));
      this.memoryTrace.geometry.dispose();this.memoryTrace.geometry=new THREE.BufferGeometry().setFromPoints(points);
    }
    this.memoryQuote.visible=directScene(state).memoryQuote!==null;
    this.sizeInscription(this.memoryQuote,100);
  }

  dispose() {
    this.observer.disconnect();
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
    this.scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
    for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of this.inscriptionTextures)t.dispose();
    for(const label of [this.requestLabel,this.responseLabel,this.memoryQuote])label.material.dispose();
    this.mineral?.dispose();this.water.dispose();this.composer.dispose();this.renderer.dispose();this.renderer.domElement.remove();
  }
}
