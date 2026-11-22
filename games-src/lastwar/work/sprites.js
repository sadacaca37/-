// ===== 그림 캐릭터: 제미나이가 그린 아군·몬스터·보스 그림을 3D 다리 위에 세워서 움직인다 =====
// 그림 묶음(SPRITE_ATLAS)은 sprite-atlas.js에 들어 있다. 그림 원본은 work/art/ 폴더.
// 그림은 늘 카메라를 바라보고(빌보드), 발끝이 땅에 붙는다.
// 입체감: 햇빛 방향으로 그림 모양 그대로 땅에 긴 그림자를 드리우고, 발밑을 살짝 어둡게 한다.
// 쓰러질 때는 종이처럼 넘어지지 않고, 뒤로 밀려난 뒤 가장자리부터 불씨처럼 타들어 가며 사라진다(+3D 파편).
const dummy=new THREE.Object3D();
const SPRITE_TEX=new THREE.TextureLoader().load(SPRITE_ATLAS.image);SPRITE_TEX.colorSpace=THREE.SRGBColorSpace;SPRITE_TEX.anisotropy=4;
const SPRITE_UV={};for(let[name,[x,y,w,h]]of Object.entries(SPRITE_ATLAS.frames))SPRITE_UV[name]={u:x/SPRITE_ATLAS.width,v:1-(y+h)/SPRITE_ATLAS.height,du:w/SPRITE_ATLAS.width,dv:h/SPRITE_ATLAS.height,aspect:w/h};
const SPRITE_NOISE=`float sprHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float sprNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(sprHash(i),sprHash(i+vec2(1.,0.)),f.x),mix(sprHash(i+vec2(0.,1.)),sprHash(i+vec2(1.,1.)),f.x),f.y);}
 float sprDissolve(vec2 p){return sprNoise(p*7.)*.65+sprNoise(p*19.)*.35;}`;
const spriteMaterial=new THREE.ShaderMaterial({fog:true,side:THREE.DoubleSide,
 uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{map:{value:null},uLight:{value:new THREE.Color(1,1,1)}}]),
 vertexShader:`attribute vec3 aPos;attribute vec2 aSize;attribute float aRoll;attribute vec4 aUV;attribute vec4 aTint;attribute vec4 aFx;
 varying vec2 vUv;varying vec2 vLocal;varying vec4 vTint;varying vec4 vFx;
 #include <fog_pars_vertex>
 void main(){vUv=aUV.xy+uv*aUV.zw;vLocal=uv;vTint=aTint;vFx=aFx;
  vec4 mvPosition=modelViewMatrix*vec4(aPos,1.0);vec2 p=vec2((uv.x-.5)*aSize.x,uv.y*aSize.y);float c=cos(aRoll),s=sin(aRoll);
  mvPosition.xy+=vec2(c*p.x-s*p.y,s*p.x+c*p.y);gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
 }`,
 fragmentShader:`uniform sampler2D map;uniform vec3 uLight;varying vec2 vUv;varying vec2 vLocal;varying vec4 vTint;varying vec4 vFx;
 #include <fog_pars_fragment>
 ${SPRITE_NOISE}
 void main(){vec4 t=texture2D(map,vUv);if(t.a<.42)discard;
  vec3 col=mix(t.rgb*uLight,vTint.rgb,vTint.a);
  if(vFx.x>0.){float n=sprDissolve(vLocal);if(n<vFx.x*1.08)discard;if(n<vFx.x*1.08+.08)col=vFx.yzw*1.7;}
  col*=mix(.7,1.,smoothstep(0.,.2,vLocal.y));
  gl_FragColor=vec4(col,1.0);
  #include <fog_fragment>
  #include <colorspace_fragment>
 }`});
