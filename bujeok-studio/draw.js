// 직접 쓰기: 붉은 먹을 묻힌 붓으로 부적을 손으로 씁니다.
// 획은 300×600 부적 좌표로 저장하고, 공유 링크에는 압축해서 담습니다.

const W = 300, H = 600, SCALE = 3;
const INK = '#a82b1e';
const BRUSH_SIZE = 12;

/* ---------- 획 → 윤곽선 ---------- */
export function strokePath(pts) {
  if (!pts.length) return '';
  const f = (n) => n.toFixed(1);
  if (pts.length === 1) {
    const [x, y, w] = pts[0], r = Math.max(0.8, w / 2);
    return `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`;
  }
  const left = [], right = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[Math.max(0, i - 1)], n = pts[Math.min(pts.length - 1, i + 1)];
    let dx = n[0] - p[0], dy = n[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const r = Math.max(0.35, pts[i][2] / 2);
    left.push([pts[i][0] - dy * r, pts[i][1] + dx * r]);
    right.push([pts[i][0] + dy * r, pts[i][1] - dx * r]);
  }
  const a = pts[0], z = pts.at(-1), ra = Math.max(0.35, a[2] / 2), rz = Math.max(0.35, z[2] / 2);
  let d = `M${f(left[0][0])} ${f(left[0][1])}`;
  for (let i = 1; i < left.length; i++) d += `L${f(left[i][0])} ${f(left[i][1])}`;
  d += `A${f(rz)} ${f(rz)} 0 0 0 ${f(right.at(-1)[0])} ${f(right.at(-1)[1])}`;
  for (let i = right.length - 2; i >= 0; i--) d += `L${f(right[i][0])} ${f(right[i][1])}`;
  d += `A${f(ra)} ${f(ra)} 0 0 0 ${f(left[0][0])} ${f(left[0][1])}Z`;
  for (const point of pts) { if (point[2] > 20) d += strokePath([point]); }
  return d;
}

// 머무는 동안 마지막 붓자국에 먹이 스며듭니다. 점을 추가하지 않아 공유 데이터도 작게 유지합니다.
function inkDwell(getStroke, paint) {
  let frame = 0, point = null, since = 0, initial = 0, soaked = false;
  function tick(now) {
    const stroke = getStroke(), tip = stroke?.at(-1);
    if (!tip) return;
    if (tip !== point) { point = tip; since = now; initial = tip[2]; soaked = false; }
    const elapsed = Math.max(0, now - since - 180);
    if (elapsed > 0) {
      const next = initial + (28 - initial) * (1 - Math.exp(-elapsed / 1000));
      if (next > tip[2] + 0.025) { tip[2] = next; soaked = true; paint(); }
    }
    frame = requestAnimationFrame(tick);
  }
  return {
    start() { cancelAnimationFrame(frame); point = null; frame = requestAnimationFrame(tick); },
    stop() { cancelAnimationFrame(frame); frame = 0; return soaked; }
  };
}

/* ---------- 부적 종이 바탕 (기존 부적과 같은 질감) ---------- */
function baseDoc() {
  let src = '';
  try { src = window.talismanSVG?.('부', 7) || ''; } catch {}
  if (!src) src = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1800" viewBox="0 0 300 600"><rect width="300" height="600" fill="#edcc59"/><g color="${INK}"></g></svg>`;
  const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
  let g = doc.querySelector('g[color]');
  if (!g) { g = doc.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('color', INK); doc.documentElement.append(g); }
  while (g.firstChild) g.firstChild.remove();
  return { doc, g };
}

// baseSvg가 있으면 그 부적(자동으로 쓴 글씨 포함) 위에 획을 덧씁니다.
export function strokesToSVG(strokes, baseSvg) {
  let doc, g;
  if (baseSvg) {
    doc = new DOMParser().parseFromString(baseSvg, 'image/svg+xml');
    g = doc.querySelector('g[color]') || doc.documentElement;
  } else ({ doc, g } = baseDoc());
  for (const s of strokes) {
    const p = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', strokePath(s));
    p.setAttribute('fill', 'currentColor');
    g.append(p);
  }
  return new XMLSerializer().serializeToString(doc.documentElement);
}

