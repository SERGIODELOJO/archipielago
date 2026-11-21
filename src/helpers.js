// ---------- utilidades ----------
const C=h=>new THREE.Color(h).convertSRGBToLinear();
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
function hash2(x,y){let h=x*374761393+y*668265263;h=(h^(h>>13))*1274126177;return ((h^(h>>16))>>>0)/4294967295}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const a=hash2(xi,yi),b=hash2(xi+1,yi),c=hash2(xi,yi+1),d=hash2(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y){let s=0,a=.5,f=1;for(let i=0;i<4;i++){s+=a*vnoise(x*f,y*f);f*=2;a*=.5}return s}
const S=3.2;const hx=(q,r)=>S*Math.sqrt(3)*(q+r/2), hz=(q,r)=>S*1.5*r;
// ---------- render ----------
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.5,20000);
const controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=1.45;controls.minDistance=8;controls.maxDistance=140;
const loader=new THREE.TextureLoader();
const cloudTex=(()=>{const N=256,cv=document.createElement("canvas");cv.width=cv.height=N;const x=cv.getContext("2d"),im=x.createImageData(N,N);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const u=i/N*2-1,v=j/N*2-1;const n=fbm(i/N*5+11,j/N*5+3);const d=Math.hypot(u,v*1.1)*(1+.45*(n-.5));
  let a=Math.max(0,Math.min(1,(1-d)/.75));a=a*a*(3-2*a)*(.45+.75*fbm(i/N*9+40,j/N*9));const o=(j*N+i)*4;const sh=225+30*(1-v)/2;im.data[o]=im.data[o+1]=im.data[o+2]=Math.min(255,sh);im.data[o+3]=Math.min(255,a*255)}
 x.putImageData(im,0,0);return new THREE.CanvasTexture(cv)})();
const pmrem=new THREE.PMREMGenerator(renderer);
const anim=[];

function std(col,o={}){return new THREE.MeshStandardMaterial(Object.assign({color:C(col),roughness:.85,metalness:0},o))}
function shadowAll(o){o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}})}

