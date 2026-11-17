import { createLuckBackdrop } from './luck-backdrop.js?v=2';
import { createPhotoStage } from './photo-reveal.js?v=13';
// 받는 사람이 링크를 열면 보이는 3D 연출. three.js는 이 파일이 처음 쓰일 때만 불러옵니다.
const THREE_URL = './vendor/three.module.min.js';


let current = null;

export function play(opts) {
  current?.destroy();
  current = mount(opts);
}

function mount(o) {
  const photoMode=o.effect==='exorcism';
  const root = document.createElement('div');
  root.className = o.preview ? 'rv rv-preview' : 'rv';
  root.dataset.effect = o.effect;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', `${o.wish} 부적`);
  root.innerHTML = `<canvas class="rv-canvas"></canvas><img class="rv-flatimg" alt=""><div class="rv-flash"></div>
<p class="rv-say" aria-live="polite"></p><p class="rv-shout" aria-hidden="true"></p>
<div class="rv-gate"><div class="rv-seal" aria-hidden="true">符</div><p class="rv-from"></p><button class="rv-btn rv-open" type="button" disabled>불러오는 중…</button></div>
<button class="rv-close" type="button" aria-label="닫기" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
<button class="rv-skip" type="button" hidden>건너뛰기 ≫</button>
<div class="rv-end" hidden><p class="rv-wish"></p><p class="rv-msg"></p><div class="rv-actions"><button class="rv-btn ghost rv-replay" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11a9 9 0 1 1 2.7 6.4M3 4v7h7"/></svg><span>다시 보기</span></button><button class="rv-btn ghost rv-save" type="button">부적 저장</button><button class="rv-btn rv-make" type="button"></button></div></div>`;
  const q = (s) => root.querySelector(s);
  q('.rv-from').textContent = o.from ? (window.bujeokLanguage?.()==='en'?`${o.from} sent you a talisman`:window.bujeokLanguage?.()==='ja'?`${o.from}さんからお守りが届きました`:`${o.from}님이 부적을 보냈어요`) : (window.bujeokT?.('누군가 부적을 보냈어요')||'누군가 부적을 보냈어요');
  q('.rv-wish').textContent = `「${o.wish}」`;
  q('.rv-msg').textContent = o.from ? `from. ${o.from}` : '';
  q('.rv-msg').hidden = !o.from;
  q('.rv-make').textContent = '나도 부적 만들기';
  q('.rv-make').hidden = !!o.preview;
  q('.rv-close').hidden = !(o.preview || photoMode);
  if (o.preview || o.replay || photoMode) q('.rv-gate').hidden = true;
  document.body.append(root);
  document.documentElement.classList.add('rv-lock');

  let stage = null, dead = false, sayTimer = 0;
  const ui = {
    say(text) {
      const el = q('.rv-say');
      clearTimeout(sayTimer);
      if (!text) { el.classList.remove('on'); return; }
      el.textContent = text;
      el.classList.add('on');
      sayTimer = setTimeout(() => el.classList.remove('on'), 2200);
    },
    shout(text) {
      const el = q('.rv-shout');
      el.textContent = text;
      el.classList.remove('on');
      void el.offsetWidth;
      el.classList.add('on');
    },
    flash(color = '#fff6d8', strength = 0.9) {
      const el = q('.rv-flash');
      el.style.background = color;
      el.style.transition = 'none';
      el.style.opacity = strength;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = '';
        el.style.opacity = 0;
      }));
    },
    end() {
      q('.rv-skip').hidden = true;
      q('.rv-end').hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('rv-ended')));
    },
  };

  const imgP = svgImage(o.svg);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const threeP = (reduce || photoMode) ? Promise.resolve(null) : import(THREE_URL).catch((e) => { console.warn(e); return null; });

  const ready = Promise.all([imgP, threeP]).then(([img, THREE]) => {
    if (dead) return;
    if(photoMode){stage=createPhotoStage(root,img,ui,start);return;}
    q('.rv-flatimg').src = img.src;
    if (THREE) {
      try { stage = createStage(THREE, q('.rv-canvas'), img, o.effect, ui); }
      catch (e) { console.warn('WebGL 연출을 시작하지 못해 평면으로 보여줘요.', e); stage = null; }
    }
    if (!stage) root.classList.add('rv-flat');
  });

  function start() {
    if (dead) return;
    root.classList.add('rv-go');
    if (stage) { stage.start(); q('.rv-skip').hidden = false; }
    else ui.end();
  }

  if(photoMode) ready.catch(()=>ui.say('사진 준비를 시작하지 못했어요. 다시 열어주세요.'));
  else if (o.preview || o.replay) ready.then(start);
  else ready.then(() => {
    const b = q('.rv-open');
    b.disabled = false;
    b.textContent = '부적 열기';
    b.focus();
    b.onclick = start;
  });

  q('.rv-skip').onclick = () => { if (stage) stage.fast = true; };
  q('.rv-replay').onclick = () => {if(photoMode){q('.rv-end').hidden=true;root.classList.remove('rv-ended');start();}else play({ ...o, replay: true });};
  const close = () => { api.destroy(); o.onClose?.(); };
  q('.rv-make').onclick = close;
  q('.rv-close').onclick = close;
  q('.rv-save').onclick = async () => {
    const btn = q('.rv-save');
    btn.disabled = true;
    try {
      const img = await imgP;
      const c = document.createElement('canvas');
      c.width = 900; c.height = 1800;
      c.getContext('2d').drawImage(img, 0, 0, 900, 1800);
      const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `부적소_${o.wish.replace(/\s/g, '')}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      btn.textContent = '저장했어요';
    } catch { btn.textContent = '저장 실패'; }
    finally { btn.disabled = false; }
  };
  const onKey = (e) => { if (e.key === 'Escape' && (o.preview || photoMode)) { e.preventDefault(); e.stopPropagation(); api.destroy(); o.onClose?.(); } };
  addEventListener('keydown', onKey);

  const api = {
    destroy() {
      if (dead) return;
      dead = true;
      clearTimeout(sayTimer);
      stage?.dispose();
      removeEventListener('keydown', onKey);
      root.remove();
      document.documentElement.classList.remove('rv-lock');
      if (current === api) current = null;
    },
  };
  return api;
}

function svgImage(svg) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return img.decode().then(() => img);
}

/* ---------------- 3D stage ---------------- */

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const ease = {
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outBack: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
const rand = (a, b) => a + Math.random() * (b - a);

function canvasTex(THREE, w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const dotTexture = (THREE) => canvasTex(THREE, 64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, '#fff'); r.addColorStop(0.25, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
});

const glowTexture = (THREE) => canvasTex(THREE, 256, 256, (g) => {
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(255,240,190,1)'); r.addColorStop(0.35, 'rgba(255,200,90,.45)'); r.addColorStop(1, 'rgba(255,170,60,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
});

const pillarTexture = (THREE) => canvasTex(THREE, 128, 512, (g, w, h) => {
  const x = g.createLinearGradient(0, 0, w, 0);
  x.addColorStop(0, 'rgba(255,255,255,0)'); x.addColorStop(0.5, 'rgba(255,255,255,1)'); x.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = x; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in';
  const y = g.createLinearGradient(0, 0, 0, h);
  y.addColorStop(0, 'rgba(0,0,0,1)'); y.addColorStop(0.75, 'rgba(0,0,0,.6)'); y.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = y; g.fillRect(0, 0, w, h);
});

const raysTexture = (THREE) => canvasTex(THREE, 512, 512, (g) => {
  g.translate(256, 256);
  g.fillStyle = '#fff';
  for (let i = 0; i < 18; i++) {
    g.rotate((Math.PI * 2) / 18);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(-22, -256); g.lineTo(22, -256); g.closePath(); g.fill();
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'destination-in';
  const r = g.createRadialGradient(256, 256, 20, 256, 256, 256);
  r.addColorStop(0, 'rgba(0,0,0,.9)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 512, 512);
});

// 부적 종이: 살짝 휜 평면.
function paperGeometry(THREE, w, h, curl) {
  const geo = new THREE.PlaneGeometry(w, h, 10, 20);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / w, y = p.getY(i) / h;
    p.setZ(i, curl * (x * x * 2.4 + Math.sin(y * Math.PI * 1.3) * 0.12));
  }
  geo.computeVertexNormals();
  return geo;
}

// 가벼운 가산 혼합 파티클. 수명이 줄면 색이 어두워지며 사라집니다.
class Sparks {
  constructor(THREE, scene, n, size, map) {
    this.n = n; this.i = 0;
    this.pos = new Float32Array(n * 3).fill(-999);
    this.col = new Float32Array(n * 3);
    this.base = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.max = new Float32Array(n).fill(1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.geo = g;
    this.points = new THREE.Points(g, new THREE.PointsMaterial({
      size, map, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.points.frustumCulled = false;
    this.tmp = new THREE.Color();
    scene.add(this.points);
  }
  spawn(x, y, z, vx, vy, vz, life, color) {
    const k = this.i++ % this.n, j = k * 3;
    this.pos[j] = x; this.pos[j + 1] = y; this.pos[j + 2] = z;
    this.vel[j] = vx; this.vel[j + 1] = vy; this.vel[j + 2] = vz;
    this.life[k] = this.max[k] = life;
    this.tmp.set(color);
    this.base[j] = this.tmp.r; this.base[j + 1] = this.tmp.g; this.base[j + 2] = this.tmp.b;
  }
  burst(x, y, z, count, speed, life, colors) {
    for (let i = 0; i < count; i++) {
      const u = rand(-1, 1), a = rand(0, Math.PI * 2), s = Math.sqrt(1 - u * u), v = rand(speed * 0.35, speed);
      this.spawn(x, y, z, Math.cos(a) * s * v, u * v, Math.sin(a) * s * v * 0.6, rand(life * 0.5, life), colors[i % colors.length]);
    }
  }
  update(dt, gravity = 0, drag = 0) {
    const damp = Math.max(0, 1 - drag * dt);
    for (let k = 0; k < this.n; k++) {
      if (this.life[k] <= 0) continue;
      const j = k * 3;
      this.life[k] -= dt;
      if (this.life[k] <= 0) { this.pos[j + 1] = -999; this.col[j] = this.col[j + 1] = this.col[j + 2] = 0; continue; }
      this.vel[j] *= damp; this.vel[j + 1] = this.vel[j + 1] * damp + gravity * dt; this.vel[j + 2] *= damp;
      this.pos[j] += this.vel[j] * dt; this.pos[j + 1] += this.vel[j + 1] * dt; this.pos[j + 2] += this.vel[j + 2] * dt;
      const f = Math.sqrt(this.life[k] / this.max[k]);
      this.col[j] = this.base[j] * f; this.col[j + 1] = this.base[j + 1] * f; this.col[j + 2] = this.base[j + 2] * f;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}

function createStage(THREE, canvas, img, effect, ui) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  camera.position.set(0, 0, 7);

  const tc = document.createElement('canvas');
  tc.width = 512; tc.height = 1024;
  tc.getContext('2d').drawImage(img, 0, 0, 512, 1024);
  const tex = new THREE.CanvasTexture(tc);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const paperMat = new THREE.MeshStandardMaterial({
    map: tex, side: THREE.DoubleSide, roughness: 0.82, metalness: 0,
    emissive: 0xffe2a0, emissiveMap: tex, emissiveIntensity: 0.12,
  });
  const hero = new THREE.Mesh(paperGeometry(THREE, 1.6, 3.2, 0.14), paperMat);
  scene.add(hero);

  const hemi = new THREE.HemisphereLight(0xfff4dc, 0x40243a, 1.4);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 3, 5);
  scene.add(hemi, key);

  const dot = dotTexture(THREE);
  const sparks = new Sparks(THREE, scene, 900, 0.11, dot);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(THREE), color: 0xffd47a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.scale.set(4.4, 6, 1);
  scene.add(halo);

  const rings = [];
  const ringGeo = new THREE.RingGeometry(0.92, 1, 96);
  function ring(x, y, z, { color = 0xffe08a, grow = 6, dur = 0.9, start = 0.4 } = {}) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    m.position.set(x, y, z);
    scene.add(m);
    rings.push({ m, age: 0, dur, grow, start });
  }

  let shake = 0, camY = 0;
  const k = {
    THREE, scene, camera, hero, paperMat, tex, hemi, key, sparks, halo, ring, ui,
    paperGeometry: (w, h, c) => paperGeometry(THREE, w, h, c),
    shake(v) { shake = Math.max(shake, v); },
    dot,
  };
  const fx = (EFFECTS[effect] || EFFECTS.descent)(k);

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 세로로 긴 화면에서는 부적이 화면 폭을 넘지 않도록 카메라를 뒤로 뺍니다.
    camera.position.z = camera.aspect < 0.62 ? 7 * (0.62 / camera.aspect) ** 0.55 : 7;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  const fired = new Set();
  const at = (t, time, id, fn) => { if (t >= time && !fired.has(id)) { fired.add(id); fn(); } };

  let t = 0, raf = 0, last = 0, ended = false;
  const api = {
    fast: false,
    start() { last = performance.now(); raf = requestAnimationFrame(frame); },
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => { m.map?.dispose(); m.dispose(); }); });
      renderer.dispose();
    },
  };

  function step(dt) {
    t += dt;
    fx.update(t, dt, at);
    sparks.update(dt, fx.gravity ?? -1.2, 1.4);
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.age += dt;
      const p = r.age / r.dur;
      if (p >= 1) { scene.remove(r.m); r.m.material.dispose(); rings.splice(i, 1); continue; }
      r.m.scale.setScalar(r.start + ease.outCubic(p) * r.grow);
      r.m.material.opacity = 1 - p;
    }
    halo.position.set(hero.position.x, hero.position.y, hero.position.z - 0.3);
    if (!ended && t >= fx.endAt) { ended = true; api.fast = false; ui.end(); }
    // 결과 패널이 올라오면 부적이 가리지 않도록 살짝 위로.
    camY += ((ended ? (fx.endCameraY ?? -0.45) : 0) - camY) * Math.min(1, dt * 3);
    shake *= Math.exp(-dt * 6);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    const n = api.fast ? 5 : 1;
    for (let i = 0; i < n; i++) step(dt);
    camera.position.x = (Math.random() - 0.5) * shake;
    camera.position.y = camY + (Math.random() - 0.5) * shake;
    camera.lookAt(0, camY, 0);
    renderer.render(scene, camera);
  }

  renderer.render(scene, camera);
  return api;
}

/* ---------------- 연출들 ---------------- */

const EFFECTS = {
  // 머니건: 바닥에서 부적이 '촤라라' 뿜어져 나와 화면 가득 흩날리고, 마지막에 큰 부적이 떨어집니다.
  moneygun(k) {
    const { THREE, scene, hero, paperMat, sparks, halo, ui } = k;
    scene.background = new THREE.Color(0x2a0c10);
    scene.fog = new THREE.Fog(0x2a0c10, 9, 24);
    k.hemi.intensity = 1.5;
    const N = 520;
    const mat = paperMat.clone();
    mat.emissiveIntensity = 0.18;
    const inst = new THREE.InstancedMesh(k.paperGeometry(0.44, 0.88, 0.06), mat, N);
    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    inst.frustumCulled = false;
    scene.add(inst);
    const P = new Float32Array(N * 3), V = new Float32Array(N * 3), R = new Float32Array(N * 3), W = new Float32Array(N * 3);
    const alive = new Uint8Array(N), ph = new Float32Array(N);
    const o = new THREE.Object3D();
    o.scale.setScalar(0); o.updateMatrix();
    for (let i = 0; i < N; i++) inst.setMatrixAt(i, o.matrix);
    let next = 0, acc = 0;

    function fire(t, fromTop = false) {
      const i = next++ % N, j = i * 3;
      alive[i] = 1; ph[i] = rand(0, 6.3);
      if (fromTop) {
        P[j] = rand(-3.4, 3.4); P[j + 1] = rand(3.4, 4.4); P[j + 2] = rand(-2, 1);
        V[j] = rand(-0.3, 0.3); V[j + 1] = rand(-1.2, -0.6); V[j + 2] = 0;
      } else {
        const ex = Math.sin(t * 2.6) * 1.5;
        P[j] = ex; P[j + 1] = -3.3; P[j + 2] = 1.0;
        V[j] = rand(-2.2, 2.2) + ex * 0.5; V[j + 1] = rand(7.5, 11.5); V[j + 2] = rand(-4, 0.2);
        if (Math.random() < 0.3) sparks.spawn(ex, -3.1, 1.6, rand(-1, 1), rand(1, 3), 0, 0.4, 0xffd26a);
      }
      R[j] = rand(0, 6); R[j + 1] = rand(0, 6); R[j + 2] = rand(0, 6);
      W[j] = rand(-14, 14); W[j + 1] = rand(-10, 10); W[j + 2] = rand(-14, 14);
    }

    const fireFrom = 0.35, fireTo = 3.6, drop = 3.4, land = 4.3;
    hero.scale.setScalar(0.88);
    hero.position.set(0, 7, 1.4);
    hero.visible = false;

    return {
      endAt: land + 0.6,
      endCameraY: -0.3, // 가까이 있는 폭격 부적은 결과 화면에서 덜 올립니다.
      gravity: -2,
      update(t, dt, at) {
        at(t, fireFrom, 'burst', () => { for (let i = 0; i < 28; i++) fire(t); k.shake(0.25); });
        at(t, land, 'land', () => {
          ui.flash('#ffe6a8', 0.6);
          k.shake(0.3);
          k.ring(0, 0, 1.4, { grow: 5, dur: 0.8 });
          sparks.burst(0, 0, 1.5, 180, 6, 1.2, [0xffe39a, 0xff8a5c, 0xfff4d6]);
        });
        if (t >= fireFrom && t < fireTo) {
          acc += dt * 105;
          while (acc >= 1) { fire(t); acc--; }
          k.shake(0.07);
        } else if (t >= fireTo && Math.random() < dt * 9) fire(t, true);

        for (let i = 0; i < N; i++) {
          if (!alive[i]) continue;
          const j = i * 3;
          V[j + 1] -= 9 * dt;
          if (V[j + 1] < 0) {
            // 떨어질 땐 공기저항으로 팔랑팔랑
            const d = Math.max(0, 1 - 2.2 * dt);
            V[j] = V[j] * d + Math.sin(t * 3.2 + ph[i]) * 3 * dt;
            V[j + 2] *= d;
            V[j + 1] = Math.max(V[j + 1], -1.5 - Math.sin(t * 4 + ph[i]) * 0.4);
            W[j] *= 1 - dt * 0.8; W[j + 2] *= 1 - dt * 0.8;
            R[j] += Math.sin(t * 5 + ph[i]) * dt * 3;
          }
          P[j] += V[j] * dt; P[j + 1] += V[j + 1] * dt; P[j + 2] += V[j + 2] * dt;
          R[j] += W[j] * dt; R[j + 1] += W[j + 1] * dt; R[j + 2] += W[j + 2] * dt;
          if (P[j + 1] < -5) { alive[i] = 0; o.scale.setScalar(0); }
          else { o.scale.setScalar(1); o.position.set(P[j], P[j + 1], P[j + 2]); o.rotation.set(R[j], R[j + 1], R[j + 2]); }
          o.updateMatrix();
          inst.setMatrixAt(i, o.matrix);
        }
        inst.instanceMatrix.needsUpdate = true;

        if (t >= drop) {
          hero.visible = true;
          const s = t - drop, e = ease.outBack(seg(t, drop, land));
          hero.position.set(0, 7 - 7 * e + (t > land ? Math.sin((t - land) * 1.3) * 0.06 : 0), 1.4);
          hero.rotation.set(0, Math.sin(s * 0.9) * 0.25, Math.sin(s * 7) * 0.45 * Math.exp(-s * 2.2));
          if (t >= land) {
            const l = t - land;
            paperMat.emissiveIntensity = 0.15 + 1.6 * Math.exp(-l * 2.5);
            halo.material.opacity = 0.3 + 0.6 * Math.exp(-l * 1.5);
          }
        }
      },
    };
  },

  // 행운가득: 네잎클로버·꽃잎·금화가 회오리처럼 솟구쳤다 흩날리고, 그 바람을 타고 부적이 떠오릅니다.
  descent(k) {
    const { THREE, scene, hero, paperMat, sparks, halo, ui } = k;
    const backdrop=createLuckBackdrop(THREE,scene);
    scene.fog=new THREE.Fog(0xc5d8b5,9,24);
    const glowMap = glowTexture(THREE), bokeh = [];
    for (let i = 0; i < 46; i++) {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: [0xe5e9c7, 0xc5ddd1, 0xe4efed, 0xf2e8c7][i % 4], transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      const sc = rand(0.8, 3.4);
      m.scale.set(sc, sc, 1);
      m.position.set(rand(-9, 9), rand(-6, 6), rand(-12, -4));
      m.userData = { base: rand(0.07, 0.17), ph: rand(0, 6.3), vy: rand(0.1, 0.45) };
      bokeh.push(m); scene.add(m);
    }
    k.hemi.color.set(0xffffff); k.hemi.groundColor.set(0xd8e8c8); k.hemi.intensity = 2.1;
    k.key.intensity = 1.3;
    halo.material.color.set(0xfff0b8);

    // 네잎클로버: 은은한 그라데이션 텍스처를 오목하게 휜 판에 입혀 입체감 있게
    const cloverTex = canvasTex(THREE, 512, 512, (g, w) => {
      const c = w / 2;
      g.translate(c, c);
      // 짧은 줄기
      g.strokeStyle = '#c9d9bd'; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(18, 120, 60, 225); g.stroke();
      for (let i = 0; i < 4; i++) {
        g.save(); g.rotate(i * Math.PI / 2 + Math.PI / 4 + (i % 2 ? 0.05 : -0.04));
        const L = 205;
        const leaf = new Path2D();
        leaf.moveTo(0, -6);
        leaf.bezierCurveTo(-L * 0.62, -L * 0.3, -L * 0.6, -L * 1.02, -L * 0.2, -L * 1.0);
        leaf.bezierCurveTo(-L * 0.06, -L * 0.99, 0, -L * 0.9, 0, -L * 0.8);
        leaf.bezierCurveTo(0, -L * 0.9, L * 0.06, -L * 0.99, L * 0.2, -L * 1.0);
        leaf.bezierCurveTo(L * 0.6, -L * 1.02, L * 0.62, -L * 0.3, 0, -6);
        const gr = g.createRadialGradient(0, -L * 0.25, 4, 0, -L * 0.55, L * 0.75);
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, '#e4eedd'); gr.addColorStop(1, '#bccdb2');
        g.fillStyle = gr; g.fill(leaf);
        g.save(); g.clip(leaf);
        // 아주 옅은 가운데 잎맥만
        g.strokeStyle = 'rgba(220,250,200,.22)'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(0, -4); g.lineTo(0, -L * 0.72); g.stroke();
        g.restore();
        g.strokeStyle = 'rgba(60,80,50,.22)'; g.lineWidth = 2; g.stroke(leaf);
        g.restore();
      }
      g.fillStyle = '#a9bd9c'; g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill();
    });
    const cloverGeo = new THREE.PlaneGeometry(0.62, 0.62, 14, 14);
    { const pos = cloverGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), r2 = (x * x + y * y) / 0.096, a = Math.atan2(y, x);
        // 가운데가 오목하고, 잎 사이(대각선 아닌 축 방향)는 살짝 접힌 형태
        pos.setZ(i, r2 * 0.09 + Math.cos(a * 4) * 0.025 * r2);
      }
      cloverGeo.computeVertexNormals(); }
    const o = new THREE.Object3D(), col = new THREE.Color();
    function swarm(geo, mat, n, palette) {
      const inst = new THREE.InstancedMesh(geo, mat, n);
      inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      inst.frustumCulled = false;
      o.scale.setScalar(0); o.updateMatrix();
      for (let i = 0; i < n; i++) { inst.setMatrixAt(i, o.matrix); inst.setColorAt(i, col.set(palette[i % palette.length]).offsetHSL(rand(-0.02, 0.02), 0, rand(-0.05, 0.05))); }
      scene.add(inst);
      return { inst, n, next: 0, P: new Float32Array(n * 3), V: new Float32Array(n * 3), R: new Float32Array(n * 3), W: new Float32Array(n * 3), S: new Float32Array(n), M: new Uint8Array(n), ph: new Float32Array(n), alive: new Uint8Array(n) };
    }
    const side = THREE.DoubleSide;
    const clovers = swarm(cloverGeo, new THREE.MeshStandardMaterial({ map: cloverTex, side, alphaTest: 0.45, roughness: 0.55, emissive: 0xffffff, emissiveMap: cloverTex, emissiveIntensity: 0.08 }), 760, [0xd4ea5a, 0xb6e05a, 0x8fd456, 0x63c04c, 0x45a843, 0xc8e86e, 0x9fdc5e, 0xe2ee7a, 0x72c850]);
    const all = [clovers];

    // mode 0: 아래 모서리에서 회오리처럼 솟구침, 1: 위에서 살랑살랑, 2: 부적 주변으로 퍼지는 꽃가루
    function fire(sw, mode, sx = 1) {
      const i = sw.next++ % sw.n, j = i * 3;
      sw.alive[i] = 1; sw.ph[i] = rand(0, 6.3); sw.S[i] = Math.random() < 0.18 ? rand(2.2, 4.2) : Math.random() < 0.5 ? rand(0.4, 0.7) : rand(0.75, 1.15); sw.M[i] = mode;
      const P = sw.P, V = sw.V;
      if (mode === 0) {
        P[j] = sx * rand(3.2, 4.6); P[j + 1] = rand(-4.6, -3.6); P[j + 2] = rand(-2, 1.5);
        V[j] = -sx * rand(1.2, 4.2); V[j + 1] = rand(6.5, 10.5); V[j + 2] = rand(-1.5, 1);
      } else if (mode === 1) {
        P[j] = rand(-4.8, 4.8); P[j + 1] = rand(4, 5.2); P[j + 2] = Math.random() < 0.2 ? rand(0.8, 2) : rand(-3.5, -0.2);
        V[j] = rand(-0.3, 0.6); V[j + 1] = rand(-1.1, -0.5); V[j + 2] = 0;
      } else if (mode === 3) {
        // 화면 안쪽 깊은 곳에서 카메라 쪽으로 쏟아져 나옴
        const a = rand(0, Math.PI * 2), r = rand(0.2, 1.6), x0 = hero.position.x, y0 = hero.position.y;
        P[j] = x0 + Math.cos(a) * r; P[j + 1] = y0 + Math.sin(a) * r; P[j + 2] = rand(-16, -9);
        const sp = rand(9, 16), spread = rand(0.18, 0.42);
        V[j] = Math.cos(a) * sp * spread; V[j + 1] = Math.sin(a) * sp * spread; V[j + 2] = sp;
        sw.S[i] *= 1.15;
      } else {
        const a = rand(0, Math.PI * 2), s = rand(2.5, 6.5);
        P[j] = hero.position.x + rand(-0.5, 0.5); P[j + 1] = hero.position.y + rand(-1, 1); P[j + 2] = 0;
        V[j] = Math.cos(a) * s; V[j + 1] = Math.sin(a) * s + 1.5; V[j + 2] = rand(-2.5, 0.4);
      }
      sw.R[j] = rand(0, 6); sw.R[j + 1] = rand(0, 6); sw.R[j + 2] = rand(0, 6);
      sw.W[j] = rand(-9, 9); sw.W[j + 1] = rand(-7, 7); sw.W[j + 2] = rand(-9, 9);
    }
    const pick = () => clovers;

    const gustFrom = 0.25, gustTo = 2.2, rise = 0.7, land = 2.7;
    hero.position.set(0, -6, 0.4);
    let acc = 0, depthAcc = 0;

    return {
      endAt: land + 1.5,
      gravity: -0.5,
      update(t, dt, at) {
        backdrop.update(t);
        at(t, gustFrom, 'gust', () => { for (let i = 0; i < 20; i++) fire(pick(), 0, i % 2 ? 1 : -1); });
        at(t, land, 'land', () => {
          ui.flash('#fffbea', 0.55);
          k.ring(0, 0, 0.2, { color: 0x8fdc8a, grow: 5, dur: 1.1 });
          k.ring(0, 0, 0.1, { color: 0xffd27a, grow: 3.6, dur: 1.3, start: 0.2 });
          sparks.burst(0, 0, 0.6, 140, 4.5, 1.6, [0xffe39a, 0xb8f0a8, 0xffffff]);
          for (let i = 0; i < 26; i++) fire(pick(), 2);
          for (let i = 0; i < 40; i++) fire(pick(), 3);
        });
        if (t >= gustFrom && t < gustTo) {
          acc += dt * 55;
          while (acc >= 1) { fire(pick(), 0, Math.random() < 0.5 ? 1 : -1); acc--; }
        } else if (t >= gustTo && Math.random() < dt * 10) fire(pick(), 1);
        if (t > 0.6) { depthAcc += dt * (t < land ? 13 : 9); while (depthAcc >= 1) { fire(Math.random() < 0.8 ? clovers : pick(), 3); depthAcc--; } }

        for (const b of bokeh) {
          const u = b.userData;
          b.position.y += u.vy * dt; if (b.position.y > 7) b.position.y = -7;
          b.material.opacity = u.base * seg(t, 0, 0.8) * (0.7 + 0.3 * Math.sin(t * 0.7 + u.ph));
        }

        for (const sw of all) {
          const { P, V, R, W, S, ph, alive, inst } = sw;
          for (let i = 0; i < sw.n; i++) {
            if (!alive[i]) continue;
            const j = i * 3;
            if (sw.M[i] === 3) {
              P[j] += V[j] * dt; P[j + 1] += V[j + 1] * dt; P[j + 2] += V[j + 2] * dt;
              R[j] += W[j] * dt * 0.6; R[j + 1] += W[j + 1] * dt * 0.6; R[j + 2] += W[j + 2] * dt * 0.6;
              if (P[j + 2] > k.camera.position.z - 0.4) { alive[i] = 0; o.scale.setScalar(0); }
              else { o.scale.setScalar(S[i]); o.position.set(P[j], P[j + 1], P[j + 2]); o.rotation.set(R[j], R[j + 1], R[j + 2]); }
              o.updateMatrix(); inst.setMatrixAt(i, o.matrix);
              continue;
            }
            V[j + 1] -= 7 * dt;
            if (V[j + 1] < 0) {
              // 떨어질 땐 바람에 살랑살랑
              const d = Math.max(0, 1 - 2.4 * dt);
              V[j] = V[j] * d + (Math.sin(t * 2.4 + ph[i]) * 2.6 + 0.6) * dt;
              V[j + 2] *= d;
              V[j + 1] = Math.max(V[j + 1], -0.9 - Math.sin(t * 3 + ph[i]) * 0.35);
              W[j] *= 1 - dt * 0.6; W[j + 2] *= 1 - dt * 0.6;
              R[j] += Math.sin(t * 4 + ph[i]) * dt * 2.4;
            }
            P[j] += V[j] * dt; P[j + 1] += V[j + 1] * dt; P[j + 2] += V[j + 2] * dt;
            R[j] += W[j] * dt; R[j + 1] += W[j + 1] * dt; R[j + 2] += W[j + 2] * dt;
            if (P[j + 1] < -6) { alive[i] = 0; o.scale.setScalar(0); }
            else { o.scale.setScalar(S[i]); o.position.set(P[j], P[j + 1], P[j + 2]); o.rotation.set(R[j], R[j + 1], R[j + 2]); }
            o.updateMatrix();
            inst.setMatrixAt(i, o.matrix);
          }
          inst.instanceMatrix.needsUpdate = true;
        }

        if (t < land) {
          const e = ease.outBack(seg(t, rise, land));
          hero.position.set(Math.sin(t * 2.2) * 0.25 * (1 - e), -6 + 6 * e, 0.4);
          hero.rotation.set(0, (1 - e) * Math.PI * 5, Math.sin(t * 3) * 0.2 * (1 - e));
          if (t > rise && Math.random() < dt * 40) sparks.spawn(hero.position.x + rand(-0.7, 0.7), hero.position.y - rand(1, 1.8), rand(0, 0.6), rand(-0.2, 0.2), rand(-0.6, -0.1), 0, rand(0.6, 1.2), Math.random() < 0.5 ? 0xffe39a : 0xb8f0a8);
        } else {
          const s = t - land;
          hero.position.set(0, Math.sin(s * 1.3) * 0.07, 0.4);
          hero.rotation.set(0, Math.sin(s * 0.8) * 0.26, Math.sin(s * 1.1) * 0.03);
          paperMat.emissiveIntensity = 0.2 + 1.2 * Math.exp(-s * 2.2);
          halo.material.opacity = 0.3 + 0.45 * Math.exp(-s * 1.4);
          if (Math.random() < dt * 14) sparks.spawn(rand(-2.5, 2.5), rand(-2, 2.5), rand(-0.5, 1), rand(-0.1, 0.1), rand(0.1, 0.4), 0, rand(1, 2), Math.random() < 0.5 ? 0xffe39a : 0xffffff);
        }
      },
    };
  },
  // 하트하트: 반짝이는 하트 풍선 다발이 부적을 들고 둥실 떠오르고, 자리 잡으면 풍선들이 놓여 날아가며 작은 하트가 쏟아집니다.
  hearts(k) {
    const { THREE, scene, hero, paperMat, sparks, halo, ui } = k;
    scene.background = canvasTex(THREE, 512, 512, (g, w, h) => {
      const r = g.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.5, w * 0.78);
      r.addColorStop(0, '#fff3f7'); r.addColorStop(0.35, '#ffd3e2'); r.addColorStop(0.75, '#f7a3c0'); r.addColorStop(1, '#d9708f');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
    });
    k.hemi.color.set(0xffffff); k.hemi.groundColor.set(0xffc6d6); k.hemi.intensity = 1.6;
    k.key.intensity = 2.2; k.key.position.set(-3, 4, 6);
    const fill = new THREE.PointLight(0xffe6ee, 2.2, 30, 1.2); fill.position.set(3, -1, 6); scene.add(fill);
    halo.material.color.set(0xffd0de);

    // 은은한 빛망울
    const glowMap = glowTexture(THREE), bokeh = [];
    for (let i = 0; i < 34; i++) {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: [0xffffff, 0xffd6e4, 0xfff0f4][i % 3], transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      const sc = rand(0.8, 3); m.scale.set(sc, sc, 1);
      m.position.set(rand(-9, 9), rand(-6, 6), rand(-12, -5));
      m.userData = { base: rand(0.08, 0.22), ph: rand(0, 6.3), vy: rand(0.1, 0.35) };
      bokeh.push(m); scene.add(m);
    }

    // 하트 모양: 통통하게 부푼 풍선 / 납작한 하트 조각
    const hs = new THREE.Shape();
    hs.moveTo(0, 0.25); hs.bezierCurveTo(0, 0.25, -0.05, 0, -0.25, 0); hs.bezierCurveTo(-0.55, 0, -0.55, 0.35, -0.55, 0.35);
    hs.bezierCurveTo(-0.55, 0.55, -0.35, 0.77, 0, 0.95); hs.bezierCurveTo(0.35, 0.77, 0.55, 0.55, 0.55, 0.35);
    hs.bezierCurveTo(0.55, 0.35, 0.55, 0, 0.25, 0); hs.bezierCurveTo(0.1, 0, 0, 0.25, 0, 0.25);
    // 둥근 앞면에서 가장자리로 갈 때만 하트 윤곽으로 변형합니다.
    // 안쪽 링까지 골/꼬리를 축소 복제하지 않아 중앙에 접힌 능선이 생기지 않습니다.
    const balloonGeo = (() => {
      const outline=new THREE.Shape();
      outline.moveTo(0,0.38);
      outline.bezierCurveTo(0.17,0.58,0.39,0.58,0.51,0.39);
      outline.bezierCurveTo(0.68,0.12,0.37,-0.22,0.025,-0.58);
      outline.quadraticCurveTo(0,-0.605,-0.025,-0.58);
      outline.bezierCurveTo(-0.37,-0.22,-0.68,0.12,-0.51,0.39);
      outline.bezierCurveTo(-0.39,0.58,-0.17,0.58,0,0.38);
      const segments=160,rings=48,edge=outline.getSpacedPoints(segments),positions=[],indices=[];
      const depth=0.39;
      positions.push(0,0,depth);
      for(let ring=1;ring<rings;ring++){
        const phi=Math.PI*ring/rings,r=Math.sin(phi),z=depth*Math.cos(phi);
        const blend=r**4;
        for(let i=0;i<segments;i++){
          const p=edge[i],angle=Math.atan2(p.y,p.x);
          const cx=0.49*Math.cos(angle),cy=0.49*Math.sin(angle);
          positions.push(1.055*r*(cx+(p.x-cx)*blend),0.97*r*(cy+(p.y-cy)*blend),z);
        }
      }
      const back=positions.length/3;positions.push(0,0,-depth);
      for(let i=0;i<segments;i++){
        const next=(i+1)%segments;
        indices.push(0,1+next,1+i);
        for(let ring=0;ring<rings-2;ring++){
          const a=1+ring*segments+i,b=1+ring*segments+next;
          indices.push(a,b,a+segments,b,b+segments,a+segments);
        }
        const last=1+(rings-2)*segments;
        indices.push(last+i,last+next,back);
      }
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
      return g;
    })();
    balloonGeo.computeBoundingBox();
    const tipY=balloonGeo.boundingBox.min.y;
    // 작은 둥근 매듭으로 몸통 끝과 줄을 연결합니다.
    const knotGeo=new THREE.LatheGeometry([
      new THREE.Vector2(0.023,-0.055),new THREE.Vector2(0.018,-0.043),
      new THREE.Vector2(0.011,-0.025),new THREE.Vector2(0.014,-0.01),
      new THREE.Vector2(0.018,0.004)
    ],20);
    knotGeo.translate(0,tipY,0);
    const confGeo = new THREE.ShapeGeometry(hs, 10); confGeo.center(); confGeo.rotateZ(Math.PI); confGeo.scale(0.22, 0.22, 0.22);

    const PAL = [0xff4f7a, 0xff7aa2, 0xff2d55, 0xffa3bd, 0xff8a80, 0xe8355f, 0xffc2d4, 0xd92b5a];
    const balloonMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.24, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.18, sheen: 0.6, sheenColor: 0xffe0ea, emissive: 0x5a1424, emissiveIntensity: 0.2, transparent: false, opacity: 1 });
    const o = new THREE.Object3D(), col = new THREE.Color();

    // 떠오르는 풍선 무리 (+ 부적을 든 다발)
    const N = 46, CL = 5, NT = N + CL;
    const balloons = new THREE.InstancedMesh(balloonGeo, balloonMat, NT);
    const knots = new THREE.InstancedMesh(knotGeo, balloonMat, NT);
    for (const m of [balloons, knots]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; }
    for (let i = 0; i < NT; i++) { col.set(PAL[i % PAL.length]).offsetHSL(0, rand(-0.05, 0.05), rand(-0.04, 0.04)); balloons.setColorAt(i, col); knots.setColorAt(i, col); }
    scene.add(balloons, knots);
    // 반투명 풍선은 개별 메시로 그려 카메라 거리순 정렬을 지원합니다.
    const translucent=new Map();
    for(let i=2;i<N;i+=5){
      const mat=balloonMat.clone();
      balloons.getColorAt(i,mat.color);
      mat.transparent=true;mat.opacity=0.74;mat.depthWrite=false;mat.metalness=0;
      const mesh=new THREE.Mesh(balloonGeo,mat);mesh.visible=false;
      scene.add(mesh);translucent.set(i,mesh);
    }
    const SEG = 7;
    const strPos = new Float32Array(NT * SEG * 2 * 3);
    const strGeo = new THREE.BufferGeometry(); strGeo.setAttribute('position', new THREE.BufferAttribute(strPos, 3));
    const strings = new THREE.LineSegments(strGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));
    strings.frustumCulled = false; scene.add(strings);

    const B = [];
    function spawn(b, first) {
      const near = Math.random() < 0.16;
      b.x = near ? (Math.random() < 0.5 ? -1 : 1) * rand(1.9, 5) : rand(-5.5, 5.5); b.z = near ? rand(-2.6, -1.6) : rand(-7, -1.8);
      b.y = first ? rand(-9, -3.5) : rand(-6.5, -5); b.vy = rand(0.9, 1.9) * (near ? 1.3 : 1);
      b.s = near ? rand(1.1, 1.5) : rand(0.55, 1.05); b.ph = rand(0, 6.3); b.on = true; b.len = rand(1.1, 1.7);
      // 회전한 풍선의 가장 앞부분도 종이 뒤에 머물도록 전체 반경을 확보합니다.
      b.z=Math.min(b.z,-0.65-balloonGeo.boundingSphere.radius*b.s);
    }
    for (let i = 0; i < N; i++) { const b = {}; spawn(b, true); b.on = i < 22; if (b.on) b.y = rand(-7, -1.5); B.push(b); }
    const OFF = [[-1.42,3.48,-0.12],[0.16,4.02,0.08],[1.45,3.16,-0.2],[-0.63,2.55,0.14],[0.65,2.49,0.02]];
    const sizes=[0.98,0.77,0.86,0.63,0.72];
    const C=OFF.map((d,i)=>({
      d:[d[0]+rand(-0.12,0.12),d[1]+rand(-0.12,0.12),d[2]],
      x:0,y:0,z:0,s:sizes[i]*rand(0.96,1.04),ph:rand(0,6.3),
      sway:rand(0.035,0.085),pace:rand(1.05,1.65),tilt:rand(-0.09,0.09),
      free:false,vy:0,vx:rand(-0.4,0.4)
    }));

    // 작은 하트 조각 (자리 잡을 때 화면 쪽으로 쏟아짐)
    const NC = 260;
    const conf = new THREE.InstancedMesh(confGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.4, emissive: 0x501020, emissiveIntensity: 0.5 }), NC);
    conf.instanceMatrix.setUsage(THREE.DynamicDrawUsage); conf.frustumCulled = false;
    const CP = new Float32Array(NC * 3), CV = new Float32Array(NC * 3), CR = new Float32Array(NC * 3), CW = new Float32Array(NC * 3), CS = new Float32Array(NC), CA = new Uint8Array(NC), CPH = new Float32Array(NC);
    o.scale.setScalar(0); o.updateMatrix();
    for (let i = 0; i < NC; i++) { conf.setMatrixAt(i, o.matrix); conf.setColorAt(i, col.set(PAL[(i * 3) % PAL.length])); }
    scene.add(conf);
    let cn = 0;
    function fireConf(x, y, toward) {
      const i = cn++ % NC, j = i * 3; CA[i] = 1; CPH[i] = rand(0, 6.3); CS[i] = Math.random() < 0.15 ? rand(2, 3.4) : rand(0.6, 1.4);
      const a = rand(0, Math.PI * 2), sp = rand(2, 6);
      CP[j] = x; CP[j + 1] = y; CP[j + 2] = toward ? rand(-3, 0) : 0.4;
      CV[j] = Math.cos(a) * sp * (toward ? 0.45 : 1); CV[j + 1] = Math.sin(a) * sp * (toward ? 0.45 : 1) + 1.5; CV[j + 2] = toward ? rand(5, 10) : rand(-1.5, 1.5);
      CR[j] = rand(0, 6); CR[j + 1] = rand(0, 6); CR[j + 2] = rand(0, 6); CW[j] = rand(-8, 8); CW[j + 1] = rand(-8, 8); CW[j + 2] = rand(-8, 8);
    }

    const rise = 0.4, land = 3.1, burst = land - 0.55, release = burst + 0.15;
    hero.position.set(0, -8, 0.3);
    let emitAcc = 0;

    function setString(idx, ax, ay, az, bx, by, bz, t, ph) {
      for (let sgi = 0; sgi < SEG; sgi++) {
        const u0 = sgi / SEG, u1 = (sgi + 1) / SEG, base = (idx * SEG + sgi) * 6;
        for (const [u, off] of [[u0, 0], [u1, 3]]) {
          const w = Math.sin(u * Math.PI) * 0.12 * Math.sin(t * 3 + ph + u * 5);
          strPos[base + off] = ax + (bx - ax) * u + w; strPos[base + off + 1] = ay + (by - ay) * u; strPos[base + off + 2] = az + (bz - az) * u;
        }
      }
    }
    function put(mesh, i, x, y, z, s, rx, ry, rz) {
      const glass=mesh===balloons?translucent.get(i):null;
      if(glass){
        glass.visible=s>0;glass.position.set(x,y,z);glass.rotation.set(rx,ry,rz);glass.scale.setScalar(s);
        o.scale.setScalar(0);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);return;
      }
      o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.setScalar(s); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); }

    return {
      endAt: land + 1.7,
      gravity: -0.3,
      update(t, dt, at) {
        at(t, burst, 'land', () => {
          ui.flash('#fff2f6', 0.5);
          k.ring(0, 0, 0.3, { color: 0xff8fb0, grow: 5, dur: 1.1 });
          k.ring(0, 0, 0.2, { color: 0xffffff, grow: 3.4, dur: 1.2, start: 0.2 });
          sparks.burst(0, 0.2, 0.6, 120, 4.5, 1.4, [0xffffff, 0xffc2d4, 0xff7aa2]);
          for (let i = 0; i < 40; i++) fireConf(rand(-0.6, 0.6), rand(-0.5, 1), false);
          for (let i = 0; i < 70; i++) fireConf(rand(-1.6, 1.6), rand(-1.2, 1.6), true);
        });
        at(t, release, 'release', () => { C.forEach((c) => { c.free = true; c.vy = rand(1.2, 2); }); });

        for (const b of bokeh) { const u = b.userData; b.position.y += u.vy * dt; if (b.position.y > 7) b.position.y = -7; b.material.opacity = u.base * seg(t, 0, 0.8) * (0.7 + 0.3 * Math.sin(t * 1.4 + u.ph)); }

        // 풍선 무리 띄우기
        emitAcc += dt * (t < land + 1 ? 9 : 4);
        while (emitAcc >= 1) { emitAcc--; const b = B.find((x) => !x.on); if (b) spawn(b, false); }
        for (let i = 0; i < N; i++) {
          const b = B[i];
          if (!b.on) { put(balloons, i, 0, 0, 0, 0, 0, 0, 0); put(knots, i, 0, 0, 0, 0, 0, 0, 0); setString(i, 0, -50, 0, 0, -50, 0, t, 0); continue; }
          b.y += b.vy * dt;
          const x = b.x + Math.sin(t * 0.9 + b.ph) * 0.35, ry = Math.sin(t * 0.7 + b.ph) * 0.6, rz = Math.sin(t * 1.2 + b.ph) * 0.14;
          if (b.y > 7.5) b.on = false;
          put(balloons, i, x, b.y, b.z, b.s, 0, ry, rz); put(knots, i, x, b.y, b.z, b.s, 0, ry, rz);
          const ty = b.y + tipY * b.s, tx = x - Math.sin(rz) * tipY * b.s;
          setString(i, tx, ty, b.z, tx + Math.sin(t * 0.9 + b.ph + 1) * 0.15, ty - b.len * b.s, b.z, t, b.ph);
        }

        // 부적과 그 위 풍선 다발
        const e = ease.outCubic(seg(t, rise, land));
        if (t < land) {
          hero.position.set(Math.sin(t * 1.3) * 0.3 * (1 - e), -8 + 8 * e, 0.3);
          hero.rotation.set(0, Math.sin(t * 1.1) * 0.35 * (1 - e), Math.sin(t * 1.7) * 0.08 * (1 - e));
        } else {
          const s = t - land;
          hero.position.set(0, Math.sin(s * 1.3) * 0.08, 0.3);
          hero.rotation.set(0, Math.sin(s * 0.8) * 0.22, Math.sin(s * 1.1) * 0.03);
          paperMat.emissiveIntensity = 0.18 + 1.1 * Math.exp(-s * 2.2);
          halo.material.opacity = 0.35 + 0.45 * Math.exp(-s * 1.4);
          if (Math.random() < dt * 10) sparks.spawn(rand(-2.5, 2.5), rand(-2, 2.5), rand(-0.5, 1), 0, rand(0.1, 0.4), 0, rand(1, 2), Math.random() < 0.5 ? 0xffffff : 0xffc2d4);
        }
        const topX = hero.position.x, topY = hero.position.y + 1.55, topZ = hero.position.z;
        C.forEach((c) => {
          if (!c.free) { c.x = topX + c.d[0] + Math.sin(t*c.pace+c.ph)*c.sway; c.y = hero.position.y + c.d[1] + Math.sin(t*(c.pace+0.35)+c.ph)*c.sway*0.65; c.z = topZ + c.d[2]; }
          else { c.vy += dt * 0.8; c.y += c.vy * dt; c.x += c.vx * dt; }
        });
        // 묶여 있을 때와 풀려난 뒤 모두 풍선 몸통 사이에 여유를 둡니다.
        for(let pass=0;pass<3;pass++)for(let i=0;i<C.length;i++)for(let j=i+1;j<C.length;j++){
          const a=C[i],b=C[j],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
          const dist=Math.hypot(dx,dy,dz),min=balloonGeo.boundingSphere.radius*(a.s+b.s)+0.08;
          if(dist<min&&dist>0.0001){const push=(min-dist)/2;a.x-=dx/dist*push;a.y-=dy/dist*push;b.x+=dx/dist*push;b.y+=dy/dist*push;}
        }
        C.forEach((c,n)=>{
          const i=N+n;
          const rz = c.tilt + Math.sin(t*c.pace+c.ph)*0.07 + (c.x-topX)*0.12;
          put(balloons, i, c.x, c.y, c.z, c.s, 0, Math.sin(t * 0.8 + c.ph) * 0.4, rz); put(knots, i, c.x, c.y, c.z, c.s, 0, 0, rz);
          const tx = c.x, ty = c.y + tipY * c.s;
          if (!c.free) setString(i, tx, ty, c.z, topX, topY, topZ, t, c.ph);
          else setString(i, tx, ty, c.z, tx + Math.sin(t + c.ph) * 0.2, ty - 1.4, c.z, t, c.ph);
        });
        balloons.instanceMatrix.needsUpdate = true; knots.instanceMatrix.needsUpdate = true; strGeo.attributes.position.needsUpdate = true;

        // 하트 조각
        for (let i = 0; i < NC; i++) {
          if (!CA[i]) continue; const j = i * 3;
          if (CV[j + 2] > 2.5) { CP[j] += CV[j] * dt; CP[j + 1] += CV[j + 1] * dt; CP[j + 2] += CV[j + 2] * dt; }
          else {
            CV[j + 1] -= 6 * dt;
            if (CV[j + 1] < 0) { const d = Math.max(0, 1 - 2.4 * dt); CV[j] = CV[j] * d + Math.sin(t * 2.6 + CPH[i]) * 2.4 * dt; CV[j + 1] = Math.max(CV[j + 1], -0.9); }
            CP[j] += CV[j] * dt; CP[j + 1] += CV[j + 1] * dt; CP[j + 2] += CV[j + 2] * dt;
          }
          CR[j] += CW[j] * dt; CR[j + 1] += CW[j + 1] * dt; CR[j + 2] += CW[j + 2] * dt;
          if (CP[j + 1] < -6 || CP[j + 2] > k.camera.position.z - 0.4) { CA[i] = 0; o.scale.setScalar(0); o.updateMatrix(); conf.setMatrixAt(i, o.matrix); continue; }
          put(conf, i, CP[j], CP[j + 1], CP[j + 2], CS[i], CR[j], CR[j + 1], CR[j + 2]);
        }
        conf.instanceMatrix.needsUpdate = true;
      },
    };
  },
};
