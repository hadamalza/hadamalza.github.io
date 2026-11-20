'use strict';
const piano=document.getElementById('piano'),text=document.getElementById('try-text'),sound=document.getElementById('sound'),statusText=document.getElementById('demo-status'),select=document.getElementById('song-trigger'),menu=document.getElementById('song-menu'),songName=document.getElementById('song-name'),playing=document.getElementById('playing');
let lang=localStorage.getItem('pianotype-language')==='en'?'en':'ko';
const titles={'작은별':'Twinkle Twinkle Little Star','엘리제를 위하여':'Für Elise','터키 행진곡':'Turkish March','월광 소나타 — 3악장':'Moonlight Sonata — 3rd Movement','징글벨':'Jingle Bells'};
function songTitle(title){return lang==='en'?(titles[title]||title):title}
const keys=new Map(),whitePitches=[0,2,4,5,7,9,11];
let whiteCount=0;
for(let midi=21;midi<=108;midi++){
 const key=document.createElement('span');
 if(whitePitches.includes(midi%12)){key.className='key';whiteCount++}else{key.className='black-key';key.style.left=((whiteCount/52)*100)+'%'}
 piano.append(key);keys.set(midi,key);
}
let ctx,enabled=true,cursor=0,loading=false,songs=[],buffers=new Map(),highlightTimer,activeSources=new Set();
function updateSoundButton(){const label=lang==='en'?(enabled?'Mute':'Unmute'):(enabled?'음소거':'소리 켜기');sound.setAttribute('aria-label',label);sound.title=label;sound.setAttribute('aria-pressed',String(enabled))}
function hush(){for(const source of activeSources){try{source.stop()}catch{}}activeSources.clear();pitchVoices.clear();clearTimeout(highlightTimer);keys.forEach(k=>k.classList.remove('active'))}
function currentSong(){return songs[Number(select.value)]}
function resetSong(){cursor=0;lastStrikeTime=-Infinity;touchInterval=.22;hush();songName.textContent=currentSong().title;playing.textContent='한 타, 한 음.'}
sound.disabled=true;
let selectedIndex=0;
function closeMenu(){menu.hidden=true;select.setAttribute('aria-expanded','false')}
function chooseSong(index){selectedIndex=index;select.value=String(index);select.textContent=songTitle(songs[index].title);menu.querySelectorAll('[role="option"]').forEach((o,i)=>o.setAttribute('aria-selected',String(i===index)));resetSong();closeMenu()}
const scoresReady=fetch('assets/songs.json').then(r=>{if(!r.ok)throw new Error('scores');return r.json()}).then(data=>{if(!Array.isArray(data)||!data.length||data.some(s=>!s.events?.length))throw new Error('scores');songs=data;menu.replaceChildren(...songs.map((s,i)=>{const o=document.createElement('button');o.type='button';o.role='option';o.dataset.title=s.title;o.textContent=songTitle(s.title);o.addEventListener('click',()=>{chooseSong(i);select.focus()});return o}));select.disabled=false;sound.disabled=false;chooseSong(Math.max(0,songs.findIndex(s=>s.title==='월광 소나타 — 3악장')))}).catch(()=>{statusText.textContent=lang==='en'?'Could not load songs. Please refresh the page.':'곡을 불러오지 못했어요. 페이지를 새로고침해주세요.'});
select.addEventListener('click',()=>{const opening=menu.hidden;menu.hidden=!opening;select.setAttribute('aria-expanded',String(opening));if(opening)menu.querySelector('[aria-selected="true"]')?.focus()});
menu.addEventListener('keydown',e=>{const options=[...menu.querySelectorAll('[role="option"]')],i=options.indexOf(document.activeElement);if(e.key==='Escape'){closeMenu();select.focus()}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();options[(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length].focus()}});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.song-picker'))closeMenu()});
let audioReady;
function prepareAudio(){
 if(audioReady)return audioReady;
 ctx??=new AudioContext();
 const samples=[];
 for(let octave=2;octave<=6;octave++)for(const [i,name] of ['C','Ds','Fs','A'].entries()){
 if(octave===6&&i!==0)continue;
 samples.push((async()=>{const r=await fetch(`assets/audio/${name}${octave}.mp3`);if(!r.ok)throw new Error('audio');return [(octave+1)*12+i*3,await ctx.decodeAudioData(await r.arrayBuffer())]})());
 }
 audioReady=Promise.all(samples).then(items=>{buffers=new Map(items);statusText.textContent=''}).catch(error=>{audioReady=null;statusText.textContent=lang==='en'?'Could not load audio. Use the sound button to try again.':'소리를 불러오지 못했어요. 소리 버튼을 눌러 다시 시도해주세요.';throw error});
 return audioReady;
}
updateSoundButton();
void prepareAudio().catch(()=>{});
text.addEventListener('pointerdown',()=>{if(enabled){void prepareAudio().catch(()=>{});void ctx.resume().catch(()=>{})}});
sound.addEventListener('click',()=>{
 enabled=!enabled;updateSoundButton();
 if(!enabled){hush();return}
 void prepareAudio().catch(()=>{});void ctx.resume().catch(()=>{});
});
let strikeRequest=0, lastStrikeTime=-Infinity, touchInterval=.22;
const pitchVoices=new Map();
text.addEventListener('keydown',async e=>{
 if(!enabled||e.repeat||e.metaKey||e.ctrlKey||e.altKey||!/^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|Semicolon|Quote|Comma|Period|Slash|Backslash|BracketLeft|BracketRight|Minus|Equal|Backquote)$/.test(e.code))return;
 const request=++strikeRequest,selected=select.value;
 try{const ready=prepareAudio();await Promise.all([ready,ctx.resume(),scoresReady])}catch{return}
 if(!enabled||request!==strikeRequest||selected!==select.value||!currentSong())return;
 const song=currentSong(),eventIndex=cursor++%song.events.length,event=song.events[eventIndex],now=ctx.currentTime;
 const interval=now-lastStrikeTime;if(interval>.045&&interval<1.2)touchInterval=touchInterval*.35+interval*.65;lastStrikeTime=now;
 const gap=eventIndex+1<song.events.length?song.events[eventIndex+1].time-event.time:.4,scale=touchInterval/Math.max(.04,gap);
 keys.forEach(k=>k.classList.remove('active'));clearTimeout(highlightTimer);
 for(const note of event.notes){
 const source=ctx.createBufferSource(),gain=ctx.createGain(),nearest=[...buffers.keys()].reduce((a,b)=>Math.abs(a-note.midi)<=Math.abs(b-note.midi)?a:b),duration=Math.max(.55,Math.min(1.2,Math.max(.14,note.duration*scale))),fade=.45;
 const previous=pitchVoices.get(note.midi);if(previous){try{previous.stop()}catch{}}
 source.buffer=buffers.get(nearest);source.playbackRate.value=2**((note.midi-nearest)/12);gain.gain.setValueAtTime(Math.max(.001,note.velocity*.45/Math.sqrt(event.notes.length)),now);gain.gain.setValueAtTime(Math.max(.001,note.velocity*.45/Math.sqrt(event.notes.length)),now+duration);gain.gain.linearRampToValueAtTime(0,now+duration+fade);source.connect(gain).connect(ctx.destination);source.start(now);source.stop(now+duration+fade+.02);activeSources.add(source);pitchVoices.set(note.midi,source);source.onended=()=>{activeSources.delete(source);if(pitchVoices.get(note.midi)===source)pitchVoices.delete(note.midi);source.disconnect();gain.disconnect()};keys.get(note.midi)?.classList.add('active');
 }
 highlightTimer=setTimeout(()=>keys.forEach(k=>k.classList.remove('active')),160);
 playing.textContent=((cursor-1)%song.events.length+1)+' / '+song.events.length;
});
fetch('downloads/release.json').then(r=>r.json()).then(r=>{document.querySelectorAll('[data-size]').forEach(el=>el.textContent=(r.bytes/1024/1024).toFixed(1)+' MB')}).catch(()=>{});