// isla con relieve, playa y vegetación
function island(o,opt={}){
 const g=new THREE.Group();g.position.set(o.x,0,o.z);
 const T=TYPES[o.t],R=2.15*o.s,rings=22,segs=64,pos=[],col=[],idx=[];
 const peak={hierro:2.6,selva:1.5,ron:.9,lino:.7,perlas:.25}[o.t]*o.s*(opt.hmul||1);
 const sand=C(opt.sand||"#d9c08c"),wet=C("#9c8a62"),g1=C(T.g),g2=C(T.g2),rock=C(o.t==="hierro"?"#4a4440":"#7a6d60"),tmp=new THREE.Color();
 const ph=o.x*.37+o.z*.11;
 for(let i=0;i<=rings;i++)for(let j=0;j<segs;j++){
  const th=j/segs*Math.PI*2, rr=i/rings;
  const coast=1+.22*(fbm(Math.cos(th)*1.6+ph,Math.sin(th)*1.6-ph)-.5)*2;
  const rad=rr*R*coast*1.08;
  const lx=Math.cos(th)*rad,lz=Math.sin(th)*rad;
  let h;const k=rr/1.0;
  if(k>.86){h=-.45*(k-.86)/.14+.05*(1-(k-.86)/.14)}
  else{const t=1-k/.86;h=.05+.18*Math.min(1,t*3)+peak*Math.pow(Math.max(0,t-.15)/.85,1.6)*(.65+.7*fbm(lx*.9+ph,lz*.9))}
  if(o.t==="hierro"&&k<.15)h-=.35*(1-k/.15)*o.s;
  pos.push(lx,h,lz);
  if(h<.12)tmp.copy(h<.04?wet:sand);
  else if(h<.32)tmp.copy(sand).lerp(g1,(h-.12)/.2);
  else if(h<peak*.62+.25)tmp.copy(g1).lerp(g2,fbm(lx*2,lz*2));
  else tmp.copy(g2).lerp(rock,Math.min(1,(h-(peak*.62+.25))/.5));
  col.push(tmp.r,tmp.g,tmp.b);
 }
 for(let i=0;i<rings;i++)for(let j=0;j<segs;j++){const a=i*segs+j,b=i*segs+(j+1)%segs,c=(i+1)*segs+j,d=(i+1)*segs+(j+1)%segs;idx.push(a,b,c,b,d,c)}
 const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));geo.setAttribute("color",new THREE.Float32BufferAttribute(col,3));geo.setIndex(idx);geo.computeVertexNormals();
 const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0}));m.receiveShadow=true;m.castShadow=true;g.add(m);
 const hAt=(x,z)=>{let best=0,bd=1e9;for(let i=0;i<pos.length;i+=3){const d=(pos[i]-x)**2+(pos[i+2]-z)**2;if(d<bd){bd=d;best=pos[i+1]}}return best};
 const place=(n,minR,maxR,fn)=>{for(let i=0;i<n;i++){const a=rnd()*6.283,r=R*(minR+rnd()*(maxR-minR));const x=Math.cos(a)*r,z=Math.sin(a)*r,y=hAt(x,z);if(y>.1){const t=fn();t.position.set(x,y,z);t.rotation.y=rnd()*6.28;g.add(t)}}};
 if(o.t==="selva"){place(Math.round(16*o.s),.05,.6,()=>jungleTree(.8+rnd()*.5));place(5,.55,.75,()=>palm(.8+rnd()*.3))}
 if(o.t==="ron"){place(8,.1,.6,()=>caneClump());place(4,.55,.75,()=>palm(.8))}
 if(o.t==="lino"){place(9,.05,.6,()=>flaxBush());place(2,.5,.7,()=>palm(.75))}
 if(o.t==="hierro"){place(6,.25,.6,()=>rockLump());const hut=mineHut();hut.position.set(R*.45,hAt(R*.45,0),0);g.add(hut)}
 if(o.t==="perlas"){place(3,0,.4,()=>palm(.7))}
 shadowAll(g);g.userData.R=R;g.userData.hAt=hAt;return g;
}
const leafMat=()=>std("#3d7a2a",{side:THREE.DoubleSide,roughness:.7});
function palm(s=1){const g=new THREE.Group();const pts=[];const lean=.25+rnd()*.3;for(let i=0;i<=6;i++){const t=i/6;pts.push(new THREE.Vector3(lean*t*t,t*1.6,0))}
 const curve=new THREE.CatmullRomCurve3(pts);const tr=new THREE.Mesh(new THREE.TubeGeometry(curve,10,.055,6),std("#7a5a3a"));g.add(tr);
 const top=pts[6];const lm=leafMat();for(let i=0;i<7;i++){const lg=new THREE.PlaneGeometry(1,.26,6,1);const p=lg.attributes.position;for(let k=0;k<p.count;k++){const x=p.getX(k)+.5;p.setX(k,x);p.setZ(k,-.32*x*x);p.setY(k,p.getY(k)*(1-x*.7))}lg.rotateX(-Math.PI/2);lg.computeVertexNormals();const l=new THREE.Mesh(lg,lm);l.position.copy(top);l.rotation.y=i/7*6.283+rnd()*.3;l.rotation.z=.15;g.add(l)}
 g.scale.setScalar(s);return g}
function jungleTree(s){const g=new THREE.Group();const tr=new THREE.Mesh(new THREE.CylinderGeometry(.05,.08,.7,5),std("#5b4129"));tr.position.y=.35;g.add(tr);
 const shades=["#2f6b2a","#3b7f30","#285a24"];for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.34-.06*i,1),std(shades[i],{roughness:.8,flatShading:true}));b.position.set((rnd()-.5)*.25,.75+i*.17,(rnd()-.5)*.25);g.add(b)}g.scale.setScalar(s);return g}
