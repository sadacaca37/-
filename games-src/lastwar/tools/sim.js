// 자동 플레이로 스테이지별 압박 정도 측정: node sim.js <work 폴더>
const fs=require('fs'),vm=require('vm'),path=require('path');const dir=process.argv[2]||'work';
let ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(dir,'core.js'),'utf8')+'\n'+fs.readFileSync(path.join(dir,'campaign.js'),'utf8')+';this.C=CampaignBattle;this.MAX_TROOPS=MAX_TROOPS;',ctx);
const MAXN=ctx.MAX_TROOPS??30;const seeds=[1,2,3,4,5,6];
for(let stage=0;stage<5;stage++){let wins=0,dmg=0,minN=0,endN=0,secs=0,bossTime=0;
 for(let seed of seeds){let b=new ctx.C();b.reset(stage);let s=seed*9301;b.random=()=>((s=(s*16807)%2147483647)/2147483647);b.reset(stage);
  let taken=0,low=99,firstBoss=null;
  for(let i=0;i<9000&&b.mode==='playing';i++){
   let threats=b.hazards.filter(h=>h.z>-12),bosses=b.bosses.filter(x=>x.hp>0),target=0;
   if(b.n<MAXN-2)target=5.1;else if(threats.length){let h=threats[0];target=h.x>0?-4:4}else if(bosses.length)target=bosses.sort((a,c)=>a.hp-c.hp)[0].x;
   else if(b.blocks.length)target=b.blocks.reduce((a,c)=>a.z>c.z?a:c).x;else if(b.enemies.length){let near=b.enemies.filter(e=>e.z>-12);target=near.length?near.reduce((s,e)=>s+e.x,0)/near.length:0}
   b.setTarget(target);b.update(1/30);for(let e of b.events)if(e.type==='damage')taken+=e.value||0;b.events=[];if(b.time>8)low=Math.min(low,b.n);
   if(firstBoss===null&&b.bossKills>0)firstBoss=b.time;
  }
  if(b.mode!=='lost')wins++;dmg+=taken;minN+=low;endN+=b.n;secs+=b.time;bossTime+=firstBoss??b.time;}
 let k=seeds.length;console.log(`stage ${stage+1}: clear ${wins}/${k}  damage ${Math.round(dmg/k)}  lowest squad ${Math.round(minN/k)}  end squad ${Math.round(endN/k)}  1st boss down ${Math.round(bossTime/k)}s  time ${Math.round(secs/k)}s`);}
