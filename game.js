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
const TYPES={selva:{g:"#3f7d34",g2:"#2c5e27"},lino:{g:"#b9b65a",g2:"#8f9a46"},hierro:{g:"#5d5650",g2:"#3e3a37"},ron:{g:"#6e9a3a",g2:"#577d2c"},perlas:{g:"#d9c896",g2:"#cdb987"}};
// ================= ARCHIPIÉLAGO · sala y red =================
const QS=new URLSearchParams(location.search);
const params=QS;
const LOCAL=QS.has("local");
const LOW=QS.has("low")||(!QS.has("high")&&(matchMedia("(pointer:coarse)").matches||Math.min(innerWidth,innerHeight)<600));
const CAPS=[{n:"Brasa",c:"#c0392b"},{n:"Bruno",c:"#2e86c1"},{n:"Nadia",c:"#d4ac0d"},{n:"Salitre",c:"#7d3c98"},{n:"Lupe",c:"#1e8449"},{n:"Kai",c:"#e67e22"}];
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let GS=null,myIdx=-1,worldReady=false,pendingMsgs=[];

// ---------- transporte: PeerJS (internet / wifi) o BroadcastChannel (pruebas) ----------
const Net={isHost:false,myId:null,code:null,peer:null,conns:{},bc:null,hostConn:null,
 ice:{iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:global.stun.twilio.com:3478"},{urls:"turn:openrelay.metered.ca:80",username:"openrelayproject",credential:"openrelayproject"},{urls:"turn:openrelay.metered.ca:443?transport=tcp",username:"openrelayproject",credential:"openrelayproject"}]},
 host(code,ok,fail){this.isHost=true;this.code=code;this.myId="h";
  if(LOCAL){this.bc=new BroadcastChannel("archi-"+code);this.bc.onmessage=e=>{const d=e.data;if(d.to==="h")hostRecv(d.from,d.m)};ok();return}
  this.peer=new Peer("archipielago-"+code.toLowerCase(),{config:this.ice,debug:1});
  this.peer.on("open",()=>ok());
  this.peer.on("error",e=>fail(e.type==="unavailable-id"?"Ese código ya está en uso. Prueba otra vez.":"No se pudo crear la sala ("+e.type+")."));
  this.peer.on("connection",conn=>{conn.on("open",()=>{this.conns[conn.peer]=conn});conn.on("data",m=>hostRecv(conn.peer,m));conn.on("close",()=>{delete this.conns[conn.peer];hostLeft(conn.peer)})})},
 join(code,ok,fail){this.isHost=false;this.code=code;
  if(LOCAL){this.myId="p"+Math.random().toString(36).slice(2,8);this.bc=new BroadcastChannel("archi-"+code);this.bc.onmessage=e=>{const d=e.data;if(d.to==="all"||d.to===this.myId)clientRecv(d.m)};ok();return}
  this.peer=new Peer({config:this.ice,debug:1});
  const to=setTimeout(()=>fail("No encuentro esa sala. Revisa el código."),15000);
  this.peer.on("open",id=>{this.myId=id;const c=this.peer.connect("archipielago-"+code.toLowerCase(),{reliable:true});this.hostConn=c;
   c.on("open",()=>{clearTimeout(to);ok()});c.on("data",m=>clientRecv(m));c.on("close",()=>banner("Se ha perdido la conexión con el anfitrión."))});
  this.peer.on("error",e=>{clearTimeout(to);fail(e.type==="peer-unavailable"?"No encuentro esa sala. Revisa el código.":"Error de conexión ("+e.type+").")})},
 toHost(m){if(this.isHost){hostRecv("h",m);return}if(LOCAL)this.bc.postMessage({from:this.myId,to:"h",m});else this.hostConn&&this.hostConn.open&&this.hostConn.send(m)},
 toOne(id,m){if(id==="h"){clientRecv(JSON.parse(JSON.stringify(m)));return}if(LOCAL)this.bc.postMessage({from:"h",to:id,m});else{const c=this.conns[id];c&&c.open&&c.send(m)}},
 toAll(m){clientRecv(JSON.parse(JSON.stringify(m)));if(LOCAL)this.bc.postMessage({from:"h",to:"all",m});else Object.values(this.conns).forEach(c=>c.open&&c.send(m))}
};

// ---------- interfaz de la sala ----------
{const st=document.createElement("style");st.textContent=`
.lobby{position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;padding:16px;background:radial-gradient(ellipse at 50% 30%,#2a2020 0,#0d0a09 60%,#050404 100%);font-family:"IM Fell English",Georgia,serif;color:#f3e6c8;overflow:auto}
.lobby[hidden]{display:none}
.lobby .in{width:min(440px,100%);display:flex;flex-direction:column;gap:14px;text-align:center}
.lobby h1{font-family:"IM Fell English SC",Georgia,serif;font-weight:400;font-size:clamp(40px,10vw,64px);margin:0;letter-spacing:.04em;color:#f3e6c8;text-shadow:0 2px 24px rgba(224,120,60,.35)}
.lobby .sub{color:#b9a985;font-style:italic;margin:-8px 0 8px}
.lobby input{font:inherit;font-size:18px;padding:12px 14px;border-radius:10px;border:1px solid rgba(224,180,90,.45);background:rgba(0,0,0,.35);color:#f3e6c8;text-align:center;width:100%;box-sizing:border-box}
.lobby input:focus{outline:2px solid #e0b45a;outline-offset:1px}
.lobby button{font:inherit;font-size:18px;padding:12px 16px;border-radius:999px;border:1px solid rgba(224,180,90,.55);background:rgba(224,180,90,.16);color:#f3e6c8;cursor:pointer}
.lobby button.pri{background:#e0b45a;color:#1a120a;border-color:#e0b45a}
.lobby button:disabled{opacity:.45;cursor:default}
.lobby .row{display:flex;gap:8px}.lobby .row>*{flex:1;min-width:0}
.lobby .or{color:#8a7a60;font-style:italic}
.lobby .code{font-family:"IM Fell English SC",Georgia,serif;font-size:56px;letter-spacing:.18em;color:#e0b45a}
.lobby .pl{display:flex;flex-direction:column;gap:6px;text-align:left}
.lobby .pl div{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.04)}
.lobby .dot{width:14px;height:14px;border-radius:50%;flex:none}
.lobby .err{color:#ff9b7a;min-height:1.2em}
.lobby .in.wide{width:min(760px,100%)}
.lobby .caps{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
@media (max-width:640px){.lobby .caps{grid-template-columns:repeat(3,1fr)}}
.lobby button.cap{padding:0;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;align-items:center;background:#120c08;border:2px solid rgba(224,180,90,.25);font-size:14px;transition:transform .2s,border-color .2s}
.lobby button.cap img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block}
.lobby button.cap .cn{font-family:"IM Fell English SC",Georgia,serif;font-size:16px;color:var(--c);padding-top:4px;filter:brightness(1.4)}
.lobby button.cap .cw{font-size:12px;color:#8a7a60;padding:0 4px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.lobby button.cap:hover:not(:disabled){transform:translateY(-3px);border-color:#e0b45a}
.lobby button.cap.mine{border-color:var(--c);box-shadow:0 0 0 2px var(--c),0 0 24px var(--c)}.lobby button.cap.mine .cw{color:#f3e6c8}
.lobby button.cap:disabled{opacity:.35}
.lobby .small{font-size:14px;color:#8a7a60}
.lobby .rules{text-align:left;font-size:15px;color:#cdbd98;background:rgba(255,255,255,.04);border-radius:10px;padding:8px 12px}.lobby .rules summary{cursor:pointer;color:#e0b45a}.lobby .rules li{margin:6px 0}.lobby .rules b{color:#f3e6c8}
.banner{position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:30;background:#5a1d14;color:#fff;padding:10px 16px;border-radius:10px;font-family:Georgia,serif;max-width:calc(100% - 32px)}`;document.head.appendChild(st)}
const lob=document.createElement("div");lob.className="lobby";lob.innerHTML=`<div class="in" id="lin">
<h1>Archipiélago</h1><div class="sub">Piratas, niebla y un volcán con tesoro</div>
<input id="lName" maxlength="14" placeholder="Tu nombre" autocomplete="off">
<button class="pri" id="lCreate">Crear partida</button>
<div class="or">o únete a la de un amigo</div>
<div class="row"><input id="lCode" maxlength="4" placeholder="CÓDIGO" autocomplete="off" style="text-transform:uppercase;letter-spacing:.2em"><button id="lJoin">Unirse</button></div>
<div class="err" id="lErr"></div><div class="small">${LOW?"Calidad ajustada para móvil":"Calidad alta"}</div>
<details class="rules"><summary>Cómo se juega</summary><ul>
<li>Cada ronda, todos dais órdenes <b>en secreto</b> a la vez: la ruta (hasta 3 casillas, en el mapa con M), una carta y cuánto ron apostáis si hay abordaje.</li>
<li>Cuando todos confirman, los barcos navegan a la vez. Si dos acaban en la misma casilla o se cruzan, hay <b>abordaje</b>: gana quien tenga más cañones + ron apostado. El ganador suma 1 de fama y roba ron; el perdedor vuelve a puerto.</li>
<li>Para junto a una isla marcada con ✕ y saquearás su <b>cofre</b> (fama, ron, una carta… o una trampa).</li>
<li>El <b>tesoro del volcán</b> da +3 de fama. Sigue el humo. Cuidado: puede entrar en erupción.</li>
<li>Con los faroles apagados os ven peor. El catalejo (C) ve más lejos entre la niebla.</li>
<li>Las <b>Cartas de Fortuna</b> ayudan o fastidian a otros. ¡Sabotaje descubierto! te protege sola.</li>
<li>Gana el primero en llegar a la fama que marca arriba (10 con 3 o 4 piratas).</li></ul></details></div>`;
document.body.appendChild(lob);
try{$("lName").value=localStorage.getItem("archi-name")||""}catch(e){}
{const c=QS.get("sala");if(c)$("lCode").value=c.toUpperCase()}
function banner(t){const b=document.createElement("div");b.className="banner";b.textContent=t;document.body.appendChild(b);setTimeout(()=>b.remove(),8000)}
function myName(){const n=$("lName").value.trim()||"Pirata";try{localStorage.setItem("archi-name",n)}catch(e){}return n}
function lobbyWait(html){$("lin").innerHTML=html}
$("lCreate").onclick=()=>{const name=myName();const code=Array.from({length:4},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random()*24)]).join("");$("lErr").textContent="Creando sala…";
 Net.host(code,()=>{H.players=[{id:"h",name,cap:0}];renderHostLobby()},e=>{$("lErr").textContent=e})};
