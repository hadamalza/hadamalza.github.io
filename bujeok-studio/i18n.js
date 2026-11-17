(() => {
const strings={
'퇴마할 얼굴을 보여주시오':['Show your face for the ritual','お祓いする顔を見せてください'],
'얼굴 사진을 올리거나 찍어주세요':['Upload or take a face photo','顔写真を選ぶか撮影してください'],
'이마 위치를 눌러 맞춰주세요':['Tap your forehead to place the talisman','おでこをタップして位置を合わせてください'],
'사진 올리기':['Upload photo','写真を選ぶ'], '사진 찍기':['Use camera','カメラを使う'], '촬영':['Capture','撮影'], '확인':['Confirm','確認'],
'25MB 이하 사진을 골라주세요':['Choose a photo under 25MB','25MB以下の写真を選んでください'],
'사진을 열지 못했어요. 다른 사진을 골라주세요':['Could not open this photo. Choose another.','写真を開けませんでした。別の写真を選んでください'],
'카메라를 열지 못했어요. 사진을 올려주세요':['Could not open the camera. Upload a photo instead.','カメラを開けませんでした。写真を選んでください'],
'사진 준비를 시작하지 못했어요. 다시 열어주세요.':['Could not prepare the photo. Please reopen.','写真の準備ができませんでした。もう一度開いてください'],
'링크를 복사하지 못했어요. 공유하기를 이용해주세요.':['Could not copy the link. Use Share.','コピーできませんでした。共有をお試しください'],

'부적소':['Bujeok','お守り工房'],
'소원을 이루어드립니다':['Make a wish','願いをかなえる'],
'바라는 문구 입력':['Enter your wish','願いごとを入力'],
'붓으로 직접 쓰기':['Write with a brush','筆で書く'],
'다른 구성':['New layout','配置を変える'],
'되돌리기':['Undo','元に戻す'], '다시 실행':['Redo','やり直す'], '모두 지우기':['Clear all','すべて消す'],
'부적 저장':['Save image','画像を保存'], '이미지 저장':['Save image','画像を保存'], '공유하기':['Share','共有'],
'부적 띄워 보내기':['Send a talisman','お守りを送る'], '닫기':['Close','閉じる'],
'어떤 유형의 부적으로 전하겠소?':['What kind of talisman will you send?','どんなお守りで届けますか？'],
'받는 이가 보게 될 광경':['Choose an effect','演出を選ぶ'], '염원 붙이기':['Stick your wish','願いを貼りつける'], '부적폭격':['Talisman storm','お守りシャワー'], '행운가득':['Lucky shower','幸運いっぱい'], '하트하트':['Heart balloons','ハートいっぱい'], '하트 풍선 다발이 부적을 들고 둥실 떠올라요':['A bunch of heart balloons floats the talisman up.','ハートの風船がお守りをふわっと運んできます。'],
'당신의 염원을 상대에게 강렬하게 전하세요':['Make your wish impossible to miss.','あなたの願いを、相手に強く届けましょう'],
'부적이 돈처럼 촤라라 쏟아져요':['Let good fortune rain down.','幸運が雨のように降り注ぎます'],
'부적이 촤라라 쏟아져요':['Let good fortune rain down.','幸運が雨のように降り注ぎます'],
'네잎클로버와 꽃잎이 화사하게 흩날려요':['Four-leaf clovers and petals flutter all around.','四つ葉のクローバーと花びらが華やかに舞います。'],
'보내는 이':['From','送り主'], '선택':['Optional','任意'], '이름이나 별명':['Name or nickname','名前・ニックネーム'],
'공유 링크':['Share link','共有リンク'], '링크 복사':['Copy link','リンクをコピー'],
'기본 공유를 지원하지 않는 브라우저예요. 링크 복사를 이용해주세요.':['Native sharing is unavailable. Use Copy link.','このブラウザは共有に未対応です。リンクをコピーしてください。'],
'공유창을 열지 못했어요. 링크 복사를 이용해주세요.':['Could not open sharing. Use Copy link.','共有を開けませんでした。リンクをコピーしてください。'], '공유화면 미리보기':['Preview shared view','共有画面をプレビュー'], '링크 보내기':['Share link','リンクを送る'],
'바라는 문구를 입력해주세요.':['Enter your wish.','願いごとを入力してください。'],
'한글, 영어, 일본어, 숫자로 12자까지 적어주세요.':['Use up to 12 Korean, English, Japanese letters or digits.','韓国語・英語・日本語・数字で12文字以内で入力してください。'],
'이 글자는 아직 지원하지 않아요. 다른 글자로 입력해주세요.':['This character is not supported yet. Try another.','この文字は未対応です。別の文字を入力してください。'],
'부적 이미지를 저장했어요.':['Image saved.','画像を保存しました。'],
'저장에 실패했어요. 다시 시도해주세요.':['Could not save. Please try again.','保存できませんでした。もう一度お試しください。'],
'연출을 불러오지 못했어요.':['Could not load the effect.','演出を読み込めませんでした。'],
'링크를 복사했습니다':['Link copied.','リンクをコピーしました'],
'링크를 길게 눌러 복사해주세요.':['Press and hold the link to copy.','リンクを長押ししてコピーしてください。'],
'불러오는 중…':['Loading…','読み込み中…'], '건너뛰기 ≫':['Skip ≫','スキップ ≫'], '다시 보기':['Replay','もう一度'],
'부적 열기':['Open talisman','お守りを開く'], '나도 부적 만들기':['Make my own','自分も作る'], '저장했어요':['Saved','保存しました'], '저장 실패':['Save failed','保存できませんでした'],
'누군가 부적을 보냈어요':['Someone sent you a talisman','お守りが届きました'],
'💀 퇴마 부적이 도착했어요':['⚡ A protective talisman has arrived','⚡ 厄払いのお守りが届きました'],
'💥 부적폭격 부적이 도착했어요':['💸 A fortune talisman has arrived','💸 金運のお守りが届きました'],
'✨ 하늘에서 부적이 내려와요':['✨ A talisman descends from above','✨ 空からお守りが降りてきます'],
'잡귀는 물러가고 좋은 기운만 남았어요.':['The spirits are gone. Only good energy remains.','邪気が去り、良い気だけが残りました。'],
'복이 돈다발처럼 쏟아지길!':['May good fortune rain down on you!','たくさんの幸運が降り注ぎますように！'],
'하늘의 기운이 늘 함께하길.':['May blessings always be with you.','いつも天の恵みがありますように。'],
'스산한 기운이 감돈다…':['Something stirs in the shadows…','不穏な気配が漂う…'],
'부적이여, 잡귀를 물리쳐라!':['Talisman, banish these spirits!','お守りよ、邪気を払え！'],
'퇴마!':['Begone!','退散！'], '쾅':['BOOM','ドン'], '촤라라':['Whoosh','シャララ'], '부적 플렉스 💸':['Fortune shower 💸','金運アップ 💸'], '하늘이 열린다…':['The heavens open…','空が開く…'],
'빈 부적 종이':['Blank talisman paper','白紙のお守り'], '직접 쓴 부적':['Hand-drawn talisman','手書きのお守り'],
'언어 변경':['Change language','言語を変更'], '확대':['Zoom in','拡大'], '축소':['Zoom out','縮小'], '기본 배율':['Reset zoom','元の倍率']
};
const presets={ko:['수능대박','사랑해넌내꺼야','취업성공','로또당첨기원'],en:['MONEY MAGNET','NO MONDAYS','I QUIT'],ja:['推しに会いたい','当選祈願','ビジュ最強','退職します']};
let locale='ko';const texts=new WeakMap(),attrs=new WeakMap();
window.bujeokT=(key)=>locale==='ko'?key:(strings[key]?.[locale==='en'?0:1]||key);
window.bujeokLanguage=()=>locale;
window.bujeokCountryLanguage=c=>c==='KR'?'ko':c==='JP'?'ja':'en';
function translate(){
 observer.disconnect();
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 for(let node;node=walker.nextNode();){
  if(node.parentElement?.closest('script,style,svg,input,textarea,#paper,#share-wish,.rv-wish,[data-lang],[data-wish]'))continue;
  const value=node.nodeValue;let entry=texts.get(node);
  if(!entry||value!==entry.last)entry={source:value,key:value.trim()};
  if(!strings[entry.key])continue;
  const next=entry.source.replace(entry.key,window.bujeokT(entry.key));
  if(next!==value)node.nodeValue=next;entry.last=next;texts.set(node,entry);
 }
 for(const el of document.querySelectorAll('[placeholder],[aria-label],[title]')){
  if(el.closest('#paper,svg'))continue;
  const entries=attrs.get(el)||{};
  for(const name of ['placeholder','aria-label','title']){
   const value=el.getAttribute(name);if(value===null)continue;
   let entry=entries[name];if(!entry||entry.last!==value)entry={key:value};
   if(!strings[entry.key])continue;
   const next=window.bujeokT(entry.key);if(next!==value)el.setAttribute(name,next);entry.last=next;entries[name]=entry;
  }
  attrs.set(el,entries);
 }
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
}
let queued=false;const observer=new MutationObserver(records=>{
 if(records.every(r=>r.target.nodeType===1&&r.target.closest?.('#paper,svg')))return;
 if(!queued){queued=true;queueMicrotask(()=>{queued=false;translate();});}
});
function setLanguage(next,manual=false){
 if(!presets[next])return;
 locale=next;document.documentElement.lang=next;
 if(manual)try{localStorage.setItem('bujeok-language',next);}catch{}
 document.querySelectorAll('[data-wish]:not([data-locale])').forEach((el,i)=>{const wish=presets[next][i]||'';el.hidden=!wish;el.dataset.wish=wish;el.textContent=wish;});
 document.querySelectorAll('[data-locale]').forEach(el=>{el.hidden=el.dataset.locale!==next;});
 document.querySelectorAll('[data-lang]').forEach(el=>el.setAttribute('aria-checked',String(el.dataset.lang===next)));
 document.title=next==='ko'?'부적소 — 나만의 부적':next==='ja'?'お守り工房 — 願いを込めて':'Bujeok — Make a wish';
 translate();
}
const toggle=document.querySelector('#language-toggle'),menu=document.querySelector('#language-menu');
function close(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}
toggle.onclick=()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)menu.querySelector('[aria-checked="true"]')?.focus();};
menu.onclick=e=>{const choice=e.target.closest('[data-lang]');if(choice){setLanguage(choice.dataset.lang,true);close();toggle.focus();}};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.language-picker'))close();});
menu.addEventListener('keydown',e=>{const items=[...menu.querySelectorAll('button')],i=items.indexOf(document.activeElement);if(e.key==='Escape'){close();toggle.focus();}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();items[(i+(e.key==='ArrowDown'?1:2))%3].focus();}});
window.bujeokLocaleReady=(async()=>{
 let saved;try{saved=localStorage.getItem('bujeok-language');}catch{}
 if(presets[saved]){setLanguage(saved);return;}
 let country;try{country=sessionStorage.getItem('bujeok-country');}catch{}
 if(!country){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),1800);try{
  const response=await fetch('https://api.country.is/',{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('country');country=(await response.json()).country;
  if(!/^[A-Z]{2}$/.test(country))throw Error('country');
  try{sessionStorage.setItem('bujeok-country',country);}catch{}
 }catch{}finally{clearTimeout(timer);}}
 const browser=(navigator.language||'en').slice(0,2);
 setLanguage(country?window.bujeokCountryLanguage(country):(presets[browser]?browser:'en'));
})();
})();
