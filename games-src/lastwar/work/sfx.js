// ===== 효과음: 소리 파일 없이 Web Audio로 직접 합성 =====
// 사격·처치·피해·강화, 보스 6종의 등장 포효·공격 예고·공격·발소리·피격·격파, 클리어/패배 소리.
let sfxBus=null,sfxNoise=null;const sfxLast={};
function sfxReady(){if(muted)return null;try{audioCtx??=new AudioContext();if(audioCtx.state!=='running'){audioCtx.resume().catch(()=>{});return null}
  if(!sfxBus){let comp=audioCtx.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=10;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.2;
   sfxBus=audioCtx.createGain();sfxBus.gain.value=.85;sfxBus.connect(comp);comp.connect(audioCtx.destination);
   sfxNoise=audioCtx.createBuffer(1,audioCtx.sampleRate,audioCtx.sampleRate);let d=sfxNoise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  return audioCtx}catch{return null}}
function sfxGate(name,gap){let t=performance.now()/1000;if(t-(sfxLast[name]??-9)<gap)return false;sfxLast[name]=t;return true}
function sfxEnvelope(g,t,o){let vol=o.vol||.05,attack=o.attack||.005,dur=o.dur||.1,hold=Math.min(dur*.9,Math.max(attack,o.hold||0));
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+attack);g.gain.setValueAtTime(vol,t+hold);g.gain.exponentialRampToValueAtTime(.0001,t+dur)}
// 음 하나: f→to(Hz), dur(초), vol, type(sine/triangle/square/sawtooth), lp(저역 필터), vib:[속도,깊이]
function sTone(o){let c=audioCtx,t=c.currentTime+(o.delay||0),dur=o.dur||.1,osc=c.createOscillator(),g=c.createGain(),nodes=[osc,g];
 osc.type=o.type||'sine';osc.frequency.setValueAtTime(o.f,t);if(o.to)osc.frequency.exponentialRampToValueAtTime(o.to,t+dur);sfxEnvelope(g,t,o);
 if(o.lp){let f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;osc.connect(f);f.connect(g);nodes.push(f)}else osc.connect(g);
 if(o.vib){let l=c.createOscillator(),lg=c.createGain();l.frequency.value=o.vib[0];lg.gain.value=o.vib[1];l.connect(lg);lg.connect(osc.frequency);l.start(t);l.stop(t+dur+.03);nodes.push(l,lg)}
 g.connect(sfxBus);osc.start(t);osc.stop(t+dur+.03);osc.onended=()=>nodes.forEach(n=>n.disconnect())}
// 잡음: 폭발·바람·발소리 재료. filter 종류와 f→to(Hz)로 색을 바꾼다.
function sNoise(o){let c=audioCtx,t=c.currentTime+(o.delay||0),dur=o.dur||.1,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
 s.buffer=sfxNoise;s.loop=true;s.playbackRate.value=.9+Math.random()*.2;f.type=o.filter||'lowpass';f.Q.value=o.q||1;f.frequency.setValueAtTime(o.f||1000,t);if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,t+dur);
 sfxEnvelope(g,t,o);s.connect(f);f.connect(g);g.connect(sfxBus);s.start(t,Math.random()*.5);s.stop(t+dur+.03);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect()}}