$("lJoin").onclick=()=>{const name=myName();const code=$("lCode").value.trim().toUpperCase();if(code.length!==4){$("lErr").textContent="El código tiene 4 letras.";return}$("lErr").textContent="Conectando…";
 Net.join(code,()=>{Net.toHost({t:"join",name,id:Net.myId});lobbyWait(`<h1>Archipiélago</h1><div class="sub">Sala ${esc(code)} · elige tu capitán</div><div class="caps" id="lCaps"></div><div class="small">Esperando a que el anfitrión zarpe…</div>`);$("lin").classList.add("wide");renderPlayers(LP)},e=>{$("lErr").textContent=e})};
let LP=[];
function renderPlayers(list){LP=list;const el=$("lPl");if(el)el.innerHTML=list.map(p=>`<div><span class="dot" style="background:${CAPS[p.cap].c}"></span><span>${esc(p.name)}${p.id===Net.myId?" (tú)":""}</span><span class="small" style="margin-left:auto">${CAPS[p.cap].n}</span></div>`).join("");
 const g=$("lCaps");if(!g)return;g.innerHTML=CAPS.map((c,k)=>{const o=list.find(p=>p.cap===k);const mine=o&&o.id===Net.myId;return `<button class="cap ${mine?"mine":""}" data-k="${k}" ${o&&!mine?"disabled":""} style="--c:${c.c}"><img alt="" src="retratos/${c.n.toLowerCase()}.jpg"><span class="cn">${c.n}</span><span class="cw">${o?esc(o.name):"libre"}</span></button>`}).join("");
 g.querySelectorAll("button.cap").forEach(b=>b.onclick=()=>Net.toHost({t:"cap",c:+b.dataset.k}))}