function caneClump(){const g=new THREE.Group();for(let i=0;i<6;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(.04,.6+rnd()*.3,4),std(i%2?"#8fae46":"#a6b84f"));c.position.set((rnd()-.5)*.4,.3,(rnd()-.5)*.4);c.rotation.z=(rnd()-.5)*.3;g.add(c)}return g}
function flaxBush(){const g=new THREE.Group();const m=new THREE.Mesh(new THREE.SphereGeometry(.22,7,5),std(rnd()<.5?"#c9c77a":"#9fb0d8",{roughness:.9}));m.scale.y=.6;m.position.y=.1;g.add(m);return g}
function rockLump(){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.25+rnd()*.2,0),std("#4f4843",{flatShading:true}));m.scale.y=.7;return m}
function mineHut(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.5,.35,.45),std("#6b4e33"));b.position.y=.17;g.add(b);const r=new THREE.Mesh(new THREE.ConeGeometry(.42,.3,4),std("#3b2f2a"));r.position.y=.5;r.rotation.y=Math.PI/4;g.add(r);return g}
function colony(color){const g=new THREE.Group();[[0,0],[.42,.18],[-.3,.35]].forEach(([x,z],i)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(.36,.3,.32),std("#e6d8bd"));b.position.set(x,.15,z);g.add(b);const r=new THREE.Mesh(new THREE.ConeGeometry(.3,.26,4),std(color,{roughness:.6}));r.position.set(x,.43,z);r.rotation.y=Math.PI/4;g.add(r)});
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.9),std("#3a2a1a"));pole.position.set(.1,.45,-.3);g.add(pole);const fl=new THREE.Mesh(new THREE.PlaneGeometry(.3,.18),std(color,{side:THREE.DoubleSide}));fl.position.set(.25,.8,-.3);g.add(fl);shadowAll(g);return g}
function fort(color){const g=new THREE.Group();const t=new THREE.Mesh(new THREE.CylinderGeometry(.42,.5,.8,10),std("#8a8178"));t.position.y=.4;g.add(t);for(let i=0;i<8;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.13,.14,.13),std("#8a8178"));const a=i/8*6.283;m.position.set(Math.cos(a)*.38,.87,Math.sin(a)*.38);g.add(m)}
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(.34,.2),std(color,{side:THREE.DoubleSide}));fl.position.set(.17,1.25,0);g.add(fl);const p=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.6),std("#3a2a1a"));p.position.y=1.15;g.add(p);shadowAll(g);return g}
function ship(color,opt={}){
 const g=new THREE.Group();const hullGeo=new THREE.BoxGeometry(1.7,.42,.6,14,3,4);const p=hullGeo.attributes.position;
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const t=Math.max(-1,Math.min(1,x/.85));const v=Math.max(0,Math.min(1,(y+.21)/.42));
  const w=(1-Math.pow(Math.abs(t),2.6)*(t>0?.95:.45))*(.45+.55*v);p.setZ(i,z*w);p.setY(i,y+.12*t*t+(t<-.7?.12*(-t-.7)/.3:0))}
 hullGeo.computeVertexNormals();const wood=opt.wood||"#5a3a22";
 const hull=new THREE.Mesh(hullGeo,std(wood,{roughness:.75}));hull.position.y=.12;g.add(hull);
 const stripe=new THREE.Mesh(new THREE.BoxGeometry(1.5,.06,.5),std(color));stripe.position.y=.26;g.add(stripe);
 const deck=new THREE.Mesh(new THREE.BoxGeometry(1.45,.04,.44),std("#a07a50"));deck.position.y=.3;g.add(deck);
 [-.25,.3].forEach((x,i)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,1.5-i*.25),std("#3b2a1a"));m.position.set(x,1.02-i*.12,0);g.add(m);
  const sg=new THREE.PlaneGeometry(.62-i*.08,.62-i*.08,6,6);const sp=sg.attributes.position;for(let k=0;k<sp.count;k++){const xx=sp.getX(k),yy=sp.getY(k);sp.setZ(k,.12*(1-(xx*xx+yy*yy)*3))}sg.computeVertexNormals();
  const s=new THREE.Mesh(sg,std(opt.sail||"#efe3c8",{side:THREE.DoubleSide,roughness:.9}));s.position.set(x+.02,.98-i*.1,0);s.rotation.y=Math.PI/2;g.add(s);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(.22,.12),std(color,{side:THREE.DoubleSide}));fl.position.set(x+.11,1.8-i*.37,0);g.add(fl)});
 if(opt.lamp){const l=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:C("#ffc56b")}));l.position.set(-.8,.62,0);g.add(l);const pl=new THREE.PointLight(C("#ff9d3a"),opt.lamp,6,2);pl.position.copy(l.position);g.add(pl)}
 shadowAll(g);return g}

// laguna turquesa + espuma alrededor de cada isla
function lagoon(R,opt={}){
 const geo=new THREE.CircleGeometry(R*1.9,64);geo.rotateX(-Math.PI/2);
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uFD:{value:0},uC:{value:C(opt.c||"#3fd1c0")},uF:{value:(opt.f??.8)*.45},uR:{value:R},uT:{value:0},uA:{value:(opt.a??.75)*.6}},
  vertexShader:"varying vec2 vP;varying vec3 vW;void main(){vP=position.xz;vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
  fragmentShader:"uniform vec3 uC;uniform float uF,uR,uT,uA,uFD;varying vec2 vP;varying vec3 vW;void main(){float fz=exp(-pow(length(vW-cameraPosition)*uFD,2.));float d=length(vP)/uR;float a=smoothstep(1.65,.95,d)*uA;float f=smoothstep(.07,0.,abs(d-1.0-.03*sin(uT*1.3+atan(vP.y,vP.x)*7.)))*uF;vec3 c=mix(uC,vec3(1.),f);gl_FragColor=vec4(c,max(a,f*.8)*fz);}"});
 const mesh=new THREE.Mesh(geo,m);mesh.position.y=.04;mesh.renderOrder=2;anim.push(t=>m.uniforms.uT.value=t);return mesh}
