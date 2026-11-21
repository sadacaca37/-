const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');let context={};vm.createContext(context);vm.runInContext(fs.readFileSync('work/core.js','utf8')+'\n'+fs.readFileSync('work/campaign.js','utf8')+';this.CampaignBattle=CampaignBattle;this.STAGES=STAGES;',context);
assert.equal(context.STAGES.length,5);assert.equal(new Set(context.STAGES.map(s=>s.theme)).size,5);
for(let stage=0;stage<5;stage++){
 let b=new context.CampaignBattle();b.reset(stage);let early=b.waveSettings();b.time=45;let late=b.waveSettings();assert.ok(late.count>early.count&&late.speed>early.speed&&late.interval<early.interval,'difficulty must rise with time');
 b.reset(stage);let peak=0,bossPeak=0,modes=[];
 for(let i=0;i<9000&&b.mode==='playing';i++){
  let threats=b.hazards.filter(h=>h.z>-12),bosses=b.bosses.filter(x=>x.hp>0);let target=0;
  if(b.n<60)target=5.1;
  else if(threats.length){let h=threats[0];target=h.x>0?-4:4;}
  else if(bosses.length)target=bosses.sort((a,c)=>a.hp-c.hp)[0].x;
  else if(b.blocks.length)target=b.blocks.reduce((a,c)=>a.z>c.z?a:c).x;
  else if(b.enemies.length){let near=b.enemies.filter(e=>e.z>-12);target=near.length?near.reduce((s,e)=>s+e.x,0)/near.length:0;}
  b.setTarget(target);b.update(1/30);b.events=[];peak=Math.max(peak,b.enemies.length);bossPeak=Math.max(bossPeak,b.bosses.filter(x=>x.hp>0).length);
  assert.ok(b.enemies.length<=600,'no invisible enemies beyond render capacity');assert.ok(b.n>=0&&b.n<=64);assert.ok(Number.isFinite(b.x));
 }
 console.log(JSON.stringify({stage:stage+1,result:b.mode,seconds:Math.round(b.time),squad:b.n,kills:b.kills,bossKills:b.bossKills,bossTotal:b.config.bossTimes.length,peak,bossPeak,level:b.level}));
 if(process.argv.includes('--strict'))assert.equal(b.mode,stage===4?'won':'stage_clear','stage '+(stage+1)+' should be completable');
}
let b=new context.CampaignBattle();b.reset();b.time=29.99;b.update(.02);assert.equal(b.bosses.length,2,'first stage must have simultaneous bosses');b.mode='stage_clear';let t=b.time;b.update(1);assert.equal(b.time,t,'clear screen must stop battle');b.reset(1,123);assert.equal(b.totalKills,123);assert.equal(b.stageIndex,1);assert.equal(b.bosses.length,0);assert.equal(b.time,0);
for(let n of[1,12,64])for(let side of[-1,1]){b.reset();b.n=n;b.enemies=[];b.blocks=[];b.recruit=999;b.wave=999;b.blockTimer=999;b.setTarget(5.1*side);for(let i=0;i<90;i++)b.update(1/60);let edge=b.x+side*b.halfWidth();assert.ok(Math.abs(edge-side*5.1)<.003)}
console.log('Campaign structure, difficulty, simultaneous bosses, resets, and wall bounds passed');
