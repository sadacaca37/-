'use strict';
const ROAD_LIMIT=5.10, SQUAD_SPACING=.90, PLAYER_Z=2.1;
class Battle {
 constructor(){this.reset();this.mode='ready'}
 reset(){this.time=0;this.x=-1.5;this.target=-1.5;this.velocity=0;this.n=12;this.level=1;this.kills=0;this.mode='playing';this.shots=[];this.enemies=[];this.blocks=[];this.hazards=[];this.events=[];this.joined=Array(12).fill(-10);this.seed=42;this.fire=0;this.recruit=0;this.wave=5;this.blockTimer=9;this.id=0;this.boss={x:0,z:-40,hp:2400,max:2400,active:false,attack:5,aim:0};this.addWave(90,-16);this.addBlock(-1.7,-23,80);}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296}
 emit(type,x,z,value){this.events.push({type,x,z,value})}
 halfWidth(){return (Math.ceil(Math.sqrt(Math.max(1,this.n)))-1)*SQUAD_SPACING/2}
 centerLimit(){return ROAD_LIMIT-this.halfWidth()}
 setTarget(value){this.target=Math.max(-ROAD_LIMIT,Math.min(ROAD_LIMIT,value))}
 addTroops(count){let before=this.n;this.n=Math.min(64,this.n+count);for(let i=before;i<this.n;i++)this.joined[i]=this.time;this.x=Math.max(-this.centerLimit(),Math.min(this.centerLimit(),this.x));}
 addWave(count,z){for(let i=0;i<count;i++)this.enemies.push({id:this.id++,x:-4.65+(i%15)*.62+(this.random()-.5)*.12,z:z-Math.floor(i/15)*.65+Math.sin(i*.43)*.22,hp:this.time>28?2:1,speed:1.05+this.random()*.35,phase:this.random()*6,hitAt:-10});}
 addBlock(x,z,hp){this.blocks.push({id:this.id++,x,z,hp,max:hp,hitAt:-10});}
 formation(i,settled=false){let cols=Math.ceil(Math.sqrt(Math.max(1,this.n))),xx=this.x+(i%cols-(cols-1)/2)*SQUAD_SPACING,zz=PLAYER_Z+Math.floor(i/cols)*.7;let age=this.time-(this.joined[i]??-10);if(!settled&&age<.5){let p=Math.max(0,age/.5);p=p*p*(3-2*p);xx=ROAD_LIMIT+(xx-ROAD_LIMIT)*p;zz+=1.2*(1-p)}return{x:xx,z:zz,phase:i*.79,variant:i%7,joined:age};}
 update(dt){if(this.mode!=='playing')return;this.time+=dt;let limit=this.centerLimit(),oldX=this.x;let destination=Math.max(-limit,Math.min(limit,this.target));this.x+=(destination-this.x)*(1-Math.exp(-dt*14));this.x=Math.max(-limit,Math.min(limit,this.x));if(Math.abs(destination-this.x)<.001)this.x=destination;this.velocity=(this.x-oldX)/dt;this.recruit-=dt;
 if(this.x+this.halfWidth()>4.88&&this.recruit<=0&&this.n<64){this.addTroops(1);this.recruit=.28;this.emit('recruit',ROAD_LIMIT,4,1)}
 this.wave-=dt;if(this.time<48&&this.wave<=0){this.wave=5;this.addWave(50+Math.floor(this.time*.7),-34)}
 this.blockTimer-=dt;if(this.time<44&&this.blockTimer<=0){this.blockTimer=11;this.addBlock(this.time<22?1.3:-1.7,-29,65+this.level*30)}
 this.fire-=dt;if(this.fire<=0){this.fire=.24-this.level*.018;for(let i=0;i<this.n;i++){let p=this.formation(i);if(p.joined<.4)continue;this.shots.push({x:p.x-.24,z:p.z-.85,power:this.level>=3?2:1})}this.emit('fire',this.x,PLAYER_Z)}
 for(let b of this.blocks){b.z+=dt*1.4;if(b.z>PLAYER_Z){if(Math.abs(b.x-this.x)<this.halfWidth()+1.15){this.n=Math.max(0,this.n-5);this.emit('damage',b.x,b.z,5)}b.dead=true}}
 for(let e of this.enemies){e.z+=dt*e.speed;if(e.z>1){e.x+=(this.x-e.x)*dt*.65}if(e.z>PLAYER_Z){if(Math.abs(e.x-this.x)<this.halfWidth()+.4){this.n=Math.max(0,this.n-1);this.emit('damage',e.x,e.z,1)}e.dead=true}}
 for(let s of this.shots){let old=s.z;s.z-=dt*27;for(let b of this.blocks){if(!b.dead&&s.z<=b.z+.6&&old>=b.z-.6&&Math.abs(s.x-b.x)<1.15){b.hp-=s.power;b.hitAt=this.time;s.dead=true;if(b.hp<=0){b.dead=true;this.level=Math.min(4,this.level+1);this.addTroops(5);this.emit('upgrade',b.x,b.z,this.level)}break}}
 if(!s.dead)for(let e of this.enemies){if(!e.dead&&s.z<=e.z+.3&&old>=e.z-.3&&Math.abs(s.x-e.x)<.32){e.hp-=s.power;e.hitAt=this.time;s.dead=true;if(e.hp<=0){e.dead=true;this.kills++;this.emit('hit',e.x,e.z,e.phase)}else this.emit('spark',e.x,e.z);break}}
 const b=this.boss;if(!s.dead&&b.active&&s.z<=b.z+1&&old>=b.z-1&&Math.abs(s.x-b.x)<1.6){b.hp-=s.power;s.dead=true;if(this.random()<.15)this.emit('spark',s.x,b.z)}if(s.z<-52)s.dead=true;}
 this.shots=this.shots.filter(s=>!s.dead);this.enemies=this.enemies.filter(e=>!e.dead);this.blocks=this.blocks.filter(b=>!b.dead);
 const b=this.boss;if(this.time>50&&!b.active){b.active=true;this.emit('boss',0,b.z)}if(b.active){b.z=Math.min(-7,b.z+dt*2.1);b.x=Math.sin(this.time*.55)*2.4;let previousAttack=b.attack;b.attack-=dt;if(previousAttack>1&&b.attack<=1){b.aim=this.x;this.emit('warning',b.aim,b.z)}if(b.attack<0){b.attack=5;for(let i=0;i<12;i++)this.enemies.push({id:this.id++,x:b.x+(i-6)*.5,z:b.z+2,hp:2,speed:2.4,phase:i,hitAt:-10});this.hazards.push({x:b.aim,z:b.z+2});this.emit('slam',b.aim,b.z)}if(b.hp<=0){this.mode='won';this.emit('won',b.x,b.z)}}
 for(let h of this.hazards){h.z+=dt*17;if(h.z>PLAYER_Z){if(Math.abs(h.x-this.x)<1.45){this.n=Math.max(0,this.n-6);this.emit('damage',h.x,PLAYER_Z,6)}h.dead=true}}this.hazards=this.hazards.filter(h=>!h.dead);
 if(this.n<=0){this.mode='lost';this.emit('lost',this.x,PLAYER_Z)}this.joined.length=this.n;
 }
}