// cuadrícula hexagonal
function hexGrid(color,op,y=.06){const pts=[];CELLS.forEach(c=>{for(let i=0;i<6;i++){const a1=Math.PI/6+i*Math.PI/3,a2=a1+Math.PI/3;pts.push(c.x+S*Math.cos(a1),y,c.z+S*Math.sin(a1),c.x+S*Math.cos(a2),y,c.z+S*Math.sin(a2))}});
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pts,3));const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:C(color),transparent:true,opacity:op,depthWrite:false}));l.renderOrder=3;return l}
// niebla volumétrica con sprites suaves
function fogBank(x,z,color,op,n=9,spread=2.6,h=1.2,size=5){const g=new THREE.Group();for(let i=0;i<n;i++){const m=new THREE.SpriteMaterial({map:cloudTex,color:C(color),transparent:true,opacity:op*(.6+rnd()*.4),depthWrite:false,fog:true});m.rotation=rnd()*6.28;const s=new THREE.Sprite(m);const sz=size*(.7+rnd()*.6);s.scale.set(sz,sz*.62,1);s.position.set(x+(rnd()-.5)*spread,.4+rnd()*h,z+(rnd()-.5)*spread);s.userData.b=s.position.clone();s.userData.ph=rnd()*6.28;g.add(s)}
 anim.push(t=>g.children.forEach(s=>{s.position.x=s.userData.b.x+Math.sin(t*.15+s.userData.ph)*.4;s.material.rotation+=.0008}));return g}
function seaMist(color,op,n,rad,y0,y1,size){const g=new THREE.Group();for(let i=0;i<n;i++){const m=new THREE.SpriteMaterial({map:cloudTex,color:C(color),transparent:true,opacity:op*(.5+rnd()*.5),depthWrite:false,fog:true});m.rotation=rnd()*6.28;const s=new THREE.Sprite(m);const sz=size*(.6+rnd()*.8);s.scale.set(sz,sz*.45,1);const a=rnd()*6.283,r=Math.sqrt(rnd())*rad;s.position.set(Math.cos(a)*r,y0+rnd()*(y1-y0),Math.sin(a)*r);s.userData.v=.2+rnd()*.3;g.add(s)}
 anim.push((t,dt)=>g.children.forEach(s=>{s.position.x+=s.userData.v*dt;if(s.position.x>rad)s.position.x=-rad}));return g}
function makeWater(geo,opt){const wn=loader.load("tex/waternormals.jpg",t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping});
 const w=new THREE.Water(geo,{textureWidth:opt.tex||512,textureHeight:opt.tex||512,waterNormals:wn,sunDirection:opt.sun.clone().normalize(),sunColor:opt.sunColor,waterColor:opt.color,distortionScale:opt.dist||3.2,fog:!!scene.fog,alpha:1});
 w.rotation.x=-Math.PI/2;w.material.uniforms.size.value=opt.size||7;anim.push((t,dt)=>w.material.uniforms.time.value+=dt*(opt.speed||.6));return w}
function makeSky(elev,azim,o){const sky=new THREE.Sky();sky.scale.setScalar(10000);const u=sky.material.uniforms;u.turbidity.value=o.turb;u.rayleigh.value=o.ray;u.mieCoefficient.value=o.mie;u.mieDirectionalG.value=o.g;
 const sun=new THREE.Vector3().setFromSphericalCoords(1,THREE.MathUtils.degToRad(90-elev),THREE.MathUtils.degToRad(azim));u.sunPosition.value.copy(sun);return {sky,sun}}
function sunLight(dir,col,int,range=30){const l=new THREE.DirectionalLight(C(col),int);l.position.copy(dir).multiplyScalar(60);l.castShadow=true;l.shadow.mapSize.set(2048,2048);const c=l.shadow.camera;c.left=c.bottom=-range;c.right=c.top=range;c.near=1;c.far=160;l.shadow.bias=-.0005;l.shadow.normalBias=.02;scene.add(l);return l}