const CAPDESC=["Capitana Brasa","Bruno el Forjado","Nadia la Inventora","Viejo Salitre","Lupe la Elegante","Kai el Grumete"];
function renderHostLobby(){const url=location.origin+location.pathname+"?sala="+Net.code+(LOCAL?"&local":"");
 lobbyWait(`<h1>Archipiélago</h1><div class="sub">Pasa este código a tus amigos</div><div class="code">${Net.code}</div><div class="small">o este enlace: <span style="user-select:all;word-break:break-all">${esc(url)}</span></div><div class="sub" style="margin:4px 0 -4px">Elige tu capitán</div><div class="caps" id="lCaps"></div><button class="pri" id="lStart">Zarpar</button><div class="small" id="lHint"></div>`);$("lin").classList.add("wide");
 renderPlayers(H.players);$("lStart").disabled=H.players.length<2&&!QS.has("solo");$("lHint").textContent=H.players.length<2?"Hacen falta al menos 2 piratas.":H.players.length+" piratas. El mapa se ajusta a vosotros.";
 $("lStart").onclick=()=>hostStart()}

// ---------- lógica del anfitrión ----------
const H={players:[],orders:{},G:null};
function hostRecv(from,m){
 if(m.t==="join"){if(H.G){const nm=String(m.name).slice(0,14).toLowerCase();const p=H.G.players.find(p=>p.gone&&p.name.toLowerCase()===nm)||H.G.players.find(p=>p.name.toLowerCase()===nm);
   if(p){p.id=from;p.gone=false;p.ready=false;delete H.orders[p.i];Net.toOne(from,{t:"start",G:H.G});Net.toAll({t:"ready",ready:H.G.players.map(p=>p.ready),gone:H.G.players.map(p=>p.gone)});banner(p.name+" ha vuelto a la partida.")}
   else Net.toOne(from,{t:"full"});return}if(H.players.length>=6||H.players.some(p=>p.id===from))return;let cap=0;while(H.players.some(p=>p.cap===cap))cap++;H.players.push({id:from,name:String(m.name).slice(0,14),cap});Net.toAll({t:"lobby",players:H.players});renderHostLobby();return}
 if(m.t==="cap"&&!H.G){const p=H.players.find(p=>p.id===from);const c=m.c|0;if(p&&c>=0&&c<6&&!H.players.some(q=>q.cap===c&&q!==p)){p.cap=c;Net.toAll({t:"lobby",players:H.players});renderHostLobby()}return}
 if(m.t==="orders"&&H.G&&H.G.phase==="orders"){const i=H.G.players.findIndex(p=>p.id===from);if(i<0)return;H.orders[i]=m.o;H.G.players[i].ready=true;Net.toAll({t:"ready",ready:H.G.players.map(p=>p.ready)});hostMaybeResolve();return}
}
function hostLeft(id){if(!H.G){H.players=H.players.filter(p=>p.id!==id);Net.toAll({t:"lobby",players:H.players});renderHostLobby();return}
 const p=H.G.players.find(p=>p.id===id);if(p){p.gone=true;p.ready=true;Net.toAll({t:"ready",ready:H.G.players.map(p=>p.ready),gone:H.G.players.map(p=>p.gone)});banner(p.name+" se ha desconectado. Si vuelve a entrar con el mismo nombre, recupera su barco.");hostMaybeResolve()}}