const translations=[['.site-header nav a:nth-child(1)','설치 가이드','Installation'],['#download-trigger','다운로드','Download'],['#download-options a','Mac 다운로드','Download for Mac'],['#download-options span','Windows 준비 중','Windows coming soon'],['.contact-link','문의','Contact'],['h1','방구석 피아니스트 되기','Become a Pianist at Home'],['.intro-copy','키보드로 치는 피아노 앱. 업무 메일, 사직서, 카톡, 슬랙까지.<br> 어떤 순간에도 우아함을 잃지 마세요.','A piano app for your keyboard. Emails, chats, or Slack.<br> Stay elegant, whatever the moment.'],['.download-actions a','Mac 다운로드','Download for Mac'],['.download-actions button','Windows 준비 중','Windows coming soon'],['.meta','v1.2 · macOS 13 이상 · Apple Silicon & Intel','v1.2 · macOS 13 or later · Apple Silicon & Intel'],['#demo-title','직접 연주해보기','Try it yourself'],['#how h2','설치 안내','Installation'],['.setup li:nth-child(1) .step-copy','<code>Pianotype-1.2.dmg</code>를 열고 앱 아이콘을 Applications 폴더로 드래그하세요.','Open <code>Pianotype-1.2.dmg</code> and drag the app icon into Applications.'],['.setup li:nth-child(2) .step-copy','개인이 배포하는 앱이라 처음 열 때 Apple이 실행을 차단할 수 있어요.<br>다운로드한 앱이 맞는지 확인한 뒤 ‘시스템 설정 → 개인정보 보호 및 보안 → 그래도 열기’를 선택하세요.','Because this app is distributed independently, Apple may block it the first time you open it.<br>After checking that it is the app you downloaded, choose System Settings → Privacy & Security → Open Anyway.'],['.setup li:nth-child(3)','입력 모니터링에서 Pianotype을 허용하고 앱을 다시 연 뒤 ‘연주 켜기’를 누르세요.','Allow Pianotype under Input Monitoring, reopen the app, and turn on playback.']];
function applyLanguage(){document.documentElement.lang=lang;for(const [selector,ko,en] of translations){const element=document.querySelector(selector);if(element)element.innerHTML=lang==='en'?en:ko}document.querySelector('[src="assets/install-drag.png"]').alt=lang==='en'?'Drag Pianotype into the Applications folder':'Pianotype 앱을 Applications 폴더로 옮기는 설치 화면';document.querySelector('[src^="assets/install-security.png"]').alt=lang==='en'?'Privacy & Security settings showing the Open Anyway button':'개인정보 보호 및 보안 설정의 그래도 열기 버튼';document.title=lang==='en'?'Pianotype — Become a Pianist at Home':'Pianotype — 방구석 피아니스트 되기';text.placeholder=lang==='en'?'The quick brown fox jumps over the lazy dog.':'간장 공장 공장장 장공장장';text.setAttribute('aria-label',lang==='en'?'Try it yourself':'직접 연주해보기');menu.setAttribute('aria-label',lang==='en'?'Choose a song':'체험 곡 선택');document.querySelectorAll('#song-menu [role="option"]').forEach(o=>o.textContent=songTitle(o.dataset.title));if(songs.length)select.textContent=songTitle(currentSong().title);document.getElementById('language').setAttribute('aria-label',lang==='en'?'한국어로 전환':'Switch to English');document.getElementById('language').title=lang==='en'?'한국어':'English';document.querySelector('.contact-link').setAttribute('aria-label',lang==='en'?'Contact on Instagram, opens in a new tab':'문의 — 인스타그램, 새 탭에서 열기');updateSoundButton()}
document.getElementById('language').addEventListener('click',()=>{lang=lang==='ko'?'en':'ko';localStorage.setItem('pianotype-language',lang);applyLanguage()});applyLanguage();

