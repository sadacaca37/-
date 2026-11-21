// Original looping synth score, generated locally without external audio files.
let musicBus=null,musicNext=0,musicStep=0,musicActive=false,musicNoise=null;
muted=false;$('#sound').textContent='소리 ON';
function unlockMusic(){
 if(muted)return;
 try{audioCtx??=new AudioContext();audioCtx.resume().catch(()=>{});
  if(!musicBus){musicBus=audioCtx.createGain();musicBus.gain.value=0;musicBus.connect(audioCtx.destination);
   musicNoise=audioCtx.createBuffer(1,audioCtx.sampleRate*.2,audioCtx.sampleRate);let data=musicNoise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  }
 }catch{}
}
function musicTone(freq,t,duration,volume,type='triangle',endFreq){
 let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(endFreq)o.frequency.exponentialRampToValueAtTime(endFreq,t+duration);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(musicBus);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect()};
}
function musicPercussion(t,volume,snare=false){
 let source=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),gain=audioCtx.createGain();source.buffer=musicNoise;filter.type='highpass';filter.frequency.value=snare?1500:7000;gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.0001,t+(snare?.14:.045));source.connect(filter);filter.connect(gain);gain.connect(musicBus);source.start(t);source.stop(t+.16);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};
}
function scheduleMusic(){
 if(!musicBus)return;let active=!muted&&!paused&&!document.hidden&&battle.mode==='playing'&&audioCtx.state==='running',now=audioCtx.currentTime;
 if(active!==musicActive){musicActive=active;musicBus.gain.cancelScheduledValues(now);musicBus.gain.setTargetAtTime(active?.38:0,now,.025);if(active){musicNext=now+.04;musicStep=0}}
 if(!active)return;
 let beat=60/(120+battle.stageIndex*4),step=beat/4;
 while(musicNext<now+.12){let s=musicStep%16,bar=Math.floor(musicStep/16)%4,root=[110,87.307,130.813,97.999][bar],t=musicNext;
  if(s%4===0)musicTone(135,t,.19,.65,'sine',43);
  if(s===4||s===12){musicPercussion(t,.23,true);musicTone(180,t,.1,.12,'triangle',85)}
  if(s%2===0)musicPercussion(t,s%4===2?.13:.075);
  if([0,3,6,8,11,14].includes(s))musicTone(root*(s===14?2:1),t,step*1.5,.2,'triangle');
  if(s%2===0){let notes=[0,7,12,7,3,7,10,7],note=notes[s/2];musicTone(root*2*Math.pow(2,note/12),t,step*1.7,.065,'sine')}
  if(battle.bosses.some(b=>b.hp>0)&&s%4===2)musicTone(root*4,t,step,.045,'square');
  musicNext+=step;musicStep++;
 }
}
// Unlock in the same user gesture as start/resume; preserve the sound preference.
document.addEventListener('click',unlockMusic);
document.addEventListener('keydown',e=>{if(e.key===' ')unlockMusic()});
setInterval(scheduleMusic,25);
