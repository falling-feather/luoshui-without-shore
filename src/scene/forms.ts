import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { ChapterId } from '../content.ts';

export function random(seed: number) {
  let n = seed >>> 0;
  return () => { n = (1664525 * n + 1013904223) >>> 0; return n / 4294967296; };
}


const dummy = new THREE.Object3D();
export function bankHeightAt(u:number,v:number,height:number,seed:number) {
  const a=Math.atan2(v,u),fringe=1+.10*Math.sin(a*5+seed)+.06*Math.cos(a*9-seed);
  const r=Math.hypot(u,v)/fringe;
  return height*Math.pow(Math.max(0,1-r),.85)-.06+.05*Math.sin(a*8)*r;
}

/** A continuous eroded ridge, with several asymmetric summits. */
export function mountainMass(radius:number,height:number,seed:number) {
  const cols=72,rows=48,p:number[]=[],indices:number[]=[];
  const hash=(x:number,z:number)=>{const n=Math.sin(x*127.1+z*311.7+seed*23.17)*43758.5453;return n-Math.floor(n);};
  const noise=(x:number,z:number)=>{
    const ix=Math.floor(x),iz=Math.floor(z);let u=x-ix,v=z-iz;u=u*u*(3-2*u);v=v*v*(3-2*v);
    return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iz),hash(ix+1,iz),u),THREE.MathUtils.lerp(hash(ix,iz+1),hash(ix+1,iz+1),u),v);
  };
  for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
    const nx=col/cols*2-1,nz=row/rows*2-1;
    const phase=seed*.31;
    const spine=nz+.15*Math.sin(nx*2.3+phase);
    const width=.46+.14*Math.sin(nx*1.8+phase);
    const shoulder=Math.exp(-Math.pow(Math.abs(spine)/width,1.7));
    const envelope=Math.pow(Math.max(0,1-nx*nx),.55)*Math.pow(Math.max(0,1-nz*nz),.55);
    const crest=.57+.16*Math.sin(nx*3.1+phase)+.08*Math.cos(nx*6.3-phase);
    const saddle=1-.22*Math.exp(-Math.pow((nx-.25*Math.sin(phase))/.22,2));
    const foothill=.15*Math.exp(-Math.pow((nz-.34+nx*.10)/.50,2));
    const erosion=(noise(nx*5+seed,nz*3)-.5)*.025;
    const y=height*envelope*(crest*shoulder*saddle+foothill+erosion)-.25;
    p.push(nx*radius,y,nz*radius*.78);
    if(col<cols&&row<rows){const a=row*(cols+1)+col;indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

/** Ring-built rock: the silhouette and strata are geometry, not a background. */
export function crag(radius: number, height: number, seed: number) {
  const positions: number[] = [], indices: number[] = [];
  const cols = 22, rows = 22;
  for (let y = 0; y <= rows; y++) {
    const t = y / rows;
    for (let j = 0; j <= cols; j++) {
      const a = j / cols * Math.PI * 2;
      const ledge = 1 + .10 * Math.sin(t * 31 + seed) + .065 * Math.cos(t * 53);
      const r = radius * Math.pow(1 - t, .58) * ledge *
        (1 + .17 * Math.sin(a * 3 + seed) + .11 * Math.sin(a * 7 - t * 8 + seed));
      const twist = Math.sin(t * 3 + seed) * radius * .25;
      positions.push(Math.cos(a) * r + twist, t * height * (1 + .04 * Math.sin(a * 5 + seed) * Math.sin(t*Math.PI)), Math.sin(a) * r * .84);
      if (y < rows && j < cols) {
        const k = y * (cols + 1) + j;
        indices.push(k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
export function bankGeometry(rx: number, rz: number, height: number, seed: number) {
  const p: number[] = [], idx: number[] = [], columns = 56, rings = 16;
  for (let i=0;i<=rings;i++) {
    const r = i / rings;
    for (let j=0;j<=columns;j++) {
      const a=j/columns*Math.PI*2;
      const fringe=1+.10*Math.sin(a*5+seed)+.06*Math.cos(a*9-seed);
      const u=Math.cos(a)*r*fringe,v=Math.sin(a)*r*fringe;
      p.push(u*rx,bankHeightAt(u,v,height,seed),v*rz);
      if(i<rings&&j<columns){const k=i*(columns+1)+j;idx.push(k,k+1,k+columns+1,k+1,k+columns+2,k+columns+1);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function curve(points: number[][], radius: number, material: THREE.Material, closed = false) {
  const path = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number])),closed,'catmullrom',.45);
  return new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(30,points.length*9), radius, 5, closed),material);
}
export function pineGrove(count:number,area:[number,number,number,number],height:number,seed:number,bark:THREE.Material,leaves:THREE.Material,surfaceSeed:number) {
  const group=new THREE.Group(),rand=random(seed),wood:THREE.BufferGeometry[]=[];
  const needlesPerBough=220,boughs=4;
  const needleGeometry=new THREE.BufferGeometry();
  needleGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.045,0,0,.045,0,0,0,1,0,0,0,-.035,0,0,.035,0,1,0],3));
  needleGeometry.computeVertexNormals();
  const foliage=new THREE.InstancedMesh(needleGeometry,leaves,count*boughs*needlesPerBough);
  const helper=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
  const [x,z,rx,rz]=area;
  const taper=(a:THREE.Vector3,b:THREE.Vector3,r0:number,r1:number)=>{
    const d=b.clone().sub(a),g=new THREE.CylinderGeometry(r1,r0,d.length(),6,1);
    helper.position.copy(a).add(b).multiplyScalar(.5);helper.quaternion.setFromUnitVectors(up,d.normalize());helper.scale.set(1,1,1);helper.updateMatrix();g.applyMatrix4(helper.matrix);wood.push(g);
  };
  let n=0;
  for(let i=0;i<count;i++){
    const a=[-2.2,-.35,1.2][Math.floor(i/3)%3]+(rand()-.5)*.8,r=.40+rand()*.39;
    const u=Math.cos(a)*r,v=Math.sin(a)*r;
    const root=new THREE.Vector3(x+u*rx,bankHeightAt(u,v,height,surfaceSeed),z+v*rz);
    const h=2.1+rand()*2.4,azimuth=rand()*6.28,lean=.3+rand()*.65;
    const at=(t:number)=>root.clone().add(new THREE.Vector3(Math.sin(t*1.7)*Math.cos(azimuth)*lean,h*t,Math.sin(t*1.7)*Math.sin(azimuth)*lean));
    for(let k=0;k<5;k++)taper(at(k/5),at((k+1)/5),.13*(1-k/6),.13*(1-(k+1)/6));
    for(let b=0;b<boughs;b++){
      const t=.47+b*.135,angle=azimuth+b*2.4+(rand()-.5)*.4,length=(1.55-b*.2)*( .8+rand()*.35);
      const start=at(t),elbow=start.clone().add(new THREE.Vector3(Math.cos(angle)*length*.55,-.08,Math.sin(angle)*length*.55));
      const end=start.clone().add(new THREE.Vector3(Math.cos(angle)*length,.14+rand()*.22,Math.sin(angle)*length));
      taper(start,elbow,.052,.034);taper(elbow,end,.034,.012);
      for(let k=0;k<needlesPerBough;k++){
        const theta=rand()*6.28,radius=Math.sqrt(rand());
        const local=new THREE.Vector3(Math.cos(theta)*radius*.85,(rand()-.5)*.28+Math.pow(1-radius,2)*.19,Math.sin(theta)*radius*.63);
        const center=end.clone().add(local);
        const axis=new THREE.Vector3(local.x*.7+(rand()-.5)*.6,.28+rand()*.4,local.z*.7+(rand()-.5)*.5).normalize();
        helper.position.copy(center);helper.quaternion.setFromUnitVectors(up,axis);helper.scale.set(.7+rand()*.6,.12+rand()*.19,.7+rand()*.6);helper.updateMatrix();foliage.setMatrixAt(n,helper.matrix);
        const tint=new THREE.Color('#b8c8b6').multiplyScalar(.65+rand()*.5);foliage.setColorAt(n++,tint);
      }
    }
  }
  const geometry=mergeGeometries(wood,false)!;for(const piece of wood)piece.dispose();
  const trunk=new THREE.Mesh(geometry,bark);trunk.name='pine-wood';trunk.castShadow=true;trunk.receiveShadow=true;
  foliage.name='pine-needles';foliage.castShadow=true;foliage.receiveShadow=true;
  foliage.instanceMatrix.needsUpdate=true;if(foliage.instanceColor)foliage.instanceColor.needsUpdate=true;
  group.add(trunk,foliage);return group;
}

export function riverHerbs(count:number,area:[number,number,number,number],height:number,seed:number,time:{value:number},surfaceSeed:number) {
  const rand=random(seed),p:number[]=[],uv:number[]=[],colors:number[]=[],idx:number[]=[];
  const root=new THREE.Color('#1d4a39'),tip=new THREE.Color('#c5b77d');
  for(let i=0;i<=8;i++){
    const t=i/8,w=Math.sin(t*Math.PI)*.055;
    for(const side of [-1,1]){
      p.push(side*w,t,t*t*.22);uv.push((side+1)/2,t);
      const color=root.clone().lerp(tip,Math.pow(t,3)*.8);colors.push(color.r,color.g,color.b);
    }
    if(i<8){const k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:.15,side:THREE.DoubleSide});
  material.onBeforeCompile=shader=>{
    shader.uniforms.uHerbTime=time;
    shader.vertexShader='uniform float uHerbTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(uHerbTime*.55+instanceMatrix[3].x*.3)*uv.y*uv.y*.12;');
  };
  material.customProgramCacheKey=()=> 'luo-river-herbs';
  const mesh=new THREE.InstancedMesh(geo,material,count*5);
  const [x,z,rx,rz]=area;
  for(let i=0;i<count;i++){
    const a=[-2.1,-.2,1.0][i%3]+(rand()-.5)*.9,r=.46+rand()*.34,px=x+Math.cos(a)*rx*r,pz=z+Math.sin(a)*rz*r,py=bankHeightAt(Math.cos(a)*r,Math.sin(a)*r,height,surfaceSeed);
    for(let j=0;j<5;j++){
      dummy.position.set(px,py,pz);dummy.rotation.set((rand()-.5)*.7,rand()*6.28,(rand()-.5)*.5);
      const h=.22+rand()*.65;dummy.scale.set(.8+rand(),h,1);dummy.updateMatrix();mesh.setMatrixAt(i*5+j,dummy.matrix);
    }
  }
  mesh.instanceMatrix.needsUpdate=true;return mesh;
}

