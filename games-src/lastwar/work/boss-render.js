const bossViews=new Map();scene.remove(bossGroup);
const bossWarnings=Array.from({length:4},()=>{let m=mesh('box',new THREE.MeshBasicMaterial({color:'#ff614c',transparent:true,opacity:.25,depthWrite:false}),[0,.082,0],[2.8,.009,1]);m.castShadow=false;m.visible=false;return m});
function makeBossRig(kind){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);scene.add(root);
 const palette={brute:['#ad3436','#e6b267'],charger:['#da6b28','#ffdf97'],summoner:['#674291','#cba3ff'],gunner:['#31576e','#85e8ff'],reaper:['#315749','#9affbb'],titan:['#483647','#ff8b31']};
 const [armor,accent]=palette[kind],dark='#252b36';
 const joint=(parent,x,y,z)=>{let g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g};
 mesh('sphere',armor,[0,1.04,0],[.44,.45,.28],body);mesh('box',dark,[0,.65,0],[.62,.2,.4],body);
 mesh('box',accent,[0,1.12,.26],[.23,.18,.07],body);mesh('sphere',dark,[0,1.15,-.24],[.32,.32,.15],body);
 const head=joint(body,0,1.52,0);mesh('sphere',armor,[0,0,0],[.25,.26,.23],head);
 mesh('box',dark,[0,0,.2],[.35,.12,.08],head);mesh('box',accent,[0,.02,.25],[.27,.035,.035],head);
 const arms=[],elbows=[],legs=[];
 for(let side of[-1,1]){
  let arm=joint(body,side*.46,1.27,0),elbow=joint(arm,0,-.32,0);arms.push(arm);elbows.push(elbow);
  mesh('sphere',armor,[0,0,0],[.23,.23,.24],arm);mesh('cyl',dark,[0,-.19,0],[.12,.32,.12],arm);
  mesh('sphere',armor,[0,-.18,.02],[.17,.26,.19],elbow);mesh('box',accent,[0,-.38,.05],[.23,.16,.24],elbow);
  let leg=joint(root,side*.2,.64,0);legs.push(leg);mesh('cyl',dark,[0,-.19,0],[.13,.36,.13],leg);mesh('box',armor,[0,-.35,.035],[.26,.24,.26],leg);mesh('box',dark,[0,-.51,.12],[.28,.17,.4],leg);
  if(kind==='charger'||kind==='brute'){let horn=mesh('cyl',accent,[side*.19,.24,0],[.055,.38,.055],head);horn.rotation.z=-side*.55;}
  if(kind==='gunner'){mesh('box',armor,[0,-.27,.17],[.32,.3,.4],elbow);for(let j=0;j<3;j++){let barrel=mesh('cyl',dark,[(j-1)*.085,-.28,.48],[.045,.48,.045],elbow);barrel.rotation.x=Math.PI/2;}}
  if(kind==='reaper'){let blade=mesh('box',accent,[0,-.52,.3],[.065,.65,.4],elbow);blade.rotation.x=-.6;mesh('box',dark,[0,-.36,.07],[.35,.06,.1],elbow);}
  if(kind==='titan'){mesh('sphere',armor,[side*.03,.13,0],[.29,.28,.3],arm);for(let j=0;j<2;j++)mesh('box',accent,[side*.07,j*.12-.1,.245],[.06,.08,.025],arm);}
 }
 let ornament=joint(body,0,1.6,-.15);
 if(kind==='summoner'){mesh('torus',accent,[0,.05,0],[.47,.47,.1],ornament);for(let side of[-1,1])mesh('sphere',accent,[side*.62,-.22,.1],[.13,.13,.13],ornament);}
 if(kind==='titan')for(let side of[-1,1]){let vent=mesh('cyl',dark,[side*.28,1.53,-.25],[.14,.6,.14],body);vent.rotation.z=-side*.2;mesh('sphere',accent,[side*.32,1.83,-.25],[.1,.15,.1],body);}
 if(kind==='reaper')mesh('hemi',dark,[0,.09,-.02],[.3,.28,.3],head);
 let name=spriteLabel(BOSS_NAMES[kind],3,.55);name.ctx.fillStyle='#202634';name.ctx.fillRect(0,0,256,128);name.ctx.font='900 35px Arial';name.ctx.fillStyle='#ffffff';name.ctx.fillText(BOSS_NAMES[kind],128,70);name.tex.needsUpdate=true;
 return{mesh:root,body,head,arms,elbows,legs,ornament,label:spriteLabel('',2,.7),name};
}
function removeBossView(v){scene.remove(v.mesh,v.label.sp,v.name.sp);for(let label of[v.label,v.name]){label.tex.dispose();label.sp.material.dispose()}}
function clearBossViews(){for(let v of bossViews.values())removeBossView(v);bossViews.clear();bossWarnings.forEach(m=>m.visible=false)}
function renderBosses(animation){
 for(let b of battle.bosses){if(b.hp<=0)continue;let v=bossViews.get(b.id);if(!v){v=makeBossRig(b.kind);bossViews.set(b.id,v)}
  let walking=b.z<-9-(b.index%2)*3-.01,phase=animation*(walking?9:3)+b.index*2,windup=b.attack<1.4&&b.z>-23?(1.4-b.attack)/1.4:0;
  let strike=Math.max(0,1-(battle.time-b.slamAt)/.5),float=b.kind==='summoner';
  v.mesh.position.set(b.x,float?.2+Math.sin(animation*3)*.15:Math.abs(Math.sin(phase))*(walking?.12:.025),b.z);
  v.mesh.scale.setScalar(b.scale);v.mesh.rotation.y=Math.sin(animation*1.3+b.index)*.13;
  v.body.rotation.set(-windup*.4+strike*.48,b.kind==='reaper'?Math.sin(animation*2)*.22+strike*.65:Math.sin(phase)*.055,Math.sin(phase)*.04);v.head.rotation.y=Math.sin(animation*1.8+b.index)*.22;
  v.arms.forEach((a,i)=>{let sign=i?1:-1;a.rotation.x=(walking?Math.sin(phase+i*Math.PI)*.6:.12)-windup*2.1+strike*.9;a.rotation.z=sign*(float?.6+.2*Math.sin(animation*2):b.kind==='reaper'?.35:.12);v.elbows[i].rotation.x=-.25-windup*.65;v.legs[i].rotation.x=walking?Math.sin(phase+i*Math.PI)*.55:Math.sin(phase+i*Math.PI)*.05;});
  v.ornament.rotation.z=animation*.6;v.ornament.rotation.y=Math.sin(animation)*.3;
  v.label.sp.position.set(b.x,b.scale*2.05+.4,b.z);v.name.sp.position.set(b.x,b.scale*2.05+1.05,b.z);setLabel(v.label,String(Math.max(0,Math.ceil(b.hp))));
 }
 for(let[id,v]of bossViews)if(!battle.bosses.some(b=>b.id===id&&b.hp>0)){removeBossView(v);bossViews.delete(id)}
}
function renderBossWarnings(){warningStrip.visible=false;bossWarnings.forEach(m=>m.visible=false);battle.bosses.filter(b=>b.hp>0&&b.attack<1.4&&b.z>-23).slice(0,4).forEach((b,i)=>{let m=bossWarnings[i];m.visible=battle.mode==='playing';m.position.set(b.aim,.082,(b.z+PLAYER_Z)/2);m.scale.set(b.kind==='gunner'||b.kind==='reaper'?6:b.kind==='titan'?4:b.kind==='charger'?3:2.8,.01,PLAYER_Z-b.z);m.material.color.set(b.kind==='summoner'?'#bb79ff':'#ff614c');m.material.opacity=.2+Math.sin(battle.time*21)*.09})}
