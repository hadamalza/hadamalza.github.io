// Soft, slowly travelling light rings; rendered behind the existing talisman scene.
export function createLuckBackdrop(THREE,scene){
 const uniforms={uTime:{value:0},uAspect:{value:innerWidth/innerHeight},uSage:{value:new THREE.Color('#c8dda9')},uMint:{value:new THREE.Color('#a4c9a8')},uBlue:{value:new THREE.Color('#b4d2be')},uLight:{value:new THREE.Color('#ffffe8')}};
 const material=new THREE.ShaderMaterial({uniforms,depthWrite:false,depthTest:false,toneMapped:false,
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,1.0,1.0);}`,
 fragmentShader:`
 varying vec2 vUv;uniform float uTime;uniform float uAspect;uniform vec3 uSage,uMint,uBlue,uLight;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
 float mist(vec2 p){return noise(p)*.57+noise(p*2.03+7.2)*.28+noise(p*4.11+13.4)*.15;}
 void main(){
  vec2 p=(vUv-vec2(.5,.54))*vec2(uAspect,1.0);float t=uTime;
  float haze=mist(p*2.4+vec2(t*.012,-t*.008));
  float angle=atan(p.y,p.x),r=length(p);
  float organic=mist(p*4.0+vec2(-t*.018,t*.012));
  float radius=r+(organic-.5)*.018;
  float wave=radius*27.0-t*.95;
  float ring=pow(.5+.5*cos(wave),3.0);
  float arcs=.82+.18*noise(p*2.2+vec2(t*.012));
  float mistRing=pow(.5+.5*cos(radius*13.-t*.38+1.8),2.0);
  vec3 col=mix(uMint,uSage,clamp(.6-r*.35+(haze-.5)*.65,0.,1.));
  col=mix(col,uBlue,smoothstep(.3,.8,mist(p*2.1+vec2(5.,-3.)))*.25);
  float light=ring*arcs*.25+mistRing*.12+exp(-r*r*12.)*.2;
  col=mix(col,uLight,clamp(light,0.,.65));
  // Broad scattering rather than hard rings: gently drifting pools of milky light.
  float bloom=0.;
  for(int i=0;i<4;i++){
   float f=float(i);vec2 center=vec2((hash(vec2(f,8.))-.5)*uAspect,(hash(vec2(f,17.))-.5)*.9);
   center+=vec2(sin(t*.075+f*2.1),cos(t*.06+f*1.7))*.045;
   float d=length(p-center),spread=mix(.12,.28,hash(vec2(f,31.)));
   bloom+=exp(-d*d/(spread*spread))*.24;
  }
  col=mix(col,uLight,clamp(bloom,0.,.56));
  float gleam=0.;
  for(int i=0;i<14;i++){
   float f=float(i);vec2 center=vec2((hash(vec2(f,41.))-.5)*uAspect,(hash(vec2(f,63.))-.5));
   center.y+=sin(t*.12+f)*.018;
   vec2 delta=p-center;float d=length(delta),sz=mix(.009,.037,hash(vec2(f,27.)));
   float pulse=.55+.45*sin(t*1.2+f*2.4);
   gleam+=(1.-smoothstep(sz*.5,sz,d))*.19*pulse;
   gleam+=exp(-d*d/(sz*sz*8.))*.08*pulse;
  }
  for(int i=0;i<7;i++){
   float f=float(i);vec2 center=vec2((hash(vec2(f,82.))-.5)*uAspect,(hash(vec2(f,91.))-.5)*.9);
   vec2 d=p-center;float turn=f*.7;
   d=mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*d;
   float pulse=.1+.9*pow(max(0.,sin(t*1.7+f*2.4)),3.);
   float star=exp(-abs(d.x)/.0023-abs(d.y)/.034)+exp(-abs(d.y)/.0023-abs(d.x)/.034);
   gleam+=star*pulse*1.5+exp(-dot(d,d)/.0014)*pulse*.1;
  }
  col=1.-(1.-col)*exp(-gleam*2.);
  col*=1.-smoothstep(.3,1.2,r)*.035;
  col+=(hash(gl_FragCoord.xy)-.5)*.009;
  gl_FragColor=vec4(max(col,vec3(0.)),1.);
  #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);mesh.frustumCulled=false;mesh.renderOrder=-1000;scene.add(mesh);
 return {update(t){uniforms.uTime.value=t;uniforms.uAspect.value=innerWidth/innerHeight;}};
}
