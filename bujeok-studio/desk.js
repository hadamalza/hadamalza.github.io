// 한밤의 부적 작업대 — 3D 책상 장면. #paper에 그려진 부적을 그대로 책상 위 종이 텍스처로 씁니다.
import * as THREE from './vendor/three.module.min.js';

const paperEl = document.querySelector('#paper');
const workspace = document.querySelector('.workspace');
if (paperEl && workspace) {
  try { start(); } catch (e) { console.warn('3D 책상을 띄우지 못해 평면 화면으로 보여줘요.', e); window.finishBujeokStartup?.(); }
}

function start() {
  const canvas = document.createElement('canvas');
  canvas.className = 'desk3d';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070504);
  scene.fog = new THREE.Fog(0x070504, 90, 190);
  const camera = new THREE.PerspectiveCamera(34, 1, 1, 400);

  // ---------- 책상 ----------
  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(170, 5, 100),
    new THREE.MeshStandardMaterial({ map: woodTexture(renderer), roughness: 0.62, metalness: 0 })
  );
  desk.position.y = -2.5;
  desk.receiveShadow = true;
  scene.add(desk);

  // ---------- 부적 ----------
  const tc = document.createElement('canvas');
  tc.width = 600; tc.height = 1200;
  const talTex = new THREE.CanvasTexture(tc);
  talTex.colorSpace = THREE.SRGBColorSpace;
  talTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const talisman = new THREE.Mesh(paperGeometry(17, 34, 0.5), new THREE.MeshStandardMaterial({ map: talTex, roughness: 0.92 }));
  talisman.rotation.set(-Math.PI / 2, 0, -0.07);
  talisman.position.set(0, 0.35, 0);
  talisman.castShadow = talisman.receiveShadow = true;
  scene.add(talisman);

  // 뒤쪽에 깔린 낡은 부적 두 장
  [[-15, -14, 0.5, 0.95], [12, -21, -0.35, 0.8]].forEach(([x, z, r, s], i) => {
    const m = new THREE.Mesh(paperGeometry(15 * s, 30 * s, 0.12), new THREE.MeshStandardMaterial({ map: oldTalismanTexture(i), roughness: 0.95 }));
    m.rotation.set(-Math.PI / 2, 0, r);
    m.position.set(x, 0.05 + i * 0.03, z);
    m.receiveShadow = true;
    scene.add(m);
  });

  // ---------- 촛대와 촛불 ----------
  const candle = new THREE.Group();
  candle.position.set(19, 0, -19);
  const brass = new THREE.MeshStandardMaterial({ color: 0x8a6230, metalness: 0.85, roughness: 0.35 });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.8, 0.8, 40), brass);
  plate.position.y = 0.4;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 3, 24), brass);
  stem.position.y = 2.2;
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2, 1.2, 32), brass);
  cup.position.y = 4.2;
  const wax = new THREE.Mesh(waxGeometry(), new THREE.MeshStandardMaterial({ color: 0xefe2c4, roughness: 0.55, emissive: 0xffa040, emissiveIntensity: 0.06 }));
  wax.position.y = 4.8;
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 6), new THREE.MeshBasicMaterial({ color: 0x140a04 }));
  wick.position.y = 17.6;
  [plate, stem, cup, wax].forEach((m) => { m.receiveShadow = true; });
  candle.add(plate, stem, cup, wax, wick);

  const glowTex = radialTexture([[0, 'rgba(255,250,225,1)'], [0.22, 'rgba(255,200,110,.9)'], [0.5, 'rgba(255,130,40,.25)'], [1, 'rgba(255,90,20,0)']]);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  flame.scale.set(1.6, 3.6, 1);
  flame.position.y = 19.4;
  const flameGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb060, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  flameGlow.scale.setScalar(16);
  flameGlow.position.y = 19.2;
  candle.add(flame, flameGlow);
  scene.add(candle);

  // 촛불빛: 그림자를 드리우는 스포트라이트 + 주변을 채우는 점광원
  const light = new THREE.SpotLight(0xff9a48, 2400, 0, 1.25, 1, 2);
  light.position.set(19, 19.6, -19);
  light.target.position.set(-4, 0, 10);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.bias = -0.0008;
  light.shadow.normalBias = 0.05;
  light.shadow.camera.near = 2;
  light.shadow.camera.far = 140;
  const fill = new THREE.PointLight(0xff9a48, 700, 0, 2);
  fill.position.set(19, 19.6, -19);
  scene.add(light, light.target, fill);

  // 차가운 달빛 한 줄기 + 아주 어두운 환경광
  scene.add(new THREE.HemisphereLight(0x33405e, 0x0b0705, 0.42));
  // 방 바깥에서 새어 드는 은은한 주황빛
  const lamp = new THREE.DirectionalLight(0xff8a3c, 0.55);
  lamp.position.set(-70, 55, 90);
  scene.add(lamp);
  const moon = new THREE.DirectionalLight(0x6f86c8, 0.35);
  moon.position.set(-60, 80, -40);
  scene.add(moon);

  // ---------- 벼루, 먹, 붓, 인주 ----------
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x2b2826, roughness: 0.55, metalness: 0.1 });
  const inkstone = new THREE.Group();
  const slab = new THREE.Mesh(roundedBox(15, 2.6, 22, 1.4), stoneMat);
  slab.position.y = 1.3;
  const inkPool = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.3, 40), new THREE.MeshStandardMaterial({ color: 0x050404, roughness: 0.08, metalness: 0.2 }));
  inkPool.scale.z = 1.25;
  inkPool.position.set(0, 2.5, -4.5);
  const inkstick = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 10), new THREE.MeshStandardMaterial({ color: 0x0d0c0c, roughness: 0.4 }));
  inkstick.position.set(1.5, 3.4, 4.5);
  inkstick.rotation.y = 0.25;
  [slab, inkstick].forEach((m) => { m.castShadow = m.receiveShadow = true; });
  inkstone.add(slab, inkPool, inkstick);
  inkstone.position.set(-21, 0, 15);
  inkstone.rotation.y = -0.35;
  scene.add(inkstone);

  const brush = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 25, 16), new THREE.MeshStandardMaterial({ color: 0x8a5a2c, roughness: 0.45 }));
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.62, 1.8, 16), new THREE.MeshStandardMaterial({ color: 0x1e1612, roughness: 0.4, metalness: 0.3 }));
  ferrule.position.y = -13.4;
  const tip = new THREE.Mesh(new THREE.LatheGeometry([0, 0.75, 0.85, 0.7, 0.4, 0].map((r, i) => new THREE.Vector2(r || 0.001, -i * 1.1)), 16), new THREE.MeshStandardMaterial({ color: 0x0a0807, roughness: 0.75 }));
  tip.position.y = -14.3;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0x7a1a12, roughness: 0.4 }));
  cap.position.y = 12.9;
  [shaft, ferrule, tip, cap].forEach((m) => { m.castShadow = true; brush.add(m); });
  brush.rotation.set(0, 0.55, Math.PI / 2);
  brush.position.set(19, 0.8, 16);
  scene.add(brush);

  const dish = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.1, 1.8, 40), new THREE.MeshStandardMaterial({ color: 0xd9d4c8, roughness: 0.25 }));
  bowl.position.y = 0.9;
  const paste = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 0.2, 40), new THREE.MeshStandardMaterial({ color: 0x9e1a10, roughness: 0.85 }));
  paste.position.y = 1.75;
  bowl.castShadow = true;
  dish.add(bowl, paste);
  dish.position.set(-17, 0, -22);
  scene.add(dish);

  // ---------- 연기와 먼지 ----------
  const smokeTex = radialTexture([[0, 'rgba(200,190,180,.55)'], [1, 'rgba(200,190,180,0)']]);
  const smoke = Array.from({ length: 14 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, opacity: 0, depthWrite: false }));
    s.userData.t = i / 14;
    scene.add(s);
    return s;
  });
  const dustN = 160, dustPos = new Float32Array(dustN * 3), dustSeed = new Float32Array(dustN);
  for (let i = 0; i < dustN; i++) {
    dustPos[i * 3] = rand(-45, 55); dustPos[i * 3 + 1] = rand(2, 40); dustPos[i * 3 + 2] = rand(-40, 30); dustSeed[i] = rand(0, 6.3);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.35, map: glowTex, color: 0xffc890, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  // ---------- 부적 텍스처 동기화 ----------
  let pending = 0, textureRevision = 0, textureReady = false, firstFrameShown = false;
  function syncTexture() {
    const svg = paperEl.querySelector('svg');
    if (!svg) return;
    const revision = ++textureRevision;
    const img = new Image();
    img.onload = () => {
      if(revision !== textureRevision)return;
      const g = tc.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.clearRect(0, 0, tc.width, tc.height);
      g.drawImage(img, 0, 0, tc.width, tc.height);
      talTex.needsUpdate = true;
      textureReady = true;
      // 새로 쓴 부적이 살짝 내려앉는 느낌
      drop = 1;
    };
    img.onerror = () => window.finishBujeokStartup?.();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.outerHTML);
  }
  new MutationObserver(() => { cancelAnimationFrame(pending); pending = requestAnimationFrame(syncTexture); }).observe(paperEl, { childList: true, subtree: true });

  // ---------- 배치와 크기 ----------
  const wide = matchMedia('(min-width: 901px)');
  let W = 1, H = 1, fitDist = 1;
  function place() {
    if (wide.matches) { canvas.classList.add('desk3d-full'); document.body.prepend(canvas); }
    else { canvas.classList.remove('desk3d-full'); workspace.prepend(canvas); }
    resize();
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    if (wide.matches) {
      // 왼쪽 주문서를 피해, 남은 오른쪽 공간 한가운데에 부적이 오도록
      const orderRight = document.querySelector('.order')?.getBoundingClientRect().right || 0;
      const free = Math.max(200, W - orderRight - 24);
      camera.setViewOffset(W, H, -(orderRight + free / 2 - W / 2), -H * 0.025, W, H);
      // 남은 폭에 맞춰 부적을 최대한 크게 (폭이 좁으면 조금 물러남)
      fitDist = Math.min(1.15, Math.max(0.82, (0.62 * H) / free)) * 0.92;
    } else { camera.setViewOffset(W, H, -W * 0.045, 0, W, H); fitDist = 0.92; }
    camera.updateProjectionMatrix();
  }
  wide.addEventListener('change', place);
  addEventListener('resize', resize);
  document.fonts?.ready.then(resize);

  // ---------- 시선(마우스) 따라 살짝 기울기 ----------
  let px = 0, py = 0, tx = 0, ty = 0;
  addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  let raf = 0, last = performance.now(), t = 0, drop = 0;
  const target = new THREE.Vector3(0, 0, 1);

  // ---------- 직접 쓰기: 손에 든 붓 + 화면 좌표 → 부적 좌표 ----------
  const hand = new THREE.Group();
  {
    const bristle = new THREE.Mesh(new THREE.LatheGeometry([[0.001, 0], [0.45, 1.2], [0.8, 2.6], [0.85, 4.2], [0.7, 4.6]].map(([r, y]) => new THREE.Vector2(r, y)), 18), new THREE.MeshStandardMaterial({ color: 0x120c09, roughness: 0.8 }));
    const inkTip = new THREE.Mesh(new THREE.LatheGeometry([[0.001, 0], [0.46, 1.2], [0.7, 2.2], [0.001, 2.25]].map(([r, y]) => new THREE.Vector2(r, y)), 18), new THREE.MeshStandardMaterial({ color: 0x9e1c10, roughness: 0.35 }));
    inkTip.scale.setScalar(1.03);
    const ferrule2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.75, 1.8, 16), new THREE.MeshStandardMaterial({ color: 0x1e1612, roughness: 0.4, metalness: 0.3 }));
    ferrule2.position.y = 5.4;
    const shaft2 = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.55, 26, 16), new THREE.MeshStandardMaterial({ color: 0x8a5a2c, roughness: 0.45 }));
    shaft2.position.y = 19.3;
    const cap2 = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0x7a1a12, roughness: 0.4 }));
    cap2.position.y = 32.6;
    [bristle, inkTip, ferrule2, shaft2, cap2].forEach((m) => { m.castShadow = true; hand.add(m); });
  }
  hand.rotation.set(0.42, 0, -0.38); // 오른손으로 쥔 각도
  hand.visible = false;
  scene.add(hand);
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), deskPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.4), hit = new THREE.Vector3();
  let drawBlend = 0, drawOn = false, penDown = false, touchBrush = false, drawZoom = 1;
  const handTarget = new THREE.Vector3(0, 6, 0), brushRest = new THREE.Vector3();
  function ray(cx, cy) {
    const r = canvas.getBoundingClientRect();
    if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return false;
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return true;
  }
  window.bujeokDesk = {
    paper: tc,
    refresh() { talTex.needsUpdate = true; },
    resync: syncTexture,
    pick(cx, cy) {
      if (!ray(cx, cy)) return null;
      const h = raycaster.intersectObject(talisman, false)[0];
      return h && h.uv ? { x: h.uv.x * 300, y: (1 - h.uv.y) * 600 } : null;
    },
    setDrawMode(on) { drawOn = on; hand.visible = on; brush.visible = !on;penDown=false;if(!on){drawZoom=1;camera.zoom=1;camera.updateProjectionMatrix();} },
    setDrawZoom(value){drawZoom=Math.max(1,Math.min(2.5,value));camera.zoom=drawOn?drawZoom:1;camera.updateProjectionMatrix();return drawZoom;},
    getDrawZoom(){return drawZoom;},
    brushAt(cx, cy, down, pointerType) {
      if(pointerType)touchBrush=pointerType==='touch';
      penDown = down;
      if (!ray(cx, cy) || !raycaster.ray.intersectPlane(deskPlane, hit)) return;
      handTarget.set(hit.x, hit.y, hit.z);
    },
  };

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now; t += dt;
    px += (tx - px) * Math.min(1, dt * 2.5); py += (ty - py) * Math.min(1, dt * 2.5);
    const narrow = camera.aspect < 0.9;
    const dist = fitDist;
    // 쓰기 중에는 부적 위로 살며시 다가가 내려다봅니다
    drawBlend += ((drawOn ? 1 : 0) - drawBlend) * Math.min(1, dt * 3);
    const b = drawBlend * drawBlend * (3 - 2 * drawBlend), k = 1 - b;
    camera.position.set(px * 10 * k, (98 + py * 5 * k) * dist * k + (narrow ? 78 : 66) * b, (40 + py * 4 * k) * dist * k + 13 * b);
    camera.lookAt(target.set((narrow ? 2 : 0) * k, 0, (narrow ? -1 : 1) * k + 0.5 * b));
    if (hand.visible) {
      // 붓끝이 포인터를 부드럽게 따라가고, 누르면 종이에 닿습니다
      handTarget.y = penDown ? 0.4 : 7;
      brushRest.copy(handTarget);
      if(!penDown&&(touchBrush||!wide.matches)){brushRest.x=Math.max(14,handTarget.x+8);brushRest.z=Math.max(-12,Math.min(12,handTarget.z));brushRest.y=8;}
      hand.position.lerp(brushRest, Math.min(1, dt * (penDown?22:7)));
    }

    // 촛불 일렁임: 여러 사인파 + 가끔 툭 꺼질 듯
    const f = 0.9 + Math.sin(t * 4.1) * 0.025 + Math.sin(t * 9.7) * 0.012 + Math.sin(t * 1.7) * 0.03;
    light.intensity = 2400 * f; fill.intensity = 700 * f;
    light.position.x = fill.position.x = 19 + Math.sin(t * 2.1) * 0.1;
    flame.scale.set(1.6 * (0.95 + f * 0.06), 3.6 * (0.9 + f * 0.12), 1);
    flame.material.rotation = Math.sin(t * 2.3) * 0.035;
    flameGlow.material.opacity = 0.42 * f;

    smoke.forEach((s) => {
      const u = (s.userData.t = (s.userData.t + dt * 0.09) % 1);
      s.position.set(19 + Math.sin(u * 9 + t * 0.6) * u * 3.5, 21 + u * 34, -19 + Math.cos(u * 7) * u * 2);
      s.scale.setScalar(2 + u * 12);
      s.material.opacity = Math.sin(u * Math.PI) * 0.12;
    });
    for (let i = 0; i < dustN; i++) {
      dustPos[i * 3 + 1] += Math.sin(t * 0.3 + dustSeed[i]) * dt * 0.4;
      dustPos[i * 3] += Math.cos(t * 0.2 + dustSeed[i]) * dt * 0.3;
    }
    dustGeo.attributes.position.needsUpdate = true;

    drop = Math.max(0, drop - dt * 2.2);
    talisman.position.y = 0.35 + Math.sin(drop * Math.PI) * 1.2;
    renderer.render(scene, camera);
    if(textureReady && !firstFrameShown){firstFrameShown=true;window.finishBujeokStartup?.();}
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else { last = performance.now(); raf = requestAnimationFrame(frame); }
  });

  place();
  syncTexture();
  document.documentElement.classList.add('desk-3d');
  raf = requestAnimationFrame(frame);
}