export function blankPaperSVG() {
  const { doc } = baseDoc();
  return new XMLSerializer().serializeToString(doc.documentElement);
}

/* ---------- 링크용 인코딩 ---------- */
function pushVar(out, n) { do { let b = n & 127; n >>>= 7; if (n) b |= 128; out.push(b); } while (n); }
const zz = (n) => (n << 1) ^ (n >> 31);
const unzz = (n) => (n >>> 1) ^ -(n & 1);

async function pipe(bytes, stream) {
  const buf = await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer();
  return new Uint8Array(buf);
}
const toB64 = (u8) => { let s = ''; u8.forEach((b) => (s += String.fromCharCode(b))); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const fromB64 = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(s + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0)); };

export async function encodeStrokes(strokes) {
  const out = [];
  pushVar(out, strokes.length);
  for (const s of strokes) {
    pushVar(out, s.length);
    let px = 0, py = 0;
    for (const [x, y, w] of s) {
      const X = Math.round(x * 2), Y = Math.round(y * 2);
      pushVar(out, zz(X - px)); pushVar(out, zz(Y - py));
      out.push(Math.max(0, Math.min(255, Math.round(w * 8))));
      px = X; py = Y;
    }
  }
  let bytes = new Uint8Array(out), tag = 'r';
  if (typeof CompressionStream === 'function') {
    try { bytes = await pipe(bytes, new CompressionStream('deflate-raw')); tag = 'z'; } catch {}
  }
  return tag + toB64(bytes);
}

