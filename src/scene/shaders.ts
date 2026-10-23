import * as THREE from 'three';

export const rockVertex = /* glsl */`
varying vec3 vWorld;
varying vec3 vNormal;
void main() {
  vec4 p = vec4(position, 1.0);
  vec3 n = normal;
  #ifdef USE_INSTANCING
    p = instanceMatrix * p;
    n = mat3(instanceMatrix) * n;
  #endif
  vec4 world = modelMatrix * p;
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * world;
}`;
export const rockFragment = /* glsl */`
uniform vec3 uDark;
uniform vec3 uJade;
uniform vec3 uGold;
uniform vec3 uFog;
uniform sampler2D uMineral;
uniform float uTime;
varying vec3 vWorld;
varying vec3 vNormal;
float hash(vec3 p) { return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
float noise(vec3 p) {
  vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
   mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
void main() {
  vec3 normal = normalize(vNormal);
  vec3 weights=pow(abs(normal),vec3(4.));weights/=max(.001,weights.x+weights.y+weights.z);
  vec3 pigment=texture2D(uMineral,vWorld.yz*.24).rgb*weights.x+
    texture2D(uMineral,vWorld.xz*.24).rgb*weights.y+
    texture2D(uMineral,vWorld.xy*.24).rgb*weights.z;
  float stone = dot(pigment,vec3(.3,.6,.1));
  float light = max(0.,dot(normal,normalize(vec3(-.6,1.,.7))));
  vec3 color = mix(uDark,uJade, .10+light*.66+stone*.15);
  color=mix(color,pigment*(.8+light*.65),.10);
  float layer = sin(vWorld.y*.8+noise(vWorld*.09)*2.+vWorld.x*.12);
  float line = 1.-smoothstep(.02,.07+fwidth(layer)*1.2,abs(layer));
  float rim = pow(1.-abs(dot(normal,normalize(cameraPosition-vWorld))),2.5);
  color = mix(color,uGold,line*(.008+light*.018)+rim*.035);
  float ink = smoothstep(.3,.9,noise(vWorld*.075));
  color = mix(color,uDark,ink*(1.-light)*.16);
  color *= .85+stone*.25;
  float fog = 1.-exp(-pow(distance(cameraPosition,vWorld)*.0082,1.4));
  color = mix(color,uFog,fog);
  gl_FragColor = vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export const skyVertex = /* glsl */`
varying vec3 vDir;
void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
`;
export const skyFragment = /* glsl */`
uniform vec3 uLow;
uniform vec3 uHigh;
uniform float uTime;
varying vec3 vDir;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
 vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