export class Silk {
  mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private points = 74;
  constructor(material: THREE.Material) {
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array((this.points+1)*2*3),3));
    const ids:number[]=[];
    for(let i=0;i<this.points;i++){let k=i*2;ids.push(k,k+2,k+1,k+1,k+2,k+3);}
    this.geometry.setIndex(ids);
    this.mesh=new THREE.Mesh(this.geometry,material);this.mesh.frustumCulled=false;
  }
  update(fn: (t:number)=>THREE.Vector3, width: number) {
    const p=this.geometry.attributes.position;
    const up=new THREE.Vector3(0,1,0);
    for(let i=0;i<=this.points;i++){
      const t=i/this.points,at=fn(t),ahead=fn(Math.min(1,t+.005)),behind=fn(Math.max(0,t-.005));
      const side=ahead.sub(behind).cross(up).normalize();
      const w=width*Math.pow(Math.sin(Math.PI*t),.5);
      p.setXYZ(i*2,at.x+side.x*w,at.y+side.y*w+.015,at.z+side.z*w);
      p.setXYZ(i*2+1,at.x-side.x*w,at.y-side.y*w-.015,at.z-side.z*w);
    }
    p.needsUpdate=true;this.geometry.computeVertexNormals();
  }
}

export interface SpiritMotion {
  chapter:ChapterId;
  stride:number;
  reply:number;
  gaze:number;
  dance:number;
}

