const STAGES = [
 {name:'해상 교량',subtitle:'OCEAN BRIDGE',theme:'ocean',duration:52,bossTimes:[30,30],troops:16,sky:'#75b9d0',ground:'#258fae',road:'#a6a9a9',accent:'#79dfff'},
 {name:'붉은 사막',subtitle:'RED CANYON',theme:'desert',duration:56,bossTimes:[26,39],troops:22,sky:'#e9bc83',ground:'#cb9457',road:'#b5906a',accent:'#ffc77a'},
 {name:'혹한의 고개',subtitle:'FROZEN PASS',theme:'snow',duration:60,bossTimes:[26,39,39],troops:28,sky:'#b8d9eb',ground:'#dbeaf0',road:'#8faabc',accent:'#ccf6ff'},
 {name:'폐허 도시',subtitle:'FALLEN CITY',theme:'city',duration:64,bossTimes:[24,38,47],troops:34,sky:'#8e9ba7',ground:'#646d77',road:'#545c65',accent:'#b2ccff'},
 {name:'용암 요새',subtitle:'MAGMA FORTRESS',theme:'lava',duration:68,bossTimes:[22,34,44,44],troops:40,sky:'#3a2538',ground:'#e55d21',road:'#514650',accent:'#ffae6b'}
];
const BOSS_ROSTER=[['brute','charger'],['summoner','gunner'],['reaper','brute','summoner'],['titan','gunner','charger'],['reaper','titan','summoner','gunner']];
const BOSS_NAMES={brute:'강철 파괴자',charger:'돌격 야수',summoner:'공허 소환사',gunner:'중화기 거신',reaper:'쌍날 사신',titan:'용암 타이탄'};
const DIFFICULTY=[{name:'쉬움',speed:.48,hp:.25,crowd:.55,boss:.4},{name:'보통',speed:.61,hp:.4,crowd:.68,boss:.55},{name:'도전',speed:.74,hp:.6,crowd:.8,boss:.7},{name:'어려움',speed:.87,hp:.8,crowd:.9,boss:.85},{name:'극한',speed:1,hp:1,crowd:1,boss:1}];
const ENEMY_LIMIT=600;
class CampaignBattle extends Battle {
 reset(index=0,total=0){
  this.stageIndex=Math.max(0,Math.min(4,index));this.config=STAGES[this.stageIndex];this.difficulty=DIFFICULTY[this.stageIndex];super.reset();
  this.n=this.config.troops;this.level=Math.min(5,1+this.stageIndex);this.joined=Array(this.n).fill(-10);this.totalKills=total;
  this.enemies=[];this.blocks=[];this.shots=[];this.hazards=[];this.events=[];this.bosses=[];this.bossSpawned=0;this.bossKills=0;
  this.emptyBoss={x:0,z:-45,hp:0,max:1,active:false,attack:5,aim:0};this.boss=this.emptyBoss;
  this.spawned=0;this.wave=3.8;this.blockTimer=8;this.addWave(Math.ceil((100+this.stageIndex*12)*this.difficulty.crowd),-15);this.addBlock(-1.8,-24,65+this.stageIndex*25);
 }
 threat(){return 1+this.stageIndex+Math.floor(this.time/13)}
 waveSettings(){return{count:Math.ceil(Math.min(125,62+this.stageIndex*10+Math.floor(this.time*.9))*this.difficulty.crowd),interval:Math.max(1.5,4.2-this.stageIndex*.3-this.time*.034)/this.difficulty.crowd,speed:(1.35+this.stageIndex*.19+Math.min(this.time,90)*.018 )*2.8*this.difficulty.speed};}
 addWave(count,z){let tuning=this.waveSettings();count=Math.min(count,ENEMY_LIMIT-this.enemies.length);for(let i=0;i<count;i++){
   let roll=this.random(),kind=roll<.17+this.stageIndex*.02?'runner':roll>.91-this.stageIndex*.015?'armored':'normal';
   let base=-4.65+(i%16)*.62,phase=this.random()*6;
   let ramp=Math.floor(Math.min(this.time,65)/23),wedge=Math.floor(this.time/10)%2?Math.abs(base)*.32:0;
   this.enemies.push({id:this.id++,x:base,home:base,z:z-Math.floor(i/16)*.65-wedge+Math.sin(i*.45)*.35,hp:Math.ceil(Math.ceil(((kind==='armored'?3+Math.floor(this.stageIndex/2):1+Math.floor(this.stageIndex/2))+ramp)*2.5)*2*this.difficulty.hp),speed:tuning.speed*(kind==='runner'?1.55:kind==='armored'?.76:1)+this.random()*.7*this.difficulty.speed,kind,phase,hitAt:-10});
  }this.spawned=(this.spawned||0)+count;
 }
 spawnBoss(index){let kind=BOSS_ROSTER[this.stageIndex][index],hp=Math.ceil((750+this.stageIndex*230+(index%2)*140)*3*this.difficulty.boss);
  let lane=index%2===0?-2.4:2.4;
  let b={id:this.id++,index,kind,x:lane,home:lane,z:-31-(index%2)*5,hp,max:hp,active:true,attack:4.5+(index%2)*1.5,aim:0,scale:kind==='brute'?2.65:2.35,hitAt:-10,slamAt:-10};this.bosses.push(b);this.bossSpawned++;this.emit('boss',b.x,b.z,index+1);
 }
 update(dt){
  if(this.mode!=='playing')return;this.time+=dt;
  let limit=this.centerLimit(),oldX=this.x,destination=Math.max(-limit,Math.min(limit,this.target));this.x+=(destination-this.x)*(1-Math.exp(-dt*14));this.x=Math.max(-limit,Math.min(limit,this.x));if(Math.abs(destination-this.x)<.001)this.x=destination;this.velocity=(this.x-oldX)/dt;
  this.recruit-=dt;if(this.x+this.halfWidth()>4.88&&this.recruit<=0&&this.n<64){this.addTroops(1);this.recruit=Math.max(.14,.24-this.stageIndex*.02);this.emit('recruit',ROAD_LIMIT,PLAYER_Z,1)}
  this.wave-=dt;if(this.time<this.config.duration&&this.wave<=0){let settings=this.waveSettings();this.wave=settings.interval;this.addWave(settings.count,-31)}
  this.blockTimer-=dt;if(this.time<this.config.duration-4&&this.blockTimer<=0){this.blockTimer=9;this.addBlock(Math.floor(this.time/9)%2?1.6:-1.8,-27,55+this.level*20)}
  while(this.bossSpawned<this.config.bossTimes.length&&this.time>=this.config.bossTimes[this.bossSpawned])this.spawnBoss(this.bossSpawned);
  this.fire-=dt;if(this.fire<=0){this.fire=.24-this.level*.018;for(let i=0;i<this.n;i++){let p=this.formation(i);if(p.joined<.4)continue;this.shots.push({x:p.x-.24,z:p.z-.85,power:1+Math.floor((this.level-1)/2)})}this.emit('fire',this.x,PLAYER_Z)}
  for(let b of this.blocks){b.z+=dt*1.6;if(b.z>PLAYER_Z){if(Math.abs(b.x-this.x)<this.halfWidth()+1.15){this.n=Math.max(0,this.n-4);this.emit('damage',b.x,b.z,4)}b.dead=true}}
  for(let e of this.enemies){e.z+=dt*e.speed*(1+Math.min(this.time,80)*.004);let sway=e.kind==='runner'?.55:.22;e.x=Math.max(-4.8,Math.min(4.8,e.home+Math.sin(this.time*(e.kind==='runner'?3:1.6)+e.phase)*sway));if(e.z>-5){e.home+=(this.x-e.home)*dt*.17;}if(e.z>PLAYER_Z){if(Math.abs(e.x-this.x)<this.halfWidth()+.42){let damage=e.kind==='armored'?2:1;this.n=Math.max(0,this.n-damage);this.emit('damage',e.x,e.z,damage)}e.dead=true}}
  // Spatial buckets avoid checking every bullet against the whole horde.
  let cells=new Map();for(let e of this.enemies){if(e.dead)continue;let key=Math.floor(e.x)+':'+Math.floor(e.z);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(e)}
  for(let s of this.shots){let old=s.z;s.z-=dt*29;let hit=null,kind='',closest=-Infinity;
   const consider=(o,k,rx,rz)=>{if(!o.dead&&Math.abs(s.x-o.x)<rx&&old>=o.z-rz&&s.z<=o.z+rz&&o.z>closest){hit=o;kind=k;closest=o.z}};
   for(let cx=Math.floor(s.x-.35);cx<=Math.floor(s.x+.35);cx++)for(let cz=Math.floor(s.z-.4);cz<=Math.floor(old+.4);cz++)for(let e of cells.get(cx+':'+cz)||[])consider(e,'enemy',.35,.35);
   for(let b of this.blocks)consider(b,'block',1.15,.6);for(let b of this.bosses)if(b.hp>0)consider(b,'boss',b.kind==='brute'?1.45:1.2,.9);
   if(hit){s.dead=true;hit.hp-=s.power;hit.hitAt=this.time;if(hit.hp<=0&&!hit.dead){hit.dead=true;if(kind==='enemy'){this.kills++;this.emit('hit',hit.x,hit.z,hit.phase)}if(kind==='block'){this.level=Math.min(6,this.level+1);this.addTroops(8);this.emit('upgrade',hit.x,hit.z,this.level)}if(kind==='boss'){this.bossKills++;this.addTroops(8);this.emit('bossdown',hit.x,hit.z,this.bossKills)}}else if(this.random()<.18)this.emit('spark',hit.x,hit.z);}
   if(s.z<-58)s.dead=true;
  }
  this.shots=this.shots.filter(s=>!s.dead);this.enemies=this.enemies.filter(e=>!e.dead);this.blocks=this.blocks.filter(b=>!b.dead);
  for(let b of this.bosses){if(b.hp<=0)continue;b.z=Math.min(-9-(b.index%2)*3,b.z+dt*(b.kind==='charger'?2.5:1.7 )*2.8*this.difficulty.speed);b.x=b.home+Math.sin(this.time*.7+b.index*2)*.7;
   if(b.z>-23){let prev=b.attack;b.attack-=dt;if(prev>1.4&&b.attack<=1.4){b.aim=this.x;this.emit('warning',b.aim,b.z,b.kind)}if(b.attack<=0){b.slamAt=this.time;b.attack=Math.max(3.8,6.3-this.stageIndex*.35)+(b.index%2)*.4;
    if(b.kind==='summoner'){this.addWave(22+this.stageIndex*4,b.z+2);this.emit('summon',b.x,b.z)}
    else {let offsets=b.kind==='charger'?[-.8,.8]:b.kind==='gunner'?[-1.8,0,1.8]:b.kind==='reaper'?[-2.4,2.4]:[0];for(let off of offsets)this.hazards.push({x:Math.max(-4.3,Math.min(4.3,b.aim+off)),z:b.z+1,width:b.kind==='brute'?1.5:b.kind==='titan'?2:.7,speed:b.kind==='charger'?22:b.kind==='gunner'?26:16,damage:b.kind==='titan'?9:b.kind==='brute'?6:4});this.emit('slam',b.aim,b.z);}
   }}
  }
  for(let h of this.hazards){h.z+=dt*h.speed;if(h.z>PLAYER_Z){if(Math.abs(h.x-this.x)<h.width){this.n=Math.max(0,this.n-h.damage);this.emit('damage',h.x,PLAYER_Z,h.damage)}h.dead=true}}this.hazards=this.hazards.filter(h=>!h.dead);
  this.boss=this.bosses.find(b=>b.hp>0)||this.emptyBoss;
  if(this.n<=0){this.mode='lost';this.emit('lost',this.x,PLAYER_Z)}
  else if(this.time>=this.config.duration&&this.bossKills===this.config.bossTimes.length&&this.enemies.length===0&&this.hazards.length===0){this.mode=this.stageIndex===4?'won':'stage_clear';this.emit(this.mode==='won'?'won':'stageclear',0,-6,this.stageIndex+1)}
  this.joined.length=this.n;
 }
}