const downloadTrigger=document.getElementById('download-trigger'),downloadOptions=document.getElementById('download-options');
function closeDownload(){downloadOptions.hidden=true;downloadTrigger.setAttribute('aria-expanded','false')}
downloadTrigger.addEventListener('click',()=>{const open=downloadOptions.hidden;downloadOptions.hidden=!open;downloadTrigger.setAttribute('aria-expanded',String(open))});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.download-menu'))closeDownload()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!downloadOptions.hidden){closeDownload();downloadTrigger.focus()}});
downloadOptions.querySelector('a').addEventListener('click',closeDownload);

const mobileToggle=document.getElementById('mobile-menu-toggle'),mobileMenu=document.getElementById('mobile-menu');
function closeMobile(){mobileMenu.hidden=true;mobileToggle.setAttribute('aria-expanded','false');mobileToggle.setAttribute('aria-label',lang==='en'?'Open menu':'메뉴 열기')}
function translateMobile(){document.getElementById('mobile-install').textContent=lang==='en'?'Installation':'설치 가이드';document.getElementById('mobile-download-title').textContent=lang==='en'?'Download':'다운로드';document.getElementById('mobile-mac').textContent=lang==='en'?'Download for Mac':'Mac 다운로드';document.getElementById('mobile-windows').textContent=lang==='en'?'Windows coming soon':'Windows 준비 중';document.getElementById('mobile-contact').textContent=lang==='en'?'Contact':'문의';document.getElementById('mobile-language-title').textContent=lang==='en'?'Language':'언어';for(const [id,code] of [['mobile-korean','ko'],['mobile-english','en']]){const b=document.getElementById(id);b.setAttribute('aria-pressed',String(lang===code));b.querySelector('span').hidden=lang!==code}mobileToggle.setAttribute('aria-label',mobileMenu.hidden?(lang==='en'?'Open menu':'메뉴 열기'):(lang==='en'?'Close menu':'메뉴 닫기'))}
mobileToggle.addEventListener('click',()=>{if(!mobileMenu.hidden){closeMobile();return}mobileMenu.hidden=false;mobileToggle.setAttribute('aria-expanded','true');translateMobile()});
for(const [id,code] of [['mobile-korean','ko'],['mobile-english','en']])document.getElementById(id).addEventListener('click',()=>{lang=code;localStorage.setItem('pianotype-language',lang);applyLanguage();translateMobile()});
document.getElementById('language').addEventListener('click',translateMobile);
mobileMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMobile));
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.site-header'))closeMobile()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobileMenu.hidden){closeMobile();mobileToggle.focus()}});
window.addEventListener('resize',()=>{if(window.innerWidth>600)closeMobile()});translateMobile();

const floatingPiano=document.querySelector('.floating-piano');
let scrollAnchor=Math.max(0,window.scrollY), lastFocusAt=-Infinity;
window.addEventListener('scroll',()=>{
 const y=Math.max(0,window.scrollY),delta=y-scrollAnchor;
 if(y<24){floatingPiano.classList.remove('is-hidden');scrollAnchor=y;return}
 if(performance.now()-lastFocusAt<400){scrollAnchor=y;return}
 if(Math.abs(delta)<8)return;
 floatingPiano.classList.toggle('is-hidden',delta>0);scrollAnchor=y;
},{passive:true});
text.addEventListener('focus',()=>{lastFocusAt=performance.now();floatingPiano.classList.remove('is-hidden');scrollAnchor=Math.max(0,window.scrollY)});