/* ---------- 도우미 ---------- */
function rand(a, b) { return a + Math.random() * (b - a); }

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function radialTexture(stops) {
  return canvasTexture(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([o, c]) => r.addColorStop(o, c));
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  });
}

function flameTexture() {
  return canvasTexture(64, 128, (g) => {
    const r = g.createRadialGradient(32, 92, 2, 32, 80, 60);
    r.addColorStop(0, 'rgba(255,255,245,1)');
    r.addColorStop(0.25, 'rgba(255,225,140,1)');
    r.addColorStop(0.55, 'rgba(255,140,40,.7)');
    r.addColorStop(1, 'rgba(255,80,10,0)');
    g.fillStyle = r;
    g.beginPath();
    g.moveTo(32, 4);
    g.bezierCurveTo(46, 50, 56, 82, 32, 120);
    g.bezierCurveTo(8, 82, 18, 50, 32, 4);
    g.fill();
    g.fillStyle = 'rgba(60,90,255,.35)';
    g.beginPath(); g.ellipse(32, 108, 7, 9, 0, 0, Math.PI * 2); g.fill();
  });
}

function woodTexture(renderer) {
  const t = canvasTexture(2048, 1024, (g, w, h) => {
    g.fillStyle = '#2c1a0f'; g.fillRect(0, 0, w, h);
    // 나뭇결: 가로로 흐르는 물결 무늬
    for (let y = 0; y < h; y += 2) {
      const v = Math.sin(y * 0.021 + Math.sin(y * 0.0047) * 4) * 0.5 + Math.sin(y * 0.11) * 0.2 + Math.random() * 0.15;
      g.fillStyle = v > 0 ? `rgba(120,70,35,${v * 0.22})` : `rgba(0,0,0,${-v * 0.35})`;
      g.fillRect(0, y, w, 2);
    }
    for (let k = 0; k < 220; k++) {
      const y0 = Math.random() * h, amp = 2 + Math.random() * 10, fr = 0.002 + Math.random() * 0.006, ph = Math.random() * 6;
      g.strokeStyle = Math.random() < 0.7 ? `rgba(0,0,0,${0.08 + Math.random() * 0.2})` : `rgba(150,95,50,${0.05 + Math.random() * 0.1})`;
      g.lineWidth = 0.5 + Math.random() * 2.2;
      g.beginPath();
      for (let x = 0; x <= w; x += 16) { const yy = y0 + Math.sin(x * fr + ph) * amp; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
      g.stroke();
    }
    // 옹이 하나와 오래된 얼룩
    const kx = w * 0.18, ky = h * 0.7;
    for (let r = 46; r > 4; r -= 5) { g.strokeStyle = `rgba(0,0,0,${0.12 + (46 - r) / 260})`; g.lineWidth = 2; g.beginPath(); g.ellipse(kx, ky, r * 2.2, r, 0, 0, Math.PI * 2); g.stroke(); }
    for (let k = 0; k < 6; k++) {
      const r = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      r.addColorStop(0, 'rgba(10,4,2,.35)'); r.addColorStop(1, 'rgba(10,4,2,0)');
      g.save(); g.translate(Math.random() * w, Math.random() * h); g.scale(60 + Math.random() * 120, 40 + Math.random() * 70);
      g.fillStyle = r; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore();
    }
  });
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

function oldTalismanTexture(seed) {
  return canvasTexture(256, 512, (g, w, h) => {
    g.fillStyle = seed ? '#b49a52' : '#c4a95c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(60,40,15,${Math.random() * 0.18})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    g.strokeStyle = 'rgba(120,30,20,.55)'; g.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      g.lineWidth = 5 + Math.random() * 6;
      g.beginPath();
      let x = 50 + Math.random() * 150, y = 60 + i * 45;
      g.moveTo(x, y);
      for (let k = 0; k < 3; k++) { x += rand(-60, 60); y += rand(-10, 25); g.lineTo(Math.max(30, Math.min(w - 30, x)), y); }
      g.stroke();
    }
    const r = g.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.65);
    r.addColorStop(0, 'rgba(40,20,5,0)'); r.addColorStop(1, 'rgba(40,20,5,.6)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
}

function paperGeometry(w, h, lift) {
  const geo = new THREE.PlaneGeometry(w, h, 12, 24);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / w, y = p.getY(i) / h;
    p.setZ(i, lift * (Math.pow(Math.abs(x) * 2, 3) * 0.6 + Math.pow(Math.max(0, y * 2 - 0.6), 2) * 1.2 + (1 + Math.sin(y * 9)) * 0.03));
  }
  geo.computeVertexNormals();
  return geo;
}

function waxGeometry() {
  // 위가 녹아 내려앉은 초. 옆선을 회전시켜 만듭니다.
  const pts = [[0, 0], [2.1, 0], [2.15, 6], [2.05, 11], [2.0, 12.2], [1.6, 12.5], [0.6, 12.1], [0, 12.3]];
  const geo = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 40);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(z, x);
    // 흘러내린 촛농 자국
    const drip = Math.max(0, Math.sin(a * 3 + 1) - 0.6) * Math.max(0, (y - 5) / 7) * 0.35;
    const k = 1 + drip;
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

function roundedBox(w, h, d, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4, bevelSegments: 3, curveSegments: 8 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -h / 2, 0);
  return geo;
}
