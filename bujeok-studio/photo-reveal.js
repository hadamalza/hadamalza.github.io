// Photos remain in this page's memory. No upload, storage, or shared-URL payload.
export function createPhotoStage(root, paperImage, ui, start) {
  root.classList.add('rv-photo');
  const panel=document.createElement('section');panel.className='face-panel';
  panel.innerHTML=`<h2>얼굴 사진을 올리거나 찍어주세요</h2><div class="face-frame"><div class="face-placeholder"><svg viewBox="0 0 160 200" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><ellipse cx="80" cy="75" rx="40" ry="51"/><path d="M20 192c0-55 120-55 120 0M64 76h2m28 0h2M68 101q12 8 24 0"/></svg></div><canvas class="face-photo" width="600" height="800" hidden></canvas><video class="face-video" autoplay playsinline muted hidden></video><img class="face-paper" alt="" hidden><span class="face-impact" hidden aria-hidden="true">탁!</span></div><p class="face-error" role="alert"></p><div class="face-controls"><div class="face-sources"><button class="rv-btn ghost face-upload" type="button">사진 올리기</button><button class="rv-btn ghost face-camera" type="button">사진 찍기</button></div><button class="rv-btn face-go" type="button" disabled>확인</button></div><input class="face-file" type="file" accept="image/*" hidden><input class="face-camera-file" type="file" accept="image/*" capture="user" hidden>`;
  root.append(panel);
  const q=s=>panel.querySelector(s),canvas=q('.face-photo'),video=q('.face-video'),frame=q('.face-frame'),paper=q('.face-paper');
  paper.src=paperImage.src;
  let disposed=false,stream=null,loaded=false,loadingId=0,animations=[],timer=0;
  paper.style.left='50%';paper.style.top='24%';
  const tr=s=>window.bujeokT?.(s)||s;
  function stopCamera(){stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;video.hidden=true;q('.face-camera').textContent=tr('사진 찍기');q('.face-camera').classList.remove('is-capturing');q('.face-placeholder').hidden=loaded;}
  function drawPhoto(source,w,h,mirror=false){const scale=Math.max(600/w,800/h),ctx=canvas.getContext('2d');ctx.save();if(mirror){ctx.translate(600,0);ctx.scale(-1,1);}ctx.drawImage(source,(600-w*scale)/2,(800-h*scale)/2,w*scale,h*scale);ctx.restore();loaded=true;canvas.hidden=false;q('.face-placeholder').hidden=true;q('.face-go').disabled=false;q('.face-error').textContent='';}
  async function loadFile(file){if(!file)return;const id=++loadingId;stopCamera();q('.face-error').textContent='';if(file.size>25*1024*1024){q('.face-error').textContent=tr('25MB 이하 사진을 골라주세요');return;}const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();if(!disposed&&id===loadingId)drawPhoto(img,img.naturalWidth,img.naturalHeight);}catch{if(!disposed)q('.face-error').textContent=tr('사진을 열지 못했어요. 다른 사진을 골라주세요');}finally{URL.revokeObjectURL(url);}}
  q('.face-upload').onclick=()=>q('.face-file').click();
  q('.face-file').onchange=e=>{loadFile(e.target.files[0]);e.target.value='';};
  q('.face-camera-file').onchange=e=>{loadFile(e.target.files[0]);e.target.value='';};
  q('.face-camera').onclick=async()=>{if(stream){if(video.videoWidth){drawPhoto(video,video.videoWidth,video.videoHeight,true);stopCamera();}return;}if(!navigator.mediaDevices?.getUserMedia){q('.face-camera-file').click();return;}stopCamera();const id=++loadingId;q('.face-error').textContent='';try{const next=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});if(disposed||id!==loadingId){next.getTracks().forEach(t=>t.stop());return;}stream=next;video.srcObject=stream;video.hidden=false;q('.face-placeholder').hidden=false;q('.face-camera').textContent=tr('촬영');q('.face-camera').classList.add('is-capturing');q('.face-go').disabled=true;await video.play();}catch{stopCamera();q('.face-go').disabled=!loaded;q('.face-error').textContent=tr('카메라를 열지 못했어요. 사진을 올려주세요');}};
  q('.face-go').onclick=()=>{if(loaded)start();};
  // ── 퇴마 연출 (자동 재생): 얼굴 사진을 붙인 3D 짚인형에 부적이 쏟아져 꽂히고, 마지막 한 장에 혼이 빠져나간다 ──
  const mk=(tag,cls,parent,html)=>{const e=document.createElement(tag);e.className=cls;if(html)e.innerHTML=html;parent?.append(e);return e;};
  // 얼굴 가이드: 사진 캔버스(600x800)와 같은 좌표계라 이 타원 영역을 그대로 잘라 인형 얼굴로 쓴다
  const FACE={cx:300,cy:330,rx:180,ry:236};
  q('.face-placeholder').innerHTML=`<svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true"><ellipse cx="${FACE.cx}" cy="${FACE.cy}" rx="${FACE.rx}" ry="${FACE.ry}" stroke="currentColor" stroke-width="4" stroke-dasharray="16 12"/><path d="M70 800C92 660 190 612 300 612S508 660 530 800" stroke="currentColor" stroke-width="4" stroke-dasharray="16 12"/></svg>`;
  mk('div','face-curse',frame);
  const fx=mk('canvas','face-fx',root),fctx=fx.getContext('2d');
  const SHOTS=9;
  let phase='idle',hits=0,timers=[],raf=0,parts=[],freezeUntil=0,wisps=false,glitterUntil=0,fastMode=false,last=0,doll=null,mode2d=false;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),rnd=(a,b)=>a+Math.random()*(b-a);
  const later=(fn,ms)=>{const t=setTimeout(()=>{if(!disposed)fn();},ms);timers.push(t);return t;};
  function animate(el,frames,options){const a=el.animate(frames,options);animations.push(a);return a;}
  const once=(el,frames,options)=>{animate(el,frames,options).finished.then(()=>el.remove(),()=>el.remove());};
  function area(){const o=root.getBoundingClientRect();return{r:doll&&!mode2d?doll.rect():frame.getBoundingClientRect(),o};}
  function ringAt(x,y,r0,grow,color,life){parts.push({kind:'ring',x,y,vx:0,vy:0,g:0,drag:1,r0,grow,size:7,color,life,max:life});loop();}

  function faceCanvas(){const c=document.createElement('canvas');c.width=360;c.height=472;const g=c.getContext('2d');
    g.drawImage(canvas,FACE.cx-FACE.rx,FACE.cy-FACE.ry,FACE.rx*2,FACE.ry*2,0,0,360,472);
    g.globalCompositeOperation='destination-in';g.translate(180,236);g.scale(1,472/360);
    const r=g.createRadialGradient(0,0,0,0,0,180);r.addColorStop(0,'#000');r.addColorStop(.88,'#000');r.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=r;g.beginPath();g.arc(0,0,180,0,7);g.fill();return c;}

  // 파티클 (불꽃·먹물·원귀의 연기·금가루)
  function size(){const r=root.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);fx.width=Math.round(r.width*dpr);fx.height=Math.round(r.height*dpr);fctx.setTransform(dpr,0,0,dpr,0,0);}
  function at(px,py){const r=frame.getBoundingClientRect(),o=root.getBoundingClientRect();return{x:r.left-o.left+r.width*px,y:r.top-o.top+r.height*py};}
  function ghostAt(){const r=frame.getBoundingClientRect(),o=root.getBoundingClientRect();return{x:r.left-o.left+r.width/2,y:r.top-o.top+r.height*.36,w:r.width*.62};}
  function burst(x,y,kind,n){if(!Number.isFinite(x)||!Number.isFinite(y))return;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2;let s,p;
    if(kind==='spark'){s=rnd(4,13);p={size:rnd(1.5,3),life:rnd(18,34),color:Math.random()<.3?'255,250,230':'255,205,110',g:.18,drag:.9};}
    else if(kind==='ink'){s=rnd(2,8);p={size:rnd(2,5.5),life:rnd(36,60),color:'190,30,22',g:.38,drag:.96,solid:1};}
    else if(kind==='shard'){s=rnd(3,11);p={size:rnd(3,8),life:rnd(40,75),color:Math.random()<.5?'190,150,255':'240,230,255',g:-.04,drag:.95};}
    else{s=rnd(.5,2);p={size:rnd(1.5,3.5),life:rnd(50,90),color:'255,222,140',g:-.06,drag:.98,star:1};}
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(kind==='ink'?2:0),max:p.life,...p,kind});}loop();}
  function loop(){if(!raf&&!disposed)raf=requestAnimationFrame(tick);}
  function tick(now){raf=0;if(disposed)return;const dt=clamp((now-(last||now))/16.7,0,3)||1;last=now;
    if(now<freezeUntil){raf=requestAnimationFrame(tick);return;}
    if(wisps){const {r,o}=area();for(let i=0;i<2;i++)if(Math.random()<.5*dt){const t=Math.random(),edge=t<.4?0:t<.8?1:2;parts.push({kind:'wisp',x:r.left-o.left+(edge===0?rnd(-.08,.08):edge===1?rnd(.92,1.08):rnd(.1,.9))*r.width,y:r.top-o.top+(edge===2?rnd(-.06,.04):rnd(.05,.95))*r.height,vx:rnd(-.4,.4),vy:rnd(-1.6,-.5),size:rnd(8,22),life:rnd(50,85),max:85,color:Math.random()<.5?'150,100,230':'90,40,160',g:-.01,drag:.99,ph:Math.random()*6});}}
    if(now<glitterUntil){const {r,o}=area();if(Math.random()<.45*dt)parts.push({kind:'glit',x:r.left-o.left+rnd(-.15,1.15)*r.width,y:r.top-o.top+rnd(.3,1.1)*r.height,vx:rnd(-.3,.3),vy:rnd(-2.2,-.8),size:rnd(1.5,3.5),life:rnd(50,90),max:90,color:'255,222,140',g:-.02,drag:.99,star:1});}
    const W=fx.width,H=fx.height;fctx.save();fctx.setTransform(1,0,0,1,0,0);fctx.clearRect(0,0,W,H);fctx.restore();
    parts=parts.filter(p=>(p.life-=dt)>0);
    for(const p of parts){if(p.kind==='ring'){p.vx=p.vy=0;}p.vx*=Math.pow(p.drag||1,dt);p.vy=p.vy*Math.pow(p.drag,dt)+p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const k=p.life/p.max;
      if(p.kind==='wisp'){p.ph+=.08*dt;p.x+=Math.sin(p.ph)*.8*dt;fctx.globalCompositeOperation='lighter';const r=p.size*(1.6-k*.6),gr=fctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);gr.addColorStop(0,`rgba(${p.color},${.35*Math.sin(k*Math.PI)})`);gr.addColorStop(1,`rgba(${p.color},0)`);fctx.fillStyle=gr;fctx.fillRect(p.x-r,p.y-r,r*2,r*2);continue;}
      if(p.kind==='ring'){const e=1-k;fctx.globalCompositeOperation='lighter';fctx.strokeStyle=`rgba(${p.color},${k})`;fctx.lineWidth=p.size*k+1;fctx.beginPath();fctx.arc(p.x,p.y,p.r0+e*p.grow,0,7);fctx.stroke();continue;}
      if(p.kind==='spark'){fctx.globalCompositeOperation='lighter';fctx.strokeStyle=`rgba(${p.color},${k})`;fctx.lineWidth=p.size;fctx.lineCap='round';fctx.beginPath();fctx.moveTo(p.x,p.y);fctx.lineTo(p.x-p.vx*2.2,p.y-p.vy*2.2);fctx.stroke();continue;}
      fctx.globalCompositeOperation=p.solid?'source-over':'lighter';fctx.fillStyle=`rgba(${p.color},${p.solid?Math.min(1,k*1.6):k})`;
      if(p.star){const s=p.size*(1+Math.sin(p.life*.5)*.5);fctx.beginPath();fctx.moveTo(p.x,p.y-s*2);fctx.lineTo(p.x+s*.5,p.y-s*.5);fctx.lineTo(p.x+s*2,p.y);fctx.lineTo(p.x+s*.5,p.y+s*.5);fctx.lineTo(p.x,p.y+s*2);fctx.lineTo(p.x-s*.5,p.y+s*.5);fctx.lineTo(p.x-s*2,p.y);fctx.lineTo(p.x-s*.5,p.y-s*.5);fctx.fill();}
      else{fctx.beginPath();fctx.arc(p.x,p.y,p.size*(p.solid?1:k+.3),0,7);fctx.fill();}}
    fctx.globalCompositeOperation='source-over';
    if(parts.length||wisps||now<glitterUntil)raf=requestAnimationFrame(tick);else last=0;}

  // ── 3D 짚인형 ──
  const THREE_URL=new URL('./vendor/three.module.min.js',import.meta.url).href;
  async function createDoll(){
    const THREE=await import(THREE_URL);
    const cv=mk('canvas','face-3d');root.insertBefore(cv,fx);
    const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,60);
    const tex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;};
    const hemi=new THREE.HemisphereLight(0xffe6c8,0x1a0d14,.75),key=new THREE.DirectionalLight(0xffdcb0,1.5),rim=new THREE.PointLight(0x9a5cff,0,14,1.4),warm=new THREE.PointLight(0xffb45a,0,12,1.2);
    key.position.set(2.5,3,5);rim.position.set(0,1.2,-1.6);warm.position.set(0,.4,3);scene.add(hemi,key,rim,warm);

    // 짚 질감
    const straw=tex(256,512,(g,w,h)=>{g.fillStyle='#b38a44';g.fillRect(0,0,w,h);const cs=['#dcb86a','#9a7232','#e8cd8a','#7d5a26','#c79d55','#f0dc9c'];
      for(let i=0;i<300;i++){g.globalAlpha=rnd(.35,.9);g.fillStyle=cs[i%cs.length];g.fillRect(Math.random()*w,0,rnd(1,4),h);}
      g.globalAlpha=.3;g.fillStyle='#4a3214';for(let i=0;i<50;i++)g.fillRect(Math.random()*w,Math.random()*h,rnd(1,2),rnd(20,90));g.globalAlpha=1;});
    straw.wrapS=straw.wrapT=THREE.RepeatWrapping;straw.repeat.set(2,1);
    const strawMat=new THREE.MeshStandardMaterial({map:straw,bumpMap:straw,bumpScale:.04,roughness:.95});
    const redMat=new THREE.MeshStandardMaterial({color:0xa3221a,roughness:.7});
    const body=new THREE.Group(),dollG=new THREE.Group();dollG.add(body);scene.add(dollG);
    const add=(geo,mat,x,y,z,rx=0,ry=0,rz=0,parent=body)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);parent.add(m);return m;};
    const head=add(new THREE.SphereGeometry(.56,32,24),strawMat,0,1.2,0);head.scale.set(1,1.1,.82);
    const tuftGeo=new THREE.CylinderGeometry(.016,.01,.6,5);tuftGeo.translate(0,.3,0);
    for(let i=0;i<14;i++)add(tuftGeo,strawMat,rnd(-.12,.12),1.76,rnd(-.08,.08),rnd(-.35,.35),0,rnd(-.7,.7));
    add(new THREE.TorusGeometry(.21,.055,10,28),redMat,0,.62,0,Math.PI/2);
    add(new THREE.CylinderGeometry(.03,.02,.32,6),redMat,.12,.46,.18,0,0,.5);
    add(new THREE.CylinderGeometry(.3,.45,1.2,22),strawMat,0,0,0);
    add(new THREE.CylinderGeometry(.12,.12,1.6,14),strawMat,0,.32,0,0,0,Math.PI/2);
    for(const sx of [-1,1]){
      add(new THREE.TorusGeometry(.135,.04,8,22),redMat,sx*.6,.32,0,0,Math.PI/2);
      add(new THREE.ConeGeometry(.2,.42,14,1,true),strawMat,sx*.98,.32,0,0,0,sx*Math.PI/2).material=strawMat;
      for(let i=0;i<5;i++)add(tuftGeo,strawMat,sx*1.05,.32+rnd(-.12,.12),rnd(-.12,.12),0,0,-sx*Math.PI/2+rnd(-.4,.4));
      add(new THREE.CylinderGeometry(.14,.2,1.15,14),strawMat,sx*.2,-1.12,0,0,0,sx*.1);
      add(new THREE.ConeGeometry(.24,.38,14,1,true),strawMat,sx*.27,-1.72,0);
    }
    add(new THREE.TorusGeometry(.43,.055,10,30),redMat,0,-.46,0,Math.PI/2);
    strawMat.side=THREE.DoubleSide;
    // 얼굴 (사진)
    const faceTex=new THREE.CanvasTexture(document.createElement('canvas'));faceTex.colorSpace=THREE.SRGBColorSpace;
    const faceMat=new THREE.MeshStandardMaterial({map:faceTex,transparent:true,roughness:.85,emissive:0xffffff,emissiveMap:faceTex,emissiveIntensity:.28});
    // 머리 곡면을 그대로 따라 감싸는 얼굴: 머리 구의 앞쪽 조각에 사진을 정면에서 투영
    const faceGeo=new THREE.SphereGeometry(.56*1.012,48,40,Math.PI/2-1.05,2.1,Math.PI/2-1.05,2.1);
    { const p=faceGeo.attributes.position,uv=faceGeo.attributes.uv;for(let i=0;i<p.count;i++){uv.setXY(i,.5+p.getX(i)/.84,.5+p.getY(i)/(1.0));} uv.needsUpdate=true; }
    faceMat.polygonOffset=true;faceMat.polygonOffsetFactor=-2;faceMat.depthWrite=false;
    const face=new THREE.Mesh(faceGeo,faceMat);head.add(face);
    add(new THREE.SphereGeometry(.05,12,10),redMat,.27,1.6,.44);
    // 부적
    const paperCanvas=document.createElement('canvas');paperCanvas.width=256;paperCanvas.height=512;paperCanvas.getContext('2d').drawImage(paperImage,0,0,256,512);
    const paperTex=new THREE.CanvasTexture(paperCanvas);paperTex.colorSpace=THREE.SRGBColorSpace;
    const paperMat=new THREE.MeshStandardMaterial({map:paperTex,side:THREE.DoubleSide,roughness:.8,emissive:0xffe2a0,emissiveMap:paperTex,emissiveIntensity:.18});
    const finalMat=paperMat.clone();
    const smallGeo=new THREE.PlaneGeometry(.34,.68),bigGeo=new THREE.PlaneGeometry(.56,1.12);
    const TARGETS=[[-.14,.24,.44,.2],[.17,-.22,.47,-.15],[-.66,.34,.13,.35],[.68,.3,.13,-.3],[-.22,-1.05,.22,.12],[.24,-.98,.23,-.1],[.33,.5,.36,-.25],[-.36,-.36,.43,.25],[-.44,1.3,.38,.3]];
    // 후광
    const glowTex=tex(128,128,(g)=>{const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(.4,'rgba(255,255,255,.25)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);});
    const aura=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0x8a4dff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));aura.scale.set(4.6,6,1);aura.position.set(0,0,-1);scene.add(aura);
    // 저주스러운 우주: 검붉은·보랏빛 성운 두 겹 + 별
    const nebula=(seed,stars)=>tex(1024,1024,(g,w,h)=>{if(stars){g.fillStyle='#050208';g.fillRect(0,0,w,h);}
      g.globalCompositeOperation='lighter';
      const cs=['120,30,170','150,20,60','60,15,110','90,10,40','170,60,200'];
      for(let i=0;i<(stars?46:26);i++){const x=rnd(0,w),y=rnd(0,h),r=rnd(90,stars?340:240),c=cs[(i+seed)%cs.length],a=rnd(.03,stars?.085:.08);
        const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(${c},${a})`);gr.addColorStop(1,`rgba(${c},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
      // 어두운 먼지 띠
      g.globalCompositeOperation='source-over';
      for(let i=0;i<(stars?44:14);i++){const x=rnd(0,w),y=rnd(0,h),r=rnd(80,260),gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,stars?'rgba(2,0,4,.8)':'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(3,1,5,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
      if(stars){for(let i=0;i<520;i++){const a=Math.random(),r=a<.96?rnd(.5,1.4):rnd(1.6,2.6);g.fillStyle=`rgba(${a<.85?'235,225,255':'255,170,190'},${rnd(.3,.95)})`;g.beginPath();g.arc(rnd(0,w),rnd(0,h),r,0,7);g.fill();}}
    });
    const skyA=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshBasicMaterial({map:nebula(0,true),depthWrite:false,fog:false}));skyA.position.z=-22;
    const skyB=new THREE.Mesh(new THREE.PlaneGeometry(44,44),new THREE.MeshBasicMaterial({map:nebula(2,false),transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));skyB.position.z=-14;
    scene.add(skyA,skyB);
    const soul=new THREE.Sprite(new THREE.SpriteMaterial({map:faceTex,color:0xc4a2ff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(soul);

    // 타임라인
    const shotT=[];{let t=1.55;for(let i=0;i<SHOTS;i++){shotT.push(t);t+=Math.max(.1,.27-i*.022);}shotT.push(t+.3);}
    const FLY=.2,FLY_BIG=.34,finalHit=shotT[SHOTS]+FLY_BIG,sealAt=finalHit+.85,endAt=sealAt+1.9;
    let t=0,fired=new Set(),flying=[],stuck=[],sp={rz:0,vz:0,ry:0,vy:0,x:0,vx:0,z:0,vzz:0,sq:0},spinA=0,spinV=0,tilt=0,tiltV=0,shake=0,freeze=0,flash=0,camY=0,frameId=0,lastT=0,ended=false,sealed=false;
    const once3=(id,time,fn)=>{if(t>=time&&!fired.has(id)){fired.add(id);fn();}};
    const v3=new THREE.Vector3();
    function screen(x,y,z,local=true){v3.set(x,y,z);if(local)body.localToWorld(v3);v3.project(camera);const r=root.getBoundingClientRect();return{x:(v3.x+1)/2*r.width,y:(1-v3.y)/2*r.height};}
    function launch(i){const big=i===SHOTS,tg=big?[0,.02,.5,-.04]:TARGETS[i],side=i%2?1:-1;
      const m=new THREE.Mesh(big?bigGeo:smallGeo,big?finalMat:paperMat);scene.add(m);
      const from=new THREE.Vector3(side*rnd(4,5.5),tg[1]+rnd(.8,2.6),3.6),to=new THREE.Vector3(tg[0],tg[1],tg[2]+i*.004);
      const rot0=new THREE.Euler(rnd(-1,1),rnd(-1.5,1.5),tg[3]+side*Math.PI*(big?2:rnd(1.5,3))),rot1=new THREE.Euler(0,tg[0]>.55?.5:tg[0]<-.55?-.5:tg[0]*.4,tg[3]);
      flying.push({m,from,to,rot0,rot1,t0:t,dur:big?FLY_BIG:FLY,big,i,s0:big?2.2:1.5});}
    function impact(f){const {to,big,i}=f;const p=screen(to.x,to.y,to.z);
      try{navigator.vibrate?.(big?[50,40,120]:15);}catch{}
      const side=to.x>=0?1:-1,from=f.from.x>0?1:-1;sp.vz+=-side*(big?3:1.2+i*.1)+rnd(-.4,.4);sp.vx+=-from*(big?.9:.35);sp.vzz-=big?.9:.3;sp.sq=big?.22:.1;
      if(big){tiltV-=16;sp.vz*=.3;sp.vx*=.3;}else spinV+=(i%3===2?-from*rnd(7,9):-from*rnd(2,3.2));
      flash=Math.max(flash,big?1.6:.7);shake=Math.max(shake,big?.22:.05+i*.008);
      burst(p.x,p.y,'spark',big?80:12);burst(p.x,p.y,'ink',big?30:6);ringAt(p.x,p.y,8,big?240:80,big?'255,244,207':'255,230,160',big?40:22);
      if(big){freeze=.13;ui.flash('#fff3c4',.9);later(()=>ringAt(p.x,p.y,8,330,'255,214,122',46),90);}
      else if(i>=SHOTS-3)ui.flash('#ffd98a',.12);}
    function seal(){sealed=true;wisps=false;const fp=new THREE.Vector3(0,1.2,.5);body.localToWorld(fp);soul.position.copy(fp);soul.userData.y0=fp.y;
      const p=screen(0,1.2,.5);burst(p.x,p.y,'shard',70);
      faceMat.color.set(0x6d6a66);faceMat.emissiveIntensity=.05;}
    function rect(){const a=screen(-1.25,2,0),b=screen(1.25,-1.9,0);const o=root.getBoundingClientRect();if(![a.x,a.y,b.x,b.y].every(Number.isFinite))return frame.getBoundingClientRect();return{left:o.left+a.x,top:o.top+a.y,width:b.x-a.x,height:b.y-a.y};}

    function resize(){const w=root.clientWidth||1,h=root.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();camera.position.set(0,.15,Math.max(7.8,5.2/camera.aspect));camera.lookAt(0,.05,0);camera.updateMatrixWorld();}
    resize();addEventListener('resize',resize);
    function step(dt){
      if(freeze>0){freeze-=dt;return;}
      t+=dt;
      // 등장: 아래에서 스르륵 떠오르며 보랏빛으로 물듦
      const intro=clamp(t/1.1,0,1),ei=1-Math.pow(1-intro,3);
      for(let i=0;i<=SHOTS;i++)once3('s'+i,shotT[i],()=>launch(i));
      dollG.updateMatrixWorld(true);
      for(let j=flying.length-1;j>=0;j--){const f=flying[j],p=clamp((t-f.t0)/f.dur,0,1),e=p*p;
        const toW=body.localToWorld(f.to.clone());f.m.position.lerpVectors(f.from,toW,e);
        f.m.rotation.set(f.rot0.x*(1-e),f.rot0.y*(1-e),f.rot0.z+(f.rot1.z-f.rot0.z)*e);f.m.scale.setScalar(f.s0+(1-f.s0)*e);
        if(p>=1){flying.splice(j,1);body.add(f.m);f.m.position.copy(f.to);f.m.rotation.copy(f.rot1);f.m.scale.setScalar(1);stuck.push(f.m);impact(f);}}
      once3('seal',sealAt,seal);
      once3('end',endAt,()=>{ended=true;finish();});
      // 인형 흔들림 (스프링)
      const K=60,C=7;sp.vz+=(-K*sp.rz-C*sp.vz)*dt;sp.rz+=sp.vz*dt;sp.vy+=(-K*sp.ry-C*sp.vy)*dt;sp.ry+=sp.vy*dt;sp.vx+=(-K*sp.x-C*sp.vx)*dt;sp.x+=sp.vx*dt;
      sp.vzz+=(-40*sp.z-6*sp.vzz)*dt;sp.z+=sp.vzz*dt;sp.sq*=Math.exp(-dt*9);
      // 회전: 맞으면 빙글 돌고, 느려지면 정면으로 돌아온다
      spinV*=Math.exp(-dt*2.2);const home=Math.round(spinA/(Math.PI*2))*Math.PI*2;if(Math.abs(spinV)<4)spinV+=(home-spinA)*14*dt-spinV*3*dt;spinA+=spinV*dt;
      // 마지막 한 방: 발을 축으로 뒤로 확 젖혀졌다가 띠용 하고 튕겨 올라옴
      tiltV+=(-38*tilt-3.2*tiltV)*dt;tilt+=tiltV*dt;if(tilt<-1.35){tilt=-1.35;tiltV=Math.abs(tiltV)*.35;}
      // 등장: 멀리 어둠 속에서 빙글빙글 날아와 쿵 착지
      const IN=.95,pin=clamp(t/IN,0,1),fe=1-Math.pow(1-pin,3);
      once3('land',IN,()=>{shake=Math.max(shake,.2);sp.sq=.28;flash=.6;const a=screen(0,-1.75,0);ringAt(a.x,a.y,10,180,'190,150,255',30);burst(a.x,a.y,'shard',30);ui.flash('#b48cff',.18);});
      const fly=1-fe,arcY=Math.sin(pin*Math.PI)*1.4;
      const possessed=!sealed&&t>IN,tw=possessed?.035*(1+Math.sin(t*23)*.5):0;
      const PV=1.8;dollG.position.set(sp.x+fly*-3.2+(possessed?rnd(-1,1)*tw*.4:0),fly*-.4+arcY*(1-pin)+Math.sin(t*1.4)*.04-PV+PV*Math.cos(tilt),sp.z-fly*14+PV*Math.sin(tilt));
      dollG.rotation.set(fly*.9+tilt,spinA+sp.ry+Math.sin(t*.7)*.1+fly*Math.PI*6,sp.rz+(possessed?rnd(-1,1)*tw:0)+Math.sin(t*1.1)*.03+fly*1.2);
      const st=clamp(tiltV*.012,-.12,.12);dollG.scale.set(1+sp.sq*.5-st*.5,1-sp.sq+st,1+sp.sq*.5-st*.5);
      skyA.rotation.z+=dt*.012;skyB.rotation.z-=dt*.03;skyB.material.opacity=sealed?Math.max(.35,skyB.material.opacity-dt*.4):.85;
      flash*=Math.exp(-dt*7);faceMat.emissiveIntensity=(sealed?.05:.28)+flash*.5;
      if(!sealed){const pulse=.6+.4*Math.sin(t*5);rim.intensity=ei*(5+3*pulse);aura.material.opacity=0;faceMat.color.setRGB(1-.25*ei,1-.35*ei,1);}
      else{const s=t-sealAt,e=clamp(s/.9,0,1);rim.intensity*=Math.exp(-dt*5);warm.intensity=2.4*clamp(s*2,0,1);aura.material.opacity=0;
        finalMat.emissiveIntensity=.2+.9*Math.exp(-s*2);
        soul.material.opacity=e<1?(1-e)*.9:0;soul.position.y=soul.userData.y0+e*e*2.8;soul.scale.set(.82*(1-.6*e),1.08*(1+1.1*e),1);
        if(!fired.has('glit')){fired.add('glit');glitterUntil=performance.now()+(fastMode?700:1500);loop();}}
      camY+=((ended?1:0)-camY)*Math.min(1,dt*2.5);shake*=Math.exp(-dt*7);
    }
    function frameLoop(now){frameId=requestAnimationFrame(frameLoop);const dt=Math.min((now-(lastT||now))/1000,1/20);lastT=now;
      const n=fastMode?4:1;for(let i=0;i<n;i++)step(dt);
      const a=camera.aspect,z=Math.max(7.8,5.2/a)*(1.05-.05*clamp(t/3,0,1))*(1-(a<1?.3:.12)*camY);
      // 마지막 장면: 다가가며 인형을 크게, 다리는 아래 결과 패널 뒤로 넘어가도록 시선을 위로
      const ly=(a<1?.55:.3)*camY;camera.position.set((Math.random()-.5)*shake,.15+ly+(Math.random()-.5)*shake,z);camera.lookAt(0,.05+ly,0);
      renderer.render(scene,camera);}
    return{
      rect,
      start(){flying.forEach(f=>{scene.remove(f.m);body.remove(f.m);});stuck.forEach(m=>body.remove(m));flying=[];stuck=[];fired=new Set();t=0;freeze=0;flash=0;shake=0;camY=0;ended=false;sealed=false;Object.assign(sp,{rz:0,vz:0,ry:0,vy:0,x:0,vx:0,z:0,vzz:0,sq:0});spinA=0;spinV=0;tilt=0;tiltV=0;
        const fc=faceCanvas(),nt=new THREE.CanvasTexture(fc);nt.colorSpace=THREE.SRGBColorSpace;const old=faceMat.map;faceMat.map=faceMat.emissiveMap=soul.material.map=nt;faceMat.needsUpdate=soul.material.needsUpdate=true;old?.dispose();faceMat.color.set(0xffffff);finalMat.emissiveIntensity=.18;warm.intensity=0;soul.material.opacity=0;
        cv.hidden=false;cancelAnimationFrame(frameId);lastT=0;frameId=requestAnimationFrame(frameLoop);},
      skipToEnd(){if(t<sealAt){while(t<endAt-.05&&!ended)step(1/30);}},
      dispose(){cancelAnimationFrame(frameId);removeEventListener('resize',resize);scene.traverse(o=>{o.geometry?.dispose();[].concat(o.material||[]).forEach(m=>{m.map?.dispose();m.dispose();});});renderer.dispose();cv.remove();}
    };
  }

  // ── 2D 대체 연출 (WebGL 없을 때) ──
  function reset(){timers.forEach(clearTimeout);timers=[];animations.forEach(a=>{try{a.cancel();}catch{}});animations=[];
    frame.querySelectorAll('.face-slap,.face-ring,.face-soul').forEach(e=>e.remove());
    hits=0;fastMode=false;parts=[];wisps=false;glitterUntil=0;phase='idle';frame.classList.remove('possessed','blessed','sealed');paper.hidden=true;q('.face-impact').hidden=true;}

  // 연사: 간격이 점점 짧아지며 양옆에서 부적이 날아와 얼굴에 붙는다
  function barrage(){if(phase!=='intro')return;phase='barrage';shoot();}
  function shoot(){if(phase!=='barrage')return;const n=hits+1;
    if(n>SHOTS){phase='final';later(()=>slap(.5,.3,true),fastMode?60:340);return;}
    const ang=rnd(0,Math.PI*2),rad=Math.sqrt(Math.random())*.26;
    slap(clamp(.5+Math.cos(ang)*rad,.16,.84),clamp(.42+Math.sin(ang)*rad*1.1,.12,.82),false);
    later(shoot,fastMode?45:Math.max(95,250-n*20));}

  function slap(px,py,big){const n=++hits;
    const el=mk('img','face-slap'+(big?' final':''),frame);el.src=paper.src;el.alt='';el.style.left=px*100+'%';el.style.top=py*100+'%';el.style.width=(big?25:rnd(14,18))+'%';
    const rot=big?-3:rnd(-28,28),side=n%2?-1:1,spin=side*(big?200:rnd(120,260));el.style.setProperty('--r',rot+'deg');
    animate(el,[{transform:`translate(-50%,-50%) translate(${side*rnd(160,260)}%,${rnd(-260,-60)}%) scale(${big?3.4:3}) rotate(${rot+spin}deg)`,opacity:0},{opacity:1,offset:.2},
      {transform:`translate(-50%,-50%) scale(${big?1.12:1.08},.88) rotate(${rot}deg)`,opacity:1,offset:.85},{transform:`translate(-50%,-50%) scale(1) rotate(${rot}deg)`,opacity:1}],
      {duration:fastMode?90:big?340:200,easing:'cubic-bezier(.55,0,.95,.55)',fill:'forwards'}).finished.then(()=>impact(px,py,n,big),()=>{});}

  function impact(px,py,n,big){if(disposed||phase==='idle')return;const p=at(px,py);
    try{navigator.vibrate?.(big?[50,40,120]:15);}catch{}
    if(!big){ring(px,py,false);burst(p.x,p.y,'spark',10);burst(p.x,p.y,'ink',5);shake(frame,2+n*.9);flinch(.25+n*.05);if(n>=SHOTS-2)ui.flash('#ffd98a',.12);return;}
    const stop=130;freezeUntil=performance.now()+stop;ui.flash('#fff3c4',.9);
    ring(px,py,true);later(()=>ring(px,py,true,1.35),90);burst(p.x,p.y,'spark',80);burst(p.x,p.y,'ink',30);
    later(()=>{shake(frame,18);shake(panel,10);flinch(1);},stop);later(finale,stop+300);}

  function ring(px,py,big,scale=1){const r=mk('span','face-ring'+(big?' big':''),frame);r.style.left=px*100+'%';r.style.top=py*100+'%';
    once(r,[{transform:'translate(-50%,-50%) scale(.15)',opacity:1},{transform:`translate(-50%,-50%) scale(${(big?4.2:1.8)*scale})`,opacity:0}],{duration:big?620:340,easing:'cubic-bezier(.1,.8,.3,1)'});}
  function shake(el,a){const k=[{transform:`scale(${1+a*.003})`}];for(let i=0;i<6;i++){const f=1-i/6;k.push({transform:`translate(${rnd(-1,1)*a*f}px,${rnd(-1,1)*a*f}px) rotate(${rnd(-1,1)*a*.15*f}deg)`});}k.push({transform:'none'});animate(el,k,{duration:200+a*14});}
  function flinch(k){const d=Math.random()<.5?-1:1;
    animate(canvas,[{transform:'none',filter:`brightness(${1.2+k*1.3}) saturate(.3)`},{transform:`translate(${d*3*k}%,-1%) rotate(${d*3*k}deg) scale(${1-.08*k},${1+.05*k})`,offset:.25},{transform:'none'}],{duration:260+k*240,easing:'ease-out'});}

  function finale(){phase='done';wisps=false;
    const soul=mk('canvas','face-soul',frame);soul.width=canvas.width;soul.height=canvas.height;soul.getContext('2d').drawImage(canvas,0,0);frame.classList.remove('possessed');frame.classList.add('sealed');
    const F='grayscale(1) sepia(1) hue-rotate(220deg) saturate(3)';
    once(soul,[{transform:'none',opacity:1,filter:F+' brightness(1.4)'},{transform:'translateY(-6%) scale(1.12,.9)',opacity:.95,filter:F+' brightness(2)',offset:.2},{transform:'translateY(-150%) scale(.35,1.9) rotate(18deg)',opacity:0,filter:F+' brightness(3) blur(8px)'}],{duration:850,easing:'cubic-bezier(.5,0,.8,.4)'});
    later(()=>{const r=frame.getBoundingClientRect(),o=root.getBoundingClientRect();burst(r.left-o.left+r.width/2,r.top-o.top-r.height*.15,'shard',60);},520);
    later(()=>{ui.flash('#fff6e0',.7);frame.classList.add('blessed');glitterUntil=performance.now()+(fastMode?700:1600);loop();},700);
    later(finish,fastMode?900:2100);}

  function start2d(){reset();root.classList.add('face-playing');size();phase='intro';
      if(reduced()){phase='final';slap(.5,.3,true);return;}
      frame.classList.add('possessed');
      animate(canvas,[{filter:'none'},{filter:'brightness(2.5) saturate(0)',offset:.1},{filter:'none',offset:.2},{filter:'brightness(2) hue-rotate(200deg) saturate(3)',offset:.35}],{duration:800});
      animate(frame,[{transform:'none'},{transform:'translate(-2px,1px) skewX(1deg)',offset:.4},{transform:'translate(2px,0)',offset:.45},{transform:'none',offset:.5},{transform:'none'}],{duration:450,iterations:2});
      wisps=true;loop();later(barrage,1000);}
  function finish(){if(disposed||phase==='end')return;phase='end';ui.end();}
  function reset3d(){timers.forEach(clearTimeout);timers=[];parts=[];wisps=false;glitterUntil=0;fastMode=false;phase='idle';}
  async function start3d(){reset3d();root.classList.add('face-playing','doll-mode');size();
    if(!doll)doll=await createDoll();if(disposed)return;
    phase='doll';wisps=!reduced();loop();if(reduced())fastMode=true;doll.start();}
  addEventListener('resize',size);

  return {
    start(){if(!loaded||disposed)return;
      if(!mode2d){start3d().catch(e=>{console.warn(e);if(disposed)return;mode2d=true;root.classList.remove('doll-mode');doll?.dispose?.();doll=null;start2d();});return;}
      start2d();},
    set fast(value){if(!value||disposed)return;fastMode=true;
      if(mode2d){if(phase==='intro'){timers.forEach(clearTimeout);timers=[];barrage();}else if(phase==='done'){later(finish,250);}}},
    dispose(){disposed=true;++loadingId;stopCamera();timers.forEach(clearTimeout);cancelAnimationFrame(raf);animations.forEach(a=>{try{a.cancel();}catch{}});
      doll?.dispose?.();removeEventListener('resize',size);canvas.width=canvas.height=0;fx.width=fx.height=0;fx.remove();paper.removeAttribute('src');panel.remove();}
  };
}