void main(){
 vec3 d=normalize(vDir); float h=smoothstep(-.08,.72,d.y);
 vec3 c=mix(uLow,uHigh,h);
 vec2 uv=d.xz/(max(.15,d.y+.25))*1.9;
 float cloud=noise(uv+uTime*.002)*.6+noise(uv*2.4-uTime*.003)*.28+noise(uv*5.)*.12;
 c=mix(c,uLow,smoothstep(.48,.85,cloud)*.35);
 c*=.985+hash(gl_FragCoord.xy)*.03;
 gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const waterShader = {
  name: 'LuoRiver',
  uniforms: {
    color: { value: new THREE.Color('#244743') },
    tDiffuse: { value: null },
    textureMatrix: { value: new THREE.Matrix4() },
    uTime: { value: 0 },
    uGold: { value: new THREE.Color('#c5a874') },
    uFog: { value: new THREE.Color('#748e88') },
    uRipples: { value: Array.from({length:8},()=>new THREE.Vector4(0,0,-100,0)) },
    uLetter: { value: new THREE.Vector3(-1,0,0) },
    uDestination: { value: new THREE.Vector2(2,-9) },
    uMotion: { value: 0 },
    uTiming: { value: new THREE.Vector3(1,1,1) },
    uDance: { value: new THREE.Vector4(0,0,0,0) },
  },
  vertexShader: /* glsl */`
    uniform mat4 textureMatrix;
    varying vec4 vReflect;
    varying vec3 vWorld;
    void main(){
      vReflect=textureMatrix*vec4(position,1.);
      vWorld=(modelMatrix*vec4(position,1.)).xyz;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
    }
  `,
  fragmentShader: /* glsl */`
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec3 uGold;
    uniform vec3 uFog;
    uniform vec4 uRipples[8];
    uniform vec3 uLetter;
    uniform vec2 uDestination;
    uniform float uMotion;
    uniform vec3 uTiming;
    uniform vec4 uDance;
    varying vec4 vReflect;
    varying vec3 vWorld;
    void main(){
      vec2 p=vWorld.xz;
      float t=uTime;
      float wave=sin(p.x*.55+p.y*.38-t*.48)*.45+sin(p.x*1.4-p.y*.7+t*.42)*.2;
      vec2 ripple=vec2(0.);
      float ringLight=0.;
      for(int i=0;i<8;i++){
        float age=t-uRipples[i].z;
        vec2 v=p-uRipples[i].xy;
        float d=length(v);
        float envelope=exp(-abs(d-age*2.8)*2.1)*exp(-age*.4)*step(0.,age);
        ripple+=normalize(v+.0001)*sin(d*8.-age*19.)*envelope*.025*uRipples[i].w;
        ringLight+=envelope*.3*uRipples[i].w;
      }
      float outbound=uLetter.x;
      if(outbound>=0.){
        vec2 from=uLetter.yz;
        float d=distance(p,from);
        float speed=distance(from,uDestination)/uTiming.x;
        float front=exp(-pow((d-min(outbound,uTiming.x)*speed)*.85,2.))*(1.-smoothstep(uTiming.x,uTiming.x+uTiming.y,outbound));
        float answerTime=outbound-uTiming.x-uTiming.y;
        float answer=exp(-pow((distance(p,uDestination)-answerTime*distance(from,uDestination)/uTiming.z)*.85,2.))*step(0.,answerTime);
        ringLight+=front*.22+answer*.33;
        ripple+=vec2(sin(d*6.-t*5.),cos(d*6.-t*5.))*(front+answer)*.014;
      }
      vec4 uv=vReflect;
      uv.xy+=(vec2(sin(p.y*1.8+t*.5),cos(p.x*.9+t*.7))* (.0017+uMotion*.001)+ripple)*uv.w;
      vec3 reflection=texture2DProj(tDiffuse,uv).rgb;
      float fresnel=pow(1.-abs(normalize(cameraPosition-vWorld).y),2.);
      vec3 c=mix(color,reflection,.48+fresnel*.36);
      float lace=sin(p.y*4.+sin(p.x*.35+t*.09)*1.7+t*.35);
      float fine=1.-smoothstep(.025,.085,abs(lace));
      float shimmer=(1.-smoothstep(.025,.10,abs(sin(p.y*8.+wave*3.))))*.025;
      float light = fine*.035+shimmer+ringLight*.6;
      float stepWave=sin(distance(p,uDance.zw)*7.-uDance.x*3.)*exp(-distance(p,uDance.zw)*.55)*uDance.y;
      c=mix(c,uGold,clamp(light+max(0.,stepWave)*.14,0.,.75));
      float fog=1.-exp(-pow(distance(cameraPosition,vWorld)*.006,1.8));
      c=mix(c,uFog,fog);
      gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};
export const mistVertex = /* glsl */`
attribute float aSeed;
varying float vSeed;
uniform float uTime;
uniform float uSize;
void main(){
 vSeed=aSeed;
 vec3 p=position;
 p.x+=sin(uTime*.065+aSeed*41.)*.8;
 p.y+=sin(uTime*.11+aSeed*24.)*.4;
 vec4 mv=modelViewMatrix*vec4(p,1.);
 gl_PointSize=clamp(uSize*(50./max(1.,-mv.z)),1.,100.);
 gl_Position=projectionMatrix*mv;
}`;
export const mistFragment = /* glsl */`
uniform vec3 uColor;
uniform float uOpacity;
varying float vSeed;
void main(){
 float d=length(gl_PointCoord-.5)*2.;
 float alpha=pow(max(0.,1.-d*d),3.)*uOpacity;
 gl_FragColor=vec4(uColor,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const grainShader = {
  uniforms: { tDiffuse: {value:null}, uTime:{value:0}, uGrain:{value:.0085} },
  vertexShader: /* glsl */`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;uniform float uTime;uniform float uGrain;varying vec2 vUv;
    void main(){
      vec3 c=texture2D(tDiffuse,vUv).rgb;
      float g=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
      c*=.92+.08*pow(16.*vUv.x*vUv.y*(1.-vUv.x)*(1.-vUv.y),.15);
      c+=g*uGrain;
      gl_FragColor=vec4(c,1.);
    }`,
};