export async function decodeStrokes(code) {
  let bytes = fromB64(code.slice(1));
  if (code[0] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  let i = 0;
  const read = () => { let n = 0, shift = 0, b; do { b = bytes[i++]; if (b === undefined) throw Error('짧은 데이터'); n |= (b & 127) << shift; shift += 7; } while (b & 128); return n >>> 0; };
  const strokes = [], count = Math.min(read(), 2000);
  for (let k = 0; k < count; k++) {
    const n = Math.min(read(), 5000), s = [];
    let X = 0, Y = 0;
    for (let j = 0; j < n; j++) {
      X += unzz(read()); Y += unzz(read());
      const w = bytes[i++] / 8;
      s.push([Math.max(-10, Math.min(W + 10, X / 2)), Math.max(-10, Math.min(H + 10, Y / 2)), Math.min(30, w)]);
    }
    strokes.push(s);
  }
  return strokes;
}

export async function codeToSVG(code, base) {
  let baseSvg = null;
  try { if (base) baseSvg = base.wish ? window.talismanSVG(base.wish, base.seed) : blankPaperSVG(); } catch {}
  return strokesToSVG(await decodeStrokes(code), baseSvg);
}

/* ---------- 쓰기 화면 ---------- */
let mounted = false;
export function mountButton() {
  if (mounted) return;
  const actions = document.querySelector('.order form');
  if (!actions) return;
  mounted = true;
  const b = document.createElement('button');
  b.type = 'button';
  b.id = 'draw-open';
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4 9.5 14.5M9.5 14.5c-2 0-3.5 1.5-3.8 3.6L5 21l2.9-.7c2.1-.3 3.6-1.8 3.6-3.8m-2-2 2 2"/></svg>붓으로 직접 쓰기';
  window.startBujeokDrawing=()=>startInline(b);
  b.setAttribute('aria-pressed','false');
  b.onclick = () => { if(inline)inline.finish(true);else if(window.bujeokDesk)startInline(b); };
  const toolbar=actions.querySelector('.workspace-top');
  if(toolbar)toolbar.before(b);else actions.append(b);
}

/* ---------- 책상 위 부적에 바로 쓰기 ---------- */
let inline = null;
async function startInline(openBtn) {
  if (inline) return;
  inline = {};
  // 지금 책상 위에 있는 부적을 바탕으로 그 위에 덧씁니다.
  const prev = window.drawnTalisman;
  let base = prev ? prev.base : (typeof state !== 'undefined' ? { wish: state.wish, seed: state.seed } : null);
  let prevStrokes = [];
  try { if (prev) prevStrokes = await decodeStrokes(prev.code); } catch {}
  let baseSvg = null;
  try { if (base) baseSvg = base.wish ? window.talismanSVG(base.wish, base.seed) : blankPaperSVG(); } catch {}
  const currentSvg = document.querySelector('#paper svg')?.outerHTML || blankPaperSVG();
  const desk = window.bujeokDesk;
  const pc = desk.paper.getContext('2d');
  const k = desk.paper.width / W;
  const bar = document.createElement('div');
  bar.className = 'ink-bar';
  bar.innerHTML = `<p class="ink-hint">책상 위 부적에 붓을 대고 쓰시오.</p>
<div class="ink-row"><button type="button" class="ink-undo">↶ 되돌리기</button><button type="button" class="ink-clear">덧쓴 획 지우기</button></div>
<div class="ink-row"><button type="button" class="ink-cancel">그만두기</button><button type="button" class="ink-done">부적 완성</button></div>`;
  openBtn.setAttribute('aria-pressed','true');
  bar.style.display = 'none';

  // 좁은 화면에서는 도구 막대를 화면 아래에 띄웁니다 (주문서는 잘려 보이는 종이라 그 안에 두면 가려져요)
  if (matchMedia('(min-width: 901px)').matches) openBtn.after(bar); else { bar.classList.add('ink-float'); document.body.append(bar); }
  const q = (sel) => bar.querySelector(sel);
  document.documentElement.classList.add('desk-drawing');
  desk.setDrawMode(true);
  if (!matchMedia('(min-width: 901px)').matches) document.querySelector('.workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const bg = new Image();
  bg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(currentSvg);
  const strokes = [], undone = [];
  // 먹이 닿을 자리 표시: 붓 굵기만 한 동그라미
  const mark = document.createElement('div');
  mark.className = 'ink-cursor';
  document.body.append(mark);
  function showMark(e, p) {
    if (e.pointerType === 'touch' || e.target.closest?.('button,input,dialog')) { mark.style.opacity = 0; return; }
    const p2 = desk.pick(e.clientX + 12, e.clientY);
    const pxPerUnit = p && p2 ? 12 / Math.max(0.01, Math.hypot(p2.x - p.x, p2.y - p.y)) : 1.4;
    const d = p ? Math.max(12, size * pxPerUnit) : 10;
    mark.style.opacity = 1;
    mark.style.width = mark.style.height = d + 'px';
    mark.style.transform = `translate(${e.clientX - d / 2}px,${e.clientY - d / 2}px)`;
    mark.classList.toggle('down', !!cur);
  }
  let size = BRUSH_SIZE, cur = null, last = null, lastT = 0, width = 0;

  function compose() {
    pc.setTransform(1, 0, 0, 1, 0, 0);
    if (bg.complete && bg.naturalWidth) pc.drawImage(bg, 0, 0, desk.paper.width, desk.paper.height);
    else { pc.fillStyle = '#edcc59'; pc.fillRect(0, 0, desk.paper.width, desk.paper.height); }
    pc.setTransform(k, 0, 0, k, 0, 0);
    pc.fillStyle = INK; pc.globalAlpha = 0.94;
    for (const st of strokes) pc.fill(new Path2D(strokePath(st)));
    if (cur) pc.fill(new Path2D(strokePath(cur)));
    pc.globalAlpha = 1;
    pc.setTransform(1, 0, 0, 1, 0, 0);
    desk.refresh();
  }
  bg.onload = compose;
  compose();

  const touches=new Map();let pinching=false,pinchDistance=0,pinchZoom=1;
  function setZoom(value){desk.setDrawZoom(value);}
  setZoom(1);
  const touchDistance=()=>{const [a,b]=[...touches.values()];return Math.hypot(a.x-b.x,a.y-b.y);};
  const dwell = inkDwell(() => cur, compose);
  const isUI = (e) => e.target.closest?.('.order-tools, .workspace-top button, .language-picker, .ink-bar, dialog, header a, .rv, .pad, #toast');
  let gestureActive=false,gestureZoom=1;
  const overCanvas=e=>!isUI(e)&&e.target.closest?.('.workspace');
  function cancelInk(){dwell.stop();if(cur){cur=null;compose();}mark.style.opacity=0;}
  function wheelZoom(e){if(!e.ctrlKey||!overCanvas(e))return;e.preventDefault();if(gestureActive)return;cancelInk();const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);setZoom(desk.getDrawZoom()*Math.exp(-pixels*.01));}
  function gestureStart(e){if(!overCanvas(e))return;e.preventDefault();gestureActive=true;gestureZoom=desk.getDrawZoom();cancelInk();}
  function gestureChange(e){if(!gestureActive)return;e.preventDefault();setZoom(gestureZoom*e.scale);}
  function gestureEnd(e){if(!gestureActive)return;e.preventDefault();gestureActive=false;}
  function down(e) {
    if(isUI(e)||e.button>0)return;
    if(e.pointerType==='touch'&&e.target.closest?.('.workspace')){
      touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(touches.size>=2){e.preventDefault();pinching=true;dwell.stop();cur=null;compose();pinchDistance=touchDistance();pinchZoom=desk.getDrawZoom();desk.brushAt(e.clientX,e.clientY,false,'touch');return;}
    }
    if(cur||pinching||gestureActive)return;
    const p = desk.pick(e.clientX, e.clientY);
    desk.brushAt(e.clientX, e.clientY, !!p, e.pointerType);
    if (!p) return;
    showMark(e, p);
    e.preventDefault();
    width = size * 0.45;
    cur = [[p.x, p.y, width]];
    last = [p.x, p.y]; lastT = e.timeStamp;
    q('.ink-hint').classList.add('off');
    dwell.start();
    compose();
  }
  function move(e) {
    if(touches.has(e.pointerId))touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinching){e.preventDefault();if(touches.size>=2&&pinchDistance>0)setZoom(pinchZoom*touchDistance()/pinchDistance);return;}
    desk.brushAt(e.clientX, e.clientY, !!cur, e.pointerType);
    showMark(e, desk.pick(e.clientX, e.clientY));
    if (!cur) return;
    e.preventDefault();
    for (const ev of e.getCoalescedEvents?.() || [e]) {
      const p = desk.pick(ev.clientX, ev.clientY);
      if (!p) continue;
      const dist = Math.hypot(p.x - last[0], p.y - last[1]);
      if (dist < 1.1) continue;
      const speed = dist / Math.max(1, ev.timeStamp - lastT);
      const pressure = ev.pointerType === 'pen' && ev.pressure > 0 ? 0.35 + ev.pressure * 1.1 : 1;
      const target = size * pressure * Math.max(0.42, Math.min(1.2, 1.25 - speed * 0.9));
      width += (target - width) * 0.3;
      cur.push([p.x, p.y, width]);
      last = [p.x, p.y]; lastT = ev.timeStamp;
    }
    compose();
  }
  function up(e) {
    touches.delete(e.pointerId);
    if(pinching){if(!touches.size)pinching=false;return;}
    desk.brushAt(e.clientX, e.clientY, false, e.pointerType);
    if (!cur) return;
    const n = dwell.stop() ? 0 : Math.min(6, cur.length - 1);
    for (let i = 0; i < n; i++) cur[cur.length - 1 - i][2] *= 0.25 + (0.75 * i) / n;
    strokes.push(cur);undone.length=0;
    cur = null;
    compose();window.syncBujeokHistory?.();
  }
  const undo = () => { if(cur)return;if(strokes.length)undone.push(strokes.pop());compose();window.syncBujeokHistory?.(); };
  const redo = () => { if(cur)return;if(undone.length)strokes.push(undone.pop());compose();window.syncBujeokHistory?.(); };
  window.bujeokDrawing={undo,redo,canUndo:()=>strokes.length>0,canRedo:()=>undone.length>0,
    updateBase(svg, nextBase) {
      base=nextBase;baseSvg=svg;
      document.querySelector('#paper').setAttribute('aria-label',base.wish+' 부적 (붓글씨 편집 중)');
      bg.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(strokesToSVG(prevStrokes,baseSvg));
    }
  };
  window.syncBujeokHistory?.();
  const onKey = (e) => {
    if (e.key === 'Escape') finish(true);
    if (!e.target.matches?.('input,textarea') && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey?redo():undo(); }
  };
  addEventListener('pointerdown', down, { passive: false });
  addEventListener('pointermove', move, { passive: false });
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  addEventListener('keydown', onKey);
  addEventListener('wheel',wheelZoom,{passive:false});
  addEventListener('gesturestart',gestureStart,{passive:false});
  addEventListener('gesturechange',gestureChange,{passive:false});
  addEventListener('gestureend',gestureEnd,{passive:false});

  q('.ink-undo').onclick = undo;
  q('.ink-clear').onclick = () => { strokes.length = 0; compose(); };
  q('.ink-cancel').onclick = () => finish(false);
  q('.ink-done').onclick = () => finish(true);

  async function finish(save) {
    if(inline?.finishing)return;
    inline.finishing=true;
    if(cur)up({clientX:0,clientY:0});

    dwell.stop();
    cur = null;
    removeEventListener('pointerdown', down);
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
    removeEventListener('pointercancel', up);
    removeEventListener('keydown', onKey);
    removeEventListener('wheel',wheelZoom);
    removeEventListener('gesturestart',gestureStart);
    removeEventListener('gesturechange',gestureChange);
    removeEventListener('gestureend',gestureEnd);
    if (save) {
      try {
        const all = prevStrokes.concat(strokes);
        window.drawnTalisman = all.length ? { code: await encodeStrokes(all), base } : null;
        const p = document.querySelector('#paper');
        p.innerHTML = strokesToSVG(all, baseSvg);
        p.setAttribute('aria-label', base ? `${base.wish} 부적${all.length?' (붓글씨 덧씀)':''}` : '직접 쓴 부적');
        window.dispatchEvent(new CustomEvent('bujeok:drawn'));
      } catch (e) { console.error(e); desk.resync(); }
    } else desk.resync();
    desk.setDrawMode(false);
    document.documentElement.classList.remove('desk-drawing');
    bar.remove();
    mark.remove();
    touches.clear();
    openBtn.setAttribute('aria-pressed','false');

    window.bujeokDrawing=null;
    inline = null;
    window.syncBujeokHistory?.();
  }
  inline = { finish };
  window.finishBujeokDrawing=()=>inline?.finish(true);
}