spriteMaterial.uniforms.map.value=SPRITE_TEX;
// 햇빛(sun.position -18,32,10 → 목표 0,0,-12) 방향으로 그림 모양 그대로 땅에 눕힌 그림자
const SUN_DIR=new THREE.Vector2(18,-22).normalize(),SUN_LEN=.89;
const spriteShadowMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,
 uniforms:{map:{value:null},uSun:{value:SUN_DIR},uLen:{value:SUN_LEN},uOpacity:{value:.3}},
 vertexShader:`attribute vec3 aPos;attribute vec2 aSize;attribute vec4 aUV;attribute vec4 aFx;uniform vec2 uSun;uniform float uLen;varying vec2 vUv;varying vec2 vLocal;varying float vDis;
 void main(){vUv=aUV.xy+uv*aUV.zw;vLocal=uv;vDis=aFx.x;vec2 d=uSun*uLen;float reach=max(aPos.y,0.)+uv.y*aSize.y;
  vec3 p=vec3(aPos.x+(uv.x-.5)*aSize.x+d.x*reach,.05,aPos.z+d.y*reach);gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
 fragmentShader:`uniform sampler2D map;uniform float uOpacity;varying vec2 vUv;varying vec2 vLocal;varying float vDis;
 ${SPRITE_NOISE}
 void main(){if(texture2D(map,vUv).a<.42)discard;if(vDis>0.&&sprDissolve(vLocal)<vDis*1.08)discard;gl_FragColor=vec4(0.,0.,0.,uOpacity*(1.-vLocal.y*.55));}`});
spriteShadowMaterial.uniforms.map.value=SPRITE_TEX;
const STAGE_LIGHT={ocean:[1,1,1],desert:[1.04,.98,.9],snow:[.96,1,1.06],city:[.92,.94,.98],lava:[1.06,.88,.82]};
function spriteBatch(max){let plane=new THREE.PlaneGeometry(1,1),g=new THREE.InstancedBufferGeometry();g.index=plane.index;g.setAttribute('position',plane.getAttribute('position'));g.setAttribute('uv',plane.getAttribute('uv'));
 const A=(name,size)=>{let a=new THREE.InstancedBufferAttribute(new Float32Array(max*size),size);a.setUsage(THREE.DynamicDrawUsage);g.setAttribute(name,a);return a};
 let b={max,n:0,g,attrs:[A('aPos',3),A('aSize',2),A('aRoll',1),A('aUV',4),A('aTint',4),A('aFx',4)]};[b.aPos,b.aSize,b.aRoll,b.aUV,b.aTint,b.aFx]=b.attrs;g.instanceCount=0;
 b.mesh=new THREE.Mesh(g,spriteMaterial);b.mesh.frustumCulled=false;scene.add(b.mesh);
 b.shade=new THREE.Mesh(g,spriteShadowMaterial);b.shade.frustumCulled=false;b.shade.renderOrder=-1;scene.add(b.shade);return b}
// 그림 하나 그릴 때 쓰는 값: 위치(x,y,z), 키(h), 가로·세로 늘림(sx,sy), 기울기(roll), 덧칠 색(tr,tg,tb,ta), 좌우 뒤집기(flip),
// 타들어 가기(dissolve 0~1)와 불씨 색(er,eg,eb)
function spriteParams(){return{x:0,y:0,z:0,h:1,sx:1,sy:1,roll:0,tr:1,tg:1,tb:1,ta:0,flip:false,dissolve:0,er:1,eg:.6,eb:.2}}
function spriteReset(o){o.y=0;o.sx=1;o.sy=1;o.roll=0;o.tr=o.tg=o.tb=1;o.ta=0;o.flip=false;o.dissolve=0;o.er=1;o.eg=.6;o.eb=.2;return o}
function spriteBegin(b){b.n=0;spriteMaterial.uniforms.uLight.value.setRGB(...(STAGE_LIGHT[battle.config?.theme]||STAGE_LIGHT.ocean))}
function spritePush(b,name,o){if(b.n>=b.max)return;let f=SPRITE_UV[name];if(!f)return;let i=b.n++,w=o.h*f.aspect*o.sx*(o.flip?-1:1);
 b.aPos.array[i*3]=o.x;b.aPos.array[i*3+1]=o.y;b.aPos.array[i*3+2]=o.z;b.aSize.array[i*2]=w;b.aSize.array[i*2+1]=o.h*o.sy;b.aRoll.array[i]=o.roll;
 b.aUV.array[i*4]=f.u;b.aUV.array[i*4+1]=f.v;b.aUV.array[i*4+2]=f.du;b.aUV.array[i*4+3]=f.dv;b.aTint.array[i*4]=o.tr;b.aTint.array[i*4+1]=o.tg;b.aTint.array[i*4+2]=o.tb;b.aTint.array[i*4+3]=o.ta;
 b.aFx.array[i*4]=o.dissolve;b.aFx.array[i*4+1]=o.er;b.aFx.array[i*4+2]=o.eg;b.aFx.array[i*4+3]=o.eb}
function spriteEnd(b){b.g.instanceCount=b.n;b.mesh.visible=b.shade.visible=b.n>0;for(let a of b.attrs){a.clearUpdateRanges();a.addUpdateRange(0,Math.max(1,b.n)*a.itemSize);a.needsUpdate=true}}
// ---- 아군 4종(뒷모습)과 스테이지별 몬스터(정면) ----
const ALLY_SPRITES=['ally_rifle','ally_heavy','ally_sniper','ally_engineer'],ALLY_SLOTS=[0,1,2,0,3,2,1];
const STAGE_FOES=[['soldier'],['zombie'],['fantasy'],['robot'],['soldier','zombie','fantasy','robot']];
const SPRITE_HEIGHT={ally_rifle:1.5,ally_heavy:1.55,ally_sniper:1.55,ally_engineer:1.42,soldier_normal:1.55,soldier_runner:1.4,soldier_armored:2,zombie_normal:1.6,zombie_runner:1.05,zombie_armored:1.95,fantasy_normal:1.6,fantasy_runner:.95,fantasy_armored:2,robot_normal:1.45,robot_runner:1.15,robot_armored:1.95};
const THEME_FX={soldier:{edge:[1,.35,.12],debris:'#34363d',spark:'#ff5a2a'},zombie:{edge:[.5,1,.25],debris:'#4f6b3a',spark:'#8dff5a'},fantasy:{edge:[1,.62,.2],debris:'#d9cfb8',spark:'#ffae3a'},robot:{edge:[.35,.9,1],debris:'#5a6068',spark:'#6fe8ff'}};
function foeTheme(a){let list=STAGE_FOES[battle.stageIndex]||STAGE_FOES[0];return list[Math.floor(Math.abs(a.phase??0)*10)%list.length]}
function foeSprite(a){return foeTheme(a)+'_'+(a.kind==='runner'?'runner':a.kind==='armored'?'armored':'normal')}
let squadCheerAt=-10,squadHurtAt=-10;const SP=spriteParams();
function characterEvent(e){if(['upgrade','bossdown','stageclear','won'].includes(e.type))squadCheerAt=clock;if(e.type==='damage')squadHurtAt=clock;
 if(e.type==='hit'){let th=THEME_FX[foeTheme({phase:e.value})];burst(e,e.kind==='armored'?10:6,th.debris);burst(e,4,th.spark)}}
function allyPose(a,time,o){let ph=a.phase??0,p=time*11+ph,s=Math.sin(p),lean=THREE.MathUtils.clamp(battle.velocity*.012,-.12,.12);spriteReset(o);
 o.x=a.x;o.z=a.z;o.y=Math.abs(s)*.06;o.roll=s*.035-lean;o.sx=1+.025*Math.cos(2*p);o.sy=1-.025*Math.cos(2*p);
 if(battle.mode==='playing'){let r=Math.max(0,1-((battle.time+ph*.013)%(.24-battle.level*.018))/.09);o.sy*=1-.05*r;o.sx*=1+.035*r}
 let celebrating=battle.mode==='won'||battle.mode==='stage_clear',c=celebrating?((clock+(ph%1)*.4)%1.1)/.75:(clock-squadCheerAt-(ph%1)*.12)/.75;
 if(c>0&&c<1){let k=Math.sin(c*Math.PI);o.y+=k*.55;o.sy*=1+.08*k;o.sx*=1-.05*k}
 let h=(clock-squadHurtAt)/.3;if(h>=0&&h<1){o.tr=1;o.tg=.25;o.tb=.2;o.ta=(1-h)*.55;o.roll+=Math.sin(h*40)*.06*(1-h)}
 if(a.joined!==undefined&&a.joined>=0&&a.joined<.7){o.tr=.55;o.tg=.95;o.tb=1;o.ta=Math.max(o.ta,(1-a.joined/.7)*.6)}
 return o}
function foePose(a,time,o){let kind=a.kind||'normal',ph=a.phase??0,p=time*(kind==='runner'?15:kind==='armored'?7:10)+ph,s=Math.sin(p),c=Math.cos(2*p);spriteReset(o);
 o.x=a.x;o.z=a.z;o.y=Math.abs(s)*(kind==='runner'?.14:kind==='armored'?.04:.07);o.roll=s*(kind==='armored'?.025:kind==='runner'?.06:.045);o.sx=1+.045*c;o.sy=1-.045*c;o.flip=Math.floor(Math.abs(ph)*3)%2===1;
 let hit=battle.time-(a.hitAt??-10);if(hit>=0&&hit<.12){let k=1-hit/.12;o.ta=.85*k;o.sx*=1+.12*k;o.sy*=1-.1*k;o.z-=.08*k}
 if(a.death!==undefined){let age=a.death,th=THEME_FX[foeTheme(a)],kb=Math.min(1,age/.18);
  o.z-=kb*.35;o.y=Math.sin(Math.min(1,age/.3)*Math.PI)*.22;o.roll*=.3;o.sx*=1+.06*kb;o.sy*=1-.06*kb;
  if(age<.08){o.tr=o.tg=o.tb=1;o.ta=.9}else{o.tr=o.tg=o.tb=.06;o.ta=.3}
  o.dissolve=Math.min(1,Math.max(0,(age-.06)/.5));o.er=th.edge[0];o.eg=th.edge[1];o.eb=th.edge[2]}
 return o}
const allies=spriteBatch(40),foes=spriteBatch(400);allies.isAlly=true;
function renderBatch(batch,actors,blue,time){spriteBegin(batch);let total=Math.min(actors.length,batch.max);
 for(let i=0;i<total;i++){let a=actors[i];if(blue){let name=ALLY_SPRITES[ALLY_SLOTS[(a.variant??0)%7]];allyPose(a,time,SP);SP.h=SPRITE_HEIGHT[name];spritePush(batch,name,SP)}
  else{let name=foeSprite(a);foePose(a,time,SP);SP.h=SPRITE_HEIGHT[name]||1.5;spritePush(batch,name,SP)}}
 spriteEnd(batch)}