function sNotes(list,o){list.forEach(([f,delay,dur])=>sTone({...o,f,delay,dur:dur||o.dur}))}
const BOSS_ROAR={
 brute(){sTone({f:95,to:55,dur:1.2,vol:.2,type:'sawtooth',lp:600,attack:.08,hold:.5,vib:[11,8]});sTone({f:48,to:38,dur:1.2,vol:.18,attack:.05,hold:.4});sNoise({dur:1,vol:.07,filter:'bandpass',f:400,to:250,q:.8,attack:.1,hold:.4})},
 charger(){for(let i=0;i<2;i++)sNoise({dur:.18,vol:.14,filter:'bandpass',f:700,to:300,q:1.5,delay:i*.25});sTone({f:150,to:90,dur:.65,vol:.1,type:'sawtooth',lp:900,delay:.45,attack:.04,hold:.3,vib:[7,6]});
  for(let i=0;i<6;i++)sTone({f:120,to:60,dur:.09,vol:.12,delay:.5+i*.11})},
 summoner(){[220,277.2,329.6,415.3].forEach((f,i)=>sTone({f,dur:1.6,vol:.045,attack:.4,hold:.9,vib:[5,4],delay:i*.06}));sTone({f:55,dur:1.6,vol:.08,type:'triangle',attack:.3,hold:.9});sNoise({dur:1.4,vol:.03,filter:'highpass',f:5000,attack:.4,hold:.6})},
 gunner(){sTone({f:180,to:900,dur:.45,vol:.05,type:'sawtooth',lp:2000});sTone({f:900,to:250,dur:.45,vol:.05,type:'sawtooth',lp:2000,delay:.45});
  sTone({f:420,to:380,dur:.12,vol:.07,type:'square',delay:.95});sNoise({dur:.08,vol:.08,filter:'highpass',f:2500,delay:.95});sTone({f:98,dur:.7,vol:.08,type:'square',lp:500,delay:1.05,attack:.02,hold:.5})},
 reaper(){sNoise({dur:.7,vol:.12,filter:'bandpass',f:300,to:3000,q:2,attack:.2,hold:.3});sTone({f:659,dur:2,vol:.06,delay:.4});sTone({f:622,dur:2,vol:.04,delay:.4});sTone({f:1819,dur:1.2,vol:.02,delay:.4})},
 titan(){sNoise({dur:1.8,vol:.25,f:200,to:80,attack:.3,hold:.9});sTone({f:40,to:32,dur:1.8,vol:.2,attack:.2,hold:1});sTone({f:70,to:45,dur:1.2,vol:.12,type:'sawtooth',lp:400,delay:.4,attack:.1,hold:.5,vib:[6,5]});sNoise({dur:1.2,vol:.05,filter:'highpass',f:4000,delay:.6,attack:.2})}
};
const BOSS_SLAM={
 brute(){sTone({f:130,to:32,dur:.6,vol:.32});sNoise({dur:.5,vol:.2,f:1600,to:120});sTone({f:240,to:200,dur:.15,vol:.06,type:'square',lp:1200})},
 charger(){sTone({f:110,to:40,dur:.35,vol:.25});sTone({f:110,to:40,dur:.35,vol:.25,delay:.12});sNoise({dur:.6,vol:.12,filter:'bandpass',f:600,to:200,q:.7})},
 gunner(){for(let i=0;i<10;i++){sNoise({dur:.05,vol:.09,filter:'highpass',f:1500,delay:i*.045});sTone({f:160,to:60,dur:.06,vol:.08,delay:i*.045})}for(let i=0;i<4;i++)sTone({f:3200,dur:.05,vol:.012,type:'triangle',delay:.15+i*.09})},
 reaper(){for(let i=0;i<2;i++)sNoise({dur:.28,vol:.16,filter:'bandpass',f:600,to:4500,q:3,delay:i*.16});sTone({f:1800,to:600,dur:.25,vol:.03,type:'sawtooth',lp:3000})},
 titan(){sNoise({dur:1.1,vol:.3,f:2500,to:90});sTone({f:80,to:28,dur:.9,vol:.3});sNoise({dur:.8,vol:.05,filter:'highpass',f:3500,delay:.25})}
};
const BOSS_PITCH={brute:110,charger:150,summoner:330,gunner:200,reaper:420,titan:70};
const SFX={
 fire(){if(!sfxGate('fire',.07))return;let p=.9+Math.random()*.2;sNoise({dur:.06,vol:.05,filter:'highpass',f:1800*p});sTone({f:150*p,to:55,dur:.07,vol:.05,type:'triangle'})},
 hit(){if(!sfxGate('hit',.045))return;let p=.8+Math.random()*.5;sNoise({dur:.07,vol:.06,filter:'bandpass',f:900*p,to:400,q:1.4});sTone({f:260*p,to:120,dur:.08,vol:.025,type:'square',lp:1500});
  if(Math.random()<.18&&sfxGate('grunt',.25))sTone({f:190*p,to:110,dur:.16,vol:.035,type:'triangle',attack:.01})},
 spark(){if(sfxGate('spark',.09))sTone({f:2400+Math.random()*800,to:1800,dur:.03,vol:.012,type:'square'})},
 recruit(){if(!sfxGate('recruit',.06))return;sTone({f:880,dur:.06,vol:.05,type:'triangle'});sTone({f:1320,dur:.09,vol:.045,type:'triangle',delay:.05})},
 upgrade(){sNotes([[523,0],[659,.07],[784,.14],[1047,.21]],{dur:.16,vol:.06,type:'square',lp:3000});sTone({f:1047,to:2093,dur:.35,vol:.04,type:'triangle',delay:.28})},
 damage(){if(!sfxGate('damage',.08))return;sTone({f:110,to:40,dur:.22,vol:.18});sNoise({dur:.18,vol:.09,f:900,to:200})},
 boss(k){BOSS_ROAR[k]?.()},
 warning(k){if(!sfxGate('warning'+k,.3))return;let base=BOSS_PITCH[k]||200;sTone({f:base,to:base*3,dur:1.1,vol:.05,type:'triangle',attack:.3,hold:.8});
  for(let i=0;i<2;i++)sTone({f:980,dur:.08,vol:.03,type:'square',lp:2500,delay:i*.18});
  if(k==='gunner')sTone({f:300,to:1500,dur:1,vol:.03,type:'sawtooth',lp:1800});if(k==='summoner')sNoise({dur:1,vol:.03,filter:'highpass',f:5000,attack:.3});if(k==='titan')sNoise({dur:1,vol:.12,f:180,attack:.3,hold:.6})},
 slam(k){BOSS_SLAM[k]?.()},
 summon(){[392,494,587,784,988].forEach((f,i)=>sTone({f,dur:.25,vol:.05,type:'triangle',delay:i*.05,vib:[12,10]}));sTone({f:200,to:800,dur:.5,vol:.05});sNoise({dur:.6,vol:.05,filter:'bandpass',f:2000,to:300,q:2,attack:.1})},
 step(k){if(!sfxGate('step'+k,.12))return;let f=k==='titan'?55:k==='brute'?65:k==='gunner'?90:80;sTone({f,to:f*.6,dur:.16,vol:k==='titan'?.15:.09});if(k==='gunner')sTone({f:1200,to:900,dur:.04,vol:.012,type:'square'});if(k==='charger')sNoise({dur:.06,vol:.04,filter:'bandpass',f:500})},
 land(){sTone({f:80,to:30,dur:.6,vol:.3});sNoise({dur:.5,vol:.18,f:1200,to:120})},
 bosshit(k){if(!sfxGate('bosshit',.2))return;let f=k==='titan'||k==='brute'?380:k==='gunner'?620:k==='summoner'||k==='reaper'?900:480;sTone({f,to:f*.92,dur:.09,vol:.03,type:'square',lp:2500});sTone({f:f*1.52,to:f*1.4,dur:.07,vol:.02,type:'triangle'});sNoise({dur:.05,vol:.025,filter:'highpass',f:3000})},
 boom(){if(!sfxGate('boom',.1))return;sNoise({dur:.4,vol:.18,f:1800,to:150});sTone({f:100,to:40,dur:.35,vol:.18})},
 bossdown(k){let base=BOSS_PITCH[k]||150;sNoise({dur:1.4,vol:.35,f:3000,to:80});sTone({f:90,to:25,dur:1.2,vol:.35});sTone({f:base*2,to:base*.5,dur:.9,vol:.1,type:'sawtooth',lp:1200,vib:[9,15]});
  sNotes([[523,.6],[659,.6],[784,.6],[1047,.9,.7]],{dur:.6,vol:.05,type:'triangle'})},
 stageclear(){sNotes([[523,0],[659,.12],[784,.24],[1047,.4,.7]],{dur:.2,vol:.05,type:'square',lp:2800});sNotes([[262,0,.6],[392,.4,.7]],{vol:.06,type:'triangle'})},
 won(){sNotes([[523,0],[659,.12],[784,.24],[1047,.4],[784,.6],[1047,.75,1.1]],{dur:.2,vol:.05,type:'square',lp:2800});sNotes([[262,0,.7],[349,.4,.4],[392,.75,1.1]],{vol:.06,type:'triangle'});sNoise({dur:1.4,vol:.03,filter:'highpass',f:6000,delay:.75,attack:.1})},
 lost(){sNotes([[392,0],[370,.25],[349,.5],[262,.8,.9]],{dur:.4,vol:.07,type:'triangle'});sTone({f:98,to:65,dur:1.4,vol:.08,type:'sawtooth',lp:400,delay:.8})}
};
function sfxEvent(e){if(['fire','hit','spark','recruit','damage','upgrade','boss','warning','slam','summon','bossdown','stageclear','won','lost'].includes(e.type))sound(e.type,e.kind)}
