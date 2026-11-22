// ===== 보스 6종: 제미나이가 그린 보스 그림 + 등장·공격·피격·격파 움직임 =====
const bossViews=new Map();
const bossWarnings=Array.from({length:4},()=>{let m=mesh('box',new THREE.MeshBasicMaterial({color:'#ff614c',transparent:true,opacity:.25,depthWrite:false}),[0,.082,0],[2.8,.009,1]);m.castShadow=false;m.visible=false;return m});
const BOSS_STYLE={brute:{accent:'#ffcf7a',glow:'#ff6a2a'},charger:{accent:'#ffdf97',glow:'#ffc44a'},summoner:{accent:'#9ff6ff',glow:'#5ef0ff'},gunner:{accent:'#9fe8ff',glow:'#ff4a3a'},reaper:{accent:'#a8ffc4',glow:'#6dffa0'},titan:{accent:'#ffb36b',glow:'#ff6a1a'}};
const BOSS_MOVES={brute:'망치 내려찍기',charger:'뿔 돌진',summoner:'해골 소환',gunner:'3연발 포격',reaper:'쌍낫 회전베기',titan:'불꽃 브레스'};
const FLOATING_BOSSES=['summoner','reaper'];
const BOSS_HEIGHT={brute:4.7,charger:3.7,summoner:4.5,gunner:4.9,reaper:4.7,titan:5.3};
const bossSprites=spriteBatch(8),BP=spriteParams(),BOSS_COLOR={};for(let[k,s]of Object.entries(BOSS_STYLE))BOSS_COLOR[k]=new THREE.Color(s.glow);
function makeBossView(b){let st=BOSS_STYLE[b.kind];
 let ring=new THREE.Mesh(geo.torus,new THREE.MeshBasicMaterial({color:st.glow,transparent:true,opacity:.35,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.renderOrder=-1;scene.add(ring);
 let name=spriteLabel(BOSS_NAMES[b.kind],3,.55),c=name.ctx;c.fillStyle='#160d10';c.fillRect(0,0,256,128);c.strokeStyle=st.glow;c.lineWidth=6;c.strokeRect(4,4,248,120);c.font='900 35px Arial';c.fillStyle=st.accent;c.fillText(BOSS_NAMES[b.kind],128,70);name.tex.needsUpdate=true;
 return{kind:b.kind,ring,name,label:spriteLabel('',2,.7),born:clock}}
function removeBossView(v){scene.remove(v.ring,v.label.sp,v.name.sp);v.ring.material.dispose();for(let label of[v.label,v.name]){label.tex.dispose();label.sp.material.dispose()}}
function clearBossViews(){for(let v of bossViews.values())removeBossView(v);bossViews.clear();bossWarnings.forEach(m=>m.visible=false);spriteBegin(bossSprites);spriteEnd(bossSprites)}
// 보스 한 마리의 자세 계산 → BP
function bossPose(b,v,animation){let k=b.kind,st=BOSS_STYLE[k],floaty=FLOATING_BOSSES.includes(k),o=spriteReset(BP);
 let walking=b.z<-9-(b.index%2)*3-.01,dA=Math.max(0,Math.min(.1,animation-(v.lastAnim??animation)));v.lastAnim=animation;v.walk=(v.walk??b.index*2)+dA*(walking?(k==='charger'?11:k==='titan'?5.5:7.5):2.5);
 let s=Math.sin(v.walk),w=b.attack<1.4&&b.z>-23?(1.4-b.attack)/1.4:0,since=battle.time-b.slamAt,d=since>=0&&since<.6?1-since/.6:0;
 o.x=b.x;o.z=b.z;o.h=BOSS_HEIGHT[k]*b.scale/2.35;
 if(floaty){o.y=.45+Math.sin(animation*2.2+b.index)*.22;o.roll=Math.sin(animation*1.3+b.index)*.05}else{o.y=Math.abs(s)*(walking?.18:.03);o.roll=s*(walking?.045:.015)}
 let breath=Math.sin(animation*2.4+b.index);o.sy*=1+.025*breath;o.sx*=1-.015*breath;o.flip=b.index%2===1;
 if(w>0){let c=BOSS_COLOR[k];o.tr=c.r;o.tg=c.g;o.tb=c.b;o.ta=w*(.22+.18*Math.sin(animation*24))}
 if(k==='brute'){o.sy*=1+.08*w-.1*d;o.sx*=1-.03*w+.08*d;o.roll+=-.05*w+.04*d;o.y-=.3*d;o.x+=Math.sin(since*70)*.07*d}
 if(k==='charger'){let lunge=since>=0&&since<.65?Math.sin(Math.min(1,since/.65)*Math.PI):0;o.sy*=1-.12*w;o.sx*=1+.1*w+.08*lunge;o.x+=Math.sin(animation*40)*.05*w;o.z+=lunge*2.6;o.roll+=Math.sin(since*30)*.06*lunge}
 if(k==='summoner'){o.y+=.7*w;o.sx*=1+.08*w+.15*d;o.sy*=1+.15*d;if(d>0){o.tr=o.tg=o.tb=1;o.ta=Math.max(o.ta,.45*d)}}
 if(k==='gunner'){o.x+=Math.sin(animation*60)*.04*w+Math.sin(since*70)*.08*d;o.z-=.25*d*(.5+.5*Math.sin(since*80))}
 if(k==='reaper'){o.y+=.5*w;o.sy*=1+.1*w;o.sx*=1-.06*w;if(since>=0&&since<.55){let q=1-since/.55;o.roll+=Math.sin(since*46)*.1*q;o.y+=.25*q}}
 if(k==='titan'){o.y+=.5*w+(since>=0&&since<.25?Math.sin(since/.25*Math.PI)*.6:0);o.sy*=1+.08*w-.18*d;o.sx*=1+.15*d}
 let fa=clock-(v.flashAt??-9);if(fa<.08){o.tr=o.tg=o.tb=1;o.ta=Math.max(o.ta,.45*(1-fa/.08))}
 return{o,walking,floaty,w,since}}
function renderBosses(animation){spriteBegin(bossSprites);
 for(let b of battle.bosses){let v=bossViews.get(b.id);
  if(b.hp<=0){if(v&&v.deadAt===undefined){v.deadAt=clock;v.label.sp.visible=false}continue}
  if(!v){v=makeBossView(b);bossViews.set(b.id,v)}
  let {o,walking,floaty,w,since}=bossPose(b,v,animation),e=Math.min(1,(clock-v.born)/.9),st=BOSS_STYLE[b.kind];
  if(e<1){if(floaty){let c=BOSS_COLOR[b.kind];o.dissolve=1-e;o.y-=(1-e)*1.2;o.er=c.r;o.eg=c.g;o.eb=c.b}else o.y+=Math.pow(1-e,2)*14}
  else if(!v.landed){v.landed=true;if(!floaty){shock(b.x,b.z,'#ffe2b0',6);burst({x:b.x,z:b.z},40,'#cdb89a',true);if(!reducedMotion)shake=Math.max(shake,.28);sound('land',b.kind)}}
  // 피격: 계속 맞아도 하얗게 굳지 않도록 0.25초마다 짧게 번쩍이고 맞는 소리
  if(b.hitAt!==v.lastHit){v.lastHit=b.hitAt;let hit=battle.time-b.hitAt;if(hit>=0&&hit<.05&&clock-(v.flashAt??-9)>.25){v.flashAt=clock;sound('bosshit',b.kind)}}
  if(walking&&!floaty&&e>=1){let step=Math.floor(v.walk/Math.PI);if(step!==v.step){if(v.step!==undefined)sound('step',b.kind);v.step=step}}
  spritePush(bossSprites,'boss_'+b.kind,o);
  let rw=o.h*.42*(1+w*.35+(since>=0&&since<.5?(1-since/.5)*.5:0));v.ring.position.set(o.x,.06,o.z);v.ring.scale.set(rw,rw*.55,.04);v.ring.material.opacity=.22+w*.3+Math.sin(animation*4)*.06;
  if(battle.mode==='playing'&&!paused)bossEffects(b,o,since);
  let top=o.h+Math.max(0,o.y);v.label.sp.position.set(b.x,top+.4,o.z);v.name.sp.position.set(b.x,top+1.05,o.z);setLabel(v.label,String(Math.max(0,Math.ceil(b.hp))));
 }
 for(let[id,v]of bossViews){let b=battle.bosses.find(x=>x.id===id);if(!b){removeBossView(v);bossViews.delete(id);continue}
  if(v.deadAt!==undefined){let t=(clock-v.deadAt)/1.6;if(t>=1){let st=BOSS_STYLE[b.kind];burst({x:b.x,z:b.z},70,st.glow);shock(b.x,b.z,st.accent,7);removeBossView(v);bossViews.delete(id)}else bossDeath(v,b,t)}}
 spriteEnd(bossSprites)}
// 공격 중 덧붙는 효과: 거신 총구 불꽃, 드래곤 불꽃, 사신 낫 잔상
function bossEffects(b,o,since){if(since<0||since>.6)return;let s=b.scale,st=BOSS_STYLE[b.kind];
 if(b.kind==='gunner'&&Math.random()<.6)for(let side of[-1,1])fx.push({x:b.x+side*.8*s,y:1.1*s,z:o.z+.6,vx:side*(Math.random()*.8),vy:Math.random()*1.5,vz:6+Math.random()*4,life:.18,color:Math.random()<.5?'#ffe27a':'#ff7a3a'});
 if(b.kind==='titan'&&since<.45)for(let i=0;i<3;i++)fx.push({x:b.x+(Math.random()-.5)*.6,y:1.6*s,z:o.z+.8,vx:(Math.random()-.5)*3,vy:Math.random()*2-1,vz:10+Math.random()*6,life:.45,color:['#ffcf4a','#ff7a1a','#ff3d12'][i]});
 if(b.kind==='reaper'&&since<.5)for(let r=0;r<3;r++){let a=Math.random()*Math.PI*2;fx.push({x:b.x+Math.cos(a)*1.4*s,y:1.2*s,z:o.z+Math.sin(a)*.6,vx:-Math.sin(a)*3,vy:.3,vz:Math.cos(a)*1.5,life:.3,color:st.glow})}}
// 격파: 번쩍이며 쓰러져 땅으로 가라앉거나(걷는 보스), 회오리처럼 줄어들며 사라진다(떠다니는 보스). 도중에 작은 폭발.
function bossDeath(v,b,t){let st=BOSS_STYLE[b.kind],o=spriteReset(BP),f=(Math.sin(t*45)>0?.8:.15)*(1-t);
 let c=BOSS_COLOR[b.kind];o.x=b.x;o.z=b.z;o.h=BOSS_HEIGHT[b.kind]*b.scale/2.35;o.tr=1;o.tg=.95;o.tb=.85;o.ta=f;o.flip=b.index%2===1;o.er=c.r;o.eg=c.g;o.eb=c.b;
 if(FLOATING_BOSSES.includes(b.kind)){o.y=.45+t*2.2;o.dissolve=Math.min(1,t*1.15)}
 else{o.y=-t*t*1.6;o.x+=Math.sin(t*60)*.08*(1-t);o.dissolve=Math.max(0,(t-.15)/.8)}
 spritePush(bossSprites,'boss_'+b.kind,o);v.ring.material.opacity=Math.max(0,.4*(1-t));v.name.sp.material.opacity=Math.max(0,1-t*1.4);
 for(let k of[.2,.5,.8])if(t>=k&&!v['boom'+k]){v['boom'+k]=true;let e={x:b.x+(Math.random()-.5)*2.4,z:b.z+(Math.random()-.5)*1.5};burst(e,26,st.glow);shock(e.x,e.z,st.accent,3);sound('boom',b.kind)}}
function renderBossWarnings(){warningStrip.visible=false;bossWarnings.forEach(m=>m.visible=false);battle.bosses.filter(b=>b.hp>0&&b.attack<1.4&&b.z>-23).slice(0,4).forEach((b,i)=>{let m=bossWarnings[i];m.visible=battle.mode==='playing';m.position.set(b.aim,.082,(b.z+PLAYER_Z)/2);m.scale.set(b.kind==='gunner'||b.kind==='reaper'?6:b.kind==='titan'?4:b.kind==='charger'?3:2.8,.01,PLAYER_Z-b.z);m.material.color.set(b.kind==='summoner'?'#5ef0ff':'#ff614c');m.material.opacity=.2+Math.sin(battle.time*21)*.09})}
// 보스별 공격 효과(소리는 sfx.js)
function bossEventFx(e){let st=BOSS_STYLE[e.kind];if(!st)return;
 if(e.type==='slam'){
  if(e.kind==='brute'){burst(e,30,'#e6b267');shock(e.x,e.z,'#ff8a4a',6)}
  if(e.kind==='charger')for(let i=0;i<6;i++)burst({x:e.x+(Math.random()-.5)*2,z:e.z+i*1.6},6,'#d9b98a',true);
  if(e.kind==='gunner'){burst(e,24,'#ffcf6a');shock(e.x,e.z,'#ff6a3a',3)}
  if(e.kind==='reaper'){shock(e.x,e.z,'#6dffa0',7);burst(e,30,'#9affbb')}
  if(e.kind==='titan'){shock(e.x,e.z,'#ff5a1f',8);burst(e,60,'#ff8b31');if(!reducedMotion)shake=Math.max(shake,.35)}
 }
 if(e.type==='boss'&&FLOATING_BOSSES.includes(e.kind)){shock(e.x,e.z,st.glow,5);burst(e,40,st.glow)}
}