/** Continuous overlapping robe and sleeves; closed hands open only to answer. */
export class RiverSpirit {
  root=new THREE.Group();
  private robe:THREE.BufferGeometry;
  private head=new THREE.Group();
  private neck:THREE.Mesh;
  private collar=new THREE.Group();
  private collarRest:{geometry:THREE.BufferGeometry;positions:Float32Array}[]=[];
  private collarPoise=-1;
  private ribbons:Silk[]=[];
  private sleeves:{geometry:THREE.BufferGeometry;cuff:THREE.BufferGeometry;hand:THREE.Mesh;side:number}[]=[];
  private cols=48;
  private rows=40;
  private silhouette=new THREE.CatmullRomCurve3([
    new THREE.Vector3(.69,0,.32),new THREE.Vector3(.62,.45,.30),new THREE.Vector3(.49,1.1,.26),
    new THREE.Vector3(.37,1.9,.225),new THREE.Vector3(.24,2.5,.18),new THREE.Vector3(.30,2.85,.22),
    new THREE.Vector3(.365,3.25,.25),new THREE.Vector3(.34,3.48,.20),new THREE.Vector3(.125,3.69,.10),
  ],false,'centripetal');
  constructor(trim:THREE.Material) {
    const cloth=new THREE.MeshStandardMaterial({color:'#708c7b',roughness:1,side:THREE.DoubleSide,vertexColors:true});
    const sleeveCloth=new THREE.MeshStandardMaterial({color:'#829786',roughness:1,side:THREE.DoubleSide});
    const under=new THREE.MeshStandardMaterial({color:'#785b54',roughness:1,side:THREE.DoubleSide});
    const skin=new THREE.MeshStandardMaterial({color:'#c6b99e',roughness:1});
    const hair=new THREE.MeshStandardMaterial({color:'#162b2c',roughness:1});
    const ink=new THREE.LineBasicMaterial({color:'#4d6458',transparent:true,opacity:.65});
    const p:number[]=[],colors:number[]=[],ids:number[]=[];
    for(let row=0;row<=this.rows;row++)for(let col=0;col<=this.cols;col++){
      p.push(0,0,0);
      const t=row/this.rows,a=col/this.cols*Math.PI*2;
      const tone=.88+.12*Math.cos(a*8);
      const color=new THREE.Color(t<.55&&Math.sin(a)>.90?'#b3a18f':'#e3e4d2').multiplyScalar(tone);
      colors.push(color.r,color.g,color.b);
      if(row<this.rows&&col<this.cols){const k=row*(this.cols+1)+col;ids.push(k,k+this.cols+1,k+1,k+1,k+this.cols+1,k+this.cols+2);}
    }
    this.robe=new THREE.BufferGeometry();this.robe.setAttribute('position',new THREE.Float32BufferAttribute(p,3));this.robe.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));this.robe.setIndex(ids);
    const gown=new THREE.Mesh(this.robe,cloth);gown.frustumCulled=false;this.root.add(gown);
    this.neck=new THREE.Mesh(new THREE.CylinderGeometry(.085,.12,.28,12),skin);this.neck.position.y=3.76;this.root.add(this.neck);
    const face=new THREE.Mesh(new THREE.SphereGeometry(.255,24,18),skin);face.scale.set(.70,1.15,.78);this.head.add(face);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.258,24,16,0,Math.PI*2,0,Math.PI*.50),hair);cap.position.y=.06;cap.scale.set(.77,1.1,.86);this.head.add(cap);
    const back=new THREE.Mesh(new THREE.SphereGeometry(.24,20,14),hair);back.position.set(0,.04,-.12);back.scale.set(.77,1.18,.63);this.head.add(back);
    for(const s of [-1,1]){
      this.head.add(curve([[s*.09,.24,-.10],[s*.20,.49,-.13],[s*.14,.65,-.08],[s*.04,.48,-.02]],.052,hair));
      this.head.add(curve([[s*.13,.025,.18],[s*.095,.016,.198],[s*.06,.02,.20]],.006,hair));
      this.head.add(curve([[s*.14,.09,.16],[s*.10,.105,.185],[s*.06,.09,.19]],.007,hair));
    }
    const nose=new THREE.Mesh(new THREE.SphereGeometry(.028,10,8),skin);nose.scale.set(.45,1.2,1);nose.position.set(0,-.02,.195);this.head.add(nose);
    const lip=new THREE.Mesh(new THREE.SphereGeometry(.023,10,8),new THREE.MeshStandardMaterial({color:'#80564e',roughness:1}));lip.scale.set(1,.20,.25);lip.position.set(0,-.10,.185);this.head.add(lip);
    this.head.position.set(0,4.01,0);this.root.add(this.head);
    this.collar.add(curve([[-.27,3.51,.18],[-.08,3.12,.25],[.19,2.78,.22]],.033,under));
    this.collar.add(curve([[.28,3.51,.17],[.13,3.28,.26],[-.12,3.02,.25]],.025,under));
    this.collar.add(curve([[-.24,2.52,.15],[.04,2.48,.21],[.26,2.52,.14]],.025,under));
    this.root.add(this.collar);
    this.collar.traverse(o=>{if(o instanceof THREE.Mesh)this.collarRest.push({geometry:o.geometry,positions:new Float32Array(o.geometry.attributes.position.array)});});
    for(const side of [-1,1]){
      const geometry=new THREE.BufferGeometry(),indices:number[]=[];
      geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(25*33*3),3));
      for(let row=0;row<24;row++)for(let col=0;col<32;col++){const k=row*33+col;indices.push(k,k+33,k+1,k+1,k+33,k+34);}
      geometry.setIndex(indices);
      const sleeve=new THREE.Mesh(geometry,sleeveCloth);sleeve.name=side===-1?'spirit-sleeve-left':'spirit-sleeve-right';sleeve.frustumCulled=false;this.root.add(sleeve);
      const cuff=new THREE.BufferGeometry();cuff.setAttribute('position',new THREE.BufferAttribute(new Float32Array(32*3),3));this.root.add(new THREE.LineLoop(cuff,ink));
      const hand=new THREE.Mesh(new THREE.SphereGeometry(.073,12,8),skin);hand.scale.set(.75,1.18,.65);this.root.add(hand);
      this.sleeves.push({geometry,cuff,hand,side});
    }
    for(let i=0;i<2;i++){const ribbon=new Silk(i===0?sleeveCloth:under);this.ribbons.push(ribbon);this.root.add(ribbon.mesh);}
    this.head.add(curve([[-.21,.20,-.07],[.02,.25,-.02],[.22,.19,-.06]],.009,trim));
    this.update(0,{chapter:'apparition',stride:0,reply:0,gaze:0,dance:0});
    this.root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
  }
  update(time:number,motion:SpiritMotion) {
    const {chapter,stride,reply,gaze,dance}=motion;
    const step=chapter==='dance'?dance:0,parting=chapter==='farewell'?1:0;
    const lean=step*Math.sin(time*.5)*.10+reply*.10-parting*.08;
    const poise=chapter==='apparition'?.12:0;
    const offsetAt=(h:number)=>{
      const t=THREE.MathUtils.clamp(h/3.69,0,1);
      return poise*Math.sin(Math.PI*t)*Math.sin(Math.PI*(t-.35));
    };
    const positions=this.robe.attributes.position,profile=new THREE.Vector3();
    for(let row=0;row<=this.rows;row++){
      this.silhouette.getPoint(row/this.rows,profile);
      const h=profile.y,t=h/3.69,cx=lean*t*t+.055*Math.sin(t*Math.PI)+offsetAt(h),rx=profile.x,rz=profile.z;
      for(let col=0;col<=this.cols;col++){
        const a=col/this.cols*Math.PI*2,fold=1+.045*Math.sin(a*10+t*3);
        const train=Math.pow(1-t,3)*(.13+.08*stride)*(1-Math.sin(a))*.5;
        const sway=Math.pow(1-t,2)*Math.sin(time*.38+t*2)*(.035+step*.10);
        positions.setXYZ(row*(this.cols+1)+col,cx+Math.cos(a)*rx*fold+sway,h+.018*Math.cos(a*4)*(1-t),Math.sin(a)*rz*fold-train);
      }
    }
    positions.needsUpdate=true;this.robe.computeVertexNormals();
    if(poise!==this.collarPoise){
      this.collarPoise=poise;
      for(const seam of this.collarRest){
        const p=seam.geometry.attributes.position,rest=seam.positions;
        for(let i=0;i<p.count;i++)p.setXYZ(i,rest[i*3]+offsetAt(rest[i*3+1]),rest[i*3+1],rest[i*3+2]);
        p.needsUpdate=true;seam.geometry.computeVertexNormals();
      }
    }
    this.neck.position.x=lean;this.neck.rotation.z=-lean*.35+poise*.20;
    this.head.position.x=lean;this.head.rotation.y=-.28-reply*.28-gaze*1.25+step*.12*Math.sin(time*.4);
    this.head.rotation.z=-.04-parting*.08-reply*.035-poise*.20;this.collar.position.x=lean*.60;
    for(const sleeve of this.sleeves){
      const s=sleeve.side,start=new THREE.Vector3(s*.31+lean+offsetAt(3.38),3.38,0);
      const elbow=new THREE.Vector3(s*.46+lean+offsetAt(3.0),3.0+poise*s*.25,.10);
      const hand=new THREE.Vector3(s*.20+lean+offsetAt(2.76),2.76+poise*s*.70,.42);
      if(s===-1){elbow.lerp(new THREE.Vector3(-.68+lean,3.25,.20),reply);hand.lerp(new THREE.Vector3(-1.22+lean,3.56,.35),reply);}
      if(step){elbow.lerp(new THREE.Vector3(s*.60+lean,3.25+s*.10,.10),step);hand.lerp(new THREE.Vector3(s*.99+lean,3.35+s*.20,.22),step);}
      if(parting&&s===-1){elbow.set(-.42+lean,3.17,.17);hand.set(-.13+lean,3.46,.42);}
      const path=new THREE.QuadraticBezierCurve3(start,elbow,hand),point=new THREE.Vector3(),tangent=new THREE.Vector3(),up=new THREE.Vector3(),previousUp=new THREE.Vector3(),depth=new THREE.Vector3(),axis=new THREE.Vector3(0,0,1);
      const p=sleeve.geometry.attributes.position,cuff=sleeve.cuff.attributes.position;
      for(let row=0;row<=24;row++){
        const t=row/24;path.getPoint(t,point);path.getTangent(t,tangent);up.copy(tangent).cross(axis).normalize();
        if(row===0?up.y<0:up.dot(previousUp)<0)up.negate();
        previousUp.copy(up);depth.copy(tangent).cross(up).normalize();
        for(let j=0;j<=32;j++){
          const a=j/32*Math.PI*2,sine=Math.sin(a);
          const drop=sine*(.12+.06*Math.sin(Math.PI*t));
          const dz=Math.cos(a)*(.10+.09*Math.sin(Math.PI*t))*(1+.035*Math.sin(a*6));
          const drape=Math.max(0,-(up.y*drop+depth.y*dz))*.9*Math.sin(Math.PI*t);
          const x=point.x+up.x*drop+depth.x*dz,y=point.y+up.y*drop+depth.y*dz-drape,z=point.z+up.z*drop+depth.z*dz;
          p.setXYZ(row*33+j,x,y,z);if(row===24&&j<32)cuff.setXYZ(j,x,y,z);
        }
      }
      p.needsUpdate=true;cuff.needsUpdate=true;sleeve.geometry.computeVertexNormals();
      sleeve.hand.position.copy(hand).addScaledVector(path.getTangent(1,tangent),.075);sleeve.hand.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tangent);
    }
    this.ribbons.forEach((silk,i)=>silk.update(t=>{
      const s=i===0?-1:1,wind=(.12+step*.35+stride*.10)*Math.sin(t*4+time*.35+i);
      return new THREE.Vector3(s*(.28+t*.38)+lean*(1-t)+wind*t,3.27-t*2.83+Math.sin(t*Math.PI)*(.25+step*.5),-.12-t*(.48+step*.8)+Math.sin(t*3+i)*.10);
    },i===0?.075:.095));
  }
}
export function chariot(gold:THREE.Material, dark:THREE.Material) {
  const group=new THREE.Group();
  const body=new THREE.Mesh(new THREE.TorusGeometry(1.7,.14,10,60),gold);body.rotation.x=Math.PI/2;group.add(body);
  for(let i=0;i<6;i++){
    const x=(i-2.5)*.78;
    const points:number[][]=[];
    for(let j=0;j<=24;j++){
      const t=j/24;
      points.push([x+Math.sin(t*8+i*.2)*.35,Math.sin(t*5+i*.12)*.7+t*1.6,1-t*8]);
    }
    group.add(curve(points,.065,gold));
    const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.24,1),dark);head.position.copy(new THREE.Vector3(...points.at(-1)! as [number,number,number]));head.scale.set(.7,.8,1.5);group.add(head);
    group.add(curve([[head.position.x-.10,head.position.y+.1,head.position.z],[head.position.x-.24,head.position.y+.65,head.position.z+.2]],.023,gold));
    group.add(curve([[head.position.x+.10,head.position.y+.1,head.position.z],[head.position.x+.24,head.position.y+.65,head.position.z+.2]],.023,gold));
  }
  return group;
}