function openPad() {
  const root = document.createElement('div');
  root.className = 'pad';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', '붓으로 직접 쓰기');
  root.innerHTML = `<div class="pad-glow" aria-hidden="true"></div>
<p class="pad-hint">붓에 붉은 먹을 찍었소. 소원을 적으시오.</p>
<div class="pad-stage"><div class="pad-paper"><img class="pad-bg" alt=""><canvas class="pad-ink"></canvas><canvas class="pad-live"></canvas></div></div>
<div class="pad-tools">
 <div class="pad-row"><button type="button" class="pad-undo">↶ 되돌리기</button><button type="button" class="pad-clear">새 종이</button></div>
 <div class="pad-row"><button type="button" class="pad-cancel">그만두기</button><button type="button" class="pad-done">부적 완성</button></div>
</div>
<svg class="pad-brush" viewBox="0 0 60 420" aria-hidden="true"><defs><linearGradient id="pb-shaft" x1="0" x2="1"><stop offset="0" stop-color="#5a3519"/><stop offset=".5" stop-color="#b07a46"/><stop offset="1" stop-color="#4a2a13"/></linearGradient></defs><rect x="24" y="0" width="12" height="16" rx="5" fill="#8e1f17"/><rect x="22" y="14" width="16" height="285" rx="7" fill="url(#pb-shaft)"/><rect x="20" y="294" width="20" height="18" rx="3" fill="#2c2119"/><path d="M20 312c-2 40 4 74 10 104 6-30 12-64 10-104z" fill="#140c08"/><path d="M21.5 360c1 22 4 40 8.5 56 4.5-16 7.5-34 8.5-56z" fill="${INK}"/></svg>`;
  document.body.append(root);
  document.documentElement.classList.add('rv-lock');
  const q = (s) => root.querySelector(s);
  const ink = q('.pad-ink'), live = q('.pad-live'), paper = q('.pad-paper'), brush = q('.pad-brush');
  [ink, live].forEach((c) => { c.width = W * SCALE; c.height = H * SCALE; });
  const ic = ink.getContext('2d'), lc = live.getContext('2d');
  [ic, lc].forEach((c) => { c.setTransform(SCALE, 0, 0, SCALE, 0, 0); c.fillStyle = INK; });
  q('.pad-bg').src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(blankPaperSVG());

  const strokes = [];
  let size = BRUSH_SIZE, cur = null, last = null, lastT = 0, width = 0;

  const fill = (c, s) => { c.globalAlpha = 0.94; c.fill(new Path2D(strokePath(s))); };
  function redraw() { ic.clearRect(0, 0, W, H); strokes.forEach((s) => fill(ic, s)); }
  const dwell = inkDwell(() => cur, () => { lc.clearRect(0, 0, W, H); fill(lc, cur); });
  function toLocal(e) {
    const r = paper.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }
  function moveBrush(e) {
    if (e.pointerType === 'touch') { brush.style.opacity = 0; return; }
    brush.style.opacity = 1;
    // 붓끝(아래 가운데)이 정확히 포인터 위치에 오도록
    brush.style.left = e.clientX - 13 + 'px'; // .pad-brush 너비 26px
    brush.style.top = e.clientY - 182 + 'px'; // 높이 182px
    brush.style.transform = `rotate(${cur ? 24 : 30}deg)`;
  }

  paper.addEventListener('pointerdown', (e) => {
    if (cur || e.button > 0) return;
    e.preventDefault();
    paper.setPointerCapture(e.pointerId);
    const [x, y] = toLocal(e);
    width = size * 0.45;
    cur = [[x, y, width]];
    last = [x, y]; lastT = e.timeStamp;
    q('.pad-hint').classList.add('off');
    fill(lc, cur);
    dwell.start();
    moveBrush(e);
  });
  paper.addEventListener('pointermove', (e) => {
    moveBrush(e);
    if (!cur) return;
    const evs = e.getCoalescedEvents?.() || [e];
    for (const ev of evs) {
      const [x, y] = toLocal(ev);
      const dist = Math.hypot(x - last[0], y - last[1]);
      if (dist < 1.1) continue;
      const dt = Math.max(1, ev.timeStamp - lastT);
      const speed = dist / dt; // 종이 좌표/ms
      const pressure = ev.pointerType === 'pen' && ev.pressure > 0 ? 0.35 + ev.pressure * 1.1 : 1;
      const target = size * pressure * Math.max(0.42, Math.min(1.2, 1.25 - speed * 0.9));
      width += (target - width) * 0.3;
      cur.push([x, y, width]);
      last = [x, y]; lastT = ev.timeStamp;
    }
    lc.clearRect(0, 0, W, H);
    fill(lc, cur);
  });
  function end() {
    if (!cur) return;
    // 붓을 떼는 끝은 가늘게
    const n = dwell.stop() ? 0 : Math.min(6, cur.length - 1);
    for (let i = 0; i < n; i++) cur[cur.length - 1 - i][2] *= 0.25 + (0.75 * i) / n;
    strokes.push(cur);
    cur = null;
    lc.clearRect(0, 0, W, H);
    redraw();
  }
  paper.addEventListener('pointerup', end);
  paper.addEventListener('pointercancel', end);
  root.addEventListener('pointermove', moveBrush);
  paper.addEventListener('pointerleave', () => { if (!cur) brush.style.opacity = 0; });

  q('.pad-undo').onclick = () => { strokes.pop(); redraw(); };
  q('.pad-clear').onclick = () => { strokes.length = 0; redraw(); };
  const close = () => { dwell.stop(); cur = null; root.remove(); document.documentElement.classList.remove('rv-lock'); removeEventListener('keydown', onKey); };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); strokes.pop(); redraw(); }
  };
  addEventListener('keydown', onKey);
  q('.pad-cancel').onclick = close;
  q('.pad-done').onclick = async () => {
    if (!strokes.length) { q('.pad-hint').classList.remove('off'); q('.pad-hint').textContent = '아직 한 획도 긋지 않았소.'; return; }
    const btn = q('.pad-done');
    btn.disabled = true;
    try {
      const code = await encodeStrokes(strokes);
      window.drawnTalisman = { code };
      const p = document.querySelector('#paper');
      p.innerHTML = strokesToSVG(strokes);
      p.setAttribute('aria-label', '직접 쓴 부적');
      close();
      window.dispatchEvent(new CustomEvent('bujeok:drawn'));
    } catch (e) { console.error(e); btn.disabled = false; }
  };
}

if (!window.__bujeokDraw) {
  window.__bujeokDraw = true;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountButton);
  else mountButton();
}