function hostMaybeResolve(){if(H.G.players.every(p=>p.ready||p.gone))setTimeout(()=>{if(H.G.phase==="orders")hostResolve()},400)}
function hostStart(){if(H.G)return;const np=H.players.length;const deck=[];CARD_LIST.forEach(c=>{for(let i=0;i<c[3];i++)deck.push(c[0])});shuffle(deck);
 H.G={seed:1000+Math.floor(Math.random()*90000),np,round:1,phase:"orders",target:np<=2?8:np<=4?10:12,treasures:Math.max(1,np-1),
  players:H.players.map((p,i)=>({id:p.id,name:p.name,i,cap:p.cap,fame:0,rum:3,cannons:2,hand:[deck.pop(),deck.pop(),deck.pop()].slice(0,3),cell:null,home:null,ready:false,looted:[],hideFrom:{},got:false,faroles:false,gone:false})),deck,winner:-1};
 H.orders={};Net.toAll({t:"start",G:H.G})}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const CARD_LIST=[["viento-a-favor","Viento a favor","ventaja",3,"Este turno navegas hasta 5 casillas."],
 ["vigia-de-aguila","Vigía de águila","ventaja",2,"Esta ronda ves todos los barcos a 4 casillas o menos."],
 ["remiendo-rapido","Cañón de bronce","ventaja",2,"Tu barco gana 1 cañón para siempre."],
 ["contrabando","Contrabando","ventaja",2,"Ganas 2 barriles de ron."],
 ["botin-escondido","Botín escondido","ventaja",2,"Ganas 1 de fama."],
 ["carta-del-cartografo","Carta del cartógrafo","ventaja",1,"Descubres en tu mapa una zona camino del volcán."],
 ["motin","Motín","sabotaje",2,"El barco de un rival no se mueve este turno."],
 ["rata-en-la-bodega","Rata en la bodega","sabotaje",2,"Un rival pierde 2 barriles de ron."],
 ["kraken-a-sueldo","Kraken a sueldo","sabotaje",1,"El kraken ataca a un rival: pierde 1 de fama y vuelve a su puerto."],
 ["desvio-de-la-tormenta","Desvío de la tormenta","sabotaje",2,"La tormenta frena a un rival: solo avanza 1 casilla."],
 ["bandera-falsa","Bandera falsa","sabotaje",2,"Si hay abordaje esta ronda, nadie sabrá que fuiste tú."],
 ["mapa-robado","Mapa robado","sabotaje",2,"Copias en tu mapa la zona de un rival."],
 ["polvora-mojada","Pólvora mojada","sabotaje",2,"Esta ronda, un rival lucha con 2 cañones menos."],
 ["sobornar-al-vigia","Sobornar al vigía","sigilo",2,"Un rival no puede verte durante 2 rondas."],
 ["bruma-espesa","Bruma espesa","sigilo",2,"Esta ronda nadie puede ver tu barco."],
 ["sabotaje-descubierto","¡Sabotaje descubierto!","respuesta",3,"Si te juegan un sabotaje, se anula solo y sabes quién fue."]];
const NEEDS_TARGET=new Set(["motin","rata-en-la-bodega","kraken-a-sueldo","desvio-de-la-tormenta","mapa-robado","polvora-mojada","sobornar-al-vigia"]);

// ---------- mensajes al cliente ----------
function clientRecv(m){
 if(m.t==="lobby"){renderPlayers(m.players);return}
 if(m.t==="full"){$("lErr")&&($("lErr").textContent="");banner("La partida ya ha empezado. Entra con el mismo nombre que tenías para recuperar tu barco.");return}
 if(m.t==="start"){GS=m.G;myIdx=GS.players.findIndex(p=>p.id===Net.myId);if(myIdx<0){banner("La partida ya ha empezado sin ti.");return}if(worldReady)return;lob.hidden=true;loadWorld();return}
 if(!worldReady){pendingMsgs.push(m);return}
 worldMsg(m)}
function loadWorld(){const s=document.createElement("script");s.src="world.js?v="+(window.BUILD||"1");s.onload=()=>{worldReady=true;pendingMsgs.splice(0).forEach(worldMsg)};document.body.appendChild(s)}
