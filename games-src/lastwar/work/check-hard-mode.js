const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
let c={};vm.createContext(c);vm.runInContext(fs.readFileSync('work/core.js','utf8')+'\n'+fs.readFileSync('work/campaign.js','utf8')+';this.C=CampaignBattle;this.roster=BOSS_ROSTER;',c);
assert.equal(new Set(c.roster.flat()).size,6);
for(let stage=0;stage<5;stage++){
 let b=new c.C();b.reset(stage);let e=b.enemies.find(e=>e.kind==='normal');assert.equal(e.hp,Math.ceil(Math.ceil((1+Math.floor(stage/2))*2.5)*2*b.difficulty.hp));
 b.enemies=[];b.blocks=[];b.shots=[];b.wave=999;b.blockTimer=999;b.fire=999;b.time=10;
 for(let i=0;i<c.roster[stage].length;i++){
  b.bosses=[];b.hazards=[];b.spawnBoss(i);let boss=b.bosses[0];boss.z=-10;boss.attack=.01;let n=b.enemies.length;b.update(.02);
  assert.ok(Number.isFinite(boss.slamAt));
  if(boss.kind==='summoner')assert.ok(b.enemies.length>n);else assert.equal(b.hazards.length,boss.kind==='gunner'?3:boss.kind==='reaper'||boss.kind==='charger'?2:1);
 }
}
console.log('Six boss types, stage-scaled HP, attack patterns and attack animation timestamps passed');

