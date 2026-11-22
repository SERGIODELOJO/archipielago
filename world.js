// ================= ARCHIPIÉLAGO · mundo (se carga al zarpar) =================
controls.enabled=false;
if(LOW){renderer.setPixelRatio(1);renderer.shadowMap.enabled=false}else renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
seed=GS.seed;
const NP=GS.np;
const HS=22, K=HS/3.2;
const wx=(q,r)=>HS*Math.sqrt(3)*(q+r/2), wz=(q,r)=>HS*1.5*r;
const RAD={1:4,2:4,3:5,4:5,5:6,6:6}[NP];
const cdist=(a,b)=>(Math.abs(a.q-b.q)+Math.abs(a.r-b.r)+Math.abs((a.q+a.r)-(b.q+b.r)))/2;
const key=c=>c.q+","+c.r;
const CELLS=[],CM={};for(let q=-RAD;q<=RAD;q++)for(let r=-RAD;r<=RAD;r++){if(Math.abs(q+r)<=RAD){const c={q,r,x:wx(q,r),z:wz(q,r),d:cdist({q,r},{q:0,r:0})};CELLS.push(c);CM[key(c)]=c}}
const NB=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const neighbors=c=>NB.map(([a,b])=>CM[(c.q+a)+","+(c.r+b)]).filter(Boolean);
const PCOL=GS.players.map(p=>CAPS[p.cap||0].c);
const used=new Set();
const NPORT=NP+(NP<=4?2:3);const HOMES=[];for(let k=0;k<NPORT;k++){const a=-Math.PI/2+k*2*Math.PI/NPORT+rnd()*.3;const W=RAD*HS*Math.sqrt(3);let best=null,bd=1e9;CELLS.filter(c=>c.d===RAD&&!used.has(key(c))).forEach(c=>{const d=(c.x-Math.cos(a)*W)**2+(c.z-Math.sin(a)*W)**2;if(d<bd){bd=d;best=c}});HOMES.push(best);used.add(key(best))}
let VOL=null;{const cs=CELLS.filter(c=>c.d<=RAD-2).map(c=>({c,m:Math.min(...HOMES.map(h=>cdist(h,c)))})).filter(o=>o.m>=Math.max(3,RAD-1));VOL=(cs.length?cs:CELLS.filter(c=>c.d<=1).map(c=>({c})))[Math.floor(rnd()*Math.max(1,cs.length))].c;used.add(key(VOL));neighbors(VOL).forEach(n=>used.add(key(n)))}
const TYPEBAG=["selva","lino","hierro","ron","perlas"];
const ISL=HOMES.map((h,i)=>({c:h,t:i%2?"ron":"selva",s:1.05,port:i}));
{const cand=CELLS.filter(c=>!used.has(key(c))&&!HOMES.some(h=>cdist(h,c)===1));for(let i=cand.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[cand[i],cand[j]]=[cand[j],cand[i]]}
 let ti=0;const target=Math.round(CELLS.length*.25);for(const c of cand){if(ISL.length>=target)break;if(neighbors(c).some(n=>ISL.some(o=>o.c===n))&&rnd()<.8)continue;const t=TYPEBAG[ti++%5];ISL.push({c,t,s:t==="perlas"?.6+rnd()*.2:.75+rnd()*.35})}}
const ISLMAP={};ISL.forEach(o=>ISLMAP[key(o.c)]=o);
const sailable=c=>c&&!ISLMAP[key(c)]&&c!==VOL;
const START=HOMES.map(h=>neighbors(h).filter(sailable).sort((a,b)=>a.d-b.d)[0]);
// puertos: se reparten en la fase de colocación (G.portOwner[puerto] = jugador o -1)
const PORTS=ISL.filter(o=>o.port!==undefined);
function applyPorts(G){PORTS.forEach(o=>{const ow=((G&&G.portOwner)||[])[o.port];o.home=ow>=0?ow:undefined})}
// casilla de salida: junto al puerto elegido (o una provisional, oculta, mientras se elige)
const setCells=G=>G&&G.players.forEach((p,i)=>{if(!p.cell){const j=(G.portOwner||[]).indexOf(i);const s=START[j>=0?j:i%NPORT];p.cell=[s.q,s.r];p.home=p.cell.slice()}});
setCells(GS);if(Net.isHost&&H.G){setCells(H.G);if(H.G.phase==="place")setTimeout(()=>hostDraftArm(),H.G.draft&&H.G.draft.dice?13000:3000)}
applyPorts(GS);
const cellOf=a=>CM[a[0]+","+a[1]];
{const mk=G=>{if(G&&!G.terr){G.terr={};G.fort={};G.bld=G.bld||{};ISL.forEach(o=>{if(o.port===undefined){G.terr[key(o.c)]=Array(slotsOf(o)).fill(-1);G.fort[key(o.c)]=Array(slotsOf(o)).fill(0)}})}};if(Net.isHost&&H.G)mk(H.G);mk(GS)}
// ---------- cielo, mar, luz ----------
renderer.toneMappingExposure=.75;
camera.fov=62;camera.near=.1;camera.far=6000;camera.updateProjectionMatrix();
const FOGC=new THREE.Color("#6e5e59");scene.fog=new THREE.FogExp2(FOGC.clone(),.031);let fogT=.031;scene.background=FOGC.clone();
const sunDir=new THREE.Vector3().setFromSphericalCoords(1,THREE.MathUtils.degToRad(86),THREE.MathUtils.degToRad(235));
const dome=new THREE.Mesh(new THREE.SphereGeometry(4000,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{uH:{value:FOGC},uZ:{value:new THREE.Color("#22232f")},uS:{value:new THREE.Color("#ffa060")},uD:{value:sunDir}},
 vertexShader:"varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
 fragmentShader:"uniform vec3 uH,uZ,uS,uD;varying vec3 vD;\n#include <common>\nvoid main(){float h=max(vD.y,0.);vec3 c=mix(uH,uZ,pow(smoothstep(.2,.8,h),.8));float s=max(dot(vD,normalize(uD)),0.);c+=uS*(pow(s,8.)*.35+pow(s,90.)*1.2)*smoothstep(-.05,.25,1.-h);gl_FragColor=vec4(c,1.);}"}));
dome.renderOrder=-10;scene.add(dome);
const water=makeWater(new THREE.PlaneGeometry(8000,8000),{tex:LOW?256:512,sun:sunDir,sunColor:0xffb080,color:0x06161d,dist:3.4,size:1.1,speed:.8});scene.add(water);
const hemi=new THREE.HemisphereLight(C("#ffc9a8"),C("#10161c"),1.1);scene.add(hemi);
const key1=new THREE.DirectionalLight(C("#ffb380"),2.6);key1.castShadow=true;key1.shadow.mapSize.set(2048,2048);Object.assign(key1.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:300});key1.shadow.bias=-.0004;key1.shadow.normalBias=.05;scene.add(key1);scene.add(key1.target);

// ---------- islas ----------
const islandMeshes={};
ISL.forEach(o=>{const G=new THREE.Group();const g=island({x:0,z:0,t:o.t,s:o.s,q:o.c.q,r:o.c.r});G.add(g);const L=lagoon(g.userData.R,{c:"#3cc7b4",a:.65});G.add(L);
 if(false){const c=colony(PCOL[o.home]);const R=g.userData.R;c.position.set(R*.15,g.userData.hAt(R*.15,0),0);c.scale.setScalar(1.2);g.add(c)}
 G.scale.setScalar(K);G.position.set(o.c.x,0,o.c.z);G.rotation.y=rnd()*6.28;scene.add(G);islandMeshes[key(o.c)]=G});

// ---------- volcán con columna de humo visible desde lejos ----------
(function(){const vg=new THREE.Group();window.VOLG=vg;const N=110,M=200,pos=[],col=[],glw=[],idx=[];const Rv=4.9,PK=11.5;
 const ash=C("#221c1a"),rk=C("#3e322d"),rk2=C("#5a4a40"),grn=C("#34502a"),snd=C("#a98d6a"),hot=C("#8a2208"),tc=new THREE.Color();
 const prof=k=>k<.1?PK-2.6*(1-k/.1)*(1-k/.1):k<.62?PK*Math.pow(1-(k-.1)/.52,1.25)*.82+PK*.18*(1-(k-.1)/.52):k<.9?PK*.18*Math.pow(1-(k-.62)/.28,1.6)+.22:.22-.75*(k-.9)/.1;
 for(let i=0;i<=N;i++)for(let j=0;j<M;j++){const k=i/N,th=j/M*6.283;const co=1+.12*(fbm(Math.cos(th)*1.6+3,Math.sin(th)*1.6)-.5)*2;const r=k*Rv*co;const X=Math.cos(th)*r,Z=Math.sin(th)*r;
  let h=prof(k);// borde del cráter dentado
  if(k<.16)h+=.9*(fbm(Math.cos(th)*4+7,Math.sin(th)*4)-.5)*(1-Math.abs(k-.1)/.1);
  h+=.55*(fbm(X*1.1,Z*1.1)-.5)*(1-k*.6)+.25*(fbm(X*3.1+9,Z*3.1)-.5)*(1-k);
  // cono parásito al sureste
  {const dx=X-2.3,dz=Z-1.4,d=Math.sqrt(dx*dx+dz*dz);if(d<1.4)h=Math.max(h,PK*.34*(1-d/1.4)*(1-d/1.4)*(d<.25?.75:1)+.3)}
  // barrancos radiales
  const gul=Math.pow(Math.max(0,Math.cos(th*7+fbm(X*.5,Z*.5)*4)),14);h-=gul*.5*(1-k)*(k>.1?1:0);
  // ríos de lava: siguen algunos barrancos
  const lavaR=k>.1&&k<.78?Math.pow(Math.max(0,Math.cos(th*3+1.1+fbm(X*.4,Z*.4)*3)),60)*(1-(k-.1)/.68):0;
  pos.push(X,h,Z);
  if(h<.3)tc.copy(snd);else if(k>.66)tc.copy(grn).lerp(rk,.35+.4*fbm(X*2,Z*2));else tc.copy(rk2).lerp(ash,Math.min(1,(1-k)*1.2)).lerp(rk,fbm(X*3,Z*3)*.4);
  if(k<.6&&gul>.4)tc.lerp(ash,.5);let g=0;if(lavaR>.15){g=Math.min(1,lavaR*1.6);tc.lerp(hot,g)}if(k<.12){g=Math.max(g,.6*(1-k/.12));tc.copy(hot).lerp(ash,.3)}
  col.push(tc.r,tc.g,tc.b);glw.push(g)}
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*M+j,b=i*M+(j+1)%M,c=(i+1)*M+j,d=(i+1)*M+(j+1)%M;idx.push(a,b,c,b,d,c)}
 const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));geo.setAttribute("color",new THREE.Float32BufferAttribute(col,3));geo.setAttribute("glow",new THREE.Float32BufferAttribute(glw,1));geo.setIndex(idx);geo.computeVertexNormals();
 const vmat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:0});const vU={uT:{value:0}};
 vmat.onBeforeCompile=sh=>{sh.uniforms.uT=vU.uT;sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nattribute float glow;varying float vGlow;varying vec3 vWP;").replace("#include <begin_vertex>","#include <begin_vertex>\nvGlow=glow;vWP=position;");
  sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform float uT;varying float vGlow;varying vec3 vWP;").replace("#include <emissivemap_fragment>","#include <emissivemap_fragment>\nfloat fl=.65+.35*sin(uT*2.+vWP.y*3.+vWP.x*2.);totalEmissiveRadiance+=vec3(1.,.32,.06)*vGlow*vGlow*2.6*fl;").replace("#include <fog_fragment>","#ifdef USE_FOG\nfloat vfd=fogDensity*.3;float vf=1.0-exp(-vfd*vfd*fogDepth*fogDepth);gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor*.8,vf);\n#endif")};
 anim.push(t=>vU.uT.value=t);
 const vm=new THREE.Mesh(geo,vmat);vm.castShadow=true;vm.receiveShadow=true;vg.add(vm);
 // brasas que suben del cráter
 {const n=LOW?60:220,bp=new Float32Array(n*3),bs=[];for(let i=0;i<n;i++)bs.push({a:rnd()*6.28,r:rnd()*.5,k:rnd(),v:.15+rnd()*.25});const bg=new THREE.BufferGeometry();bg.setAttribute("position",new THREE.BufferAttribute(bp,3));
  const em=new THREE.Points(bg,new THREE.PointsMaterial({color:C("#ffa040"),size:.16,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));vg.add(em);
  anim.push(t=>{bs.forEach((b,i)=>{const k=(b.k+t*b.v*.25)%1;const rr=b.r+k*1.2;bp[i*3]=Math.cos(b.a+k*2)*rr;bp[i*3+1]=PK-1.2+k*7;bp[i*3+2]=Math.sin(b.a+k*2)*rr});bg.attributes.position.needsUpdate=true})}
 const lavaT=loader.load("tex/lavatile.jpg");lavaT.wrapS=lavaT.wrapT=THREE.RepeatWrapping;lavaT.encoding=THREE.sRGBEncoding;
 const lava=new THREE.Mesh(new THREE.CircleGeometry(Rv*.12,40).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:lavaT,emissiveMap:lavaT,emissive:C("#ff6a1a"),emissiveIntensity:2.4,color:C("#401005"),fog:false}));lava.position.y=PK-2.15;vg.add(lava);
 anim.push(t=>lavaT.offset.set(t*.02,t*.013));
 vg.scale.setScalar(K);vg.position.set(VOL.x,0,VOL.z);scene.add(vg);
 const pl=new THREE.PointLight(C("#ff5a1a"),4,260,1.5);pl.position.set(VOL.x,PK*K+6,VOL.z);scene.add(pl);
 // humo: ignora la niebla para que se vea desde cualquier punto del mapa
 const smoke=new THREE.Group();for(let i=0;i<70;i++){const m=new THREE.SpriteMaterial({map:cloudTex,color:C(i<10?"#b0603a":"#8a7a76"),transparent:true,opacity:.6,depthWrite:false,fog:false});m.rotation=rnd()*6.28;const s=new THREE.Sprite(m);s.userData.k=i/70;s.userData.o=rnd()*6.28;smoke.add(s)}
 anim.push(t=>smoke.children.forEach(s=>{const k=(s.userData.k+t*.012)%1;const sz=14+k*120;s.scale.set(sz,sz*.8,1);s.position.set(VOL.x+k*k*160+Math.sin(k*7+s.userData.o)*8,PK*K+k*330,VOL.z-k*k*60+Math.cos(k*5+s.userData.o)*8);s.material.opacity=.62*Math.min(1,k*10)*(1-k*.9)}));
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,color:C("#ff5a20"),transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));glow.scale.set(90,60,1);glow.position.set(VOL.x,PK*K+8,VOL.z);smoke.add(glow);
 scene.add(smoke);
})();

// ---------- personajes provisionales ----------
function person(o){const g=new THREE.Group();const skin=std(o.skin||"#c99272"),coat=std(o.coat||"#6b3a2a"),dark=std(o.pants||"#2b2420");
 const hip=new THREE.Group();hip.position.y=.82;g.add(hip);
 const legs=[-1,1].map(s=>{const l=new THREE.Group();l.position.set(0,0,s*.1);const m=new THREE.Mesh(new THREE.CylinderGeometry(.075,.06,.8,8),dark);m.position.y=-.4;l.add(m);const b=new THREE.Mesh(new THREE.BoxGeometry(.2,.1,.12),std("#1a1512"));b.position.set(.04,-.79,0);l.add(b);hip.add(l);return l});
 const torso=new THREE.Group();hip.add(torso);
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.2,.24,.66,10),coat);body.position.y=.33;torso.add(body);
 const belt=new THREE.Mesh(new THREE.CylinderGeometry(.245,.245,.07,10),std("#2a1a10"));belt.position.y=.06;torso.add(belt);
 const head=new THREE.Group();head.position.y=.8;torso.add(head);
 const hm=new THREE.Mesh(new THREE.SphereGeometry(.15,12,10),skin);head.add(hm);
 if(o.beard){const bd=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),std(o.hair||"#2a1a10"));bd.scale.set(.8,.8,1.1);bd.position.set(.07,-.08,0);head.add(bd)}
 if(o.hat==="tricorn"){const h=new THREE.Mesh(new THREE.ConeGeometry(.3,.14,3),std("#1c1714"));h.position.y=.13;head.add(h);const t=new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,.12,10),std("#1c1714"));t.position.y=.17;head.add(t)}
 else if(o.hat==="bandana"){const h=new THREE.Mesh(new THREE.SphereGeometry(.155,12,8,0,6.29,0,1.5),std(o.band||"#a8322a"));h.position.y=.01;head.add(h)}
 else {const h=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8,0,6.29,0,1.3),std(o.hair||"#3a2414"));h.position.y=.02;head.add(h)}
 const arms=[-1,1].map(s=>{const a=new THREE.Group();a.position.set(0,.6,s*.27);const m=new THREE.Mesh(new THREE.CylinderGeometry(.06,.055,.6,8),coat);m.position.y=-.3;a.add(m);const hnd=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),skin);hnd.position.y=-.62;a.add(hnd);torso.add(a);return a});
 shadowAll(g);g.userData={legs,arms,torso,head,hip};return g}
function animate(p,kind,ph){const u=p.userData;anim.push((t)=>{const s=Math.sin(t*2+ph);
 if(kind==="rope"){u.arms.forEach((a,i)=>{a.rotation.z=2.6+Math.sin(t*2.4+ph+i*1.4)*.5});u.torso.rotation.z=-.15+Math.sin(t*2.4+ph)*.1}
 if(kind==="scrub"){u.torso.rotation.z=-.9;u.arms.forEach((a,i)=>{a.rotation.z=1.2+Math.sin(t*5+ph+i*3)*.35});u.hip.position.y=.62;u.legs.forEach((l,i)=>l.rotation.z=i?.9:.7)}
 if(kind==="look"){u.head.rotation.y=Math.sin(t*.5+ph)*1.1;u.arms[1].rotation.z=2.2;u.arms[1].rotation.x=-.4}
 if(kind==="walk"){const x=Math.sin(t*.35+ph)*3;p.position.x=p.userData.x0+x;p.rotation.y=Math.cos(t*.35+ph)>0?0:Math.PI;u.legs.forEach((l,i)=>l.rotation.z=Math.sin(t*5+i*3.14)*.5);u.arms.forEach((a,i)=>a.rotation.z=Math.sin(t*5+i*3.14+3.14)*.4);u.hip.position.y=.82+Math.abs(Math.sin(t*5))*.03}
 if(kind==="idle"){u.torso.rotation.z=Math.sin(t*.8+ph)*.04;u.head.rotation.y=Math.sin(t*.4+ph)*.5;u.arms.forEach((a,i)=>a.rotation.z=Math.sin(t*.8+ph+i)*.08)}})}

// ---------- barco a escala real ----------
function plankTex(){const cv=document.createElement("canvas");cv.width=cv.height=512;const x=cv.getContext("2d");for(let i=0;i<16;i++){const b=120+Math.floor(rnd()*30);x.fillStyle=`rgb(${b},${Math.floor(b*.72)},${Math.floor(b*.48)})`;x.fillRect(0,i*32,512,32);x.fillStyle="rgba(30,18,10,.8)";x.fillRect(0,i*32,512,2);for(let k=0;k<3;k++){x.fillRect(Math.floor(rnd()*512),i*32,2,32)}
 for(let k=0;k<40;k++){x.strokeStyle=`rgba(60,35,20,${.08+rnd()*.1})`;x.beginPath();const y=i*32+4+rnd()*24;x.moveTo(rnd()*512,y);x.lineTo(rnd()*512,y+rnd()*2);x.stroke()}}
 const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
const PLANKS=plankTex();
function bigShip(color,opt={}){
 const g=new THREE.Group();const L=15,B=4.6;
 // casco
 const hg=new THREE.BoxGeometry(L,3.2,B,30,6,8);const p=hg.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const t=Math.max(-1,Math.min(1,x/(L/2)));const v=Math.max(0,Math.min(1,(y+1.6)/3.2));
  const w=(1-Math.pow(Math.abs(t),2.4)*(t>0?.97:.35))*(.35+.65*Math.pow(v,.6));p.setZ(i,z*w);p.setY(i,y+.9*t*t+(t<-.75?1.4*(-t-.75)/.25:0))}
 hg.computeVertexNormals();const hull=new THREE.Mesh(hg,std("#4a2e1a",{roughness:.7}));hull.position.y=.4;g.add(hull);
 const band=new THREE.Mesh(new THREE.BoxGeometry(L*.86,.35,B*1.01),std(color,{roughness:.6}));band.position.y=1.35;g.add(band);
 const deckT=PLANKS.clone();deckT.needsUpdate=true;deckT.repeat.set(2,1);
 const deck=new THREE.Mesh(new THREE.PlaneGeometry(L*.88,B*.9),new THREE.MeshStandardMaterial({map:deckT,color:C("#a89888"),roughness:.8}));deck.rotation.x=-Math.PI/2;deck.position.set(-.2,1.95,0);deck.receiveShadow=true;g.add(deck);
 // castillo de popa
 const qd=new THREE.Mesh(new THREE.BoxGeometry(3.4,.9,B*.88),new THREE.MeshStandardMaterial({map:PLANKS,color:C("#a89888"),roughness:.8}));qd.position.set(-L/2+2.3,2.4,0);g.add(qd);
 // borda
 const railM=std("#5a3a22",{roughness:.7});[-1,1].forEach(s=>{const r=new THREE.Mesh(new THREE.BoxGeometry(L*.8,.55,.14),railM);r.position.set(-.3,2.25,s*B*.44);g.add(r);const cap=new THREE.Mesh(new THREE.BoxGeometry(L*.8,.08,.22),std("#7a5232"));cap.position.set(-.3,2.55,s*B*.44);g.add(cap)});
 const qr=new THREE.Mesh(new THREE.BoxGeometry(.14,.6,B*.88),railM);qr.position.set(-L/2+4,3.15,0);g.add(qr);
 [-1,1].forEach(s=>{const r=new THREE.Mesh(new THREE.BoxGeometry(3.4,.5,.12),railM);r.position.set(-L/2+2.3,3.1,s*B*.43);g.add(r)});
 // cañones
 for(let i=0;i<3;i++)[-1,1].forEach(s=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.13,.17,1.3,10),std("#1d1d1f",{metalness:.6,roughness:.4}));c.rotation.x=Math.PI/2;c.position.set(-1.2+i*2.2,2.3,s*(B*.44-.45));g.add(c);const cr=new THREE.Mesh(new THREE.BoxGeometry(.7,.3,.6),std("#5a3a22"));cr.position.set(-1.2+i*2.2,2.1,s*(B*.44-.65));g.add(cr)});
 // barriles y cajas
 [[2.8,1.3],[3.3,1.0],[2.9,-1.4]].forEach(([x,z])=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.33,.3,.85,12),std("#7a5230"));b.position.set(x,2.38,z);g.add(b)});
 [[4.4,-.9],[4.4,-.2]].forEach(([x,z])=>{const b=new THREE.Mesh(new THREE.BoxGeometry(.7,.6,.6),std("#8a6a40"));b.position.set(x,2.25,z);g.add(b)});
 // mástiles, vergas y velas
 const sailC=opt.dark?"#5a4a40":"#d8ccb2";const sailM=std(sailC,{side:THREE.DoubleSide,roughness:.95});
 const masts=[[-1.6,15],[3.4,13]];masts.forEach(([x,h],mi)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.16,.24,h,10),std("#3b2a1a"));m.position.set(x,1.9+h/2,0);g.add(m);
  [.56,.8].forEach((f,k)=>{const w=(k?3.6:4.8)-mi*.5;const y=1.9+h*f;const yard=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,w+.6,6),std("#3b2a1a"));yard.rotation.x=Math.PI/2;yard.position.set(x+.15,y+(k?2.6:3.6)*.5+.2,0);g.add(yard);
   const sh=k?2.6:3.6;const sg=new THREE.PlaneGeometry(w,sh,10,8);const sp=sg.attributes.position;for(let i=0;i<sp.count;i++){const xx=sp.getX(i)/w,yy=sp.getY(i)/sh;sp.setZ(i,.9*(1-(xx*xx*4))*(.6+.4*(1-Math.abs(yy*2))))}sg.computeVertexNormals();
   const s=new THREE.Mesh(sg,sailM);s.rotation.y=Math.PI/2;s.position.set(x+.35,y+.2,0);s.castShadow=true;g.add(s);anim.push(t=>{s.scale.x=1+Math.sin(t*1.7+mi+k)*.04})});
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.8,6,2),std(color,{side:THREE.DoubleSide}));fl.position.set(x-.7,1.9+h+.3,0);g.add(fl);anim.push(t=>{const fp=fl.geometry.attributes.position;for(let i=0;i<fp.count;i++){const xx=fp.getX(i)+.7;fp.setZ(i,Math.sin(t*6-xx*4)*.12*xx)}fp.needsUpdate=true})});
 // cofa del vigía
 const nest=new THREE.Mesh(new THREE.CylinderGeometry(.75,.6,.5,12,1,true),std("#4a3020",{side:THREE.DoubleSide}));nest.position.set(-1.6,12.4,0);g.add(nest);const nf=new THREE.Mesh(new THREE.CircleGeometry(.7,12).rotateX(-Math.PI/2),std("#4a3020"));nf.position.set(-1.6,12.16,0);g.add(nf);
 // bauprés
 const bs=new THREE.Mesh(new THREE.CylinderGeometry(.09,.15,5,8),std("#3b2a1a"));bs.rotation.z=-1.2;bs.position.set(L/2+1.2,3.2,0);g.add(bs);
 // jarcias
 const rp=[];masts.forEach(([x,h])=>{[-1,1].forEach(s=>{for(let i=0;i<4;i++){rp.push(x,1.9+h*.95,0,x-1.6+i*.9,2.6,s*B*.46)}});});rp.push(-1.6,16.6,0,L/2+3.4,4.2,0,3.4,14.6,0,L/2+3.4,4.2,0,-1.6,16.6,0,-L/2+1,4,0);
 const rg=new THREE.BufferGeometry();rg.setAttribute("position",new THREE.Float32BufferAttribute(rp,3));g.add(new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:C("#1c140c")})));
 // timón y farol de popa
 const wheel=new THREE.Group();const ring=new THREE.Mesh(new THREE.TorusGeometry(.55,.05,8,24),std("#6a4424"));wheel.add(ring);for(let i=0;i<8;i++){const sp2=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.5,5),std("#6a4424"));sp2.rotation.z=i*Math.PI/8;wheel.add(sp2)}
 wheel.rotation.y=Math.PI/2;wheel.position.set(-L/2+3.3,3.75,0);g.add(wheel);const post=new THREE.Mesh(new THREE.BoxGeometry(.25,1,.25),std("#4a3020"));post.position.set(-L/2+3.45,3.3,0);g.add(post);
 const lantern=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),new THREE.MeshBasicMaterial({color:C("#ffcf80")}));lantern.position.set(-L/2+.4,4.3,0);g.add(lantern);
 const ll=new THREE.PointLight(C("#ff9a40"),0,26,2);ll.position.copy(lantern.position);g.add(ll);
 const lg=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,color:C("#ff9a40"),transparent:true,opacity:.0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));lg.scale.set(5,5,1);lg.position.copy(lantern.position);g.add(lg);
 g.userData.setLamp=on=>{ll.intensity=on?3.5:0;lg.material.opacity=on?.7:0;lantern.material.color.copy(on?C("#ffcf80"):C("#3a3020"))};
 g.userData.wheel=wheel;shadowAll(g);hull.receiveShadow=true;return g}
{const st=document.createElement("style");st.textContent=`
.hand{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:16px;z-index:5;display:flex;gap:0;align-items:flex-end;transition:opacity .6s}
body.sailing .hand,body.sailing .prep{opacity:0;pointer-events:none}
.fc{--c:#e0b45a;position:relative;width:118px;aspect-ratio:2/3;border-radius:10px;background:#15110d;border:3px solid var(--c);box-shadow:0 8px 24px rgba(0,0,0,.6);overflow:hidden;cursor:pointer;transition:transform .25s,margin .25s;font-family:"IM Fell English",Georgia,serif;color:#f3e6c8;flex:none}
.hand .fc{margin-left:-26px}.hand .fc:first-child{margin-left:0}
.hand .fc:nth-child(1){transform:rotate(-7deg) translateY(6px)}.hand .fc:nth-child(2){transform:rotate(0)}.hand .fc:nth-child(3){transform:rotate(7deg) translateY(6px)}
.hand .fc:hover,.hand .fc:focus-visible{transform:translateY(-22px) rotate(0) scale(1.06);z-index:2;outline:none}
.fc[data-t=sabotaje]{--c:#a8322a}.fc[data-t=sigilo]{--c:#5a7a95}.fc[data-t=respuesta]{--c:#2f8f7a}
.fc .art{position:absolute;inset:0 0 34%;background:radial-gradient(circle at 50% 40%,color-mix(in srgb,var(--c) 45%,#000),#0b0907 75%);display:flex;align-items:center;justify-content:center;font-family:"IM Fell English SC",Georgia,serif;font-size:56px;color:color-mix(in srgb,var(--c) 70%,#fff);overflow:hidden}
.fc .art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.fc .bot{position:absolute;left:0;right:0;bottom:0;height:36%;background:linear-gradient(#2a2118,#16110c);border-top:2px solid var(--c);padding:5px 7px;display:flex;flex-direction:column;gap:2px}
.fc .tp{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--c)}
.fc .nm{font-family:"IM Fell English SC",Georgia,serif;font-size:13px;line-height:1.05}
.fc .tx{font-size:9.5px;line-height:1.2;color:#cdbd98;font-style:italic}
.fc.big{width:min(300px,70vw);border-width:5px;border-radius:16px;cursor:default}
.fc.big .art{font-size:140px}.fc.big .tp{font-size:13px}.fc.big .nm{font-size:26px}.fc.big .tx{font-size:16px}.fc.big .bot{padding:10px 14px;gap:5px}
.fc.back{background:repeating-conic-gradient(from 0deg,#1a130c 0 15deg,#241a10 15deg 30deg);border-color:#e0b45a}
.fc.back::after{content:"";position:absolute;inset:18%;border:2px solid #e0b45a;border-radius:50%;box-shadow:inset 0 0 0 10px rgba(224,180,90,.15)}
.cov{position:fixed;inset:0;z-index:7;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:rgba(5,4,3,.7);backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:opacity .35s,visibility 0s .35s;padding:16px;text-align:center}
.cov.on{opacity:1;visibility:visible;transition:opacity .35s}
.cov .msg{font-family:"IM Fell English",Georgia,serif;color:#f3e6c8;font-size:18px;font-style:italic;max-width:520px;text-shadow:0 1px 4px #000}
.cov .btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.cov button{font:inherit;font-family:"IM Fell English",Georgia,serif;font-size:16px;color:#f3e6c8;background:rgba(10,9,8,.7);border:1px solid rgba(224,180,90,.5);border-radius:999px;padding:9px 16px;cursor:pointer}
.cov button.pri{background:rgba(224,180,90,.3);border-color:#e0b45a}
.flip{animation:flip .9s cubic-bezier(.2,.8,.2,1)}@keyframes flip{0%{transform:perspective(900px) rotateY(180deg) scale(.6);opacity:0}40%{opacity:1}100%{transform:none}}
.fly{position:fixed;z-index:8;pointer-events:none;transition:all .9s cubic-bezier(.3,.7,.2,1)}
.prep{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:200px;z-index:5;font-family:"IM Fell English",Georgia,serif;color:#e0b45a;font-size:14px;font-style:italic;text-align:right;text-shadow:0 1px 3px #000;transition:opacity .6s}
@media (prefers-reduced-motion:reduce){.flip{animation:none}.fly{transition:none}}`;document.head.appendChild(st)}
// ---------- barcos de todos los jugadores ----------
const CREWDEF=[
 {o:{coat:"#7a2a24",hat:"bandana",band:"#2a3a6a",beard:true},pos:[1.2,1.95,-1.1],k:"rope"},
 {o:{coat:"#3a4a5a",hat:"bandana",band:"#a8322a"},pos:[.2,1.95,1.2],k:"scrub"},
 {o:{coat:"#5a4a2a",hat:"none",hair:"#1a120c",beard:true},pos:[3.8,1.95,.4],k:"walk"},
 {o:{coat:"#2a3a2a",hat:"bandana",band:"#d4ac0d"},pos:[-1.6,12.2,0],k:"look"}];
const SHIPS=GS.players.map((p,i)=>{const mine=i===myIdx;const s=bigShip(PCOL[i],{dark:mine});scene.add(s);s.userData.setLamp(!mine);
 (mine?CREWDEF:CREWDEF.slice(0,2)).forEach((c,k)=>{const m=person(c.o);m.position.set(...c.pos);m.userData.x0=c.pos[0];m.rotation.y=c.k==="scrub"?Math.PI:0;s.add(m);animate(m,c.k,k*1.7+i)});
 const c=cellOf(p.cell);s.userData.pos=new THREE.Vector3(c.x,0,c.z);s.userData.heading=Math.atan2(-(VOL.z-c.z),VOL.x-c.x)+.3;s.userData.off=new THREE.Vector3(i===myIdx?0:(i%2?5:-5),0,i===myIdx?0:(i%3?-4:4));return s});
const myShip=SHIPS[myIdx];
const eye=new THREE.Group();eye.position.set(-15/2+1.7,4.9,0);myShip.add(eye);eye.add(camera);camera.position.set(0,0,0);camera.rotation.order="YXZ";
let yaw=0,pitch=-.06,yawT=0,pitchT=-.06;
const mist=new THREE.Group();for(let i=0;i<(LOW?50:110);i++){const m=new THREE.SpriteMaterial({map:cloudTex,color:C("#a8958e"),transparent:true,opacity:0,depthWrite:false,fog:true});m.rotation=rnd()*6.28;const s=new THREE.Sprite(m);const sz=40+rnd()*60;s.scale.set(sz,sz*.38,1);s.userData={a:rnd()*6.283,r:24+rnd()*130,h:1+rnd()*9,v:.004+rnd()*.006,o:.35+rnd()*.35};mist.add(s)}
scene.add(mist);
const me=()=>GS.players[myIdx];
const seen=new Set();function reveal(c,rad){CELLS.forEach(o=>{if(cdist(o,c)<=rad)seen.add(key(o))})}
reveal(HOMES[myIdx],1);reveal(cellOf(me().cell),2);

// ---------- visibilidad ----------
const vistaOf=p=>3+(p.fx&&p.fx.vista?1:0)+(capOf(p)===2?1:0);
const sigiloOf=p=>(p.faroles?0:1)+(p.fx&&p.fx.bruma?9:0);
function sees(a,b,ca,cb){if(a.i===b.i)return true;if(b.hideFrom&&b.hideFrom[a.i]>0)return false;return cdist(ca,cb)<=vistaOf(a)-sigiloOf(b)}
const curCell=i=>{const s=SHIPS[i];return cellAt(s.userData.pos.x,s.userData.pos.z)||cellOf(GS.players[i].cell)};
function cellAt(x,z){const r=z/(HS*1.5),q=x/(HS*Math.sqrt(3))-r/2;let rq=Math.round(q),rr=Math.round(r),rs=Math.round(-q-r);const dq=Math.abs(rq-q),dr=Math.abs(rr-r),ds=Math.abs(rs+q+r);if(dq>dr&&dq>ds)rq=-rr-rs;else if(dr>ds)rr=-rq-rs;return CM[rq+","+rr]}
function towerSees(c){return Object.keys(GS.terr||{}).some(k=>myB(k).torre&&GS.terr[k].includes(myIdx)&&cdist(CM[k],c)<=2)}
const fxShow=new Set();
function updateVisibility(){const m=me(),mc=curCell(myIdx);SHIPS.forEach((s,i)=>{if(i===myIdx)return;const p=GS.players[i];s.visible=fxShow.has(i)||!p.gone&&!!p.placed&&(sees(m,p,mc,curCell(i))||towerSees(curCell(i)));s.userData.setLamp(p.faroles!==false)})}

// ---------- interfaz ----------
const css=document.createElement("style");css.textContent=`
.hud{position:fixed;z-index:5;color:#f3e6c8;font-family:"IM Fell English",Georgia,serif;text-shadow:0 1px 3px #000}
.tl{top:max(12px,env(safe-area-inset-top,0px));left:max(16px,env(safe-area-inset-left,0px))}.tl .r{font-family:"IM Fell English SC",Georgia,serif;color:#e0b45a;letter-spacing:.12em;font-size:13px}
.score{display:flex;flex-direction:column;gap:3px;margin-top:6px;font-size:15px}
.score div{display:flex;align-items:center;gap:8px}.score .dot{width:11px;height:11px;border-radius:50%;flex:none}.score .me{font-weight:700}.score .ok{color:#7fd1a5;font-size:12px;font-style:italic}.score .gone{opacity:.45}
.tr{top:max(12px,env(safe-area-inset-top,0px));right:max(16px,env(safe-area-inset-right,0px));display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;max-width:55vw}
.hud button,.mapw button,.orders button{font:inherit;font-size:15px;color:#f3e6c8;background:rgba(10,9,8,.62);border:1px solid rgba(224,180,90,.45);border-radius:999px;padding:8px 14px;cursor:pointer;backdrop-filter:blur(6px)}
.hud button.on,.orders button.on{background:rgba(224,180,90,.3);border-color:#e0b45a}
.compass{top:max(12px,env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);width:min(360px,40vw);height:28px;overflow:hidden;border-bottom:1px solid rgba(224,180,90,.5);-webkit-mask:linear-gradient(90deg,transparent,#000 20%,#000 80%,transparent);mask:linear-gradient(90deg,transparent,#000 20%,#000 80%,transparent)}
.compass .strip{position:absolute;top:3px;white-space:nowrap;font-size:15px}.compass .tick{position:absolute;left:50%;bottom:0;width:2px;height:8px;background:#e0b45a}
.orders{position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:max(14px,env(safe-area-inset-bottom,0px));z-index:5;display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-start;max-width:calc(100% - 420px);background:rgba(10,9,8,.55);border:1px solid rgba(224,180,90,.3);border-radius:16px;padding:8px 10px;backdrop-filter:blur(6px);font-family:"IM Fell English",Georgia,serif;color:#f3e6c8;transition:opacity .5s}
.orders .lbl{font-size:14px;color:#cdbd98;font-style:italic;padding:0 4px}
.orders .go{background:#e0b45a;color:#1a120a;border-color:#e0b45a;font-weight:700}
.orders .go:disabled{opacity:.5}
body.sailing .orders,body.sailing .tr{opacity:0;pointer-events:none}
.note{left:50%;top:70px;transform:translateX(-50%);max-width:min(620px,calc(100% - 32px));text-align:center;background:rgba(10,9,8,.6);border:1px solid rgba(224,180,90,.35);border-radius:12px;padding:10px 16px;font-size:17px;font-style:italic;opacity:0;transition:opacity .6s;pointer-events:none}
.note.show{opacity:1}
@property --r{syntax:"<length>";inherits:false;initial-value:0px}
.spy{position:fixed;inset:0;z-index:4;pointer-events:none;--r:0vmin;opacity:0;background:radial-gradient(circle at 50% 50%,transparent 0 var(--r),rgba(60,40,15,.95) calc(var(--r) + .4vmin),rgba(0,0,0,.95) calc(var(--r) + 1.6vmin));transition:--r .55s cubic-bezier(.2,.8,.2,1),opacity .25s}
.spy.on{--r:33vmin;opacity:1}
.mapw{position:fixed;inset:0;z-index:6;display:flex;visibility:hidden;opacity:0;align-items:center;justify-content:center;flex-direction:column;background:rgba(5,4,3,.72);backdrop-filter:blur(3px);transition:opacity .4s,visibility 0s .5s;padding:12px}
.mapw.on{visibility:visible;opacity:1;transition:opacity .4s}
.mapw .box{position:relative;max-width:100%;transform-origin:50% 0;transform:perspective(1600px) rotateX(-55deg) translateY(-40px) scale(.9);clip-path:inset(0 0 100% 0);transition:transform .75s cubic-bezier(.2,.8,.2,1),clip-path .8s cubic-bezier(.4,0,.2,1)}
.mapw.on .box{transform:none;clip-path:inset(0 0 0 0)}
.mapw canvas{display:block;max-width:100%;max-height:calc(100vh - 110px);border-radius:6px;box-shadow:0 20px 60px #000;touch-action:manipulation}
.mapw .bar2{display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap}
.lb{position:fixed;left:0;right:0;height:0;background:#000;z-index:4;transition:height .9s cubic-bezier(.4,0,.2,1)}.lb.t{top:0}.lb.b{bottom:0}body.sailing .lb{height:9vh}
.rcard{position:fixed;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;opacity:0;font-family:"IM Fell English SC",Georgia,serif;color:#f3e6c8;text-shadow:0 2px 12px #000}
.rcard .a{font-size:15px;letter-spacing:.3em;color:#e0b45a}.rcard .b{font-size:60px}
.rcard.show{animation:rc 2.4s ease forwards}@keyframes rc{0%{opacity:0;transform:scale(.96)}20%{opacity:1;transform:none}75%{opacity:1}100%{opacity:0}}
.fps{position:fixed;right:6px;bottom:4px;z-index:9;font:11px monospace;color:#9a8;opacity:.7;pointer-events:none}
.res{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;font-size:15px;color:#f3e6c8}.res span{white-space:nowrap}.res .st{color:#e0b45a}.res .mis,.res .cap{font-size:13px;color:#e8d4a0;opacity:.85}
.tmr{position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:84px;z-index:6;font:600 22px "IM Fell English SC",Georgia,serif;color:#f3e6c8;background:rgba(10,9,8,.6);border:1px solid rgba(224,180,90,.45);border-radius:999px;padding:4px 16px;pointer-events:none}.tmr.hot{color:#ff8a6a;border-color:#ff6a4a;animation:tp 1s infinite}@keyframes tp{50%{opacity:.6}}
.actp{position:fixed;inset:0;z-index:8;display:flex;align-items:center;justify-content:center;background:rgba(5,4,3,.72);backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:opacity .3s,visibility 0s .3s;padding:16px}
.actp.on{opacity:1;visibility:visible;transition:opacity .3s}
.actp .box{width:min(760px,100%);max-height:calc(100vh - 32px);overflow:auto;background:linear-gradient(#2a2018,#1a140f);border:1px solid rgba(224,180,90,.5);border-radius:14px;padding:18px 20px;box-shadow:0 20px 60px #000;color:#f3e6c8}
.actp h3{margin:0 0 4px;font:400 26px "IM Fell English SC",Georgia,serif;color:#e0b45a}.actp h4{margin:16px 0 6px;font:400 18px "IM Fell English SC",Georgia,serif;color:#e0b45a;border-top:1px solid rgba(224,180,90,.25);padding-top:12px}
.actp .hint{font-style:italic;color:#cdbd98;font-size:14px;margin:2px 0 8px}
.actp .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0}
.actp button{font:inherit;font-size:15px;color:#f3e6c8;background:rgba(255,255,255,.06);border:1px solid rgba(224,180,90,.45);border-radius:10px;padding:8px 12px;cursor:pointer;text-align:left}
.actp button:hover:not(:disabled){background:rgba(224,180,90,.2)}.actp button:disabled{opacity:.38;cursor:not-allowed}
.actp button small{display:block;font-size:12px;color:#cdbd98}.actp .pri{background:#e0b45a;color:#1a120a;font-weight:700}
.actp .slot{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.2);font-size:14px}.actp .slot i{width:12px;height:12px;border-radius:50%;display:inline-block}
.actp .q{display:inline-flex;gap:6px;align-items:center;background:rgba(224,180,90,.18);border-radius:999px;padding:3px 4px 3px 12px;font-size:14px}.actp .q button{padding:2px 8px;border-radius:999px}
.actp select{font:inherit;font-size:15px;background:#1a140f;color:#f3e6c8;border:1px solid rgba(224,180,90,.45);border-radius:8px;padding:6px}
.actp .cat{margin-top:16px;border-top:1px solid rgba(224,180,90,.25);padding-top:10px}.actp .cat summary{cursor:pointer;font:400 18px "IM Fell English SC",Georgia,serif;color:#e0b45a}
.actp .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;margin-top:10px}.actp .it{border:1px solid rgba(224,180,90,.3);border-radius:10px;padding:8px 10px;font-size:13px}.actp .it.no{opacity:.6}.actp .it.ok{border-color:#7fd1a5}
.actp .it .t{font-size:15px;color:#f3e6c8}.actp .it .w{font-style:italic;color:#cdbd98}.actp .it .c{color:#e0b45a;margin:2px 0}.actp .it .x{color:#d9ccb0}
#aBox button.on{outline:2px solid #e0b45a;background:#3a2a14}.logbook{text-align:left;width:min(560px,92vw);max-height:70vh;overflow:auto;background:linear-gradient(#e9dcb8,#d7c393);color:#2a1d10;border-radius:10px;padding:16px 20px;font-family:Georgia,serif;box-shadow:0 10px 40px rgba(0,0,0,.6);border:3px solid #6b4a2a}.logbook h2{margin:0 0 8px;font-size:22px;text-align:center}.logbook h3{margin:10px 0 4px;font-size:15px;border-bottom:1px solid rgba(60,40,20,.35);padding-bottom:2px}.logl{display:flex;gap:8px;align-items:flex-start;margin:4px 0}.logl span{width:22px;text-align:center;flex:none}.logl p{margin:0;font-size:14px;line-height:1.35}.endrow{display:flex;gap:20px;align-items:center;justify-content:center;flex-wrap:wrap;max-height:82vh;overflow:auto}.logbook.titles{width:min(380px,92vw);align-self:center}.logbook.titles .tl{font-size:15px;margin:7px 0}.logbook.titles .tl i{color:#7a2a10}.logbook .tl{display:flex;gap:8px;align-items:center;font-size:13px;margin:3px 0}.logbook .tl span{width:22px;text-align:center;flex:none}.logbook .tl i{color:#e0b45a;font-style:normal;font-weight:bold}.logbook .tl small{opacity:.7}.fc .cost{position:absolute;top:6px;right:6px;z-index:2;background:rgba(10,8,6,.8);color:#f3e6c8;border-radius:999px;padding:2px 8px;font-size:12px;font-family:Georgia,serif}.fc.big .cost{font-size:16px;padding:4px 12px}
@media (max-width:760px){.orders{max-width:calc(100% - 32px);bottom:170px}.tr{max-width:60vw}.tr button,.orders button{font-size:13px;padding:7px 11px}.compass{display:none}}
@media (prefers-reduced-motion:reduce){.mapw,.mapw .box,.spy,.lb{transition:none!important}.rcard.show{animation:none}}`;document.head.appendChild(css);
const hud=document.createElement("div");hud.innerHTML=`
<div class="hud tl"><div class="r" id="hRound"></div><div class="score" id="score"></div><div class="res" id="res"></div></div><div class="tmr" id="tmr" hidden></div>
<div class="hud compass"><div class="strip" id="strip"></div><div class="tick"></div></div>
<div class="hud tr"><button id="bMap">Mapa</button><button id="bSpy">Catalejo</button><button id="bLamp">Faroles</button><button id="bLog">Bitácora</button></div>
<div class="hud note" id="note"></div>
<div class="orders" id="orders"><span class="lbl" id="oRoute"></span><span class="lbl" id="oCard"></span><button id="oAct">Acciones</button><button id="oRumM" aria-label="Menos ron">−</button><span class="lbl" id="oRum"></span><button id="oRumP" aria-label="Más ron">+</button><button class="go" id="oGo">Confirmar órdenes</button></div>
<div class="actp" id="actp"><div class="box" id="aBox"></div></div><div class="spy" id="spy"></div><div class="lb t"></div><div class="lb b"></div>
<div class="rcard" id="rcard"><div class="a" id="rcA"></div><div class="b" id="rcB"></div></div>
<div class="fps" id="fps"></div>
<div class="mapw" id="mapw"><div class="box"><canvas id="mapc" width="1100" height="860"></canvas></div><div class="bar2"><button id="bClr">Borrar ruta</button><button id="bClose">Listo</button></div></div>`;
document.body.appendChild(hud);
let noteT=0;function note(t,dur=7){$("note").textContent=t;$("note").classList.add("show");noteT=dur}
function rcard(a,b){$("rcA").textContent=a;$("rcB").textContent=b;const c=$("rcard");c.classList.remove("show");void c.offsetWidth;c.classList.add("show")}
function renderScore(){$("hRound").textContent=`RONDA ${GS.round} · FAMA PARA GANAR: ${GS.target}`;
 renderRes();$("score").innerHTML=GS.players.map((p,i)=>`<div class="${i===myIdx?"me":""} ${p.gone?"gone":""}"><span class="dot" style="background:${PCOL[i]}"></span><span>${esc(p.name)}</span><span>· fama ${p.fame}</span><span style="opacity:.75">· ${terrCount(GS,i)} terr.${p.ship==="galeon"?" · galeón":""}${FL(p).length?" · flota "+(FL(p).length+1):""}${GS.wanted===i?' · <span title="Se busca: quien le gane un abordaje o le quite un territorio, +1 de fama" style="color:#e05a4a">💀 se busca</span>':""}${repOf(p)?" · "+REPN[repOf(p)]:""}${i!==myIdx&&(GS.pacts||[]).some(x=>((x.a===myIdx&&x.b===i)||(x.b===myIdx&&x.a===i))&&x.until>=GS.round)?" · 🤝":""}</span>${GS.phase==="orders"&&p.ready?'<span class="ok">listo</span>':""}</div>`).join("")}
{const s=$("strip");const L=["N","·","NE","·","E","·","SE","·","S","·","SO","·","O","·","NO","·"];let h="";for(let k=0;k<3;k++)L.forEach((l,i)=>{h+=`<span style="position:absolute;left:${(k*16+i)*40}px;width:40px;text-align:center;${l!=="·"?"":"opacity:.5"}">${l}</span>`});s.innerHTML=h;s.style.width=(48*40)+"px"}
let spy=false,fovT=62;function setSpy(v){spy=v;$("spy").classList.toggle("on",v);$("bSpy").classList.toggle("on",v);fovT=v?14:62;fogT=v?.019:.031}
$("bSpy").onclick=()=>setSpy(!spy);
let faroles=false;function setLampUI(){$("bLamp").textContent="Faroles: "+(faroles?"encendidos":"apagados");$("bLamp").classList.toggle("on",faroles);myShip.userData.setLamp(faroles)}
$("bLamp").onclick=()=>{if(GS.phase!=="orders"||me().ready)return;faroles=!faroles;setLampUI();note(faroles?"Faroles encendidos: os verán desde más lejos.":"Faroles apagados: sois más difíciles de ver.",4)};setLampUI();
addEventListener("keydown",e=>{if(e.target.tagName==="INPUT")return;const k=e.key.toLowerCase();if(k==="m")toggleMap();if(k==="c")setSpy(!spy);if(k==="f")$("bLamp").click();if(k==="p")$("fps").hidden=!$("fps").hidden});
let drag=null;renderer.domElement.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,yaw:yawT,pitch:pitchT}});
addEventListener("pointermove",e=>{if(!drag)return;const f=spy?.0008:.004;yawT=drag.yaw-(e.clientX-drag.x)*f*1.2;pitchT=Math.max(-.7,Math.min(.6,drag.pitch-(e.clientY-drag.y)*f))});
addEventListener("pointerup",()=>drag=null);

// ---------- órdenes ----------
let route=[],bet=0,bid=0,vote=-1,vbuy=0,prepared=null,acts=[],autoSent=false,deadline=0;const rumors={};
const maxRoute=()=>(me().stormed===GS.round-1?-1:0)+(GS.galerna?2:(me().ship==="galeon"?4:3)+(FL(me()).includes("goleta")?1:0)+(capOf(me())===5?1:0))+(prepared&&prepared.id==="viento-a-favor"?2:0);
const myB=k=>(GS.bld||{})[k+"|"+myIdx]||{};const adjC=k=>neighbors(cellOf(me().cell)).some(n=>key(n)===k);
const atHomeC=()=>{const p=me();return (p.cell[0]===p.home[0]&&p.cell[1]===p.home[1])||Object.keys(GS.terr||{}).some(k=>myB(k).muelle&&GS.terr[k].includes(myIdx)&&adjC(k))};
function reserved(){const r={ron:bet+bid+vbuy};if(prepared)addCost(r,CARDCOST(prepared.id,me()));acts.forEach(a=>{if(a.a==="comercio"){r[a.give]=(r[a.give]||0)+(tradeR(me(),atHomeC(),a.give,GS.mkt));r[a.get]=(r[a.get]||0)-1}else addCost(r,costFor(me(),ACTS[a.a].c,a.a))});return r}
const left=m=>stock(me(),m)-(reserved()[m]||0);
const canAfford=c=>Object.entries(c||{}).every(([m,n])=>left(m)>=n);
const INAME={selva:"Isla del bosque",lino:"Isla del lino",hierro:"Isla del hierro",ron:"Isla del cañaveral",perlas:"Isla de las perlas"};
function renderRes(){const p=me();$("res").innerHTML=MATS.map(([m,n,e])=>`<span title="${n}">${e} ${left(m)}</span>`).join("")+`<span class="st" title="Fuerza en abordajes y asaltos">⚔ ${strengthOf(p,bet)}</span><span class="mis" title="${p.mis?MIS[p.mis].x:""}">${p.mis?(p.misOk?"✓ ":"🗝 ")+MIS[p.mis].n:""}</span><span class="cap" title="${HAB[capOf(p)].x}">★ ${HAB[capOf(p)].n}</span><span title="Cañones · tripulantes · escoltas">💣${p.cannons} 👥${p.crew||0} ⛵${FL(p).length}</span>`}
function actLabel(a){const o=a.k&&ISLMAP[a.k];return a.a==="comercio"?`Cambiar ${tradeR(me(),atHomeC(),a.give,GS.mkt)} ${MATS.find(x=>x[0]===a.give)[2]} por 1 ${MATS.find(x=>x[0]===a.get)[2]}`:ACTS[a.a].n+(o?` (${INAME[o.t].replace("Isla ","")})`:"")}
function renderOrders(){const p=me(),locked=GS.phase!=="orders"||p.ready;
 $("oRoute").textContent=route.length?`Ruta: ${route.length} casilla${route.length>1?"s":""}`:"Sin ruta: te quedas quieto";
 $("oCard").textContent=prepared?"Carta: "+CBY[prepared.id].n+(prepared.target!=null?" → "+GS.players[prepared.target].name:""):"";
 bet=Math.max(0,Math.min(bet,stock(p,"ron")));$("oRum").textContent=`Ron para el asalto: ${bet} (se gasta)`;{const ha=acts.some(a=>a.a==="asalto");if(!ha)bet=0;["oRumM","oRum","oRumP"].forEach(id=>$(id).style.display=ha?"":"none")}
 $("oAct").textContent=(acts.length?`Acciones (${acts.length})`:"Acciones")+(GS.auction?" · 🔨":"")+(GS.council?" · 🏛":"");$("oAct").classList.toggle("on",acts.length>0);
 ["oRumM","oRumP","oGo","oAct"].forEach(id=>$(id).disabled=locked);
 $("oGo").textContent=p.ready?"Esperando a los demás…":"Confirmar órdenes";renderScore();renderHand();if($("actp").classList.contains("on"))renderActs()}
$("oRumM").onclick=()=>{bet=Math.max(0,bet-1);renderOrders()};$("oRumP").onclick=()=>{if(left("ron")>0)bet++;renderOrders()};
$("oGo").onclick=()=>{if(GS.phase!=="orders"||me().ready)return;toggleMap(false);setSpy(false);closeActs();
 Net.toHost({t:"orders",o:{route:route.map(c=>[c.q,c.r]),card:prepared,bet,bid,vote,vbuy,faroles,acts}});me().ready=true;renderOrders();note("Órdenes enviadas en secreto. Esperando a los demás capitanes…",6)};
// ---------- panel de acciones ----------
function openActs(){if(GS.phase!=="orders"||me().ready)return;toggleMap(false);setSpy(false);renderActs();$("actp").classList.add("on")}
function closeActs(){$("actp").classList.remove("on")}
$("oAct").onclick=openActs;$("actp").addEventListener("click",e=>{if(e.target.id==="actp")closeActs()});
function renderActs(){const p=me(),box=$("aBox");const B=(label,cost,a,why)=>{cost=costFor(p,cost,a.a);const ok=!why&&canAfford(cost);return `<button data-a='${JSON.stringify(a)}' ${ok?"":"disabled"} title="${why||(!canAfford(cost)?"No tienes material suficiente":"")}">${label}<small>${why||(a.a==="patrulla"?"gasta 1 escolta":costTxt(cost))}</small></button>`};
 let h=`<h3>Acciones de esta ronda</h3><div class="hint">Se hacen antes de zarpar, donde está anclado tu barco ahora. Después navegas con la ruta del mapa.</div>`;
 h+=`<div class="row hint">★ <b>${HAB[capOf(p)].n}</b>: ${HAB[capOf(p)].x} &nbsp; ${p.mis?`🗝 <b>Misión secreta: ${MIS[p.mis].n}</b>: ${MIS[p.mis].x}${p.misOk?" ✓ cumplida":" (+2 de fama)"}`:""}</div>`;
 if(GS.auction){const A=AUC[GS.auction.it];h+=`<h4>🔨 Subasta en la taberna: ${A.n}</h4><div class="hint">${A.x} Puja en secreto: gana quien más ron ponga y solo paga el ganador. Si empatáis, gana quien tenga menos fama.</div><div class="row"><button id="bidM">−</button><b>Tu puja: ${bid} ron</b><button id="bidP">+</button></div>`}
 if(GS.council){h+=`<h4>🏛 Consejo pirata</h4><div class="hint">La ley ganadora manda hasta el próximo consejo. Tienes 1 voto y cada ron que pagues es 1 voto más.</div><div class="row">${GS.council.o.map((k,q)=>`<button data-vote="${q}" class="${vote===q?"on":""}">${LAWS[k].n}<small>${LAWS[k].x}</small></button>`).join("")}</div><div class="row"><span>Votos comprados</span><button id="vbM">−</button><b>${vbuy}</b><button id="vbP">+</button></div>`}
 if(GS.law)h+=`<div class="hint">📜 Ley vigente: <b>${LAWS[GS.law].n}</b>. ${LAWS[GS.law].x}</div>`;
 {const hs=GS.hostages||[];const mh=hs.filter(x=>x.of===myIdx),held=hs.filter(x=>x.by===myIdx);if(mh.length||held.length){h+=`<h4>⛓ Rehenes</h4><div class="row">`;mh.forEach(x=>h+=`<button data-ransom="${x.id}" ${p.rum>=3?"":"disabled"}>Pagar rescate a ${esc(GS.players[x.by].name)}<small>3 🍾 · al momento</small></button>`);held.forEach(x=>h+=`<button data-recruit="${x.id}" ${p.rum>=1&&(p.crew||0)<4?"":"disabled"}>Reclutar al rehén de ${esc(GS.players[x.of].name)}<small>1 🍾 · +1 tripulante</small></button>`);h+=`</div><div class="hint">Si en 2 rondas nadie paga el rescate, el rehén se une a quien lo tiene.</div>`}}
 h+=`<div class="row res">${MATS.map(([m,n,e])=>`<span title="${n}">${e} ${left(m)}</span>`).join("")}<span class="st">⚔ fuerza ${strengthOf(p,bet)}</span></div>`;
 h+=`<div class="row">${acts.length?acts.map((a,j)=>`<span class="q">${actLabel(a)}<button data-rm="${j}" aria-label="Quitar">✕</button></span>`).join(""):'<span class="hint">Aún no has elegido ninguna acción.</span>'}</div>`;
 const isl=neighbors(cellOf(p.cell)).map(n=>ISLMAP[key(n)]).filter(o=>o&&o.port===undefined);
 h+=`<h4>Islas junto a tu barco</h4>`;
 if(!isl.length)h+=`<div class="hint">No hay ninguna isla junto a tu barco. Navega hasta una para colonizarla o asaltarla.</div>`;
 isl.forEach(o=>{const k=key(o.c),T=GS.terr[k]||[],F=GS.fort[k]||[];const m=TMAT[o.t];
  h+=`<div class="row"><b>${INAME[o.t]}</b><span class="hint">da ${MATS.find(x=>x[0]===m)[2]} ${MATS.find(x=>x[0]===m)[1].toLowerCase()}</span>${Object.keys(myB(k)).map(t=>`<span title="${ACTS[t].n}">${ACTS[t].i}</span>`).join("")}${T.map((ow,si)=>`<span class="slot"><i style="background:${ow<0?"transparent;border:1px dashed #cdbd98":PCOL[ow]}"></i>${ow<0?"libre":ow===myIdx?"tuyo":esc(GS.players[ow].name)}${F[si]?" 🏰":""}</span>`).join("")}</div><div class="row">`;
  const free=T.filter(x=>x<0).length-acts.filter(a=>a.a==="colonizar"&&a.k===k).length;
  if(free>0)h+=B("Colonizar territorio",ACTS.colonizar.c,{a:"colonizar",k,s:T.indexOf(-1)});
  T.forEach((ow,si)=>{if(ow===myIdx&&!F[si]&&!acts.some(a=>a.a==="fuerte"&&a.k===k&&a.s===si))h+=B("Levantar fuerte",ACTS.fuerte.c,{a:"fuerte",k,s:si});
   if(ow>=0&&ow!==myIdx&&!acts.some(a=>a.a==="asalto"&&a.k===k&&a.s===si)){const d=2+(F[si]?3:0);h+=B(`Asaltar a ${esc(GS.players[ow].name)}${F[si]?" (fuerte)":""}`,ACTS.asalto.c,{a:"asalto",k,s:si})+`<span class="hint">defensa ${d}${SHIPS[ow].visible?" + su barco si está al lado":""} · tu fuerza ${strengthOf(p,bet)}</span>`}});
  if(T.includes(myIdx)||acts.some(a=>a.a==="colonizar"&&a.k===k))["almacen","muelle","torre","patrulla"].forEach(t=>{h+=B(`${ACTS[t].i} ${ACTS[t].n}`,ACTS[t].c,{a:t,k},myB(k)[t]||acts.some(a=>a.a===t&&a.k===k)?"Ya lo tienes":t==="patrulla"&&FL(p).filter(x=>x!=="brulote").length-acts.filter(a=>a.a==="patrulla").length<=0?"Necesitas una escolta (no brulote)":"")});
  h+=`</div>`});
 const home=atHomeC(),qn=id=>acts.filter(a=>a.a===id).length;
 h+=`<h4>Tu barco y tu puerto</h4><div class="row">`;
 h+=B(`${ACTS.emboscada.i} Emboscada`,ACTS.emboscada.c,{a:"emboscada"},qn("emboscada")?"Ya la has preparado":!neighbors(cellOf(p.cell)).some(c=>ISLMAP[key(c)])?"Tienes que estar junto a una isla":"");
 h+=B(`Reclutar tripulante (${(p.crew||0)+qn("tripulante")}/4)`,ACTS.tripulante.c,{a:"tripulante"},(p.crew||0)+qn("tripulante")>=4?"Ya tienes 4":"");
 h+=B(`Fundir cañón (${p.cannons+qn("canon")}/6)`,ACTS.canon.c,{a:"canon"},!home?"Solo en tu puerto":p.cannons+qn("canon")>=6?"Ya tienes 6":"");
 h+=`</div><h4>Tu flota (${FL(p).length+1} barco${FL(p).length?"s":""}): ${["Tu "+(p.ship==="galeon"?"galeón":"balandra")].concat(FL(p).map(t=>ACTS[t].i+" "+ACTS[t].n)).join(" · ")}</h4><div class="row">`;
 {const nf=FL(p).length+FLS.reduce((a,t)=>a+qn(t),0);FLS.forEach(t=>{h+=B(`${ACTS[t].i} ${ACTS[t].n}`,ACTS[t].c,{a:t},!home?"Solo en tu puerto":nf>=FLMAX?`Flota completa (${FLMAX} escoltas)`:"")});}
 h+=`</div><div class="row">`;
 h+=B("Botar galeón",ACTS.galeon.c,{a:"galeon"},p.ship==="galeon"||qn("galeon")?"Ya es un galeón":!home?"Solo en tu puerto":"");
 h+=`</div>`;
 // tratos con barcos al lado
 {const mc=cellOf(p.cell);const near=GS.players.filter(q=>q.i!==myIdx&&!q.gone&&cdist(cellOf(q.cell),mc)<=1);const pact=j=>(GS.pacts||[]).find(x=>((x.a===myIdx&&x.b===j)||(x.b===myIdx&&x.a===j))&&x.until>=GS.round);
  h+=`<h4>Tratos con otros capitanes</h4>`;
  if(!near.length)h+=`<div class="hint">Cuando tengas otro barco al lado (o en tu casilla) podrás proponerle un cambio de materiales o un pacto de no agresión. ${(GS.pacts||[]).filter(x=>(x.a===myIdx||x.b===myIdx)&&x.until>=GS.round).map(x=>`🤝 Pacto con ${esc(GS.players[x.a===myIdx?x.b:x.a].name)} hasta la ronda ${x.until}.`).join(" ")}</div>`;
  const opt=sel=>MATS.map(([m,n,e])=>`<option value="${m}" ${m===sel?"selected":""}>${e} ${n}</option>`).join("");const num=id=>`<select id="${id}">${[1,2,3].map(n=>`<option>${n}</option>`).join("")}</select>`;
  near.forEach(q=>{const pc=pact(q.i);h+=`<div class="row"><b style="color:${PCOL[q.i]}">${esc(q.name)}</b>${pc?`<span class="hint">🤝 pacto hasta la ronda ${pc.until}</span>`:""}</div><div class="row"><span>Le doy</span>${num("tg"+q.i)}<select id="tgm${q.i}">${opt("madera")}</select><span>por</span>${num("tr"+q.i)}<select id="trm${q.i}">${opt("hierro")}</select><button data-of="${q.i}">Proponer cambio</button>${pc?"":`<button data-pact="${q.i}">Proponer pacto (3 rondas)</button>`}</div>`})}
 h+=`<h4>Cambiar materiales</h4>${GS.mkt?`<div class="hint">📈 Mercado: ${mktTxt(GS.mkt)}</div>`:""}<div class="row"><span id="aR">Doy ${tradeR(p,home,"madera",GS.mkt)}</span><select id="aGive">${MATS.map(([m,n,e])=>`<option value="${m}">${e} ${n}</option>`).join("")}</select><span>por 1</span><select id="aGet">${MATS.map(([m,n,e])=>`<option value="${m}" ${m==="hierro"?"selected":""}>${e} ${n}</option>`).join("")}</select><button id="aTrade">Cambiar</button><span class="hint">${home?"En tu puerto el cambio es 2 por 1.":trade2(p,false)?"Tu barco cambia 2 por 1 en cualquier sitio.":"En tu puerto sería 2 por 1."}</span></div>`;
 h+=`<details class="cat"><summary>Catálogo: todo lo que se puede hacer</summary><div class="grid">${Object.entries(ACTS).filter(([id])=>id!=="comercio").map(([id,A])=>`<div class="it ${canAfford(costFor(p,A.c,id))?"ok":"no"}"><div class="t">${A.i||""} ${A.n}</div><div class="w">${A.w||""}</div><div class="c">${A.fleet?"gasta 1 escolta":costTxt(costFor(p,A.c,id))}${canAfford(costFor(p,A.c,id))?"":" · te falta material"}</div><div class="x">${A.x}</div></div>`).join("")}</div></details>`;
 h+=`<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="pri" id="aDone">Listo</button></div>`;
 const st=box.scrollTop;box.innerHTML=h;box.scrollTop=st;
 box.querySelectorAll("button[data-vote]").forEach(b=>b.onclick=()=>{vote=+b.dataset.vote;renderActs()});
 if($("bidP")){$("bidP").onclick=()=>{if(left("ron")>0)bid++;renderOrders();renderActs()};$("bidM").onclick=()=>{bid=Math.max(0,bid-1);renderOrders();renderActs()}}
 if($("vbP")){$("vbP").onclick=()=>{if(left("ron")>0)vbuy++;renderOrders();renderActs()};$("vbM").onclick=()=>{vbuy=Math.max(0,vbuy-1);renderOrders();renderActs()}}
 box.querySelectorAll("button[data-ransom]").forEach(b=>b.onclick=()=>{Net.toHost({t:"ransom",h:b.dataset.ransom});b.disabled=true});
 box.querySelectorAll("button[data-recruit]").forEach(b=>b.onclick=()=>{Net.toHost({t:"recruit",h:b.dataset.recruit});b.disabled=true});
 box.querySelectorAll("button[data-a]").forEach(b=>b.onclick=()=>{const A=JSON.parse(b.dataset.a);if(A.a==="emboscada"){route=[];note("Con la emboscada tu barco no se mueve esta ronda.",5)}acts.push(A);sndHit&&sndHit("chest");renderOrders();renderActs()});
 box.querySelectorAll("button[data-rm]").forEach(b=>b.onclick=()=>{acts.splice(+b.dataset.rm,1);renderOrders();renderActs()});
 box.querySelectorAll("button[data-of]").forEach(b=>b.onclick=()=>{const j=b.dataset.of;const g=$("tgm"+j).value,gn=+$("tg"+j).value,r=$("trm"+j).value,rn=+$("tr"+j).value;if(g===r){note("Elige dos materiales distintos.",3);return}if(left(g)<gn){note("No tienes bastante para ofrecer eso.",3);return}Net.toHost({t:"offer",to:+j,kind:"trade",give:{[g]:gn},get:{[r]:rn}})});
 box.querySelectorAll("button[data-pact]").forEach(b=>b.onclick=()=>Net.toHost({t:"offer",to:+b.dataset.pact,kind:"pact"}));
 $("aGive").onchange=()=>{$("aR").textContent="Doy "+tradeR(me(),home,$("aGive").value,GS.mkt)};$("aTrade").onclick=()=>{const g=$("aGive").value,t=$("aGet").value;if(g===t){note("Elige dos materiales distintos.",3);return}if(GS.law==="puertos"&&!home){note("Puertos cerrados: solo puedes comerciar en tu puerto o en un muelle.",4);return}if(left(g)<(tradeR(me(),home,g,GS.mkt))){note("No tienes bastante para ese cambio.",3);return}acts.push({a:"comercio",give:g,get:t});renderOrders();renderActs()};
 $("aDone").onclick=closeActs}
// ---------- temporizador ----------
function armDeadline(sec){deadline=sec>0?Date.now()+sec*1000:0;autoSent=false}
armDeadline(GS.timer?GS.timer*60+12:0);
setInterval(()=>{const el=$("tmr");if(!deadline||GS.phase!=="orders"||document.body.classList.contains("sailing")){el.hidden=true;return}const sl=Math.max(0,Math.ceil((deadline-Date.now())/1000));el.hidden=false;
 el.textContent=me().ready?`Esperando · ${Math.floor(sl/60)}:${String(sl%60).padStart(2,"0")}`:`⏳ ${Math.floor(sl/60)}:${String(sl%60).padStart(2,"0")}`;el.classList.toggle("hot",sl<=30&&!me().ready);if(typeof sndMusic==="function")sndMusic(sl<=30&&!me().ready?"tension":"navegar");
 if(sl<=2&&!me().ready&&!autoSent){autoSent=true;note("¡Se acabó el tiempo! Se envían tus órdenes tal como están.",5);$("oGo").click()}},500);

// ---------- mapa personal ----------
const mapc=$("mapc"),mx=mapc.getContext("2d");let MSC=1;
// el pergamino se dibuja a la resolución real de la pantalla (nítido en monitores grandes y retina)
function sizeMap(){const avail=Math.min(innerWidth*.96,(innerHeight-90)*1100/860);const w=avail*(devicePixelRatio||1);const s=Math.min(3,Math.max(1,w/1100));if(Math.abs(s-MSC)>.05||mapc.width!==Math.round(1100*s)){MSC=s;mapc.width=Math.round(1100*s);mapc.height=Math.round(860*s)}}
addEventListener("resize",()=>{if(mapOpen){sizeMap();drawMap()}});
const MS=Math.max(34,Math.min(1100/(Math.sqrt(3)*(2*RAD+1)+2),860/(1.5*(2*RAD)+4)));let MC={q:0,r:0};
const mP=c=>[550+MS*Math.sqrt(3)*((c.q-MC.q)+(c.r-MC.r)/2),430+MS*1.5*(c.r-MC.r)];
const parchBase=(()=>{const cv=document.createElement("canvas");cv.width=2200;cv.height=1720;const x=cv.getContext("2d");x.scale(2,2);const g=x.createRadialGradient(550,430,100,550,430,700);g.addColorStop(0,"#ead6a6");g.addColorStop(.75,"#d5b780");g.addColorStop(1,"#9c7442");x.fillStyle=g;x.fillRect(0,0,1100,860);
 for(let i=0;i<180;i++){const cx=rnd()*1100,cy=rnd()*860,r=15+rnd()*90;const sg=x.createRadialGradient(cx,cy,0,cx,cy,r);sg.addColorStop(0,`rgba(120,80,30,${.03+rnd()*.05})`);sg.addColorStop(1,"rgba(120,80,30,0)");x.fillStyle=sg;x.fillRect(cx-r,cy-r,2*r,2*r)}
 x.strokeStyle="rgba(70,48,25,.22)";x.lineWidth=2;for(let i=0;i<120;i++){const px=rnd()*1100,py=rnd()*860;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+9,py-7,px+18,py);x.quadraticCurveTo(px+27,py-7,px+36,py);x.stroke()}
 x.font="italic 30px 'IM Fell English',Georgia,serif";x.fillStyle="rgba(70,45,22,.4)";x.textAlign="center";x.fillText("Terra incognita",760,560);x.fillText("Hic sunt dracones",330,700);return cv})();
function hexPath(x,c,sc=1){const [px,py]=mP(c);x.beginPath();for(let i=0;i<=6;i++){const a=Math.PI/6+i*Math.PI/3;const X=px+MS*sc*Math.cos(a),Y=py+MS*sc*Math.sin(a);i?x.lineTo(X,Y):x.moveTo(X,Y)}}
const routeOpts=()=>{if(GS.phase!=="orders"||me().ready||route.length>=maxRoute())return[];const last=route.length?route[route.length-1]:cellOf(me().cell);return neighbors(last).filter(c=>sailable(c)&&!route.includes(c))};
function blob(x,c,R,sc=1){const [px,py]=mP(c);x.beginPath();for(let j=0;j<=48;j++){const th=j/48*6.283;const k=R*sc*(1+.22*(fbm(Math.cos(th)*1.6+c.q,Math.sin(th)*1.6+c.r)-.5)*2);j?x.lineTo(px+Math.cos(th)*k,py+Math.sin(th)*k):x.moveTo(px+Math.cos(th)*k,py+Math.sin(th)*k)}x.closePath()}
const LANDC={selva:["#7f9a4e","#55703a"],lino:["#c9bd6e","#998c45"],hierro:["#8d7f72","#5f554c"],ron:["#93a85a","#6a7f3c"],perlas:["#e2cfa0","#bba274"]};
const LICON={selva:"🌴",lino:"🌾",hierro:"⛏️",ron:"🍾",perlas:"🦪"};
function shipGlyph(x,px,py,col,ang,sz){x.save();x.translate(px,py);x.rotate(ang);x.scale(sz,sz);x.fillStyle="rgba(30,18,8,.35)";x.beginPath();x.ellipse(1,3,13,5,0,0,6.28);x.fill();
 x.fillStyle="#5a3a1e";x.strokeStyle="#1e1208";x.lineWidth=1.4;x.beginPath();x.moveTo(-12,-1);x.lineTo(12,-1);x.lineTo(8,5);x.lineTo(-9,5);x.closePath();x.fill();x.stroke();
 x.fillStyle=col;x.beginPath();x.moveTo(-1,-18);x.lineTo(-1,-2);x.lineTo(9,-3);x.closePath();x.fill();x.stroke();x.beginPath();x.moveTo(-3,-16);x.lineTo(-3,-2);x.lineTo(-11,-3);x.closePath();x.fill();x.stroke();x.restore()}
function drawIsland(x,o,c){const [px,py]=mP(c);const R=MS*.72*o.s*(o.home!==undefined?1.1:1);const k=key(c);
 for(let r=3;r>=1;r--){blob(x,c,R,1+r*.17);x.strokeStyle=`rgba(40,80,95,${.12+.08*(3-r)})`;x.lineWidth=1.4;x.setLineDash([6,5]);x.stroke()}x.setLineDash([]);
 x.save();x.translate(4,5);blob(x,c,R);x.fillStyle="rgba(40,25,10,.35)";x.fill();x.restore();
 blob(x,c,R);const lc=LANDC[o.t];const g=x.createRadialGradient(px-R*.3,py-R*.35,R*.1,px,py,R*1.15);g.addColorStop(0,"#efe1b4");g.addColorStop(.35,lc[0]);g.addColorStop(1,lc[1]);x.fillStyle=g;x.fill();x.strokeStyle="#2d1c0c";x.lineWidth=2.2;x.stroke();
 blob(x,c,R,.82);x.strokeStyle="rgba(240,225,180,.5)";x.lineWidth=1;x.stroke();
 x.font=`${Math.round(MS*.5)}px serif`;x.textAlign="center";x.textBaseline="middle";x.globalAlpha=.9;x.fillText(LICON[o.t],px,py-2);x.globalAlpha=1;x.textBaseline="alphabetic";
 if(o.port!==undefined&&o.home===undefined){x.font=`${Math.round(MS*.45)}px serif`;x.textAlign="center";x.fillText("⚓",px+R*.55,py-R*.55);x.font="italic 15px 'IM Fell English',Georgia,serif";x.fillStyle="rgba(45,25,10,.95)";x.fillText("Puerto libre",px,py+R+18);return}
 if(o.home!==undefined){x.strokeStyle="#2a1a0a";x.lineWidth=2;x.beginPath();x.moveTo(px+R*.5,py-R*.2);x.lineTo(px+R*.5,py-R-14);x.stroke();x.fillStyle=PCOL[o.home];x.beginPath();x.moveTo(px+R*.5,py-R-14);x.lineTo(px+R*.5+18,py-R-8);x.lineTo(px+R*.5,py-R-2);x.fill();x.stroke();
  x.font="italic 15px 'IM Fell English',Georgia,serif";x.fillStyle="rgba(45,25,10,.95)";x.fillText("Puerto de "+GS.players[o.home].name,px,py+R+18);return}
 const T=GS.terr[k]||[],F=GS.fort[k]||[];
 T.forEach((ow,si)=>{const fx=px-(T.length-1)*13+si*26,fy=py-R-4;x.strokeStyle="#2a1a0a";x.lineWidth=1.8;x.beginPath();x.moveTo(fx,fy+8);x.lineTo(fx,fy-14);x.stroke();
  x.beginPath();x.moveTo(fx,fy-14);x.lineTo(fx+13,fy-10);x.lineTo(fx,fy-6);x.closePath();if(ow<0){x.fillStyle="rgba(250,240,215,.85)";x.fill();x.setLineDash([2,2]);x.stroke();x.setLineDash([])}else{x.fillStyle=PCOL[ow];x.fill();x.stroke()}
  if(F[si]){x.fillStyle="#6a625a";x.strokeStyle="#2a1a0a";x.fillRect(fx-6,fy+2,12,9);x.strokeRect(fx-6,fy+2,12,9);for(let b=0;b<3;b++)x.fillRect(fx-6+b*5,fy-1,3,3)}});
 const icons=GS.players.map((p,ow)=>Object.keys((GS.bld||{})[k+"|"+ow]||{}).map(t=>ACTS[t].i).join("")).join("");
 x.font="italic 14px 'IM Fell English',Georgia,serif";x.fillStyle="rgba(45,25,10,.9)";x.fillText(INAME[o.t].replace("Isla ","").replace(/^del? (las )?/,"")+(icons?" "+icons:""),px,py+R+17);
 if(!me().looted.includes(k)){x.fillStyle="rgba(150,30,25,.9)";x.font="bold 18px Georgia";x.fillText("✕",px+R*.75,py-R*.45)}}
function drawVolcano(x,c){const [px,py]=mP(c);const R=MS*.95;x.save();x.translate(4,5);x.fillStyle="rgba(40,25,10,.35)";x.beginPath();x.ellipse(px,py+R*.35,R,R*.45,0,0,6.28);x.fill();x.restore();
 x.fillStyle="#5a4a40";x.strokeStyle="#2a1a0a";x.lineWidth=2;x.beginPath();x.moveTo(px-R,py+R*.4);x.quadraticCurveTo(px-R*.35,py-R*.1,px-R*.22,py-R*.75);x.lineTo(px+R*.2,py-R*.75);x.quadraticCurveTo(px+R*.35,py-R*.1,px+R,py+R*.4);x.closePath();x.fill();x.stroke();
 x.fillStyle="#c8401a";x.beginPath();x.ellipse(px,py-R*.75,R*.21,R*.07,0,0,6.28);x.fill();x.strokeStyle="#d8501a";x.lineWidth=2.5;x.beginPath();x.moveTo(px-R*.05,py-R*.72);x.quadraticCurveTo(px-R*.2,py-R*.2,px-R*.45,py+R*.3);x.stroke();
 x.fillStyle="rgba(90,80,75,.45)";for(let i=0;i<5;i++){x.beginPath();x.arc(px+i*7,py-R*.95-i*12,8+i*4,0,6.28);x.fill()}
 x.font="italic 15px 'IM Fell English',Georgia,serif";x.textAlign="center";x.fillStyle="rgba(45,25,10,.95)";x.fillText(GS.volBy===myIdx?"Volcán: tesoro saqueado por ti":me().volSeen?"Volcán: el tesoro ya no está":"Volcán",px,py+R*.75);
 x.font="italic 16px 'IM Fell English',Georgia,serif";x.textAlign="center";x.fillStyle="rgba(110,30,20,.95)";x.fillText(GS.treasures>0?"Volcán · tesoro":"Volcán · saqueado",px,py+R*.4+18)}
function drawMap(){const x=mx;x.setTransform(MSC,0,0,MSC,0,0);x.drawImage(parchBase,0,0,1100,860);const PL=GS.phase==="place";const mc=PL?CM["0,0"]:cellOf(me().cell);MC=mc;
 CELLS.forEach(c=>{if(!seen.has(key(c)))return;hexPath(x,c,1.03);x.fillStyle="rgba(80,120,125,.22)";x.fill()});
 // dominios: cada isla pertenece a quien tenga más territorios; su zona incluye el mar de alrededor
 const zone={};{const sc={};const add=(k,o,n)=>{(sc[k]=sc[k]||{})[o]=(sc[k][o]||0)+n};
  ISL.forEach(o=>{const k=key(o.c);let ow=-1;if(o.home!==undefined)ow=o.home;else{const T=GS.terr[k]||[];const cnt={};T.forEach(v=>{if(v>=0)cnt[v]=(cnt[v]||0)+1});const best=Object.entries(cnt).sort((a,b)=>b[1]-a[1]);if(best.length&&(best.length===1||best[0][1]>best[1][1]))ow=+best[0][0]}
   if(ow<0)return;add(k,ow,9);neighbors(o.c).forEach(n=>{if(n!==VOL&&!ISLMAP[key(n)])add(key(n),ow,o.home!==undefined?2:1)})});
  Object.entries(sc).forEach(([k,m])=>{const b=Object.entries(m).sort((a,b)=>b[1]-a[1]);if(b.length===1||b[0][1]>b[1][1])zone[k]=+b[0][0]})}
 CELLS.forEach(c=>{const k=key(c);if(!seen.has(k)||zone[k]===undefined)return;hexPath(x,c,1.01);x.fillStyle=PCOL[zone[k]];x.globalAlpha=.2;x.fill();x.globalAlpha=1});
 CELLS.forEach(c=>{const k=key(c);if(!seen.has(k)||zone[k]===undefined)return;const [px,py]=mP(c);NB.forEach(([a,b],e)=>{const n=CM[(c.q+a)+","+(c.r+b)];if(n&&zone[key(n)]===zone[k])return;
  const [nx,ny]=mP(n||{q:c.q+a,r:c.r+b});const mx_=(px+nx)/2,my_=(py+ny)/2,dx=nx-px,dy=ny-py,L=Math.hypot(dx,dy)||1,hx=-dy/L*MS*.5,hy=dx/L*MS*.5;
  x.strokeStyle=PCOL[zone[k]];x.globalAlpha=.85;x.lineWidth=3.2;x.beginPath();x.moveTo(mx_+hx-dx/L*2,my_+hy-dy/L*2);x.lineTo(mx_-hx-dx/L*2,my_-hy-dy/L*2);x.stroke();x.globalAlpha=1})});
 // niebla sobre lo que aún no has descubierto
 CELLS.forEach(c=>{if(seen.has(key(c)))return;const [px,py]=mP(c);if(px<-MS||px>1100+MS||py<-MS||py>860+MS)return;const g=x.createRadialGradient(px,py,MS*.2,px,py,MS*1.5);g.addColorStop(0,"rgba(105,85,65,.72)");g.addColorStop(.6,"rgba(115,95,75,.4)");g.addColorStop(1,"rgba(120,100,80,0)");x.fillStyle=g;x.fillRect(px-MS*1.5,py-MS*1.5,MS*3,MS*3)});
 CELLS.forEach(c=>{if(seen.has(key(c))||!neighbors(c).some(n=>seen.has(key(n))))return;const [px,py]=mP(c);hexPath(x,c,.98);x.save();x.clip();x.strokeStyle="rgba(70,45,20,.2)";x.lineWidth=1;for(let d=-2*MS;d<2*MS;d+=7){x.beginPath();x.moveTo(px+d-MS,py-MS);x.lineTo(px+d+MS,py+MS);x.stroke()}x.restore()});
 CELLS.forEach(c=>{if(!seen.has(key(c)))return;hexPath(x,c);x.strokeStyle="rgba(60,45,25,.16)";x.lineWidth=1;x.stroke()});
 routeOpts().forEach(c=>{hexPath(x,c,.9);x.fillStyle="rgba(150,30,25,.08)";x.fill();x.strokeStyle="rgba(150,30,25,.6)";x.lineWidth=2.5;x.setLineDash([5,5]);x.stroke();x.setLineDash([])});
 CELLS.forEach(c=>{if(!seen.has(key(c)))return;const o=ISLMAP[key(c)];if(o)drawIsland(x,o,c);if(c===VOL)drawVolcano(x,c)});
 // tormenta: zona peligrosa y hacia dónde irá
 if(GS.storm){const sc=cellOf(GS.storm.c);if(sc){const [px,py]=mP(sc);[sc].concat(neighbors(sc)).forEach(c=>{hexPath(x,c,1);x.fillStyle="rgba(30,35,45,.28)";x.fill()});
  x.save();x.translate(px,py);x.strokeStyle="rgba(25,30,40,.85)";x.lineWidth=2.5;for(let k=0;k<3;k++){x.beginPath();for(let a=0;a<9.5;a+=.2){const r=4+a*MS*.11;x.lineTo(Math.cos(a+k*2.1)*r,Math.sin(a+k*2.1)*r)}x.stroke()}
  const DIR=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]][GS.storm.d||0];const nc=cellOf([GS.storm.c[0]+DIR[0],GS.storm.c[1]+DIR[1]]);if(nc){const [qx,qy]=mP(nc);const dx=qx-px,dy=qy-py,L=Math.hypot(dx,dy)||1;x.strokeStyle="rgba(120,20,20,.85)";x.lineWidth=4;x.beginPath();x.moveTo(dx/L*MS*1.1,dy/L*MS*1.1);x.lineTo(dx/L*MS*1.9,dy/L*MS*1.9);x.stroke();x.beginPath();x.moveTo(dx/L*MS*2.1,dy/L*MS*2.1);x.lineTo(dx/L*MS*1.7-dy/L*8,dy/L*MS*1.7+dx/L*8);x.lineTo(dx/L*MS*1.7+dy/L*8,dy/L*MS*1.7-dx/L*8);x.closePath();x.fillStyle="rgba(120,20,20,.85)";x.fill()}
  x.fillStyle="rgba(25,30,40,.95)";x.font="italic 15px Georgia";x.textAlign="center";x.fillText("Tormenta",0,MS*1.55);x.restore()}}
 // mapa del tesoro: solo lo ves tú
 if(me().tmap){const tc=cellOf(me().tmap);if(tc){const [px,py]=mP(tc);x.save();x.strokeStyle="rgba(150,20,15,.95)";x.lineWidth=5;x.beginPath();x.moveTo(px-12,py-12);x.lineTo(px+12,py+12);x.moveTo(px+12,py-12);x.lineTo(px-12,py+12);x.stroke();x.fillStyle="rgba(150,20,15,.95)";x.font="italic bold 15px Georgia";x.textAlign="center";x.fillText("tesoro",px,py-18);x.restore()}}
 Object.entries(rumors).forEach(([j,r])=>{if(r.round!==GS.round||SHIPS[j].visible)return;const [px,py]=mP(cellOf(r.at));x.globalAlpha=.85;x.strokeStyle=PCOL[j];x.lineWidth=3;x.setLineDash([4,4]);x.beginPath();x.arc(px,py,MS*.8,0,6.28);x.stroke();x.setLineDash([]);x.fillStyle=PCOL[j];x.font="bold 22px Georgia";x.textAlign="center";x.fillText("?",px,py+8);x.font="italic 14px Georgia";x.fillText("rumor: "+GS.players[j].name,px,py+MS*.8+16);x.globalAlpha=1});
 GS.players.forEach((p,i)=>{if(i===myIdx||!SHIPS[i].visible)return;const [px,py]=mP(cellOf(p.cell));shipGlyph(x,px,py,PCOL[i],0,1.1);x.font="italic 13px Georgia";x.fillStyle="rgba(45,25,10,.9)";x.textAlign="center";x.fillText(p.name,px,py+20)});
 if(route.length){x.strokeStyle="rgba(150,30,25,.9)";x.lineWidth=4;x.setLineDash([10,7]);x.beginPath();const [a,b]=mP(mc);x.moveTo(a,b);route.forEach(c=>{const [px,py]=mP(c);x.lineTo(px,py)});x.stroke();x.setLineDash([]);route.forEach((c,i)=>{const [px,py]=mP(c);x.fillStyle="rgba(150,30,25,.95)";x.beginPath();x.arc(px,py,9,0,6.28);x.fill();x.fillStyle="#f3e6c8";x.font="bold 12px Georgia";x.textAlign="center";x.fillText(i+1,px,py+4)})}
 if(PL)placeOpts().forEach(o=>{const [px,py]=mP(o.c);x.strokeStyle="rgba(200,140,20,.95)";x.lineWidth=4;x.setLineDash([8,5]);x.beginPath();x.arc(px,py,MS*.85,0,6.28);x.stroke();x.setLineDash([])});
 if(!PL||me().placed){const mc2=cellOf(me().cell);const [sx,sy]=mP(mc2);x.strokeStyle=PCOL[myIdx];x.lineWidth=2;x.beginPath();x.arc(sx,sy,MS*.55,0,6.28);x.stroke();shipGlyph(x,sx,sy,PCOL[myIdx],0,1.3)}
 // leyenda
 x.save();x.fillStyle="rgba(234,214,166,.85)";x.strokeStyle="rgba(60,40,20,.6)";x.lineWidth=1.5;const lh=24*GS.players.length+44;x.fillRect(850,24,226,lh);x.strokeRect(850,24,226,lh);x.font="18px 'IM Fell English SC',Georgia,serif";x.fillStyle="rgba(45,25,10,.95)";x.textAlign="left";x.fillText("Dominios",864,46);
 GS.players.forEach((p,i)=>{const y=70+i*24;x.fillStyle=PCOL[i];x.fillRect(864,y-11,14,12);x.strokeRect(864,y-11,14,12);x.fillStyle="rgba(45,25,10,.95)";x.font="15px Georgia";x.fillText(`${p.name}: ${terrCount(GS,i)} terr. · fama ${p.fame}`,886,y)});x.restore();
 x.save();x.translate(1010,770);x.strokeStyle="rgba(50,30,14,.8)";x.lineWidth=1.5;x.beginPath();x.arc(0,0,48,0,6.28);x.stroke();for(let i=0;i<8;i++){const a=i/8*6.283-Math.PI/2,l=i%2?34:58;x.fillStyle=i%2?"rgba(160,40,30,.7)":"rgba(50,30,14,.85)";x.beginPath();x.moveTo(Math.cos(a)*l,Math.sin(a)*l);x.lineTo(Math.cos(a+.25)*9,Math.sin(a+.25)*9);x.lineTo(Math.cos(a-.25)*9,Math.sin(a-.25)*9);x.fill()}x.font="22px 'IM Fell English SC',Georgia,serif";x.fillStyle="rgba(50,30,14,.9)";x.textAlign="center";x.fillText("N",0,-64);x.restore();
 x.font="34px 'IM Fell English SC',Georgia,serif";x.fillStyle="rgba(45,25,10,.85)";x.textAlign="left";x.fillText("Carta de "+me().name,36,826);
 x.font="italic 19px 'IM Fell English',Georgia,serif";x.fillText(GS.phase==="orders"&&!me().ready?`Toca casillas contiguas para trazar tu ruta (hasta ${maxRoute()}). ✕ = cofre sin abrir.`:`${seen.size} de ${CELLS.length} casillas exploradas`,36,44)}
let mapOpen=false,prevPitch=0,mapTimer=0;function toggleMap(v){const want=v===undefined?!mapOpen:v;if(want===mapOpen)return;mapOpen=want;clearTimeout(mapTimer);
 if(mapOpen){setSpy(false);prevPitch=pitchT;pitchT=-.75;sizeMap();drawMap();mapTimer=setTimeout(()=>$("mapw").classList.add("on"),240)}else{$("mapw").classList.remove("on");pitchT=prevPitch}}
$("bMap").onclick=()=>toggleMap(true);$("bClose").onclick=()=>{toggleMap(false);renderOrders()};$("bClr").onclick=()=>{route=[];drawMap();renderOrders()};
mapc.addEventListener("click",e=>{const r=mapc.getBoundingClientRect();const X=(e.clientX-r.left)*1100/r.width,Y=(e.clientY-r.top)*860/r.height;
 if(GS.phase==="place"){let best=null,bd=MS*MS*1.2;placeOpts().forEach(o=>{const [px,py]=mP(o.c);const d=(px-X)**2+(py-Y)**2;if(d<bd){bd=d;best=o}});if(best){Net.toHost({t:"place",k:key(best.c)});note("Enviado…",2)}return}
 let best=null,bd=MS*MS;routeOpts().forEach(c=>{const [px,py]=mP(c);const d=(px-X)**2+(py-Y)**2;if(d<bd){bd=d;best=c}});if(best){route.push(best);drawMap();renderOrders()}});

// ---------- cartas ----------
const CBY={};CARD_LIST.forEach(([id,n,t,k,x])=>CBY[id]={id,n,t,k,x});
const TLABEL={ventaja:"Ventaja",sabotaje:"Sabotaje",sigilo:"Sigilo",respuesta:"Respuesta"};
function cardEl(id,big){const c=CBY[id];const e=document.createElement("div");e.className="fc"+(big?" big":"");e.dataset.t=c.t;e.tabIndex=0;
 e.innerHTML=(c.t==="respuesta"?"":`<div class="cost">${costTxt(CARDCOST(id,me()))}</div>`)+`<div class="art">${c.n.replace("¡","")[0]}<img alt="" src="cartas/arte/${c.id}.jpg" onerror="this.remove()"></div><div class="bot"><div class="tp">${TLABEL[c.t]}</div><div class="nm">${c.n}</div><div class="tx">${c.x}</div></div>`;return e}
const handEl=document.createElement("div");handEl.className="hand";document.body.appendChild(handEl);
const cov=document.createElement("div");cov.className="cov";document.body.appendChild(cov);
let covTimer=0;
function showCov(nodes,msg,buttons,auto){clearTimeout(covTimer);cov.innerHTML="";nodes.forEach(n=>cov.appendChild(n));if(msg){const m=document.createElement("div");m.className="msg";m.textContent=msg;cov.appendChild(m)}
 const b=document.createElement("div");b.className="btns";buttons.forEach(([t,f,pri])=>{const x=document.createElement("button");x.textContent=t;if(pri)x.className="pri";x.onclick=()=>{clearTimeout(covTimer);f()};b.appendChild(x)});cov.appendChild(b);cov.classList.add("on");
 if(auto)covTimer=setTimeout(()=>buttons[0][1](),auto)}
const hideCov=()=>{clearTimeout(covTimer);cov.classList.remove("on")};
function renderHand(){handEl.innerHTML="";const h=me().hand.slice();if(prepared){const k=h.indexOf(prepared.id);if(k>=0)h.splice(k,1)}
 h.forEach(id=>{const e=cardEl(id);e.onclick=()=>zoomCard(id);e.onkeydown=ev=>{if(ev.key==="Enter")zoomCard(id)};handEl.appendChild(e)});
 if(prepared){const e=cardEl(prepared.id);e.style.opacity=".55";e.title="Preparada";e.onclick=()=>showCov([cardEl(prepared.id,true)],"Esta carta está preparada para esta ronda.",[["Quitarla",()=>{prepared=null;hideCov();renderOrders()}],["Dejarla",hideCov,true]]);handEl.appendChild(e)}}
function zoomCard(id){const c=CBY[id];const big=cardEl(id,true);big.classList.add("flip");const cost=CARDCOST(id,me()),afford=canAfford(cost);const can=GS.phase==="orders"&&!me().ready&&c.t!=="respuesta"&&!prepared&&afford;
 const btns=[];if(can)btns.push(["Jugar esta ronda",()=>{if(NEEDS_TARGET.has(id)){pickTarget(id);return}prepared={id,target:null};hideCov();renderOrders();note(`Preparada en secreto: ${c.n}. Se revelará al zarpar.`,5)},true]);
 btns.push(["Guardar",hideCov]);showCov([big],c.t==="respuesta"?"Esta carta se juega sola cuando alguien te sabotea. Es gratis.":(prepared?"Ya tienes una carta preparada esta ronda.":!afford?`Jugarla cuesta ${costTxt(cost)} y ahora no te llega.`:`Jugarla cuesta ${costTxt(cost)}.`),btns)}
function pickTarget(id){const opts=GS.players.filter(p=>p.i!==myIdx&&!p.gone).map(p=>[p.name,()=>{prepared={id,target:p.i};hideCov();renderOrders();note(`Preparada en secreto: ${CBY[id].n} contra ${p.name}.`,5)}]);
 opts.push(["Cancelar",hideCov]);showCov([cardEl(id,true)],"¿Contra quién?",opts)}

// ---------- botón del anfitrión para no esperar eternamente ----------
if(Net.isHost){const b=document.createElement("button");b.id="bForce";b.textContent="Forzar ronda";b.title="Resuelve la ronda aunque falte alguien";$("bMap").parentElement.appendChild(b);let arm=0;
 b.onclick=()=>{if(GS.phase!=="orders")return;if(Date.now()-arm>3000){arm=Date.now();note("Pulsa otra vez para resolver la ronda sin esperar a los que faltan.",3);return}hostResolve()}}

// ================= RESOLUCIÓN (solo anfitrión) =================
async function hostResolve(){const G=H.G;if(G.phase!=="orders")return;G.phase="resolving";const P=G.players,ev=[];const E=(to,o)=>ev.push(Object.assign({to},o));
 const draw=()=>{if(!G.deck.length){G.deck=shuffle(G.discard||[]);G.discard=[]}return G.deck.pop()};G.discard=G.discard||[];
 const O=P.map((p,i)=>{const o=(!p.gone&&H.orders[i])||{route:[],card:null,bet:0,faroles:p.faroles};return o});
 P.forEach((p,i)=>{p.fx=Object.assign({},p.fx&&p.fx.wet?{wet:p.fx.wet}:{});p.faroles=!!O[i].faroles;p.maxR=G.galerna?2:(p.ship==="galeon"?4:3);if(p.stormed===G.round-1)p.maxR=Math.max(1,p.maxR-1);p.stop=false;p.ambush=false;p.mat=p.mat||{};p.crew=p.crew||0;p.ship=p.ship||"balandra"});G.galerna=0;G.colonies=G.colonies||{};
 // ayudas
 const steal=(from,to,n)=>{const got=[];for(let k=0;k<n;k++){const have=MATS.map(m=>m[0]).filter(m=>stock(from,m)>0);if(!have.length)break;const m=have[Math.floor(Math.random()*have.length)];addStock(from,m,-1);if(to)addStock(to,m,1);got.push(m)}return got};
 const mname=ms=>ms.length?ms.map(m=>MATS.find(x=>x[0]===m)[1].toLowerCase()).join(" y "):"nada";
 const mn=m=>MATS.find(x=>x[0]===m)[1].toLowerCase();
 const pay=(p,c)=>{if(!canPay(p,c))return false;Object.entries(c).forEach(([m,n])=>addStock(p,m,-n));return true};
 const inPact=(a,b)=>(G.pacts||[]).some(x=>((x.a===a&&x.b===b)||(x.a===b&&x.b===a))&&x.until>=G.round);
 const adjK=(p,k)=>neighbors(cellOf(p.cell)).some(n=>key(n)===k);
 G.bld=G.bld||{};const B=(k,i)=>G.bld[k+"|"+i]||{};
 const atHome=p=>(p.cell[0]===p.home[0]&&p.cell[1]===p.home[1])||Object.keys(G.terr).some(k=>B(k,p.i).muelle&&G.terr[k].includes(p.i)&&adjK(p,k));
 const iat=k=>{const o=ISLMAP[k];return [o.c.q,o.c.r]};
 // el ron de la tripulación se gasta siempre, haya pelea o no
 P.forEach((p,i)=>{const hasA=(O[i].acts||[]).some(a=>a&&a.a==="asalto");p.bet=p.gone||!hasA?0:Math.max(0,Math.min(p.rum,O[i].bet|0));p.rum-=p.bet});
 // subasta en la taberna
 if(G.auction){const it=G.auction.it;const bids=P.map((p,i)=>p.gone?0:Math.max(0,Math.min(p.rum,O[i].bid|0)));const mx=Math.max(0,...bids);
  if(mx>0){const c=P.filter((p,i)=>bids[i]===mx).sort((a,b)=>a.fame-b.fame);const Wp=c[0];Wp.rum-=mx;AUC[it].f(Wp,E,G);E(-1,{k:"note",txt:`🔨 ${Wp.name} gana la subasta con ${mx} de ron: ${AUC[it].n}.`});E(Wp.i,{k:"note",txt:`¡Ganas la subasta! ${AUC[it].x}`})}
  else E(-1,{k:"note",txt:"🔨 Nadie ha pujado: el objeto se queda en la taberna."});G.auction=null}
 // consejo pirata
 if(G.council){const v=[0,0];P.forEach((p,i)=>{if(p.gone)return;const o=O[i].vote;if(o!==0&&o!==1)return;const buy=Math.max(0,Math.min(p.rum,O[i].vbuy|0));p.rum-=buy;v[o]+=1+buy});
  if(v[0]+v[1]>0){const w=v[0]===v[1]?(Math.random()<.5?0:1):v[0]>v[1]?0:1;G.law=G.council.o[w];E(-1,{k:"note",txt:`🏛 El consejo pirata aprueba «${LAWS[G.law].n}» (${v[w]} votos contra ${v[1-w]}). ${LAWS[G.law].x}`})}else E(-1,{k:"note",txt:"🏛 Nadie ha votado en el consejo: la ley no cambia."});G.council=null}
 // ACCIONES en la isla donde estás anclado (antes de zarpar)
 const AO=P.map((p,i)=>p.gone?[]:(O[i].acts||[]).slice(0,10));const ord=shuffle(P.map((p,i)=>i));
 const each=(t,f)=>ord.forEach(i=>AO[i].filter(a=>a&&a.a===t).forEach(a=>f(P[i],i,a)));
 each("comercio",(p,i,a)=>{if(G.law==="puertos"&&!atHome(p)){E(i,{k:"note",txt:"Puertos cerrados: solo puedes comerciar en tu puerto o en un muelle."});return}const r=tradeR(p,atHome(p),a.give,G.mkt);p.mer=(p.mer||0)+.5;if(!a.give||!a.get||a.give===a.get||!MATS.some(m=>m[0]===a.get)||stock(p,a.give)<r)return;addStock(p,a.give,-r);addStock(p,a.get,1);ST(p,"com");G.sold=G.sold||{};G.sold[a.give]=(G.sold[a.give]||0)+r;E(i,{k:"note",txt:`Cambias ${r} de ${mn(a.give)} por 1 de ${mn(a.get)}.`})});
 each("asalto",(p,i,a)=>{const T=G.terr[a.k];if(!T||!adjK(p,a.k))return;const ow=T[a.s];if(G.law==="tregua"&&G.fort[a.k]&&G.fort[a.k][a.s]){p.rum+=p.bet;p.bet=0;E(i,{k:"note",txt:"La tregua de los fuertes prohíbe asaltar un territorio fortificado: tu gente se queda a bordo."});return}if(ow===undefined||ow<0||ow===i||!pay(p,costFor(p,ACTS.asalto.c,"asalto")))return;
  if(inPact(i,ow)){G.pacts=G.pacts.filter(x=>!((x.a===i&&x.b===ow)||(x.a===ow&&x.b===i)));p.bonus=(p.bonus||0)-1;p.pir=(p.pir||0)+2;ST(p,"tr");E(ow,{k:"note",txt:`¡${p.name} ha roto vuestro pacto y asalta tu territorio! Pierde 1 de fama por traidor.`});E(-1,{k:"note",txt:`${p.name} ha traicionado su pacto con ${P[ow].name}.`})}
  const Q=P[ow],fort=G.fort[a.k][a.s],near=!Q.gone&&adjK(Q,a.k)&&!Q.sent;const atk=strengthOf(p,p.bet)+(capOf(p)===0?2:0),brul=FL(p).includes("brulote")&&(p.fl=FL(p).filter((x,j,a)=>j!==a.indexOf("brulote")),1),def=2+(capOf(Q)===4?1:0)+(fort?3:0)+(B(a.k,ow).patrulla?2:0)+(near?strengthOf(Q,0):0);
  if(atk>def){T[a.s]=i;p.st=p.st||{bw:0,aw:0};p.st.aw++;p.pir=(p.pir||0)+1;if(G.wanted===ow){p.bonus=(p.bonus||0)+1;E(i,{k:"note",txt:`¡Cobras la recompensa por ${Q.name}! +1 de fama.`})}G.fort[a.k][a.s]=0;if(!T.includes(ow))delete G.bld[a.k+"|"+ow];E(i,{k:"assault",win:true,at:iat(a.k),fort,txt:`¡Asalto victorioso! Tu fuerza ${atk} contra su defensa ${def}: el territorio de ${Q.name} ya es tuyo${fort?" y su fuerte queda en ruinas":""}.`});
   E(ow,{k:"assault",win:false,def:true,at:iat(a.k),fort,who:i,txt:`¡${p.name} ha asaltado uno de tus territorios (fuerza ${atk} contra ${def}) y te lo ha quitado! Su barco está junto a esa isla.`});E(-1,{k:"note",txt:`${p.name} ha conquistado un territorio de ${Q.name}.`})}
  else{if(p.cannons>1)p.cannons--;E(i,{k:"assault",win:false,at:iat(a.k),fort,txt:`El asalto fracasa: tu fuerza ${atk} contra su defensa ${def}${fort?" (tenía fuerte)":""}. Pierdes 1 cañón en la retirada.`});
   E(ow,{k:"assault",win:true,def:true,at:iat(a.k),fort,who:i,txt:`¡Tus defensas han rechazado un asalto de ${p.name} (${def} contra ${atk})! Su barco está junto a tu isla.`})}});
 each("colonizar",(p,i,a)=>{const T=G.terr[a.k];if(!T||!adjK(p,a.k))return;const s=T[a.s]===-1?a.s:T.indexOf(-1);
  if(s<0){E(i,{k:"note",txt:"Alguien se te ha adelantado: ya no quedaba territorio libre en esa isla. No has gastado nada."});return}if(!pay(p,costFor(p,ACTS.colonizar.c,"colonizar")))return;T[s]=i;const m=TMAT[ISLMAP[a.k].t];
  E(i,{k:"build",b:"colonizar",at:iat(a.k),txt:`Plantas tu bandera en un territorio de la isla de ${mn(m)}: +1 de fama mientras sea tuyo y 1 de ${mn(m)} cada ronda.`+(T.length>1&&T.every(o=>o===i)?" ¡La isla entera es tuya: +1 de fama extra!":"")});E(-1,{k:"note",txt:`${p.name} ha colonizado un territorio.`})});
 each("fuerte",(p,i,a)=>{const T=G.terr[a.k];if(!T||!adjK(p,a.k)||T[a.s]!==i||G.fort[a.k][a.s]||!pay(p,costFor(p,ACTS.fuerte.c,"fuerte")))return;G.fort[a.k][a.s]=1;E(i,{k:"build",b:"fuerte",at:iat(a.k),txt:"Levantas un fuerte de piedra: ese territorio defiende con 3 más."})});
 ["almacen","muelle","torre","patrulla"].forEach(t=>each(t,(p,i,a)=>{const T=G.terr[a.k];if(!T||!adjK(p,a.k)||!T.includes(i))return;const bk=a.k+"|"+i;if((G.bld[bk]||{})[t]||(t==="patrulla"&&!FL(p).some(x=>x!=="brulote"))||!pay(p,costFor(p,ACTS[t].c,t)))return;if(t==="patrulla"){const fl=FL(p).slice();const w=fl.slice().filter(x=>x!=="brulote").sort((a,b)=>ACTS[a].str-ACTS[b].str)[0];fl.splice(fl.indexOf(w),1);p.fl=fl}G.bld[bk]=G.bld[bk]||{};G.bld[bk][t]=1;
  E(i,{k:"build",b:t,at:iat(a.k),txt:`${ACTS[t].n} terminado. ${ACTS[t].x}`});if(t==="patrulla")E(-1,{k:"note",txt:`${p.name} ha dejado una patrulla vigilando una de sus islas.`})}));
 each("emboscada",(p,i)=>{if(p.ambush||!neighbors(cellOf(p.cell)).some(c=>ISLMAP[key(c)])||!pay(p,costFor(p,ACTS.emboscada.c,"emboscada")))return;p.ambush=true;p.fx.bruma=1;E(i,{k:"note",txt:"Fondeas escondido junto a la isla y esperas a tu presa…"})});
 each("tripulante",(p,i)=>{if(p.crew>=4||!pay(p,costFor(p,ACTS.tripulante.c,"tripulante")))return;p.crew++;E(i,{k:"build",b:"tripulante",txt:`Se une un tripulante: ahora tienes ${p.crew}. +1 de fuerza.`})});
 each("canon",(p,i)=>{if(!atHome(p)||p.cannons>=6||!pay(p,costFor(p,ACTS.canon.c,"canon")))return;p.cannons++;E(i,{k:"build",b:"canon",txt:`Fundes un cañón nuevo en tu puerto: ahora tienes ${p.cannons}.`})});
 FLS.forEach(t=>each(t,(p,i)=>{if(!atHome(p)||FL(p).length>=FLMAX||!pay(p,costFor(p,ACTS[t].c,t)))return;p.fl=FL(p).concat(t);E(i,{k:"build",b:t,txt:`${ACTS[t].n} se une a tu flota (${p.fl.length+1} barcos). ${ACTS[t].x}`});E(-1,{k:"note",txt:`${p.name} ha añadido un ${ACTS[t].n.toLowerCase()} a su flota.`})}));
 each("galeon",(p,i)=>{if(!atHome(p)||p.ship==="galeon"||!pay(p,costFor(p,ACTS.galeon.c,"galeon")))return;p.ship="galeon";p.maxR=G.galerna?2:4;E(i,{k:"build",b:"galeon",txt:"¡Tu balandra ya es un galeón! Navegas 4 casillas por ronda y tienes +1 de fuerza."});E(-1,{k:"note",txt:`${p.name} ha botado un galeón.`})});
 // cartas
 const played=[];P.forEach((p,i)=>{const c=O[i].card;if(!c||!CBY[c.id]||CBY[c.id].t==="respuesta")return;const k=p.hand.indexOf(c.id);if(k<0)return;if(!pay(p,CARDCOST(c.id,p))){E(i,{k:"note",txt:"No te llegaba para pagar la carta: vuelve a tu mano."});return}p.hand.splice(k,1);G.discard.push(c.id);played.push({i,id:c.id,t:c.target})});
 played.forEach(({i,id,t})=>{const p=P[i],c=CBY[id];
  if(NEEDS_TARGET.has(id)){const q=P[t];if(!q||q.gone||t===i)return;
   if(c.t==="sabotaje"){const k=q.hand.indexOf("sabotaje-descubierto");if(k>=0){q.hand.splice(k,1);G.discard.push("sabotaje-descubierto");
     E(t,{k:"card",card:id,txt:`${p.name} te ha jugado «${c.n}», pero le has pillado con ¡Sabotaje descubierto! No tiene efecto.`});E(i,{k:"card",card:"sabotaje-descubierto",txt:`${q.name} te ha pillado: tu «${c.n}» no tiene efecto y sabe que fuiste tú.`});
     E(-1,{k:"note",txt:`¡${q.name} ha descubierto un sabotaje de ${p.name}!`});return}}
   if(id==="motin"){O[t].route=[];E(t,{k:"card",card:id,txt:"¡Motín a bordo! Alguien ha comprado a tu tripulación: este turno no te mueves."})}
   if(id==="rata-en-la-bodega"){q.rum=Math.max(0,q.rum-2);E(t,{k:"card",card:id,txt:"Las ratas se han comido 2 barriles de tu ron. No sabes quién ha sido."})}
   if(id==="kraken-a-sueldo"){const lost=steal(q,null,2);O[t].route=[];q.cell=q.home.slice();q.sent=true;E(t,{k:"card",card:id,txt:`¡El kraken! Se traga ${mname(lost)} y tu barco vuelve a puerto a reparar.`});E(-1,{k:"note",txt:`El kraken ha atacado a ${q.name}.`})}
   if(id==="desvio-de-la-tormenta"){q.maxR=1;E(t,{k:"card",card:id,txt:"Una tormenta te cierra el paso: este turno solo avanzas 1 casilla."})}
   if(id==="mapa-robado"){E(i,{k:"card",card:id,txt:`Has copiado la carta de ${q.name}: su zona ya está en tu mapa.`,reveal:[[q.cell,3],[q.home,2]]})}
   if(id==="polvora-mojada"){q.fx.wet=1;E(t,{k:"card",card:id,txt:"Alguien ha mojado tu pólvora: esta ronda luchas con 2 cañones menos."})}
   if(id==="sobornar-al-vigia"){p.hideFrom=p.hideFrom||{};p.hideFrom[t]=2;E(i,{k:"card",card:id,txt:`El vigía de ${q.name} mirará hacia otro lado durante 2 rondas: no podrá verte.`})}
   if(c.t==="sabotaje"&&!["mapa-robado"].includes(id))E(i,{k:"card",card:id,txt:`Tu «${c.n}» ha caído sobre ${q.name}. No sabrá que fuiste tú.`});return}
  if(id==="viento-a-favor"){p.maxR+=2;E(i,{k:"card",card:id,txt:"El viento empuja tus velas: este turno llegas más lejos."})}
  if(id==="vigia-de-aguila"){p.fx.vista=1;E(i,{k:"card",card:id,txt:"Tu vigía no pierde detalle: esta ronda ves más lejos."})}
  if(id==="remiendo-rapido"){p.cannons++;E(i,{k:"card",card:id,txt:`Montas un cañón de bronce: ahora tienes ${p.cannons} cañones.`})}
  if(id==="contrabando"){p.rum+=3;E(i,{k:"card",card:id,txt:"Unos contrabandistas te dejan 3 barriles de ron."})}
  if(id==="botin-escondido"){const got=[];for(let k=0;k<3;k++){const m=MATS[Math.floor(Math.random()*5)][0];addStock(p,m,1);got.push(m)}E(i,{k:"card",card:id,txt:`Desentierras un botín: ${mname(got)}.`})}
  if(id==="carta-del-cartografo"){const pc=cellOf(p.cell);const mid=CELLS.filter(c=>cdist(c,VOL)===2).sort((a,b)=>cdist(a,pc)-cdist(b,pc))[0];E(i,{k:"card",card:id,txt:"El viejo cartógrafo te dibuja una zona cerca del volcán.",reveal:[[[mid.q,mid.r],2]]})}
  if(id==="bandera-falsa"){p.fx.flag=1;E(i,{k:"card",card:id,txt:"Izas una bandera falsa: si abordas a alguien esta ronda, no sabrá que fuiste tú."})}
  if(id==="bruma-espesa"){p.fx.bruma=1;E(i,{k:"card",card:id,txt:"Una bruma espesa os envuelve: esta ronda nadie puede veros."})}});
 // rutas válidas
 // tormenta que recorre el mapa
 if(!G.storm){const cs=[];for(let q=-RAD[G.np]-1;q<=RAD[G.np]+1;q++)for(let r=-RAD[G.np]-1;r<=RAD[G.np]+1;r++){const c=cellOf([q,r]);if(c&&sailable(c)&&P.every(p=>cdist(c,cellOf(p.home||p.cell))>=3)&&cdist(c,VOL)>=2)cs.push([q,r])}const st=cs[Math.floor(Math.random()*cs.length)]||[0,2];G.storm={c:st,d:Math.floor(Math.random()*6)}}
 const inStorm=c=>G.storm&&cdist(c,cellOf(G.storm.c))<=1;
 const R=P.map((p,i)=>{const out=[];if(p.gone||p.sent||p.ambush)return out;let cur=cellOf(p.cell);for(const a of (O[i].route||[]).slice(0,p.maxR+(!G.galerna?(FL(p).includes("goleta")?1:0)+(capOf(p)===5?1:0):0))){const c=cellOf(a);if(!c||!sailable(c)||cdist(c,cur)!==1)break;out.push(c);cur=c;if(inStorm(c))break}return out});
 const pos=P.map(p=>cellOf(p.cell));const paths=P.map(p=>[p.cell.slice()]);const L=Math.max(0,...R.map(r=>r.length));const fought=new Set();
 const str=p=>strengthOf(p,p.bet);
 for(let s=1;s<=L;s++){const prev=pos.slice();P.forEach((p,i)=>{if(!p.stop&&R[i][s-1])pos[i]=R[i][s-1];paths[i].push([pos[i].q,pos[i].r])});
  // cruces: dos barcos que se intercambian casilla se encuentran a medio camino
  const groups={};P.forEach((p,i)=>{if(p.gone)return;const k=key(pos[i]);(groups[k]=groups[k]||[]).push(i)});
  for(let a=0;a<P.length;a++)for(let b=a+1;b<P.length;b++){if(P[a].gone||P[b].gone)continue;if(pos[a]===prev[b]&&pos[b]===prev[a]&&pos[a]!==pos[b]){pos[b]=pos[a];paths[b][s]=[pos[a].q,pos[a].r];const k=key(pos[a]);groups[k]=groups[k]||[];if(!groups[k].includes(b))groups[k].push(b);if(!groups[k].includes(a))groups[k].push(a)}}
  // emboscadas: el que pasa junto a un barco escondido es abordado por sorpresa
  P.forEach((A,j)=>{if(!A.ambush||A.gone||fought.has(j))return;P.forEach((V,i)=>{if(i===j||V.gone||V.stop||fought.has(i)||inPact(i,j)||pos[i]===prev[i]||pos[i]===pos[j]||cdist(pos[i],pos[j])!==1)return;
   Object.values(groups).forEach(gg=>{const x=gg.indexOf(i);if(x>=0)gg.splice(x,1)});pos[i]=pos[j];paths[i][s]=[pos[j].q,pos[j].r];const k=key(pos[j]);groups[k]=groups[k]||[];if(!groups[k].includes(j))groups[k].push(j);groups[k].push(i);
   E(i,{k:"note",txt:`¡Emboscada! ${A.name} sale de detrás de la isla y os aborda por sorpresa.`});E(j,{k:"note",txt:`¡${V.name} cae en tu emboscada!`})})});
  for(const g of Object.values(groups)){if(g.length<2)continue;if(g.length===2&&inPact(g[0],g[1])){g.forEach(i=>E(i,{k:"note",txt:`Os cruzáis con ${P[g.find(x=>x!==i)].name}, pero el pacto se respeta: nadie dispara.`}));continue}g.forEach(i=>P[i].stop=true);
   // abordaje interactivo: cada uno elige táctica y ron en secreto
   const D=await hostDuel(g,pos[g[0]]);const ZN=["Proa","Centro","Popa"];
   g.forEach(i=>{const d=D[i];d.rum=Math.max(0,Math.min(P[i].rum,d.rum|0));P[i].rum-=d.rum;ST(P[i],"ron",d.rum);const tot=strengthOf(P[i],0)+d.rum;let z=(Array.isArray(d.z)?d.z:[]).slice(0,3).map(v=>Math.max(0,v|0));while(z.length<3)z.push(0);
    if(z.reduce((x,y)=>x+y,0)>tot||z.reduce((x,y)=>x+y,0)<tot){const b=Math.floor(tot/3);z=[b,tot-2*b,b]}d.z=z});
   const won={};g.forEach(i=>won[i]=0);for(let q=0;q<3;q++){const mx=Math.max(...g.map(i=>D[i].z[q]));const top=g.filter(i=>D[i].z[q]===mx);if(top.length===1)won[top[0]]++}
   const tacTxt=i=>ZN.map((n,q)=>`${n} ${g.map(j=>D[j].z[q]).join("-")}`).join(" · ")+` (${g.map(j=>j===i?"tú":P[j].name).join("-")}; ron: ${g.map(j=>D[j].rum).join("-")})`;
   const sc=g.map(i=>({i,v:won[i]*100+strengthOf(P[i],0)+D[i].rum})).sort((x,y)=>y.v-x.v);if(won[sc[0].i]===won[sc[1].i])sc[1].v=sc[0].v;const tacs={};g.forEach(i=>tacs[i]=D[i].z);g.forEach(i=>fought.add(i));const burnt=g.filter(i=>FL(P[i]).includes("brulote"));burnt.forEach(i=>{const fl=FL(P[i]).slice();fl.splice(fl.indexOf("brulote"),1);P[i].fl=fl});
   const cell=pos[g[0]];
   if(sc[0].v===sc[1].v){g.forEach(i=>E(i,{k:"battle",tacs,burn:burnt,step:s,at:[cell.q,cell.r],with:g.filter(j=>j!==i),txt:`Abordaje igualado contra ${g.filter(j=>j!==i).map(j=>P[j].name).join(" y ")}: nadie gana y cada uno sigue en su sitio. ${tacTxt(i)}.`}));continue}
   const w=sc[0].i,W=P[w];const losers=g.filter(i=>i!==w);
   Object.entries(H.lastBets||{}).forEach(([b,on])=>{const Bp=P[b];if(!Bp||Bp.rum<1)return;if(on===w){Bp.rum+=1;ST(Bp,"apu");E(+b,{k:"note",txt:`¡Aciertas la apuesta de taberna! ${W.name} gana el abordaje: cobras 2 de ron por el que pusiste.`})}else{Bp.rum-=1;E(+b,{k:"note",txt:`Pierdes la apuesta de taberna: ${W.name} ha ganado el abordaje.`})}});
   W.st=W.st||{bw:0,aw:0};W.st.bw++;W.pir=(W.pir||0)+1;if(G.wanted>=0&&G.wanted!==w&&losers.includes(G.wanted)){W.bonus=(W.bonus||0)+1;E(w,{k:"note",txt:`¡Cobras la recompensa por ${P[G.wanted].name}! +1 de fama.`});E(-1,{k:"note",txt:`${W.name} ha cobrado la recompensa por ${P[G.wanted].name}.`})}const loot=[];losers.forEach(l=>{const Lp=P[l];ST(Lp,"bl");sc.forEach(o=>o.v=won[o.i]);const got=steal(Lp,W,2+(capOf(W)===3?1:0)+(G.law==="botin"?1:0));loot.push(...got);if((Lp.crew||0)>0){Lp.crew--;G.hostages=G.hostages||[];G.hostages.push({id:Math.random().toString(36).slice(2,7),by:w,of:l,r:G.round});E(w,{k:"note",txt:`Te llevas a un tripulante de ${Lp.name} como rehén: puede pagarte 3 de ron de rescate, o puedes reclutarlo en Acciones.`});E(l,{k:"note",txt:`${W.name} se lleva a uno de tus tripulantes como rehén. Rescátalo en Acciones por 3 de ron antes de 2 rondas.`})}const sunk=FL(Lp).some(x=>x!=="brulote");if(sunk){const fl=FL(Lp).slice();fl.splice(fl.findIndex(x=>x!=="brulote"),1);Lp.fl=fl}else{Lp.cell=Lp.home.slice();Lp.sent=true;pos[l]=cellOf(Lp.home)}
    E(l,{k:"battle",tacs,burn:burnt,step:s,at:[cell.q,cell.r],with:[w],lost:true,sunk,txt:`¡Abordaje! ${W.fx.flag?"Un barco con bandera falsa":W.name} te ha vencido (fuerza ${sc.find(o=>o.i===w).v} contra ${sc.find(o=>o.i===l).v}). Te roba ${mname(got)}${sunk?". Una de tus escoltas se hunde cubriendo la retirada, pero tu barco sigue aquí.":" y vuelves a puerto."} ${tacTxt(l)}.`})});
   E(w,{k:"battle",tacs,burn:burnt,step:s,at:[cell.q,cell.r],with:losers,txt:`¡Abordaje ganado contra ${losers.map(l=>P[l].name).join(" y ")}! Te llevas ${mname(loot)} y salen huyendo. ${tacTxt(w)}.`});
   E(-1,{k:"note",txt:W.fx.flag?`Un barco sin bandera ha hundido el orgullo de ${losers.map(l=>P[l].name).join(" y ")}.`:`${W.name} ha ganado un abordaje a ${losers.map(l=>P[l].name).join(" y ")}.`})}}
 // final de movimiento: cofres y volcán
 P.forEach((p,i)=>{if(p.gone)return;if(!p.sent)p.cell=[pos[i].q,pos[i].r];const c=cellOf(p.cell);
  if(!p.sent){const adj=neighbors(c).map(n=>ISLMAP[key(n)]).filter(o=>o&&o.port===undefined);
   const fresh=adj.find(o=>!p.looted.includes(key(o.c)));
   if(fresh){p.looted.push(key(fresh.c));const m=TMAT[fresh.t];addStock(p,m,2);const r=Math.random();let txt=`Exploráis la isla y encontráis un cofre: +2 de ${mn(m)}`;
    if(r<.3){const x=MATS[Math.floor(Math.random()*5)][0];addStock(p,x,1);txt+=` y 1 de ${mn(x)} más.`}else if(r<.5){const d=draw();if(d&&p.hand.length<3){p.hand.push(d);txt+=` y una Carta de Fortuna: ${CBY[d].n}.`}else txt+="."}else if(r<.68&&!p.tmap){const far=ISL.filter(o=>o.port===undefined&&cdist(o.c,c)>=3&&cdist(o.c,VOL)>1);const o=far[Math.floor(Math.random()*far.length)];if(o){p.tmap=[o.c.q,o.c.r];txt+=" y un viejo MAPA DEL TESORO. Mira tu mapa: hay una X en una isla.";E(-1,{k:"note",txt:`${p.name} ha encontrado un mapa del tesoro...`})}else txt+="."}else if(r<.76){p.rum=Math.max(0,p.rum-1);txt+=", pero una serpiente asusta a la tripulación y se rompe un barril de ron."}else txt+=".";
    ST(P[i],"cof");E(i,{k:"chest",at:[fresh.c.q,fresh.c.r],txt})}
   else{const free=adj.find(o=>G.terr[key(o.c)]&&G.terr[key(o.c)].some(x=>x===-1||x===i));if(free){addStock(p,TMAT[free.t],1);E(i,{k:"gather",txt:`Tu tripulación recoge 1 de ${mn(TMAT[free.t])} en una isla cercana.`})}}
   const riv=adj.find(o=>(G.terr[key(o.c)]||[]).some(x=>x>=0&&x!==i&&!P[x].gone&&!inPact(i,x)));
   if(riv){const rk=key(riv.c),T=G.terr[rk];const ow=T.find(x=>x>=0&&x!==i&&!P[x].gone&&!inPact(i,x)),Q=P[ow];const m=TMAT[riv.t];let got;
    if(B(rk,ow).patrulla||B(rk,ow).almacen){if(B(rk,ow).patrulla){E(i,{k:"plunder",txt:`La patrulla de ${Q.name} os espanta antes de que podáis saquear nada.`});E(ow,{k:"plunder",at:p.cell,who:i,txt:`Tu patrulla ha espantado a ${p.name}, que rondaba tu isla. Su barco está allí ahora mismo.`})}}else{if(stock(Q,m)>0){addStock(Q,m,-1);addStock(p,m,1);got=[m]}else got=steal(Q,p,1);
    if(got.length){p.pir=(p.pir||0)+1;ST(p,"saq");E(i,{k:"plunder",txt:`Saqueas los almacenes de ${Q.name} en esa isla: te llevas ${mname(got)}.`});E(ow,{k:"plunder",at:p.cell,who:i,txt:`¡${p.name} está saqueando tu isla! Se ha llevado ${mname(got)}. Su barco está junto a ella ahora mismo.`})}}}
   if(p.tmap&&cdist(c,cellOf(p.tmap))===1){p.tmap=null;p.bonus=(p.bonus||0)+1;const got=[];for(let q=0;q<3;q++){const x=MATS[Math.floor(Math.random()*5)][0];addStock(p,x,1);got.push(x)}E(i,{k:"treasure",txt:`¡Desentierras el tesoro del mapa! +1 de fama para siempre y ${mname(got)}.`});E(-1,{k:"note",txt:`${p.name} ha desenterrado un tesoro.`})}
   if(cdist(c,VOL)===1&&G.treasures>0){p.got=true;G.treasures=0;G.volBy=i;p.bonus=(p.bonus||0)+3;E(i,{k:"treasure",txt:"¡EL TESORO DEL VOLCÁN! +3 de fama para siempre. Eres el único que lo tendrá. Ahora sal de aquí antes de que entre en erupción."});}
   else if(cdist(c,VOL)===1&&G.treasures<=0&&G.volBy!==i&&!p.volSeen){p.volSeen=true;E(i,{k:"note",txt:"Llegáis al volcán y encontráis el cofre del tesoro abierto y vacío. Alguien se os ha adelantado… y nadie más lo sabe."})}}});
 P.forEach((p,i)=>{if(p.gone||p.sent||!inStorm(cellOf(p.cell)))return;const lost=steal(p,null,1);p.stormed=G.round;E(i,{k:"storm",at:p.cell.slice(),txt:`¡La tormenta os atrapa! El barco se detiene${lost.length?", perdéis "+mname(lost):""} y la ronda que viene navegaréis 1 casilla menos.`})});
 const nearV=P.filter(p=>!p.gone&&!p.sent&&cdist(cellOf(p.cell),VOL)===1);if(nearV.length&&Math.random()<.2){nearV.forEach(p=>{p.rum=Math.max(0,p.rum-1);p.cell=p.home.slice();p.sent=true;E(p.i,{k:"erupt",txt:"¡ERUPCIÓN! Llueve fuego: pierdes 1 barril y tu barco vuelve a puerto."})});E(-1,{k:"note",txt:"¡El volcán ha entrado en erupción!"})}
 // fin de ronda
 // producción: el puerto da 1 ron y cada colonia 1 material de su isla
 P.forEach(p=>{if(p.gone)return;p.rum+=1;const made={ron:1};Object.entries(G.terr).forEach(([k,T])=>{const m=ISLMAP[k]&&TMAT[ISLMAP[k].t];if(!m)return;const n=T.filter(o=>o===p.i).length+(T.includes(p.i)&&B(k,p.i).almacen?1:0);if(n){addStock(p,m,n);made[m]=(made[m]||0)+n}});FL(p).filter(t=>t==="mercante").forEach(()=>{const m=["madera","lona","hierro","perlas"][Math.floor(Math.random()*4)];addStock(p,m,1);made[m]=(made[m]||0)+1});
  E(p.i,{k:"prod",txt:"Producción: "+Object.entries(made).map(([m,n])=>`+${n} ${MATS.find(x=>x[0]===m)[1].toLowerCase()}`).join(", ")})});
 // rumores: cada capitán oye por dónde anda otro barco
 {const live=P.filter(p=>!p.gone);const DIRS=["este","noreste","norte","noroeste","oeste","suroeste","sur","sureste"];
  live.forEach(p=>{const others=shuffle(live.filter(q=>q.i!==p.i));if(!others.length)return;others.slice(0,capOf(p)===2?2:1).forEach(q=>{const a=cellOf(p.cell),b=cellOf(q.cell);
   const ang=Math.atan2(-(b.z-a.z),b.x-a.x);const d=DIRS[(Math.round(ang/(Math.PI/4))+8)%8];const n=cdist(a,b);
   E(p.i,{k:"rumor",who:q.i,at:q.cell.slice(),txt:n===0?`Rumor: el barco de ${q.name} está pegado al tuyo.`:`Rumor: unos pescadores han visto el barco de ${q.name} al ${d}, a unas ${n} casillas.`})})})}
 P.forEach(p=>{Object.keys(p.hideFrom||{}).forEach(k=>{if(--p.hideFrom[k]<=0)delete p.hideFrom[k]});if(p.fx.wet&&--p.fx.wet<=0)delete p.fx.wet;p.ready=false;delete p.stop});
 // misiones secretas
 P.forEach((p,i)=>{if(p.gone||!p.mis||p.misOk)return;const own=Object.entries(G.terr).filter(([k,T])=>T.includes(i)),mt=t=>own.filter(([k])=>ISLMAP[k]&&TMAT[ISLMAP[k].t]===t).length;
  const nb=Object.entries(G.bld).filter(([k])=>k.endsWith("|"+i)).reduce((a,[,b])=>a+Object.keys(b).length,0),nf=Object.entries(G.fort).reduce((a,[k,F])=>a+F.filter((f,si)=>f&&G.terr[k][si]===i).length,0);
  const st=p.st||{};const ok={hierro:mt("hierro")>=2,perlas:mt("perlas")>=2,isla:own.some(([k,T])=>T.length>=3&&T.every(o=>o===i)),fuertes:nf>=3,edif:nb>=3,almirante:FL(p).filter(t=>t!=="brulote").length>=2,abordajes:(st.bw||0)>=2,asaltos:(st.aw||0)>=2,cofres:(p.looted||[]).length>=6}[p.mis];
  if(ok){p.misOk=true;p.bonus=(p.bonus||0)+2;E(i,{k:"mission",txt:`¡Misión secreta cumplida: ${MIS[p.mis].n}! ${MIS[p.mis].x} +2 de fama para siempre.`});E(-1,{k:"note",txt:`${p.name} ha cumplido su misión secreta (${MIS[p.mis].n}): +2 de fama.`})}});
 P.forEach((p,i)=>p.fame=famOf(G,i)); {const live=P.filter(p=>!p.gone).sort((a,b)=>b.fame-a.fame);G.wanted=live.length>1&&live[0].fame>=3&&live[0].fame>live[1].fame?live[0].i:-1}
 if(G.storm){const DIR=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];if(Math.random()<.3)G.storm.d=(G.storm.d+(Math.random()<.5?1:5))%6;let moved=false;for(let t=0;t<6&&!moved;t++){const d=DIR[G.storm.d];const n=[G.storm.c[0]+d[0],G.storm.c[1]+d[1]];const nc=cellOf(n);if(nc&&cdist(nc,VOL)>=1){G.storm.c=n;moved=true}else G.storm.d=(G.storm.d+2+Math.floor(Math.random()*3))%6}}
 P.forEach(p=>{if(!p.gone&&repOf(p)==="mercader")p.rum+=1});const top=P.filter(p=>!p.gone).sort((a,b)=>b.fame-a.fame||b.rum-a.rum);if(top.length&&top[0].fame>=G.target){G.winner=top[0].i;G.phase="over"}
 else{// sucesos del mar que afectan a todos
  if(G.round>=(QS.has("ev")?1:2)&&Math.random()<(QS.has("ev")?1:.17)){const live=P.filter(p=>!p.gone);let k=QS.get("evk")!=null?+QS.get("evk"):Math.floor(Math.random()*8);if(k===5&&QS.get("evk")==null)k=[0,1,3][Math.floor(Math.random()*3)];let n,txt,lead_i,vic_i;
   if(k===4){const lead=live.slice().sort((a,b)=>b.fame-a.fame)[0];lead_i=lead.i;const lost=steal(lead,null,2);lead.cell=lead.home.slice();n="El kraken despierta";txt=`Un kraken hambriento ataca al barco con más fama: ${lead.name} pierde ${mname(lost)} y vuelve a puerto.`}
   if(k===5){live.forEach(p=>p.rum=Math.max(0,p.rum-1));n="Tormenta";txt="Una tormenta barre el archipiélago: todos perdéis 1 barril de ron."}
   if(k===6){live.forEach(p=>{if(p.hand.length){const j=Math.floor(Math.random()*p.hand.length);G.discard.push(p.hand.splice(j,1)[0])}});n="Motín general";txt="Las tripulaciones se amotinan: cada uno pierde una carta al azar."}
   if(k===7){const v=live[Math.floor(Math.random()*live.length)];vic_i=v.i;v.cell=v.home.slice();n="Remolino";txt=`Un remolino se traga el barco de ${v.name} y lo escupe en su puerto.`}
   if(k===0){G.galerna=1;n="Galerna";txt="Se levanta una galerna: la próxima ronda nadie podrá navegar más de 2 casillas."}
   if(k===1){live.forEach(p=>p.rum+=1);n="Marea de ron";txt="La marea arrastra barriles de un barco hundido: todos ganáis 1 barril de ron."}
   if(k===2){const hit=live.filter(p=>cdist(cellOf(p.cell),VOL)<=2);hit.forEach(p=>p.rum=Math.max(0,p.rum-1));n="Lluvia de ceniza";txt="El volcán escupe ceniza ardiente. "+(hit.length?hit.map(p=>p.name).join(", ")+" pierde"+(hit.length>1?"n":"")+" 1 barril por estar cerca.":"Esta vez nadie estaba lo bastante cerca.")}
   if(k===3){live.forEach(p=>{if(p.hand.length<3){const d=draw();if(d)p.hand.push(d)}});n="Restos de un naufragio";txt="Flotan restos de un naufragio: todos los que tengan sitio en la mano roban una Carta de Fortuna."}
   E(-1,{k:"sea",n,txt,kind:k,who:k===4?lead_i:k===7?vic_i:undefined})}
  if(G.law==="ron")P.forEach(p=>{if(!p.gone)p.rum+=1});
  if(G.law==="diezmo"){const lv=P.filter(p=>!p.gone).sort((a,b)=>b.fame-a.fame);const a=lv[0],z=lv[lv.length-1];if(lv.length>1&&a.fame>z.fame&&a.rum>0){a.rum--;z.rum++;E(a.i,{k:"note",txt:`Diezmo del líder: pagas 1 ron a ${z.name}.`});E(z.i,{k:"note",txt:`Diezmo del líder: ${a.name} te paga 1 ron.`})}}
  G.hostages=(G.hostages||[]).filter(h=>{if(G.round-h.r<2)return true;const Hb=P[h.by],Ho=P[h.of];if(Hb&&!Hb.gone&&(Hb.crew||0)<4){Hb.crew=(Hb.crew||0)+1;ST(Hb,"reh");E(h.by,{k:"note",txt:`Nadie ha pagado el rescate: el rehén de ${Ho.name} se une a tu tripulación.`});E(h.of,{k:"note",txt:`No pagaste el rescate: tu tripulante se ha unido a ${Hb.name}.`})}else{Ho.crew=Math.min(4,(Ho.crew||0)+1);E(h.of,{k:"note",txt:"Tu tripulante rehén se escapa y vuelve a nado."})}return false});
  G.round++;G.phase="orders";
  G.auction=G.round%3===0?{it:Object.keys(AUC)[Math.random()*Object.keys(AUC).length|0],r:G.round}:null;if(G.auction)E(-1,{k:"note",txt:`🔨 Subasta en la taberna: ${AUC[G.auction.it].n}. ${AUC[G.auction.it].x} Puja en secreto en Acciones.`});
  if(G.round%4===0){const ks=Object.keys(LAWS).filter(k=>k!==G.law);const a=ks.splice(Math.random()*ks.length|0,1)[0];const b=ks[Math.random()*ks.length|0];G.council={o:[a,b],r:G.round};E(-1,{k:"note",txt:`🏛 Consejo pirata: se vota entre «${LAWS[a].n}» y «${LAWS[b].n}». Vota en Acciones.`})}else G.council=null;G.mkt=rollMkt(G.sold);G.sold={};E(-1,{k:"note",txt:`Mercado del puerto: ${mktTxt(G.mkt)}.`});G.pacts=(G.pacts||[]).filter(x=>x.until>=G.round);P.forEach(p=>{if(p.gone)return;if(p.hand.length<3){const d=draw();if(d){p.hand.push(d);E(p.i,{k:"drew",card:d})}}})}
 const sent=P.map(p=>!!p.sent);P.forEach(p=>delete p.sent);H.orders={};
 Net.toAll({t:"resolve",G,paths,sent,ev});hostArmTimer(60)}

// ================= CLIENTE: mensajes del anfitrión =================
let busy=false;const queue=[];
function worldMsg(m){
 if(m.t==="duel"){showDuel(m);return}
 if(m.t==="duelEnd"){if(duelUI&&duelUI.id===m.id){duelUI.box.remove();duelUI=null}return}
 if(m.t==="msg"){note(m.txt,8);sndHit("chest");return}
 if(m.t==="placed"){note(m.txt,6);sndHit("chest");return}
 if(m.t==="offer"){const o=m.o,q=GS.players[o.from];const t=document.createElement("div");t.className="fc big";t.dataset.t="ventaja";
  t.innerHTML=`<div class="art">🤝</div><div class="bot"><div class="tp">Trato</div><div class="nm">${esc(q.name)} te propone</div><div class="tx">${o.kind==="pact"?"Un pacto de no agresión durante 3 rondas: no habrá abordajes entre vosotros ni saqueos en vuestras islas. Si uno asalta al otro, pierde 1 de fama.":`Te da ${costTxt(o.give)} a cambio de ${costTxt(o.get)}.`}</div></div>`;
  sndHit("chest");showCov([t],"",[["Rechazar",()=>{hideCov();Net.toHost({t:"offerAns",id:o.id,ok:false})}],["Aceptar",()=>{hideCov();Net.toHost({t:"offerAns",id:o.id,ok:true})},true]],45000);return}
 if(m.t==="offerSent"){note(`Propuesta enviada a ${esc(GS.players[m.o.to].name)}. Esperando su respuesta…`,6);return}
 if(m.t==="offerRes"){const o=m.o,other=GS.players[o.from===myIdx?o.to:o.from].name;note(m.ok?(o.kind==="pact"?`¡Pacto sellado con ${esc(other)} durante 3 rondas!`:`Trato hecho con ${esc(other)}.`):`${esc(other)} no acepta el trato.${m.why?" "+m.why:""}`,7);if(typeof renderActs==="function"&&$("actp").classList.contains("on"))renderActs();renderRes&&renderRes();return}if(m.t==="ready"){m.ready.forEach((r,i)=>GS.players[i].ready=r);if(m.gone)m.gone.forEach((g,i)=>GS.players[i].gone=g);if(GS.phase==="orders")renderScore();return}
 if(m.t==="lobby")return;
 if(m.t==="state"){GS=m.G;applyPorts(GS);placePorts();if(GS.phase==="place"){if(!wasPlace)showPlace();else{placeT0=Date.now();myShip.visible=!!me().placed;drawMap()}}else if(wasPlace)endPlace();snapShips();SHIPS.forEach((s,i)=>setShipModel(i));placeColonies();renderOrders();return}
 if(m.t==="resolve"){m.rt=Date.now();queue.push(m);if(!busy)nextResolve()}}
function nextResolve(){const m=queue.shift();if(!m){busy=false;return}busy=true;playResolve(m,()=>nextResolve())}
function snapShips(){SHIPS.forEach((s,i)=>{const c=cellOf(GS.players[i].cell);s.userData.pos.set(c.x,0,c.z);s.userData.from=null});reveal(cellOf(me().cell),2);Object.keys(GS.terr||{}).forEach(k=>{if(myB(k).torre&&GS.terr[k].includes(myIdx))reveal(CM[k],2)});updateVisibility()}
const seq=(fns,done)=>{let k=0;const go=()=>{if(k>=fns.length){done&&done();return}fns[k++](go)};go()};
const LOG=[];const LOGI={battle:"⚔",assault:"🏰",build:"🔨",card:"🂠",chest:"⚿",treasure:"✦",erupt:"🌋",sea:"≋",storm:"⛈",plunder:"💰",gather:"🪵",prod:"⚒",rumor:"👂",mission:"🗝",note:"✒"};
function logRound(m,mine){const r=m.G.phase==="over"?m.G.round:m.G.round-1;const L=mine.filter(e=>e.txt&&e.k!=="drew").map(e=>({k:e.k,t:e.txt}));const seen=m.G.players.filter((p,i)=>i!==myIdx&&SHIPS[i]&&SHIPS[i].visible).map(p=>p.name);if(seen.length)L.push({k:"rumor",t:`Velas avistadas al final de la ronda: ${seen.join(", ")}.`});LOG.push({r,L});return {r,L}}
function logHTML(e){return `<div class="logr"><h3>Ronda ${e.r}</h3>${e.L.length?e.L.map(x=>`<div class="logl"><span>${LOGI[x.k]||"✒"}</span><p>${esc(x.t)}</p></div>`).join(""):`<div class="logl"><span>✒</span><p>Mar en calma. Nada digno de anotar.</p></div>`}</div>`}
function showLog(all,cb){const box=document.createElement("div");box.className="logbook";const list=all?LOG.slice().reverse():LOG.slice(-1);box.innerHTML=`<h2>📖 Cuaderno de bitácora</h2><div class="logs">${list.length?list.map(logHTML).join(""):"<p>Aún no hay nada escrito.</p>"}</div>`;showCov([box],"",[[all?"Cerrar":"Seguir",()=>{hideCov();cb&&cb()},true]],all?0:16000)}
function playResolve(m,done){const mine=m.ev.filter(e=>e.to===-1||e.to===myIdx);const oldG=GS;
 // la ronda ya está cerrada: aplica faroles y efectos visibles de los demás
 GS.players.forEach((p,i)=>{p.faroles=m.G.players[i].faroles;p.fx=m.G.players[i].fx;p.hideFrom=m.G.players[i].hideFrom});
 toggleMap(false);setSpy(false);hideCov();document.body.classList.add("sailing");sndTension(1);sndHit("drum");$("hRound").textContent=`RONDA ${GS.round} · RESOLVIENDO`;
 const pre=mine.filter(e=>e.k==="card");
 const steps=Math.max(...m.paths.map(p=>p.length))-1;
 const fns=[];
 pre.forEach(e=>fns.push(async nx=>{if(e.card==="kraken-a-sueldo"&&e.to===myIdx&&e.txt.startsWith("¡El kraken"))await fxKraken(myIdx).catch(()=>{});const b=cardEl(e.card,true);b.classList.add("flip");showCov([b],e.txt,[["Seguir",()=>{hideCov();if(e.reveal)e.reveal.forEach(([c,r])=>reveal(cellOf(c),r));setTimeout(nx,300)},true]],7000)}));
 mine.filter(e=>e.k==="assault").forEach(e=>fns.push(nx=>{fxAssault(e).catch(()=>{}).then(()=>{rcard(e.def?(e.win?"DEFENSA":"TERRITORIO PERDIDO"):(e.win?"CONQUISTA":"ASALTO FALLIDO"),"Asalto");if(e.win&&!e.def){const k2=key(cellOf(e.at));const T=GS.terr[k2];if(T){const s2=T.findIndex(o=>o>=0&&o!==myIdx);if(s2>=0)T[s2]=myIdx;placeColonies()}}
  setTimeout(()=>{const t=document.createElement("div");t.className="fc big";t.dataset.t=e.win?"ventaja":"sabotaje";t.innerHTML=`<div class="art">⚔</div><div class="bot"><div class="tp">Asalto</div><div class="nm">${e.def?(e.win?"¡Resistís!":"Te han conquistado"):(e.win?"¡Territorio conquistado!":"Os rechazan")}</div><div class="tx">${e.txt}</div></div>`;t.classList.add("flip");showCov([t],"",[["Seguir",()=>{hideCov();setTimeout(nx,300)},true]],8000)},1500)})}));
 const blds=mine.filter(e=>e.k==="build");if(blds.length)fns.push(async nx=>{const col=blds.find(e=>e.b==="colonizar"&&e.at);if(col&&typeof fxLanding==="function"){try{await fxLanding({at:col.at,atk:myIdx,def:-1,win:true,n:2})}catch(err){console.warn(err)}cineOff()}
  const B={colonizar:["⚑","Nuevo territorio"],fuerte:["🏰","Fuerte"],tripulante:["👥","Tripulación"],canon:["💣","Cañón"],galeon:["🚢","Galeón"],escolta:["⛵","Escolta"],almacen:["📦","Almacén"],muelle:["⚓","Muelle"],torre:["🗼","Torre vigía"],patrulla:["🛡","Patrulla"]};
  const nodes=blds.map(e=>{const t=document.createElement("div");t.className="fc big";t.dataset.t="ventaja";t.innerHTML=`<div class="art">${B[e.b][0]}</div><div class="bot"><div class="tp">Construcción</div><div class="nm">${B[e.b][1]}</div><div class="tx">${e.txt}</div></div>`;t.classList.add("flip");return t});
  if(blds.some(e=>e.b==="galeon"))setTimeout(()=>{GS.players[myIdx].ship="galeon";setShipModel(myIdx)},400);
  sndHit("chest");showCov(nodes.slice(0,3),"",[["Seguir",()=>{hideCov();setTimeout(nx,300)},true]],7000)});
 fns.push(nx=>{rcard("¡LEVEN ANCLAS!","Ronda "+GS.round);setTimeout(nx,900)});
 for(let s=1;s<=steps;s++)fns.push(nx=>{SHIPS.forEach((sh,i)=>{const a=m.paths[i][s-1],b=m.paths[i][s];if(!b)return;sh.userData.from=cellOf(a);sh.userData.to=cellOf(b);sh.userData.t=0});
  const bat=mine.filter(e=>e.k==="battle"&&e.step===s);
  sailT=0;sailDone=()=>{sailDone=null;reveal(curCell(myIdx),2+(me().fx&&me().fx.vista?1:0));updateVisibility();
   if(bat.length){const e=bat[0];fxBattle(e).catch(()=>{}).then(()=>{rcard(e.lost?"DERROTA":e.txt.startsWith("Abordaje igualado")?"EMPATE":"VICTORIA","Abordaje");
    note(e.txt,9);setTimeout(()=>{if(e.lost)fadeJump(myShip,cellOf(m.G.players[myIdx].home));nx()},1600)})}else nx()}});
 fns.push(nx=>{// barcos enviados a puerto vuelven allí
  m.sent.forEach((s,i)=>{if(s){const h=cellOf(m.G.players[i].home);fadeJump(SHIPS[i],h)}});setTimeout(nx,m.sent.some(Boolean)?900:10)});
 mine.filter(e=>e.k==="mission").forEach(e=>fns.push(nx=>{sndHit("treasure");const t=document.createElement("div");t.className="fc big";t.dataset.t="ventaja";t.innerHTML=`<div class="art">🗝</div><div class="bot"><div class="tp">Misión secreta</div><div class="nm">¡Cumplida!</div><div class="tx">${e.txt}</div></div>`;t.classList.add("flip");showCov([t],"",[["Seguir",()=>{hideCov();setTimeout(nx,300)},true]],8000)}));
 mine.filter(e=>["chest","treasure","erupt","sea","storm"].includes(e.k)).forEach(e=>fns.push(async nx=>{if(e.k==="storm"){e.n="¡Atrapados en la tormenta!";await fxSea({kind:5}).catch(()=>{})}if(e.k==="sea")await fxSea(e).catch(()=>{});if(e.k==="erupt")await fxErupt().catch(()=>{});sndHit(e.k);if(e.k==="treasure")rcard("TESORO",e.txt.includes("mapa")?"+1 de fama":"+3 de fama");if(e.k==="sea"||e.k==="storm")rcard(e.k==="storm"?"TORMENTA":"SUCESO DEL MAR",e.n);
  const t=document.createElement("div");t.className="fc big";t.dataset.t=e.k==="sea"||e.k==="storm"?"sigilo":e.k==="chest"?"ventaja":e.k==="treasure"?"ventaja":"sabotaje";t.innerHTML=`<div class="art">${e.k==="sea"||e.k==="storm"?"≋":e.k==="erupt"?"🌋":e.k==="treasure"?"✦":"⚿"}</div><div class="bot"><div class="tp">${e.k==="sea"||e.k==="storm"?"Suceso del mar":e.k==="chest"?"Cofre":e.k==="treasure"?"Tesoro":"Volcán"}</div><div class="nm">${e.k==="sea"||e.k==="storm"?e.n:e.k==="chest"?"Exploración":e.k==="treasure"?(e.txt.includes("mapa")?"Tesoro enterrado":"El tesoro del volcán"):"¡Erupción!"}</div><div class="tx">${e.txt}</div></div>`;
  t.classList.add("flip");showCov([t],"",[["Seguir",()=>{hideCov();setTimeout(nx,300)},true]],7000)}));
 mine.filter(e=>e.k==="rumor").forEach(e=>rumors[e.who]={at:e.at,round:m.G.round});
 fns.push(nx=>{logRound(m,mine);showLog(false,()=>setTimeout(nx,200))});
 fns.push(nx=>{GS=m.G;snapShips();SHIPS.forEach((s,i)=>setShipModel(i));placeColonies();sndTension(0);document.body.classList.remove("sailing");route=[];prepared=null;bet=0;acts=[];bid=0;vote=-1;vbuy=0;armDeadline(GS.timer?GS.timer*60+60-(Date.now()-m.rt)/1000:0);
  if(GS.phase==="over"){gameOver();nx();return}
  rcard("ÓRDENES SECRETAS","Ronda "+GS.round);renderOrders();
  const d=mine.find(e=>e.k==="drew");setTimeout(()=>{if(d){const b=cardEl(d.card,true);b.classList.add("flip");showCov([b],"Robas una Carta de Fortuna.",[["A la mano",()=>{hideCov();arrivalNote()},true]],8000)}else arrivalNote();nx()},2400)});
 seq(fns,done)}
function arrivalNote(){const c=cellOf(me().cell);const vis=GS.players.filter((p,i)=>i!==myIdx&&SHIPS[i].visible);
 if(vis.length)note(`Velas a la vista: ${vis.map(p=>p.name).join(", ")}. Si acabáis en la misma casilla habrá abordaje.`,9);
 else if(cdist(c,VOL)<=1)note("El volcán ruge a vuestro lado. El tesoro está cerca, y el peligro también.",8);
 
 else note("Abre Acciones para colonizar o construir, y el mapa (M) para trazar la ruta.",7)}
const TITLES=[["bw","⚔","Terror de los mares","abordajes ganados"],["aw","🏰","Conquistador","asaltos ganados"],["ron","🍾","Rey del ron","barriles gastados en abordajes"],["tr","🐍","Traidor de la Cofradía","pactos rotos"],["com","⚖","Mercader de seda","cambios en el mercado"],["cof","⚿","Cazatesoros","cofres abiertos"],["saq","💰","Saqueador","almacenes saqueados"],["apu","🎲","Tahúr de taberna","apuestas acertadas"],["reh","⛓","Carcelero","rehenes capturados"],["bl","🐟","Pez de agua dulce","abordajes perdidos"]];
function titlesHTML(){const P=GS.players.filter(p=>!p.gone);const out=[];TITLES.forEach(([k,ic,n,d])=>{const v=P.map(p=>(p.st&&p.st[k])||0);const mx=Math.max(0,...v);if(mx<1)return;const who=P.filter((p,j)=>v[j]===mx).map(p=>`<b style="color:${PCOL[p.i]}">${esc(p.name)}</b>`).join(" y ");out.push(`<div class="tl"><span>${ic}</span><div><i>${n}</i> ${who} <small>(${mx} ${d})</small></div></div>`)});return out.slice(0,7).join("")}
function gameOver(){sndMusic("final");const w=GS.players[GS.winner];const rows=GS.players.slice().sort((a,b)=>b.fame-a.fame).map(p=>`${p.name}: ${p.fame} de fama`).join(" · ");
 rcard(GS.winner===myIdx?"¡VICTORIA!":"FIN DE LA PARTIDA",w.name+" gana");
 const t=document.createElement("div");t.className="fc big";t.dataset.t="ventaja";t.innerHTML=`<div class="art">☠</div><div class="bot"><div class="tp">Fin de la partida</div><div class="nm">${esc(w.name)} es leyenda</div><div class="tx">${esc(rows)}</div></div>`;
 const tt=titlesHTML();const nodes=[t];if(tt){const d=document.createElement("div");d.className="logbook titles";d.innerHTML=`<h2>🏆 Títulos de la partida</h2>${tt}`;const row=document.createElement("div");row.className="endrow";row.append(t,d);nodes[0]=row}
 setTimeout(()=>showCov(nodes,GS.winner===myIdx?"Tu nombre se cantará en todas las tabernas del archipiélago.":`${w.name} ha llegado antes a ${GS.target} de fama.`,[["Nueva partida",()=>{location.href=location.pathname+(LOCAL?"?local":"")},true]]),2600)}

// ---------- efectos ----------
const fxs=[];function puff(x,y,z,col,sz,life){const m=new THREE.SpriteMaterial({map:cloudTex,color:C(col),transparent:true,opacity:.9,depthWrite:false});const s=new THREE.Sprite(m);s.position.set(x,y,z);s.scale.set(sz,sz,1);scene.add(s);fxs.push({s,t:0,life,sz})}
function cannonFx(at){const c=cellOf(at);for(let k=0;k<14;k++)setTimeout(()=>{puff(c.x+(Math.random()-.5)*24,3+Math.random()*4,c.z+(Math.random()-.5)*24,k%3?"#d8d0c8":"#ffb060",6+Math.random()*6,2.5);flash.intensity=8},k*110)}
function eruptFx(){for(let k=0;k<30;k++)setTimeout(()=>puff(VOL.x+(Math.random()-.5)*30,45+Math.random()*30,VOL.z+(Math.random()-.5)*30,k%2?"#ff5a20":"#3a2a26",20+Math.random()*30,4),k*60)}
const flash=new THREE.PointLight(C("#ffa050"),0,120,2);scene.add(flash);
function fadeJump(ship,c){ship.userData.from=null;ship.userData.pos.set(c.x,0,c.z)}

// ---------- cámara en tercera persona, detrás del capitán ----------
scene.add(camera);const camT=new THREE.Vector3(),camL=new THREE.Vector3();let introK=QS.has("nointro")?1:0;const CAMD=+(QS.get("camd")||6.5),CAMH=+(QS.get("camh")||2.7),CAMEL=+(QS.get("camel")||.3),CAMS=+(QS.get("cams")||2.2);
function thirdPerson(dt){if(introK<1){introK=Math.min(1,introK+dt/7);if(introK>=1)introDone()}const e=1-Math.pow(1-introK,3);
 myShip.updateMatrixWorld();if(deckLow!==null){CLIPL[1].constant=deckLow+.35;CLIP.forEach((p,k)=>p.copy(CLIPL[k]).applyMatrix4(myShip.matrixWorld))}
 const dk=deckLow!==null?deckLow:CAPY;
 // catalejo: la cámara pasa a los ojos del capitán y el barco desaparece de la vista
 const spyOn=spy&&introK>=1;if(myShip.userData.glb)myShip.userData.glb.visible=!spyOn;if(myShip.userData.cap)myShip.userData.cap.visible=!spyOn;if(myShip.userData.flag)myShip.userData.flag.visible=!spyOn;
 if(spyOn){camT.set(ownCapX+.4,dk+CAPH*.93,0);myShip.localToWorld(camT);camera.position.copy(camT);const az=myShip.userData.heading+yaw,pp=Math.max(-.35,Math.min(.35,pitch));camL.set(camT.x+Math.cos(az)*Math.cos(pp)*100,camT.y+Math.sin(pp)*100,camT.z-Math.sin(az)*Math.cos(pp)*100);camera.lookAt(camL);cineCam(dt);return}
 camT.set(ownCapX,dk+CAMH,0);myShip.localToWorld(camT);
 const az=myShip.userData.heading+yaw+(1-e)*2.4;const el=THREE.MathUtils.lerp(1.05,Math.max(.06,Math.min(1.35,CAMEL-pitch*.9)),e);const D=THREE.MathUtils.lerp(260,CAMD+Math.abs(Math.sin(yaw))*12+(1-Math.cos(yaw))*3,e);const sx=Math.sin(az)*CAMS*e*Math.cos(yaw),sz=Math.cos(az)*CAMS*e*Math.cos(yaw);
 camera.position.set(camT.x-Math.cos(az)*Math.cos(el)*D+sx,camT.y+Math.sin(el)*D,camT.z+Math.sin(az)*Math.cos(el)*D+sz);if(camera.position.y<1.4)camera.position.y=1.4;
 const ahead=spy?80:8;camL.set(camT.x+Math.cos(az)*ahead+sx,camT.y+(spy?0:.4)-(1-e)*2,camT.z-Math.sin(az)*ahead+sz);camera.lookAt(camL);cineCam(dt)}

// ---------- sonido ambiente generado (por defecto solo en el anfitrión) ----------
const SND={on:false,ctx:null,master:null,tension:null};
function sndInit(){if(SND.ctx)return;const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const ctx=new A();SND.ctx=ctx;const M=ctx.createGain();M.gain.value=0;M.connect(ctx.destination);SND.master=M;
 const len=ctx.sampleRate*4,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);let b=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;b=(b+.02*w)/1.02;d[i]=b*3.5}
 const noise=()=>{const s=ctx.createBufferSource();s.buffer=buf;s.loop=true;s.start();return s};
 // olas: ruido marrón con vaivén lento
 const sea=noise(),seaF=ctx.createBiquadFilter();seaF.type="lowpass";seaF.frequency.value=500;const seaG=ctx.createGain();seaG.gain.value=.2;sea.connect(seaF).connect(seaG).connect(M);
 const lfo=ctx.createOscillator();lfo.frequency.value=.11;const lg=ctx.createGain();lg.gain.value=.12;lfo.connect(lg).connect(seaG.gain);lfo.start();
 // viento: ruido filtrado alto que silba
 const wind=noise(),wf=ctx.createBiquadFilter();wf.type="bandpass";wf.frequency.value=900;wf.Q.value=1.4;const wg=ctx.createGain();wg.gain.value=.05;wind.connect(wf).connect(wg).connect(M);
 const l2=ctx.createOscillator();l2.frequency.value=.07;const l2g=ctx.createGain();l2g.gain.value=500;l2.connect(l2g).connect(wf.frequency);l2.start();
 // fondo oscuro: dos tonos graves desafinados
 const dr=ctx.createGain();dr.gain.value=.05;dr.connect(M);[55,82.4,55.6].forEach(f=>{const o=ctx.createOscillator();o.type="sawtooth";o.frequency.value=f;const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=180;o.connect(lp).connect(dr);o.start()});
 // tensión: pulso grave que sube en la resolución
 const tg=ctx.createGain();tg.gain.value=0;tg.connect(M);const to=ctx.createOscillator();to.type="triangle";to.frequency.value=41;const tl=ctx.createOscillator();tl.frequency.value=1.6;const tlg=ctx.createGain();tlg.gain.value=.5;const tv=ctx.createGain();tv.gain.value=.5;tl.connect(tlg).connect(tv.gain);to.connect(tv).connect(tg);to.start();tl.start();SND.tension=tg}
function sndSet(on){SND.on=on;try{localStorage.setItem("archi-snd",on?"1":"0")}catch(e){}if(on){sndInit();if(!SND.ctx)return;SND.ctx.resume();SND.master.gain.setTargetAtTime(.8,SND.ctx.currentTime,.8)}else if(SND.ctx)SND.master.gain.setTargetAtTime(0,SND.ctx.currentTime,.3);$("bSnd").textContent=on?"Sonido: sí":"Sonido: no";$("bSnd").classList.toggle("on",on)}
function sndTension(v){if(SND.on&&SND.tension)SND.tension.gain.setTargetAtTime(v*.35,SND.ctx.currentTime,1.2)}
// ---------- banda sonora generada: cambia según lo que pasa (navegar, combate, tormenta, tensión, final) ----------
const MUS={mode:"",want:"navegar",bus:null,tid:0,t:0,step:0,ph:0};
const _=null;
const MUSSC={dorian:[0,2,3,5,7,9,10],harm:[0,2,3,5,7,8,11],phryg:[0,1,3,5,7,8,10],major:[0,2,4,5,7,9,11]};
const MODES={
 navegar:{bpm:74,root:50,sc:"dorian",vol:.9,chords:[0,0,5,5,3,3,4,4],
  mel:[[0,_,_,2,4,_,3,_,2,_,0,_,1,_,_,_,0,_,_,2,4,_,5,_,4,_,3,_,4,_,_,_],[7,_,_,6,4,_,_,5,4,_,3,_,2,_,_,_,3,_,4,_,2,_,1,_,0,_,_,_,_,_,_,_],[4,_,5,_,7,_,_,_,6,_,5,_,4,_,_,_,2,_,3,_,4,_,2,_,0,_,_,_,_,_,_,_]],
  bass:[0,_,_,_,_,_,4,_,0,_,_,_,_,_,_,_],kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],snare:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hat:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],lead:"pluck",pad:.05},
 combate:{bpm:138,root:45,sc:"harm",vol:1,chords:[0,0,5,4,0,0,3,4],
  mel:[[0,_,0,1,2,_,0,_,4,_,3,2,1,_,-1,_,0,_,0,1,2,_,4,_,5,_,4,3,4,_,_,_],[7,_,6,_,5,_,4,_,5,_,4,_,3,_,2,_,3,_,4,_,5,_,6,_,7,_,_,_,4,_,_,_]],
  bass:[0,_,0,_,0,_,0,7,0,_,0,_,0,_,4,_],kick:[1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0],snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],hat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],lead:"brass",pad:.03},
 tormenta:{bpm:58,root:43,sc:"phryg",vol:.9,chords:[0,1,0,5,0,1,6,4],
  mel:[[_,_,_,_,_,_,_,_,8,_,_,_,_,_,_,_,_,_,_,_,9,_,_,_,_,_,7,_,_,_,_,_]],
  bass:[0,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],kick:[1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],snare:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hat:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],lead:"pluck",pad:.11},
 tension:{bpm:104,root:50,sc:"phryg",vol:.85,chords:[0,0,1,1,0,0,1,1],
  mel:[[_,_,_,_,7,_,_,_,_,_,_,_,8,_,_,_,_,_,_,_,7,_,_,_,_,_,_,_,_,_,_,_]],
  bass:[0,_,0,_,0,_,0,_,0,_,0,_,0,_,0,_],kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],snare:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],lead:"pluck",pad:.04},
 final:{bpm:100,root:50,sc:"major",vol:1,chords:[0,0,3,4,0,5,3,4],
  mel:[[0,_,2,_,4,_,7,_,7,_,_,_,4,_,7,_,8,_,7,_,5,_,4,_,4,_,_,_,_,_,_,_],[4,_,5,_,7,_,9,_,8,_,7,_,5,_,4,_,5,_,4,_,2,_,1,_,0,_,_,_,_,_,_,_]],
  bass:[0,_,_,_,4,_,_,_,0,_,_,_,4,_,_,_],kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0],hat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],lead:"brass",pad:.06}};
const mtf=m=>440*Math.pow(2,(m-69)/12);
const deg=(M,d,oct)=>{const s=MUSSC[M.sc],n=s.length;const o=Math.floor(d/n);return M.root+(oct||0)*12+s[((d%n)+n)%n]+12*o};
function musNoise(ctx){if(MUS.nb)return MUS.nb;const len=ctx.sampleRate,b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;MUS.nb=b;return b}
function musNote(ctx,out,t,f,dur,kind,g){const o=ctx.createOscillator(),o2=ctx.createOscillator(),gg=ctx.createGain(),lp=ctx.createBiquadFilter();lp.type="lowpass";
 if(kind==="pluck"){o.type="triangle";o2.type="sine";o2.frequency.value=f*2;lp.frequency.setValueAtTime(3200,t);lp.frequency.exponentialRampToValueAtTime(600,t+dur);gg.gain.setValueAtTime(.0001,t);gg.gain.exponentialRampToValueAtTime(g,t+.01);gg.gain.exponentialRampToValueAtTime(.0001,t+dur*1.6)}
 else if(kind==="brass"){o.type="sawtooth";o2.type="sawtooth";o2.frequency.value=f*1.004;lp.frequency.setValueAtTime(500,t);lp.frequency.linearRampToValueAtTime(2200,t+.06);lp.frequency.exponentialRampToValueAtTime(900,t+dur);gg.gain.setValueAtTime(.0001,t);gg.gain.exponentialRampToValueAtTime(g*.6,t+.04);gg.gain.setValueAtTime(g*.5,t+dur*.8);gg.gain.exponentialRampToValueAtTime(.0001,t+dur*1.1)}
 else{o.type="sawtooth";o2.type="square";o2.frequency.value=f/2;lp.frequency.value=320;gg.gain.setValueAtTime(.0001,t);gg.gain.exponentialRampToValueAtTime(g,t+.02);gg.gain.exponentialRampToValueAtTime(.0001,t+dur)}
 o.frequency.value=f;const m2=ctx.createGain();m2.gain.value=.35;o.connect(lp);o2.connect(m2).connect(lp);lp.connect(gg).connect(out);o.start(t);o2.start(t);o.stop(t+dur*1.7+.05);o2.stop(t+dur*1.7+.05)}
function musPad(ctx,out,t,M,chord,dur){[0,2,4].forEach((d,k)=>{const f=mtf(deg(M,chord+d,-1));[1,1.006].forEach(dt=>{const o=ctx.createOscillator();o.type="sawtooth";o.frequency.value=f*dt;const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=700;const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(M.pad/3,t+dur*.35);g.gain.linearRampToValueAtTime(.0001,t+dur*1.05);o.connect(lp).connect(g).connect(out);o.start(t);o.stop(t+dur*1.1)})})}
function musDrum(ctx,out,t,kind){if(kind==="kick"){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(38,t+.25);g.gain.setValueAtTime(.5,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);o.connect(g).connect(out);o.start(t);o.stop(t+.4);return}
 const s=ctx.createBufferSource();s.buffer=musNoise(ctx);const f=ctx.createBiquadFilter(),g=ctx.createGain();if(kind==="snare"){f.type="bandpass";f.frequency.value=1500;g.gain.setValueAtTime(.22,t);g.gain.exponentialRampToValueAtTime(.001,t+.18)}else{f.type="highpass";f.frequency.value=7000;g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.001,t+.05)}
 s.connect(f).connect(g).connect(out);s.start(t,Math.random()*.5);s.stop(t+.2)}
function musSynthTick(){const ctx=SND.ctx;if(!ctx||!SND.on)return;if(MUS.t<ctx.currentTime)MUS.t=ctx.currentTime+.05;if(!MUS.bus){MUS.bus=ctx.createGain();MUS.bus.gain.value=0;MUS.bus.connect(SND.master);MUS.t=ctx.currentTime+.1}
 if(MUS.mode!==MUS.want){if(!MUS.fading){MUS.fading=true;MUS.bus.gain.setTargetAtTime(0,ctx.currentTime,.25);setTimeout(()=>{MUS.mode=MUS.want;MUS.step=0;MUS.ph=0;MUS.fading=false;MUS.t=Math.max(MUS.t,ctx.currentTime+.05);MUS.bus.gain.setTargetAtTime(.9*(MODES[MUS.mode]||{vol:1}).vol,ctx.currentTime,.4)},700)}return}
 const M=MODES[MUS.mode];if(!M)return;const sd=60/M.bpm/4;
 while(MUS.t<ctx.currentTime+.25){const st=MUS.step,t=MUS.t,s16=st%16,bar=Math.floor(st/16)%M.chords.length,ch=M.chords[bar];
  if(st%32===0)MUS.ph=Math.floor(Math.random()*M.mel.length);
  if(s16===0)musPad(ctx,MUS.bus,t,M,ch,sd*16);
  const md=M.mel[MUS.ph][st%32];if(md!==null&&md!==undefined)musNote(ctx,MUS.bus,t,mtf(deg(M,md+ch*0,1)),sd*2.2,M.lead,M.lead==="brass"?.11:.14);
  const bd=M.bass[s16];if(bd!==null&&bd!==undefined)musNote(ctx,MUS.bus,t,mtf(deg(M,ch+bd,-1)),sd*1.8,"bass",.16);
  if(M.kick[s16])musDrum(ctx,MUS.bus,t,"kick");if(M.snare[s16])musDrum(ctx,MUS.bus,t,"snare");if(M.hat[s16])musDrum(ctx,MUS.bus,t,"hat");
  MUS.step++;MUS.t+=sd}}
// música pirata grabada (OpenGameArt): suena por situaciones; mientras carga, la generada hace de reserva
const MUSF={navegar:["navegar1","navegar2","navegar3"],combate:["combate"],tormenta:["tormenta"],tension:["tension"],final:["final"]};
const MB={},MF={cur:null,idx:{}};
function musLoad(n){if(n in MB)return;MB[n]=0;fetch("musica/"+n+".mp3").then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(a=>SND.ctx.decodeAudioData(a)).then(b=>{MB[n]=b}).catch(()=>{MB[n]=null})}
function mfPick(mode){const L=MUSF[mode];if(!L)return null;for(let k=0;k<L.length;k++){const n=L[((MF.idx[mode]||0)+k)%L.length];if(MB[n] instanceof AudioBuffer){MF.idx[mode]=((MF.idx[mode]||0)+k+1)%L.length;return n}}return null}
function mfStop(c,t){if(!c)return;try{c.g.gain.cancelScheduledValues(t);c.g.gain.setValueAtTime(c.g.gain.value,t);c.g.gain.linearRampToValueAtTime(0,t+1.4);c.s.stop(t+1.5)}catch(e){}}
function mfStart(mode,n){const ctx=SND.ctx,b=MB[n],t=ctx.currentTime,s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;const loop=MUSF[mode].length===1;s.loop=loop;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+1.4);s.connect(g).connect(MUS.fbus);s.start(t);MF.cur={s,g,mode,end:loop?Infinity:t+b.duration}}
function musTick(){const ctx=SND.ctx;if(!ctx||!SND.on)return;
 if(!MUS.fbus){MUS.fbus=ctx.createGain();MUS.fbus.gain.value=.5;MUS.fbus.connect(SND.master);["navegar1","combate","tension","tormenta","final","navegar2","navegar3"].forEach(musLoad)}
 const want=MUS.want,c=MF.cur,t=ctx.currentTime;
 if(c&&c.mode===want&&c.end-t>1.5)return;
 const n=mfPick(want);
 if(n){mfStop(c,t);mfStart(want,n);if(MUS.bus&&MUS.mode){MUS.bus.gain.setTargetAtTime(0,t,.3);MUS.mode="";MUS.syn=false}return}
 if(c&&c.mode===want)return;
 if(c){mfStop(c,t);MF.cur=null}
 musSynthTick()}
function sndMusic(mode){MUS.want=mode}
setInterval(musTick,60);

function sndHit(kind){if(!SND.on||!SND.ctx)return;const ctx=SND.ctx,t=ctx.currentTime;
 const boom=(at,f,g)=>{const o=ctx.createOscillator();o.type="sine";o.frequency.setValueAtTime(f,t+at);o.frequency.exponentialRampToValueAtTime(30,t+at+.5);const gg=ctx.createGain();gg.gain.setValueAtTime(g,t+at);gg.gain.exponentialRampToValueAtTime(.001,t+at+.8);o.connect(gg).connect(SND.master);o.start(t+at);o.stop(t+at+.9)};
 if(kind==="battle")for(let k=0;k<7;k++)boom(k*.28+Math.random()*.1,90+Math.random()*40,.9);
 if(kind==="drum")[0,.5,1,1.25,1.5].forEach(a=>boom(a,70,.6));
 if(kind==="erupt")for(let k=0;k<10;k++)boom(k*.2,45,.8);
 if(kind==="cannon")boom(0,95+Math.random()*30,.8);
 if(kind==="splash"||kind==="steps"){const n=kind==="splash"?.7:.12;const len=Math.floor(ctx.sampleRate*n);const bf=ctx.createBuffer(1,len,ctx.sampleRate);const d=bf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,kind==="splash"?1.5:3);const src=ctx.createBufferSource();src.buffer=bf;const fl=ctx.createBiquadFilter();fl.type="lowpass";fl.frequency.value=kind==="splash"?1400:500;const g=ctx.createGain();g.gain.value=kind==="splash"?.5:.15;src.connect(fl).connect(g).connect(SND.master);src.start(t)}
 if(kind==="cheer"){for(let k=0;k<5;k++){const o=ctx.createOscillator();o.type="sawtooth";const f0=220+Math.random()*160;o.frequency.setValueAtTime(f0,t+k*.05);o.frequency.linearRampToValueAtTime(f0*1.5,t+k*.05+.35);const fl=ctx.createBiquadFilter();fl.type="bandpass";fl.frequency.value=900;fl.Q.value=2;const g=ctx.createGain();g.gain.setValueAtTime(.0001,t+k*.05);g.gain.exponentialRampToValueAtTime(.05,t+k*.05+.08);g.gain.exponentialRampToValueAtTime(.0001,t+k*.05+.9);o.connect(fl).connect(g).connect(SND.master);o.start(t+k*.05);o.stop(t+k*.05+1)}}
 if(kind==="clang"){[1800,2400,3100].forEach(f=>{const o=ctx.createOscillator();o.type="square";o.frequency.value=f*(.9+Math.random()*.2);const g=ctx.createGain();g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.connect(g).connect(SND.master);o.start(t);o.stop(t+.3)})}
 if(kind==="treasure"||kind==="chest"){[523,659,784,1046].forEach((f,k)=>{const o=ctx.createOscillator();o.type="triangle";o.frequency.value=f;const g=ctx.createGain();g.gain.setValueAtTime(.0001,t+k*.12);g.gain.exponentialRampToValueAtTime(.18,t+k*.12+.02);g.gain.exponentialRampToValueAtTime(.0001,t+k*.12+1.2);o.connect(g).connect(SND.master);o.start(t+k*.12);o.stop(t+k*.12+1.3)})}}
$("bLog").onclick=()=>showLog(true);
{const b=document.createElement("button");b.id="bSnd";$("bMap").parentElement.appendChild(b);let pref=null;try{pref=localStorage.getItem("archi-snd")}catch(e){}
 const want=pref!==null?pref==="1":Net.isHost;b.textContent=want?"Sonido: sí":"Sonido: no";SND.want=want;
 b.onclick=()=>sndSet(!SND.on);
 // los navegadores solo dejan sonar tras un toque
 if(want){const go=()=>{sndSet(true);removeEventListener("pointerdown",go);removeEventListener("keydown",go)};addEventListener("pointerdown",go);addEventListener("keydown",go)}}

// ---------- intro ----------
{const st=document.createElement("style");st.textContent=`.intro{position:fixed;inset:0;z-index:9;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;font-family:"IM Fell English SC",Georgia,serif;color:#f3e6c8;text-shadow:0 2px 18px #000,0 0 40px rgba(0,0,0,.8);text-align:center;padding:16px}
.intro .t{font-size:clamp(44px,9vw,110px);letter-spacing:.08em;opacity:0;animation:inT 6.5s ease forwards}
.intro .s{font-family:"IM Fell English",Georgia,serif;font-style:italic;font-size:clamp(17px,2.4vw,26px);color:#e8d8b0;opacity:0;animation:inT 6.5s ease .9s forwards;max-width:760px}
.intro .k{font-size:14px;letter-spacing:.35em;color:#e0b45a;opacity:0;animation:inT 6.5s ease .3s forwards}
@keyframes inT{0%{opacity:0;transform:translateY(10px)}18%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}
body.intro-on .hud,body.intro-on .orders,body.intro-on .hand{opacity:0!important;pointer-events:none}`;document.head.appendChild(st)}
const introEl=document.createElement("div");introEl.className="intro";
if(introK<1){document.body.classList.add("intro-on","sailing");const c=CAPDESC[me().cap||0];introEl.innerHTML=`<div class="k">RONDA ${GS.round} · ${GS.np} PIRATAS</div><div class="t">Archipiélago</div><div class="s">${esc(c)} leva anclas y se adentra en la niebla. Las islas del archipiélago no tienen dueño… todavía. Y no eres el único que las quiere.</div>`;document.body.appendChild(introEl)}
function introDone(){document.body.classList.remove("intro-on","sailing");introEl.remove();rcard("ÓRDENES SECRETAS","Ronda "+GS.round);setTimeout(()=>note(`Eres ${me().name}: ${CAPDESC[me().cap||0]}. Arrastra para mirar alrededor. Cada ronda: elige acciones, traza la ruta en el mapa (M) y confirma tus órdenes antes de que acabe el tiempo.`,12),900)}
// ---------- bucle ----------
let sailT=0,sailDone=null;const SAILDUR=3.6;
const fadeMats=[];scene.traverse(o=>{if(o.material&&o.material.uniforms&&o.material.uniforms.uFD)fadeMats.push(o.material)});
const DTMAX=+(QS.get("dtmax")||.05);const clock=new THREE.Clock();let T=0,frames=0,fpsAcc=0,fpsN=0,lowAuto=false;const tmp=new THREE.Vector3();
function placeShips(dt){SHIPS.forEach((s,i)=>{const u=s.userData;if(u.from){u.t=Math.min(1,u.t+dt/SAILDUR);const k=u.t<.5?2*u.t*u.t:1-Math.pow(-2*u.t+2,2)/2;
  const a=new THREE.Vector3(u.from.x,0,u.from.z),b=new THREE.Vector3(u.to.x,0,u.to.z);u.pos.copy(a).lerp(b,k);const d=b.clone().sub(a);if(d.lengthSq()>1){const want=Math.atan2(-d.z,d.x);let dh=want-u.heading;dh=Math.atan2(Math.sin(dh),Math.cos(dh));u.heading+=dh*Math.min(1,dt*2);if(i===myIdx)u.wheel.rotation.x=dh*2}
  if(u.t>=1)u.from=null}
  s.position.set(u.pos.x+(i===myIdx?0:u.off.x),Math.sin(T*.9+i)*.18-(u.dip||0),u.pos.z+(i===myIdx?0:u.off.z));const sk=u.shk||0;s.rotation.set(Math.sin(T*.55+i)*.025+sk*Math.sin(T*9+i)*.07,u.heading+(u.spin||0),Math.sin(T*.7+i)*.035+sk*Math.sin(T*7.3+i)*.09)});
 if(sailDone){sailT+=dt;if(sailT>=SAILDUR+.1)sailDone()}}
function frame(){const dt=Math.min(clock.getDelta(),DTMAX);T+=dt;anim.forEach(f=>f(T,dt));placeShips(dt);
 if(!myShip.userData.from)myShip.userData.wheel.rotation.x=Math.sin(T*.4)*.15;
 const sp=myShip.userData.pos;
 yaw+=(yawT-yaw)*Math.min(1,dt*8);pitch+=(pitchT-pitch)*Math.min(1,dt*8);thirdPerson(dt);if(Math.abs(camera.fov-fovT)>.05){camera.fov+=(fovT-camera.fov)*Math.min(1,dt*7);camera.updateProjectionMatrix()}
 scene.fog.density+=((introK<1?THREE.MathUtils.lerp(.0045,fogT,Math.pow(introK,2.2)):fogT)-scene.fog.density)*Math.min(1,dt*4);fadeMats.forEach(m=>m.uniforms.uFD.value=scene.fog.density);
 mist.children.forEach(s=>{s.userData.a+=s.userData.v*dt;s.position.set(sp.x+Math.cos(s.userData.a)*s.userData.r,s.userData.h,sp.z+Math.sin(s.userData.a)*s.userData.r);s.material.opacity=s.userData.o*Math.min(1,(s.userData.r-20)/25)*(spy?.35:1)});
 key1.position.copy(sp).add(tmp.set(-60,90,40));key1.target.position.copy(sp);dome.position.copy(sp);
 for(let i=fxs.length-1;i>=0;i--){const f=fxs[i];f.t+=dt;const k=f.t/f.life;f.s.scale.setScalar(f.sz*(1+k*2));f.s.position.y+=dt*2;f.s.material.opacity=.9*(1-k);if(k>=1){scene.remove(f.s);f.s.material.dispose();fxs.splice(i,1)}}
 flash.intensity*=Math.pow(.02,dt);flash.position.copy(sp).add(tmp.set(0,10,0));
 if((frames&15)===0)updateVisibility();
 camera.getWorldDirection(tmp);const brg=Math.atan2(tmp.x,-tmp.z);$("strip").style.left=(-((brg/(2*Math.PI))*16*40+16*40)+$("strip").parentElement.clientWidth/2-20)+"px";
 if(noteT>0){noteT-=dt;if(noteT<=0)$("note").classList.remove("show")}
 renderer.render(scene,camera);frames++;if(frames===40)window.__ready=true;
 fpsAcc+=clock.elapsedTime*0+dt;fpsN++;if(fpsAcc>=1){const fps=Math.round(fpsN/fpsAcc);$("fps").textContent=fps+" fps";
  // si va lento, baja la calidad sola
  if(fps<40&&!lowAuto&&frames>200){lowAuto=true;renderer.setPixelRatio(1);renderer.shadowMap.enabled=false;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true});mist.children.slice(50).forEach(s=>s.visible=false)}
  fpsAcc=0;fpsN=0}
 if(!window.__manual)requestAnimationFrame(frame)}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});


// ---------- modelos 3D de Tripo (solo en ordenador) ----------
let deckLow=null,ownCapX=-7;const CLIPL=[new THREE.Plane(new THREE.Vector3(1,0,0),5.6),new THREE.Plane(new THREE.Vector3(0,-1,0),0)],CLIP=[new THREE.Plane(),new THREE.Plane()];
const CAPH=+(QS.get('caph')||3.1),CAPY=1.5;
const SHIPDEF={galeon:{f:"barco-galeon",s:16,ry:Math.PI/2,y:-1.2,capx:-7,flagY:13.2},balandra:{f:"barco-balandra",s:14,ry:-Math.PI/2,y:-1.0,capx:+(QS.get('bcapx')||-4.2),flagY:12.6}};
const GLB=!LOW&&!!THREE.GLTFLoader&&!QS.has("noglb");const GL=GLB?new THREE.GLTFLoader():null;
const mcache={};const get=(n,cb)=>{if(!GL)return;if(!mcache[n])mcache[n]=new Promise(res=>GL.load("modelos/"+n+".glb",g=>{g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material&&o.material.map)o.material.map.anisotropy=4}});res(g.scene)},undefined,()=>res(null)));mcache[n].then(cb)};
function deckOf(def,m){if(def.deck)return def.deck;const g=new THREE.Group();const c=m.clone();c.scale.setScalar(def.s);c.rotation.y=def.ry;c.position.y=def.y;g.add(c);g.updateMatrixWorld(true);
 const rc=new THREE.Raycaster(new THREE.Vector3(def.capx,40,0),new THREE.Vector3(0,-1,0));const hs=rc.intersectObject(g,true).map(h=>h.point.y).filter(y=>y<CAPY+3.5);const top=hs.length?Math.max(...hs):CAPY;const lo=hs.filter(y=>y<top-.6);def.deck={top,low:lo.length?Math.max(...lo):top};return def.deck}
function setShipModel(i){if(!GL)return;const s=SHIPS[i],p=GS.players[i],type=p.ship||"balandra";if(s.userData.model===type)return;s.userData.model=type;const def=SHIPDEF[type];
 get(def.f,m=>{if(!m||s.userData.model!==type)return;if(s.userData.glb)s.remove(s.userData.glb);if(s.userData.cap){s.remove(s.userData.cap);s.userData.cap=null}
  s.children.forEach(c=>{if(c===eye||c.userData.keep)return;if(!(c.isPointLight||c.isSprite))c.visible=false});
  const c=m.clone();c.scale.setScalar(def.s);c.rotation.y=def.ry;c.position.y=def.y;s.add(c);s.userData.glb=c;const d=deckOf(def,m);const own=i===myIdx;let cy=d.top;
  if(own){if(type==="galeon"){renderer.localClippingEnabled=true;c.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.clippingPlanes=CLIP;o.material.clipIntersection=true;o.material.clipShadows=true}});cy=d.low}deckLow=cy;ownCapX=def.capx;
   s.children.forEach(o=>{if(o.isPointLight||o.isSprite)o.position.set(def.capx-.6,cy+2.2,0)})}
  if(!s.userData.flag){const fl=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.5,6,2),std(PCOL[i],{side:THREE.DoubleSide,emissive:C(PCOL[i]),emissiveIntensity:.25}));fl.userData.keep=true;s.add(fl);s.userData.flag=fl;
   anim.push(t=>{const fp=fl.geometry.attributes.position;for(let k=0;k<fp.count;k++){const xx=fp.getX(k)+1.3;fp.setZ(k,Math.sin(t*6-xx*3+i)*.15*xx)}fp.needsUpdate=true})}
  s.userData.flag.position.set(-1,def.flagY,0);
  get(CAPS[p.cap||0].n.toLowerCase(),cm=>{if(!cm||s.userData.model!==type)return;const cp=cm.clone();cp.scale.setScalar(CAPH);cp.position.set(def.capx,cy+.03,0);cp.rotation.y=Math.PI/2;cp.userData.keep=true;s.add(cp);s.userData.cap=cp})})}
if(GL){SHIPS.forEach((s,i)=>setShipModel(i));
 const IMAP={selva:"isla-bosque",lino:"isla-lona",hierro:"isla-hierro",ron:"isla-ron",perlas:"isla-perlas"};
 const HGT={"isla-bosque":.77,"isla-lona":.46,"isla-hierro":.79,"isla-ron":.5,"isla-perlas":.7};const SINK={"isla-ron":.18,"isla-perlas":.28};
 ISL.forEach(o=>{const name=o.port!==undefined?"isla-ron":IMAP[o.t];get(name,m=>{if(!m)return;const G=islandMeshes[key(o.c)];const g=G.children[0];const R=g.userData.R;
  const c=m.clone();const sc=2.6*R/.98;c.scale.setScalar(sc);c.position.y=-(SINK[name]||.04)*HGT[name]*sc;G.add(c);g.visible=false;G.userData.glb=c;placeColonies();placePorts()})})}
// volcán de Tripo (si carga, sustituye al generado)
if(GL&&!QS.has("volproc"))get("isla-volcan",m=>{if(!m)return;const c=m.clone();const W=+(QS.get("volw")||78),HY=+(QS.get("volh")||1);c.scale.set(W,W*HY,W);c.position.set(VOL.x,-1.5,VOL.z);c.rotation.y=VOL.q*1.3;
 c.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace("#include <fog_fragment>","#ifdef USE_FOG\nfloat vfd=fogDensity*.3;float vf=1.0-exp(-vfd*vfd*fogDepth*fogDepth);gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor*.8,vf);\n#endif")}}});
 scene.add(c);const V=window.VOLG;V.children.forEach(o=>{if(o.isMesh)o.visible=false});
 const bb=new THREE.Box3().setFromObject(c);V.position.y=bb.max.y-11.5*K+2});
// ---------- colonias ----------
const colPlaced={};
function islandTop(k,dx=3,dz=3){const G=islandMeshes[k];const c=CM[k];G.updateMatrixWorld(true);const vis=o=>{for(let x=o;x;x=x.parent)if(!x.visible)return false;return true};
 const rc=new THREE.Raycaster(new THREE.Vector3(c.x+dx,200,c.z+dz),new THREE.Vector3(0,-1,0));const h=rc.intersectObject(G,true).filter(h=>vis(h.object))[0];return h?h.point:new THREE.Vector3(c.x+dx,6,c.z+dz)}
function placeColonies(){Object.entries(GS.terr||{}).forEach(([k,T])=>{const F=(GS.fort||{})[k]||[];const BL=GS.players.map((p,o)=>(GS.bld||{})[k+"|"+o]||{});const sig=T.join(",")+"|"+F.join(",")+"|"+JSON.stringify(BL);if(colPlaced[k]===sig)return;const G=islandMeshes[k];if(!G)return;
 if(GL&&!G.userData.glb&&ISLMAP[k])return;// espera a que cargue la isla
 if(G.userData.col)scene.remove(G.userData.col);colPlaced[k]=sig;const grp=new THREE.Group();scene.add(grp);G.userData.col=grp;const c=CM[k],o=ISLMAP[k];const R=((G.children[0].userData.R)||1)*K;
 T.forEach((ow,si)=>{if(ow<0)return;const a=(si/T.length)*6.283+.7+(c.q*1.7+c.r)%3,rr=T.length>1?R*.5:0;const at=islandTop(k,Math.cos(a)*rr,Math.sin(a)*rr);const g=new THREE.Group();g.position.copy(at);g.rotation.y=-a;grp.add(g);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,8,6),std("#3b2a1a"));pole.position.y=4;g.add(pole);const fl=new THREE.Mesh(new THREE.PlaneGeometry(2.8,1.6),std(PCOL[ow],{side:THREE.DoubleSide,emissive:C(PCOL[ow]),emissiveIntensity:.45}));fl.position.set(1.4,7.1,0);g.add(fl);
  const put=(n,w,x,z)=>get(n,m=>{if(!m)return;const c2=m.clone();const bb=new THREE.Box3().setFromObject(c2);const ww=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)||1;c2.scale.setScalar(w/ww);c2.position.set(x,-bb.min.y*w/ww-.2,z);g.add(c2)});
  if(GL){put("colonia",8,-2.5,-1);if(F[si])put("fuerte",9,3.5,2.5)}
  else{const cm=colony(PCOL[ow]);cm.scale.setScalar(K*1.2);g.add(cm);if(F[si]){const t=new THREE.Mesh(new THREE.CylinderGeometry(1.6,2,4,8),std("#6a625a"));t.position.set(3,2,2);g.add(t)}}});
 // edificios de cada dueño en la isla
 BL.forEach((b,ow)=>{if(!Object.keys(b).length)return;const si=T.indexOf(ow);if(si<0)return;const a=(si/T.length)*6.283+.7+(c.q*1.7+c.r)%3+(T.length>1?.9:0);
  const spot=(da,rf)=>{const aa=a+da,rr=R*rf;const at=islandTop(k,Math.cos(aa)*rr,Math.sin(aa)*rr);const g=new THREE.Group();g.position.copy(at);g.rotation.y=-aa;grp.add(g);return g};
  const put=(g,n,w)=>get(n,m=>{if(!m)return;const c2=m.clone();const bb=new THREE.Box3().setFromObject(c2);const ww=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)||1;c2.scale.setScalar(w/ww);c2.position.y=-bb.min.y*w/ww-.2;g.add(c2)});
  const box=(g,w,h,col)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),std(col));m.position.y=h/2;g.add(m)};
  if(b.almacen){const g=spot(.5,.35);if(GL)put(g,"almacen",6);else box(g,3,2.4,"#8a6a44")}
  if(b.muelle){const g=spot(-.4,.85);if(GL)put(g,"puerto",10);else box(g,5,.6,"#6b4a2a")}
  if(b.torre){const g=spot(1.1,.25);const t=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.5,11,8),std("#7d746a",{roughness:.95}));t.position.y=5.5;g.add(t);const r=new THREE.Mesh(new THREE.ConeGeometry(1.8,2.4,8),std("#4a2a1a"));r.position.y=12.2;g.add(r);
   const f=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,color:C("#ffb040"),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));f.scale.set(5,5,1);f.position.y=10;g.add(f)}
  if(b.patrulla){const g=new THREE.Group();grp.add(g);const rr=R*1.55;const ph=ow*1.7;
   if(GL)get("barco-balandra",m=>{if(!m)return;const s2=m.clone();s2.scale.setScalar(6);s2.rotation.y=-Math.PI/2;g.add(s2)});else{const h=new THREE.Mesh(new THREE.BoxGeometry(5,1.4,1.8),std("#5a3a22"));h.position.y=.6;g.add(h)}
   const fl=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1),std(PCOL[ow],{side:THREE.DoubleSide,emissive:C(PCOL[ow]),emissiveIntensity:.5}));fl.position.set(0,6.5,0);g.add(fl);
   anim.push(t=>{if(!g.parent||!g.parent.parent)return;const aa=ph+t*.06;g.position.set(c.x+Math.cos(aa)*rr,Math.sin(t*1.3)*.2,c.z+Math.sin(aa)*rr);g.rotation.y=-aa-Math.PI})}})})}

// ---------- arranque ----------
{const c=cellOf(me().cell);yawT=yaw=Math.atan2(-(VOL.z-c.z),VOL.x-c.x)-myShip.userData.heading;pitchT=pitch=.02}
// ================= ABORDAJE INTERACTIVO =================
function hostDuel(g,cell){return new Promise(res=>{const P=H.G.players;const id=Math.random().toString(36).slice(2,8);const D={};const need=new Set(g.filter(i=>!P[i].gone));
 const rand=()=>null;g.forEach(i=>{if(!need.has(i))D[i]={z:null,rum:0}});
 const bets={};const done=()=>{if(!H.duel||H.duel.id!==id)return;clearTimeout(H.duel.tid);H.duel=null;H.lastBets=bets;need.forEach(i=>{if(!D[i])D[i]={z:null,rum:0}});Net.toAll({t:"duelEnd",id});res(D)};
 if(!need.size){H.lastBets={};res(D);return}H.duel={id,need,D,done,bets,g,tid:setTimeout(done,23000)};H.lastBets={};
 Net.toAll({t:"duel",id,g,at:[cell.q,cell.r],str:g.map(i=>strengthOf(P[i],0)),rum:g.map(i=>P[i].rum)})})}
function hostDuelBet(i,m){const d=H.duel,P=H.G.players;if(!d||d.id!==m.id||d.g.includes(i)||P[i].gone||P[i].rum<1||!d.g.includes(m.on|0))return;d.bets[i]=m.on|0}
function hostDuelAns(i,m){const d=H.duel;if(!d||d.id!==m.id||!d.need.has(i)||d.D[i])return;d.D[i]={z:Array.isArray(m.z)?m.z:null,rum:Math.max(0,m.rum|0)};if([...d.need].every(j=>d.D[j]))d.done()}
let duelUI=null;const ZONES=[["Proa","⚓"],["Centro","⚔"],["Popa","☠"]];
function showDuel(m){const k=m.g.indexOf(myIdx);if(k<0){const box=document.createElement("div");box.className="duel bet";document.body.appendChild(box);duelUI={id:m.id,box};
  box.innerHTML=`<h2>¡Abordaje en el mar!</h2><div class="s">${m.g.map(i=>`<span style="color:${PCOL[i]}">${esc(GS.players[i].name)}</span> (fuerza ${m.str[m.g.indexOf(i)]})`).join(" contra ")} están repartiendo a su gente por la cubierta.</div><div class="s"><b>Apuesta de taberna:</b> ¿quién gana? Pones 1 ron; si aciertas, te llevas 2.</div><div class="tacs">${m.g.map(i=>`<button data-on="${i}"><b style="color:${PCOL[i]}">${esc(GS.players[i].name)}</b><small>apostar 1 ron</small></button>`).join("")}<button data-on="-1"><b>No apuesto</b><small>solo mirar</small></button></div>`;
  box.querySelectorAll("button[data-on]").forEach(b=>b.onclick=()=>{const on=+b.dataset.on;if(on>=0){if(me().rum<1){note("No te queda ron para apostar.",3);return}Net.toHost({t:"duelBet",id:m.id,on})}box.innerHTML=`<h2>${on>=0?"Apuesta hecha":"A mirar"}</h2><div class="s">${on>=0?`1 ron por ${esc(GS.players[on].name)}.`:""} Esperando a que termine el abordaje…</div>`});return}
 const others=m.g.filter(i=>i!==myIdx);const base=m.str[k],maxR=m.rum[k];let rum=0;const b0=Math.floor(base/3);let z=[b0,base-2*b0,b0];const t0=Date.now();sndHit("drum");if(typeof sndMusic==="function")sndMusic("combate");
 const box=document.createElement("div");box.className="duel";document.body.appendChild(box);duelUI={id:m.id,box};
 const tot=()=>base+rum,left=()=>tot()-z[0]-z[1]-z[2];
 const send=()=>{if(!duelUI||duelUI.id!==m.id)return;if(left()>0)z[1]+=left();Net.toHost({t:"duelAns",id:m.id,z,rum});box.innerHTML=`<h2>Órdenes dadas</h2><div class="s">Proa ${z[0]} · Centro ${z[1]} · Popa ${z[2]} (${rum} de ron). Esperando al rival…</div>`;clearInterval(iv)};
 const draw=()=>{const sec=Math.max(0,23-Math.round((Date.now()-t0)/1000));if(sec<=0){send();return}
  box.innerHTML=`<h2>¡ABORDAJE contra ${others.map(i=>`<span style="color:${PCOL[i]}">${esc(GS.players[i].name)}</span>`).join(" y ")}!</h2>
  <div class="s">Reparte en secreto tu gente por la cubierta. En cada zona gana quien ponga más; quien gane 2 de las 3 zonas gana el abordaje. · ${sec}s</div>
  <div class="s">Tu fuerza ${base} · ${others.map(i=>`la de ${esc(GS.players[i].name)}: ${m.str[m.g.indexOf(i)]}`).join(" · ")} (sin contar el ron que meta)</div>
  <div class="rum"><span>Ron a la tripulación (se gasta, suma fuerza):</span><button data-r="-1">−</button><b>${rum}</b><button data-r="1">+</button><span class="s">tienes ${maxR}</span></div>
  <div class="zones">${ZONES.map(([n,ic],q)=>`<div class="zone"><div class="ic">${ic}</div><b>${n}</b><div class="zv"><button data-z="${q}" data-d="-1">−</button><span>${z[q]}</span><button data-z="${q}" data-d="1">+</button></div></div>`).join("")}</div>
  <div class="s">${left()>0?`Te quedan <b>${left()}</b> por repartir`:"Todo repartido"}</div><button class="pri go">Confirmar</button>`;
  box.querySelectorAll("button[data-r]").forEach(b=>b.onclick=()=>{const d=+b.dataset.r;if(d<0&&rum>0){rum--;if(left()<0){const q=[0,1,2].sort((a,b)=>z[b]-z[a])[0];z[q]--}}if(d>0&&rum<maxR)rum++;draw()});
  box.querySelectorAll("button[data-z]").forEach(b=>b.onclick=()=>{const q=+b.dataset.z,d=+b.dataset.d;if(d>0&&left()>0)z[q]++;if(d<0&&z[q]>0)z[q]--;draw()});box.querySelector(".go").onclick=send};
 const iv=setInterval(()=>{if(duelUI&&duelUI.id===m.id&&box.querySelector(".go"))draw()},1000);draw()}
{const st=document.createElement("style");st.textContent=`.duel{position:fixed;z-index:40;left:50%;top:50%;transform:translate(-50%,-50%);width:min(720px,94vw);background:rgba(18,10,6,.95);border:2px solid #b8452f;border-radius:16px;padding:18px 20px;color:#f3e6c8;font-family:"IM Fell English",Georgia,serif;text-align:center;box-shadow:0 10px 50px #000}
.duel h2{margin:0 0 6px;font-family:"IM Fell English SC",Georgia,serif;font-weight:normal;font-size:28px;color:#f0c070}.duel .s{font-size:14px;opacity:.85;margin:4px 0}
.duel .tacs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}.duel .tacs button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;border-radius:12px;background:#24160c;border:2px solid rgba(224,180,90,.3);color:#f3e6c8;font:inherit;cursor:pointer}
.duel .tacs button.on{border-color:#f0c070;background:#4a2a12;box-shadow:0 0 14px #f0c07066}.duel .tacs .ic{font-size:34px}.duel .tacs b{font-size:19px}.duel .tacs small{font-size:12.5px;opacity:.8}
.duel .rum{display:flex;align-items:center;justify-content:center;gap:10px;margin:6px 0 10px;font-size:16px}.duel .rum button{width:38px;height:38px;border-radius:50%;font-size:20px}.duel .rum b{font-size:24px;min-width:28px}
.duel .go{margin-top:8px;padding:10px 30px;font-size:18px}.duel .zones{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:10px 0}.duel .zone{background:#24160c;border:2px solid rgba(224,180,90,.3);border-radius:12px;padding:10px 6px}.duel .zone .ic{font-size:30px}.duel .zone b{font-size:18px;display:block}.duel .zv{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:6px}.duel .zv span{font-size:28px;min-width:30px;color:#f0c070}.duel .zv button{width:36px;height:36px;border-radius:50%;font-size:20px}@media (max-width:560px){.duel .tacs{grid-template-columns:1fr}}`;document.head.appendChild(st)}
// ================= FASE DE COLOCACIÓN: puertos y primer territorio, por turnos en serpiente =================
const draftWho=G=>G.draft.order[G.draft.step];
const portStep=G=>G.draft.step<G.players.length;
function portScore(o){const ns=ISL.filter(x=>x.port===undefined&&cdist(x.c,o.c)<=2);return new Set(ns.map(x=>x.t)).size*2+ns.length}
function terrOpts(G,i){const pc=PORTS.find(o=>(G.portOwner||[])[o.port]===i);if(!pc)return[];return ISL.filter(o=>o.port===undefined&&cdist(o.c,pc.c)<=2&&(G.terr[key(o.c)]||[]).includes(-1)).sort((a,b)=>cdist(a.c,pc.c)-cdist(b.c,pc.c)).map(o=>key(o.c))}
function hostDraftArm(){const G=H.G;if(!G||G.phase!=="place")return;clearTimeout(H.dtid);const who=G.players[draftWho(G)];G.draft.left=60;Net.toAll({t:"state",G});H.dtid=setTimeout(hostAutoPick,who.gone?1500:61000)}
function hostAutoPick(){const G=H.G;if(!G||G.phase!=="place")return;const i=draftWho(G);
 if(portStep(G)){const free=PORTS.filter(o=>G.portOwner[o.port]<0).sort((a,b)=>portScore(b)-portScore(a));if(free[0])hostPlace(i,{k:key(free[0].c)},true)}
 else{const op=terrOpts(G,i);if(op[0])hostPlace(i,{k:op[0]},true);else{G.draft.step++;hostDraftNext()}}}
function hostPlace(i,m,auto){const G=H.G;if(!G||G.phase!=="place"||draftWho(G)!==i)return;const o=ISLMAP[m.k];if(!o)return;const p=G.players[i];let txt;
 if(portStep(G)){if(o.port===undefined||G.portOwner[o.port]>=0)return;G.portOwner[o.port]=i;const s=START[o.port];p.cell=[s.q,s.r];p.home=p.cell.slice();p.placed=1;txt=`${p.name} elige su puerto${auto?" (se le acabó el tiempo)":""}.`}
 else{if(!terrOpts(G,i).includes(m.k))return;const T=G.terr[m.k];T[T.indexOf(-1)]=i;p.placed=2;const mats=new Set([TMAT[o.t]]);neighbors(o.c).forEach(n=>{const x=ISLMAP[key(n)];if(x&&x.port===undefined)mats.add(TMAT[x.t])});mats.forEach(mm=>addStock(p,mm,1));p.fame=famOf(G,i);
  txt=`${p.name} planta su primera bandera${auto?" (se le acabó el tiempo)":""} y se lleva ${[...mats].map(mm=>MATS.find(x=>x[0]===mm)[1].toLowerCase()).join(", ")}.`}
 Net.toAll({t:"placed",i,txt});G.draft.step++;hostDraftNext()}
function hostDraftNext(){const G=H.G;clearTimeout(H.dtid);if(G.draft.step>=G.draft.order.length){G.phase="orders";G.draft=null;G.players.forEach(p=>{if(!p.placed)p.placed=2});Net.toAll({t:"state",G});hostArmTimer(12);return}hostDraftArm()}
// ---------- puertos en 3D: muelle y bandera del dueño ----------
function placePorts(){PORTS.forEach(o=>{const G=islandMeshes[key(o.c)];if(!G||G.userData.portOwner===o.home)return;if(GL&&!G.userData.glb)return;G.userData.portOwner=o.home;if(G.userData.portDeco){scene.remove(G.userData.portDeco)}if(o.home===undefined)return;
 const grp=new THREE.Group();scene.add(grp);G.userData.portDeco=grp;const c=CM[key(o.c)];const toC=new THREE.Vector3(-c.x,0,-c.z).normalize();const R=((G.children[0].userData.R)||1)*K;
 const at=islandTop(key(o.c),toC.x*R*.35,toC.z*R*.35);const g=new THREE.Group();g.position.copy(at);g.rotation.y=Math.atan2(toC.x,toC.z);grp.add(g);
 if(GL)get("puerto",m=>{if(!m)return;const c2=m.clone();const bb=new THREE.Box3().setFromObject(c2);const w=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)||1;c2.scale.setScalar(11/w);c2.position.y=-bb.min.y*11/w-.3;g.add(c2)});
 else{const cm=colony(PCOL[o.home]);cm.scale.setScalar(K*1.2);g.add(cm)}
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,10,6),std("#3b2a1a"));pole.position.set(-3,5,0);g.add(pole);const fl=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2),std(PCOL[o.home],{side:THREE.DoubleSide,emissive:C(PCOL[o.home]),emissiveIntensity:.45}));fl.position.set(-1.3,9,0);g.add(fl)})}
// ---------- cliente: pantalla de colocación ----------
let placeT0=0,wasPlace=false;
const plb=document.createElement("div");plb.className="placeb";plb.hidden=true;document.body.appendChild(plb);
{const st=document.createElement("style");st.textContent=`.placeb{position:fixed;z-index:30;top:10px;left:50%;transform:translateX(-50%);background:rgba(20,12,6,.88);border:1px solid rgba(224,180,90,.5);border-radius:12px;padding:10px 18px;color:#f3e6c8;font-family:"IM Fell English",Georgia,serif;text-align:center;max-width:92vw;box-shadow:0 6px 24px #000a}.placeb b{color:#e0b45a}.placeb .t{font-size:22px}.placeb .s{font-size:14px;opacity:.85;margin-top:3px}.placeb.me{border-color:#e0b45a;box-shadow:0 0 0 2px #e0b45a55,0 6px 24px #000a}`;document.head.appendChild(st)}
function placeInfo(){if(GS.phase!=="place"||!GS.draft){plb.hidden=true;return}const i=GS.draft.order[GS.draft.step],p=GS.players[i];const mine=i===myIdx,port=GS.draft.step<GS.players.length;
 const left=Math.max(0,Math.ceil((GS.draft.left||60)-(Date.now()-placeT0)/1000));plb.hidden=false;plb.classList.toggle("me",mine);
 plb.innerHTML=`<div class="t">${mine?`<b>Te toca:</b> ${port?"elige tu puerto de salida":"elige tu primer territorio (a 2 casillas o menos de tu puerto)"}`:`Turno de <b style="color:${PCOL[i]}">${esc(p.name)}</b>: ${port?"elige puerto":"elige territorio"}`} · ${left}s</div><div class="s">Colocación en serpiente: ${GS.draft.order.map((j,n)=>`<span style="color:${PCOL[j]};${n===GS.draft.step?"text-decoration:underline;font-weight:bold":n<GS.draft.step?"opacity:.45":""}">${esc(GS.players[j].name)}</span>`).join(" → ")}</div>`}
setInterval(placeInfo,500);
function placeOpts(){if(GS.phase!=="place"||!GS.draft||GS.draft.order[GS.draft.step]!==myIdx)return[];return GS.draft.step<GS.players.length?PORTS.filter(o=>GS.portOwner[o.port]<0):terrOpts(GS,myIdx).map(k=>ISLMAP[k])}
let seenBak=null;
function showPlace(){placeT0=Date.now();wasPlace=true;if(!seenBak){seenBak=new Set(seen);CELLS.forEach(c=>seen.add(key(c)))}PORTS.forEach(o=>reveal(o.c,2));myShip.visible=!!me().placed;updateVisibility();toggleMap(true);drawMap();placeInfo();showDice()}
function endPlace(){wasPlace=false;plb.hidden=true;diceEl.hidden=true;if(seenBak){seen.clear();seenBak.forEach(k=>seen.add(k));seenBak=null}myShip.visible=true;snapShips();reveal(cellOf(me().home),1);toggleMap(false);armDeadline(GS.timer?GS.timer*60+12:0);sndHit("drum");
 note(`¡Todos en su puerto! Empieza la ronda 1. Tu primer territorio ya produce. Abre Acciones (A) y traza tu ruta en el mapa (M).`,10)}

// ---------- tirada de dados para el orden de colocación ----------
const diceEl=document.createElement("div");diceEl.className="dicebox";diceEl.hidden=true;document.body.appendChild(diceEl);let diceShown=false;
{const st=document.createElement("style");st.textContent=`.dicebox{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,rgba(20,12,6,.72),rgba(0,0,0,.9));font-family:"IM Fell English",Georgia,serif;color:#f3e6c8;cursor:pointer}
.dicebox .in{background:rgba(28,18,10,.94);border:1px solid rgba(224,180,90,.55);border-radius:18px;padding:22px 30px;min-width:min(560px,92vw);max-width:92vw;box-shadow:0 10px 50px #000}
.dicebox h2{font-family:"IM Fell English SC",Georgia,serif;font-weight:normal;margin:0 0 4px;text-align:center;font-size:30px;color:#e0b45a}.dicebox .sub{text-align:center;opacity:.8;margin-bottom:16px}
.drow{display:flex;align-items:center;gap:14px;padding:8px 10px;border-radius:12px;transition:all .5s}.drow .nm{flex:1;font-size:21px}.drow .sum{font-size:28px;width:44px;text-align:right;color:#e0b45a;opacity:0;transition:opacity .3s}.drow.done .sum{opacity:1}.drow .ds{display:flex;gap:7px;align-items:center}.drow .tie{font-size:13px;opacity:.7;margin:0 4px}
.drow.me{background:rgba(224,180,90,.12)}.drow .pos{font-size:22px;width:34px;color:#e0b45a}
.die{width:38px;height:38px;border-radius:8px;background:linear-gradient(145deg,#fbf3df,#d9c9a3);box-shadow:inset -3px -3px 6px #0003,0 3px 6px #0008;display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:5px;box-sizing:border-box}
.die i{width:7px;height:7px;border-radius:50%;background:#2a1a10;place-self:center;visibility:hidden}.die i.on{visibility:visible}.die.sm{width:28px;height:28px;padding:4px}.die.sm i{width:5px;height:5px}
.die.roll{animation:droll .18s linear infinite}@keyframes droll{0%{transform:rotate(0) translateY(0)}50%{transform:rotate(180deg) translateY(-6px)}100%{transform:rotate(360deg) translateY(0)}}
.dicebox .fin{text-align:center;margin-top:14px;font-size:18px;opacity:0;transition:opacity .5s}.dicebox .fin.on{opacity:1}`;document.head.appendChild(st)}
const PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function dieHTML(v,sm){return `<div class="die${sm?" sm":""}">${Array.from({length:9},(_,k)=>`<i class="${PIPS[v].includes(k)?"on":""}"></i>`).join("")}</div>`}
function setDie(el,v){el.querySelectorAll("i").forEach((p,k)=>p.classList.toggle("on",PIPS[v].includes(k)))}
function showDice(){const D=GS.draft&&GS.draft.dice;if(diceShown||!D)return;diceShown=true;const np=GS.players.length,order=GS.draft.order.slice(0,np);
 diceEl.innerHTML=`<div class="in"><h2>¿Quién elige primero?</h2><div class="sub">Cada capitán tira dos dados. El que más saca elige puerto el primero.</div><div class="rows"></div><div class="fin"></div></div>`;
 const rowsEl=diceEl.querySelector(".rows"),rows={};
 GS.players.forEach((p,i)=>{const r=document.createElement("div");r.className="drow"+(i===myIdx?" me":"");r.innerHTML=`<span class="pos"></span><span class="nm" style="color:${PCOL[i]}">${esc(p.name)}</span><span class="ds">${dieHTML(1)}${dieHTML(1)}</span><span class="sum"></span>`;rowsEl.appendChild(r);rows[i]=r});
 diceEl.hidden=false;const Q=[];const at=(t,f)=>Q.push({t,f});let tt=0,last=performance.now();const tick=()=>{const n=performance.now();tt+=Math.min(n-last,250);last=n;Q.sort((x,y)=>x.t-y.t);while(Q.length&&Q[0].t<=tt)Q.shift().f();if(Q.length)requestAnimationFrame(tick)};
 GS.players.forEach((p,i)=>{const R=D[i]||[[1,1]];const dd=rows[i].querySelectorAll(".ds .die");dd.forEach(d=>d.classList.add("roll"));
  let rolling=true;const spin=()=>{if(!rolling)return;dd.forEach(d=>setDie(d,1+Math.floor(Math.random()*6)));setTimeout(spin,90)};spin();
  at(1600+i*450,()=>{rolling=false;dd.forEach((d,k)=>{d.classList.remove("roll");setDie(d,R[0][k])});rows[i].querySelector(".sum").textContent=R[0][0]+R[0][1];rows[i].classList.add("done");try{sndHit("cannon")}catch(e){}
   if(R.length>1){const ds=rows[i].querySelector(".ds");R.slice(1).forEach((t,n)=>at(1600+i*450+900*(n+1),()=>{ds.insertAdjacentHTML("beforeend",`<span class="tie">empate →</span>${dieHTML(t[0],1)}${dieHTML(t[1],1)}`);rows[i].querySelector(".sum").textContent=t[0]+t[1]}))}})});
 const tEnd=1600+np*450+900*Math.max(0,...GS.players.map((p,i)=>((D[i]||[]).length||1)-1))+500;
 at(tEnd,()=>{const h=rowsEl.offsetHeight;rowsEl.style.position="relative";rowsEl.style.height=h+"px";const rh=h/np;
  GS.players.forEach((p,i)=>{rows[i].style.position="absolute";rows[i].style.left=0;rows[i].style.right=0;rows[i].style.top=(i*rh)+"px"});
  requestAnimationFrame(()=>order.forEach((i,n)=>{rows[i].style.top=(n*rh)+"px";rows[i].querySelector(".pos").textContent=(n+1)+"º"}));
  const f=diceEl.querySelector(".fin");f.innerHTML=`Eligen puerto en este orden. Después, <b>a la inversa</b>, cada uno elige su primera isla: <b style="color:${PCOL[order[np-1]]}">${esc(GS.players[order[np-1]].name)}</b> repite.`;f.classList.add("on");try{sndHit("drum")}catch(e){}
  at(tEnd+6000,()=>{diceEl.hidden=true})});requestAnimationFrame(tick);
 diceEl.onclick=()=>{if(diceEl.querySelector(".fin.on"))diceEl.hidden=true}}

snapShips();renderOrders();requestAnimationFrame(frame);placePorts();if(GS.phase==="place")setTimeout(showPlace,1500);
if(introK>=1)introDone();
if(0)setTimeout(()=>note(`Eres ${me().name}: ${CAPDESC[me().cap||0]}. Al fondo, el humo del volcán: allí está el tesoro. Abre el mapa (M) para trazar tu ruta y confirma tus órdenes.`,12),1200);
window.restartWorld=()=>location.reload();
if(QS.has("shot"))window.__G=()=>({GS,myIdx,seen:seen.size});

// ================= CINEMÁTICAS Y EFECTOS (abordajes, asaltos, sucesos) =================
const cine={on:false,blend:0,p:new THREE.Vector3(),l:new THREE.Vector3(),cp:new THREE.Vector3(),cl:new THREE.Vector3(),shake:0};
function cineTo(pos,look,snap){if(!cine.on||snap){cine.cp.copy(snap?pos:camera.position);camera.getWorldDirection(tmp);cine.cl.copy(snap?look:camera.position.clone().add(tmp.multiplyScalar(30)))}cine.on=true;cine.p.copy(pos);cine.l.copy(look)}
function cineOff(){cine.on=false}
const _cn=new THREE.Vector3(),_cl=new THREE.Vector3();
function cineCam(dt){cine.blend+=((cine.on?1:0)-cine.blend)*Math.min(1,dt*2.2);
 if(cine.blend>.002){const k=1-Math.exp(-dt*2.4);cine.cp.lerp(cine.p,k);cine.cl.lerp(cine.l,k);
  camera.getWorldDirection(_cl);_cl.multiplyScalar(30).add(camera.position);_cn.copy(camera.position).lerp(cine.cp,cine.blend);_cl.lerp(cine.cl,cine.blend);camera.position.copy(_cn);camera.lookAt(_cl)}
 if(cine.shake>.01){camera.position.x+=(Math.random()-.5)*cine.shake;camera.position.y+=(Math.random()-.5)*cine.shake;cine.shake*=Math.pow(.05,dt)}}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const shipPos=i=>SHIPS[i].position.clone();
// mezcladores de animación de los capitanes animados
const mixers=[];anim.push((t,dt)=>{for(const m of mixers)m.update(dt||.016)});
// capa de destellos a pantalla completa
const flashOv=document.createElement("div");flashOv.style.cssText="position:fixed;inset:0;z-index:3;pointer-events:none;background:#fff;opacity:0;transition:opacity .25s";document.body.appendChild(flashOv);
function screenFlash(col,o,ms){flashOv.style.transition="none";flashOv.style.background=col;flashOv.style.opacity=o;void flashOv.offsetWidth;flashOv.style.transition=`opacity ${ms||400}ms`;flashOv.style.opacity=0}

// ---------- bala de cañón con estela ----------
const ballMat=new THREE.MeshBasicMaterial({color:0x111111});const ballGeo=new THREE.SphereGeometry(.35,8,6);
function cannonShot(from,to,hit,onHit){const b=new THREE.Mesh(ballGeo,ballMat);b.position.copy(from);scene.add(b);
 puff(from.x,from.y,from.z,"#ffb060",3.5,.35);puff(from.x,from.y,from.z,"#d8d0c8",6,1.6);flash.position.copy(from);flash.intensity=6;
 const dur=.55+from.distanceTo(to)/90,mid=from.clone().lerp(to,.5);mid.y+=3+from.distanceTo(to)*.08;let t=0;
 const step=(tt,dt)=>{t+=dt||.016;const k=Math.min(1,t/dur);const a=from.clone().lerp(mid,k),c=mid.clone().lerp(to,k);b.position.copy(a.lerp(c,k));if(Math.random()<.5)puff(b.position.x,b.position.y,b.position.z,"#9a928a",1.2,.5);
  if(k>=1){scene.remove(b);const i=anim.indexOf(step);if(i>=0)anim.splice(i,1);
   if(hit){puff(to.x,to.y,to.z,"#ff9040",4,.4);puff(to.x,to.y+1,to.z,"#5a4a40",7,2);debris(to);cine.shake=Math.max(cine.shake,.6)}else{for(let k2=0;k2<6;k2++)puff(to.x+(Math.random()-.5)*2,to.y+k2*.7,to.z+(Math.random()-.5)*2,"#e6f2f4",2.5,.9)}
   onHit&&onHit()}};anim.push(step)}
const dGeo=new THREE.BoxGeometry(.5,.18,.18),dMat=std("#5a3a1e");
function debris(at){for(let i=0;i<7;i++){const d=new THREE.Mesh(dGeo,dMat);d.position.copy(at);scene.add(d);const v=new THREE.Vector3((Math.random()-.5)*10,5+Math.random()*6,(Math.random()-.5)*10);let t=0;
 const f=(tt,dt)=>{dt=dt||.016;t+=dt;v.y-=18*dt;d.position.addScaledVector(v,dt);d.rotation.x+=dt*8;d.rotation.z+=dt*6;if(d.position.y<-.5||t>2.5){scene.remove(d);anim.splice(anim.indexOf(f),1)}};anim.push(f)}}
// punto del costado de un barco (local: x a lo largo, z al costado)
function hullPoint(s,x,side){const v=new THREE.Vector3(x,2.2,side*2.6);s.updateMatrixWorld();return s.localToWorld(v)}

// ---------- tiempo por fotogramas (si la pestaña está oculta, sigue por reloj) ----------
function tween(ms,fn){return new Promise(r=>{let t=0,done=false;const t0=Date.now();
 const end=()=>{if(done)return;done=true;const i=anim.indexOf(f);if(i>=0)anim.splice(i,1);r()};
 const f=(tt,dt)=>{dt=dt||.016;t+=dt;const k=Math.min(1,t*1000/ms);if(fn)fn(t,dt,k);if(k>=1)end()};anim.push(f);
 const iv=setInterval(()=>{if(done)clearInterval(iv);else if(document.hidden&&Date.now()-t0>=ms){clearInterval(iv);if(fn)try{fn(ms/1000,0,1)}catch(e){}end()}},400)})}
const fwait=ms=>tween(ms);
const ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
function splash(at,n){for(let q=0;q<(n||8);q++)puff(at.x+(Math.random()-.5)*2.4,.4+Math.random()*1.6,at.z+(Math.random()-.5)*2.4,"#e9f3f5",1.6+Math.random()*2,.9+Math.random()*.5);sndHit("splash")}
function sparks(at,big){puff(at.x,at.y,at.z,"#ffe080",big?2:1.4,.25);puff(at.x,at.y,at.z,"#fff6d0",.7,.15);flash.position.copy(at);flash.intensity=big?5:3;sndHit("clang")}
const faceTo=(o,from,to)=>{o.rotation.y=Math.atan2(to.x-from.x,to.z-from.z)};

// ---------- capitanes y tripulantes animados ----------
const animCache={};
function animCap(capIdx,cb){animModel(CAPS[capIdx||0].n.toLowerCase()+"-animada",CAPH,cb)}
const CREWN=["tripulante-artillero-animada","tripulante-grumete-animada","tripulante-vigia-animada"];
function animCrew(n,H){return new Promise(r=>animModel(CREWN[n%3],H||CAPH*.92,m=>m?r(m):animModel(CREWN[0],H||CAPH*.92,r)))}
function animModel(n,H,cb){if(!GL||!THREE.SkeletonUtils){cb(null);return}
 if(!animCache[n])animCache[n]=new Promise(res=>GL.load("modelos/"+n+".glb",g=>{g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false}});res(g)},undefined,()=>res(null)));
 animCache[n].then(g=>{if(!g){cb(null);return}const m=THREE.SkeletonUtils.clone(g.scene);const bb=new THREE.Box3().setFromObject(m);const h=(bb.max.y-bb.min.y)||1;m.scale.setScalar(H/h);
  const mx=new THREE.AnimationMixer(m);mixers.push(mx);const clips={};g.animations.forEach(c=>clips[c.name]=c);let cur=null;
  // cambio de animación con fundido, para que no dé saltos
  const play=(name,once,fade)=>{const c=clips[name]||clips.idle;if(!c)return;const a=mx.clipAction(c);if(a===cur&&!once)return;
   a.reset();a.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,Infinity);a.clampWhenFinished=!!once;a.setEffectiveWeight(1);
   if(cur&&cur!==a)a.crossFadeFrom(cur,fade===undefined?.22:fade,false);a.play();cur=a};
  cb({m,play,speed:s=>{mx.timeScale=s},dispose:()=>{mx.stopAllAction();const i=mixers.indexOf(mx);if(i>=0)mixers.splice(i,1);m.parent&&m.parent.remove(m)}})})}
// precarga del capitán propio y de los rivales para que el abordaje no espere
setTimeout(()=>{GS.players.forEach(p=>animCap(p.cap,()=>{}));CREWN.forEach(n=>animModel(n,1,()=>{}))},4000);

// ---------- ABORDAJE ----------
async function fxBattle(e){sndMusic("combate");try{await fxBattle0(e)}finally{sndMusic("navegar")}}
async function fxBattle0(e){const others=(e.with||[]).filter(j=>j!==myIdx);const j=others[0];if(j===undefined)return;
 const A=myShip,Bs=SHIPS[j],ua=A.userData,ub=Bs.userData;const keep={off:ub.off.clone(),hb:ub.heading,vis:Bs.visible};
 // los barcos se ponen costado con costado
 const h=ua.heading;const side=new THREE.Vector3(Math.sin(h),0,Math.cos(h));const fwd=new THREE.Vector3(Math.cos(h),0,-Math.sin(h));
 ub.off.copy(side).multiplyScalar(11.5);ub.heading=h+Math.PI;Bs.visible=true;ub.from=null;ub.pos.copy(ua.pos);fxShow.add(j);
 const mid=A.position.clone().addScaledVector(side,5.75);mid.y=0;
 const camP=mid.clone().addScaledVector(fwd,34);camP.y=13;screenFlash("#000",1,700);cineTo(camP,mid.clone().setY(3),true);
 {const Z=e.tacs&&e.tacs[myIdx]&&e.tacs[j];rcard("¡ABORDAJE!",Z?["Proa","Centro","Popa"].map((n,q)=>`${n} ${e.tacs[myIdx][q]}-${e.tacs[j][q]}`).join(" · "):GS.players[j].name)}sndHit("drum");await fwait(1600);
 // los brulotes se lanzan primero
 const burn=(e.burn||[]).filter(x=>x===myIdx||x===j);for(const b of burn)await fxBrulote(b,b===myIdx?j:myIdx);
 // andanadas
 for(let k=0;k<8;k++){const fromA=k%2===0;const S=fromA?A:Bs,O=fromA?Bs:A;const x=-5+Math.random()*10;const f=hullPoint(S,x,1);const to=hullPoint(O,-5+Math.random()*10,1);to.y=1.5+Math.random()*2;
  const hit=Math.random()<.75;if(!hit)to.addScaledVector(side,fromA?6:-6);cannonShot(f,to,hit);sndHit("cannon");
  const esc=(fleets[fromA?myIdx:j]||[]).filter(x=>!x.dead&&!x.burning&&x.t!=="mercante");if(esc.length){const q=esc[k%esc.length].g;const f2=q.position.clone().setY(2.4);const t2=O.position.clone().add(new THREE.Vector3((Math.random()-.5)*8,1.5+Math.random()*2,(Math.random()-.5)*4));setTimeout(()=>{cannonShot(f2,t2,Math.random()<.7);sndHit("cannon")},150)}
  await fwait(380+Math.random()*250)}
 await fwait(700);
 const won=!e.lost&&!e.txt.startsWith("Abordaje igualado"),tie=e.txt.startsWith("Abordaje igualado");
 const deck=(deckLow!==null?deckLow:CAPY)+.2;const plank=new THREE.Mesh(new THREE.BoxGeometry(1.4,.25,7.5),std("#6b4a2a"));plank.position.copy(mid).setY(deck+.6);plank.rotation.y=h;scene.add(plank);
 const caps=await Promise.all([GS.players[myIdx].cap,GS.players[j].cap].map(c=>new Promise(r=>animCap(c,r))));
 const statics=[ua.cap,ub.cap].filter(Boolean);
 if(caps[0]&&caps[1]){statics.forEach(o=>o.visible=false);
  const crew=await Promise.all([0,1,2,3].map(n=>animCrew(n)));
  await duel(caps,crew,{A,Bs,side,fwd,mid,deck,won,tie});caps.forEach(c=>c.dispose());crew.forEach(c=>c&&c.dispose())}
 else{const camP2=mid.clone().addScaledVector(fwd,12);camP2.y=deck+5;cineTo(camP2,mid.clone().setY(deck+2.2));for(let k=0;k<5;k++){await fwait(400);sparks(mid.clone().setY(deck+2.4))}await fwait(800)}
 statics.forEach(o=>o.visible=true);scene.remove(plank);
 ub.off.copy(keep.off);ub.heading=keep.hb;fxShow.delete(j);Bs.visible=keep.vis;cineOff()}

// duelo coreografiado: avanzan y retroceden por la plancha, los golpes empujan, la cámara gira y el que pierde cae al agua
async function duel(caps,crew,o){const {A,Bs,side,fwd,mid,deck,won,tie}=o;const [ca,cb]=caps;
 const S=[{s:-2.2,tg:-1.8,y:0,v:0,off:0,ov:0,c:ca,d:1},{s:2.2,tg:1.8,y:0,v:0,off:0,ov:0,c:cb,d:-1}];
 scene.add(ca.m);scene.add(cb.m);ca.play("slash");cb.play("slash");ca.speed(1.05);cb.speed(.95);
 let T=0,camA=0,fell=null;const pos=new THREE.Vector3();
 const place=(st,dt)=>{st.s+=(st.tg-st.s)*Math.min(1,dt*10);st.v-=24*dt;st.y=Math.max(st.fell?-9:0,st.y+st.v*dt);if(st.y===0)st.v=Math.max(0,st.v);
  st.off+=st.ov*dt;pos.copy(mid).addScaledVector(side,st.s).addScaledVector(fwd,st.off);st.c.m.position.copy(pos).setY(deck+.75+st.y);
  if(!st.fell)st.c.m.rotation.set(0,Math.atan2(side.x*st.d,side.z*st.d)+Math.sin(T*3+st.d)*.12,0)};
 // tripulantes: dos se quedan en cubierta y dos saltan al barco enemigo colgados de un cabo
 const crewSt=crew.map((c,n)=>{if(!c)return null;const own=n<2?A:Bs,oth=n<2?Bs:A;own.updateMatrixWorld();const p0=own.localToWorld(new THREE.Vector3(n%2?-4:4,0,1.3)).setY(deck+.1);
  const d=n<2?side:side.clone().negate();c.m.position.copy(p0);c.m.rotation.y=Math.atan2(d.x,d.z);scene.add(c.m);c.play(n%2?"slash":"cheer");c.speed(.85+Math.random()*.3);
  return {c,p0,own,oth,d,swing:n%2===0?{at:n<2?.9:2.1,dur:1.1}:null,landed:false}});
 const camF=(tt,dt)=>{dt=dt||.016;T+=dt;S.forEach(st=>place(st,dt));
  crewSt.forEach(cs=>{if(!cs||!cs.swing)return;const w=cs.swing;const k=(T-w.at)/w.dur;if(k<0)return;
   if(!w.p1){cs.oth.updateMatrixWorld();w.p1=cs.oth.localToWorld(new THREE.Vector3((Math.random()-.5)*5,0,.6)).setY(deck+.1);cs.c.play("jump",true,.1)}
   if(k<1){const q=ease(k);cs.c.m.position.copy(cs.p0).lerp(w.p1,q);cs.c.m.position.y+=Math.sin(k*Math.PI)*4.2}
   else if(!cs.landed){cs.landed=true;cs.c.m.position.copy(w.p1);cs.c.play("slash");sndHit("steps")}});
  // cámara que gira despacio alrededor de los dos capitanes
  camA=Math.sin(T*.42)*.55;const cen=mid.clone().addScaledVector(side,(S[0].s+S[1].s)/2).setY(deck+2);const r=10.5+Math.sin(T*.6)*1.2;
  const cp=cen.clone().addScaledVector(fwd,Math.cos(camA)*r).addScaledVector(side,Math.sin(camA)*r);cp.y=deck+3.6+Math.sin(T*.5)*.9;
  if(fell){cen.copy(fell);cen.y=Math.max(0,cen.y)+1;cp.copy(cen).addScaledVector(fwd,9).add(new THREE.Vector3(0,5,0)).addScaledVector(side,-2)}
  cineTo(cp,cen)};
 cineTo(mid.clone().addScaledVector(fwd,11).setY(deck+4),mid.clone().setY(deck+2));anim.push(camF);
 const clamp=v=>Math.max(-3.1,Math.min(3.1,v));
 // golpe: el que ataca se lanza, el otro recula; a veces el que defiende salta hacia atrás
 const beat=async(ai,push,dodge,big)=>{const a=S[ai],b=S[1-ai];const dir=a.d;
  a.c.play("slash",true,.08);a.tg=clamp(a.tg+dir*1.1);b.tg=clamp(b.tg+dir*push);if(Math.abs(a.tg-b.tg)<1.5)a.tg=b.tg-dir*1.5;
  if(dodge){b.c.play("jump",true,.1);b.v=7;b.tg=clamp(b.tg+dir*.9)}
  await fwait(210);const cp=mid.clone().addScaledVector(side,(a.s+b.s)/2).setY(deck+2.5);sparks(cp,big);cine.shake=big?.5:.22;
  await fwait(190);a.c.play("slash");if(dodge)b.c.play("slash");a.tg=clamp(a.tg-dir*.35);await fwait(170+Math.random()*120)};
 const W=tie?-1:won?0:1;
 const seq=[[0,.5],[1,.6],[0,.4,true],[1,.7],[1,.4],[0,.8,true],[1,.5],[0,.6]];
 for(const [ai,p,dg] of seq)await beat(ai,p,dg);
 if(tie){S[0].tg=-2.6;S[1].tg=2.6;S.forEach(st=>{st.v=6;st.c.play("idle")});await fwait(1600)}
 else{const L=1-W;// el ganador acorrala al otro hasta el borde de la plancha
  await beat(W,.9);await beat(W,1);await beat(W,1.1,false,true);
  const st=S[L];st.c.play("fall",true,.1);st.fell=true;st.v=5;st.ov=(Math.random()<.5?-1:1)*3.2;cine.shake=.6;sndHit("cheer");
  const wn=S[W];wn.c.play("cheer");wn.tg=clamp(wn.tg+wn.d*.6);
  let splashed=false;await tween(1400,(t,dt)=>{st.c.m.rotation.z+=dt*st.ov*.5;const wy=deck+.75+st.y;fell=st.c.m.position.clone();
   if(!splashed&&wy<.3){splashed=true;splash(st.c.m.position,12);st.ov=0}if(splashed)st.c.m.visible=false});
  fell=null;await fwait(900)}
 crewSt.forEach((cs,n)=>{if(!cs)return;const mine=(n<2)===(W===0);cs.c.play(tie?"idle":mine?"cheer":"fall",!tie&&!mine)});
 await fwait(1700);const i=anim.indexOf(camF);if(i>=0)anim.splice(i,1);crewSt.forEach(cs=>cs&&cs.c.m.position.set(0,-50,0))}

// ---------- DESEMBARCO: un bote lleva a la tripulación a la playa, luchan y plantan la bandera ----------
function rowBoat(col){const g=new THREE.Group();const wood=std("#6b4526",{roughness:.9}),dark=std("#3e2614",{roughness:.95});
 const hull=new THREE.Mesh(new THREE.BoxGeometry(1.7,.6,3.4),wood);hull.position.set(0,.3,-.2);g.add(hull);
 const bow=new THREE.Mesh(new THREE.ConeGeometry(1.2,1.6,4),wood);bow.rotation.set(Math.PI/2,0,Math.PI/4);bow.scale.set(1,1,.42);bow.position.set(0,.36,2.3);g.add(bow);
 const rim=new THREE.Mesh(new THREE.BoxGeometry(1.85,.14,3.5),dark);rim.position.set(0,.64,-.2);g.add(rim);
 [-.9,.3].forEach(z=>{const b=new THREE.Mesh(new THREE.BoxGeometry(1.6,.08,.3),dark);b.position.set(0,.55,z);g.add(b)});
 const oars=[];[-1,1].forEach(sd=>{const o=new THREE.Group();const sh=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.8,5),wood);sh.rotation.z=Math.PI/2;sh.position.x=sd*1.3;o.add(sh);const bl=new THREE.Mesh(new THREE.BoxGeometry(.6,.05,.3),wood);bl.position.x=sd*2.6;o.add(bl);o.position.set(sd*.85,.7,0);o.rotation.z=sd*.25;g.add(o);oars.push(o)});
 const pl=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.8,4),dark);pl.position.set(0,1.5,-1.8);g.add(pl);
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(.9,.55),std(col,{side:THREE.DoubleSide,emissive:C(col),emissiveIntensity:.4}));fl.rotation.y=Math.PI/2;fl.position.set(0,2.1,-2.25);g.add(fl);
 g.userData.oars=oars;return g}
function groundAt(k,x,z){const G=islandMeshes[k];if(!G)return null;G.updateMatrixWorld(true);const vis=o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true};
 const rc=new THREE.Raycaster(new THREE.Vector3(x,200,z),new THREE.Vector3(0,-1,0));const h=rc.intersectObject(G,true).filter(h=>vis(h.object))[0];return h?h.point:null}
// alturas del terreno desde la orilla hacia dentro, para que caminen pegados al suelo
function shorePath(k,isl,from){const d=from.clone().sub(isl).setY(0);const L=d.length();d.normalize();let beach=null;
 for(let r=Math.min(L-2,60);r>0;r-=.8){const p=groundAt(k,isl.x+d.x*r,isl.z+d.z*r);if(p&&p.y>.35){beach=r;break}}if(beach===null)beach=8;
 const inR=Math.max(2,beach*.4),pts=[];let last=null;for(let r=beach;r>=inR;r-=.6){const p=groundAt(k,isl.x+d.x*r,isl.z+d.z*r)||(last?last.clone():isl.clone().addScaledVector(d,r).setY(1));if(last&&p.y-last.y>1.6)break;pts.push(p);last=p}
 while(pts.length<2)pts.push(isl.clone().addScaledVector(d,beach-pts.length).setY(1));
 return {d,beach,pts,water:isl.clone().addScaledVector(d,beach+1.4).setY(0)}}
const along=(pts,u)=>{const f=Math.max(0,Math.min(pts.length-1.001,u*(pts.length-1)));const i=Math.floor(f);return pts[i].clone().lerp(pts[i+1],f-i)};
async function fxLanding(o){// o: {at, atk, def(-1 si no hay dueño), win (ganan los atacantes), n tripulantes}
 if(!GL||!THREE.SkeletonUtils)return;const c=cellOf(o.at);const k=key(c);if(!islandMeshes[k])return;const isl=new THREE.Vector3(c.x,0,c.z);
 const sh=SHIPS[o.atk];const from=sh&&sh.visible?sh.position.clone():isl.clone().add(new THREE.Vector3(34,0,12));
 const P=shorePath(k,isl,from);const perp=new THREE.Vector3(-P.d.z,0,P.d.x);
 const n=o.n||3;const atk=await Promise.all(Array.from({length:n},(_,q)=>animCrew(q)));if(atk.some(a=>!a)){atk.forEach(a=>a&&a.dispose());return}
 const defs=o.def>=0?await Promise.all([1,2].map(q=>animCrew(q))):[];
 const boat=rowBoat(PCOL[o.atk]);boat.scale.setScalar(1.25);scene.add(boat);const b0=from.clone().addScaledVector(P.d,-6).setY(0);const b1=P.water.clone();boat.position.copy(b0);faceTo(boat,b0,b1);
 atk.forEach((a,q)=>{scene.add(a.m);a.play("idle");a.speed(.9+q*.1)});
 const seat=q=>{boat.updateMatrixWorld();return boat.localToWorld(new THREE.Vector3((q%2?-.35:.35),.6,-1.2+q*1.1))};
 // los defensores esperan arriba
 const top=P.pts[P.pts.length-1];defs.forEach((d,q)=>{if(!d)return;scene.add(d.m);d.m.position.copy(top).addScaledVector(perp,(q?1:-1)*1.4);faceTo(d.m,d.m.position,P.pts[0]);d.play("idle")});
 // cámara de costado siguiendo al bote
 const camAt=p=>p.clone().addScaledVector(perp,10).addScaledVector(P.d,5).add(new THREE.Vector3(0,4.5,0));
 if(!cine.on)screenFlash("#000",1,700);cineTo(camAt(b0),b0.clone().setY(1.5),!cine.on);
 await tween(3400,(t,dt,kk)=>{const q=ease(kk);boat.position.copy(b0).lerp(b1,q);boat.position.y=Math.sin(t*3)*.12;boat.rotation.z=Math.sin(t*2.2)*.05;
  boat.userData.oars.forEach((oa,si)=>{oa.rotation.y=Math.sin(t*5.5)*.5*(si?1:-1);oa.rotation.z=Math.cos(t*5.5)*.18*(si?-1:1)});
  atk.forEach((a,qq)=>{a.m.position.copy(seat(qq));a.m.rotation.y=boat.rotation.y});if(Math.random()<.3)puff(boat.position.x,.3,boat.position.z,"#e9f3f5",1,.6);
  cineTo(camAt(boat.position),boat.position.clone().lerp(P.pts[0],.3).setY(1.8))});
 // saltan del bote a la playa
 for(let q=0;q<n;q++){const a=atk[q];a.play("jump",true,.1);const p0=a.m.position.clone();const p1=P.pts[0].clone().addScaledVector(perp,(q-(n-1)/2)*1.3);
  tween(650,(t,dt,kk)=>{a.m.position.copy(p0).lerp(p1,kk);a.m.position.y+=Math.sin(kk*Math.PI)*1.6;faceTo(a.m,p0,p1)}).then(()=>{a.play("run");sndHit("steps")});await fwait(260)}
 await fwait(500);splash(P.water,5);
 // carrera cuesta arriba
 const stopU=defs.length?.78:1;const L=P.pts.length*.6;const runMs=Math.max(1600,L/5*1000);
 const camRun=()=>{const m=along(P.pts,.55);return [m.clone().addScaledVector(perp,9).addScaledVector(P.d,4).add(new THREE.Vector3(0,4.5,0)),m.clone().setY(m.y+1.5)]};
 {const [cp,cl]=camRun();cineTo(cp,cl)}
 if(defs.length)defs.forEach(d=>d&&d.play("run"));
 await tween(runMs,(t,dt,kk)=>{atk.forEach((a,q)=>{const u=Math.max(0,kk*stopU-q*.04);const p=along(P.pts,u).addScaledVector(perp,(q-(n-1)/2)*1.3);faceTo(a.m,a.m.position,p);a.m.position.copy(p)});
  defs.forEach((d,q)=>{if(!d)return;const u=1-.12*Math.min(1,kk*1.4);const p=along(P.pts,u).addScaledVector(perp,(q?1:-1)*1.4);d.m.position.copy(p);faceTo(d.m,p,P.pts[0])})});
 const fp=along(P.pts,defs.length?.84:1);
 if(defs.length){// pelea en la ladera
  atk.forEach(a=>a.play("slash"));defs.forEach(d=>d&&d.play("slash"));
  const ring=fp.clone();let T=0;const camF=(tt,dt)=>{T+=dt||.016;const an=T*.35;cineTo(ring.clone().add(new THREE.Vector3(Math.cos(an)*10,5,Math.sin(an)*10)),ring.clone().setY(ring.y+1.4))};anim.push(camF);
  for(let b=0;b<7;b++){const a=atk[b%n],d=defs[b%defs.length];if(d){const pa=a.m.position.clone(),pd=d.m.position.clone();const dir=pd.clone().sub(pa).setY(0).normalize();
    a.m.position.addScaledVector(dir,.5);d.m.position.addScaledVector(dir,.35);sparks(pa.clone().lerp(pd,.5).setY(pa.y+1.6),b===6);cine.shake=.2}
   await fwait(380)}
  if(o.win){defs.forEach(d=>d&&d.play("fall",true,.1));atk.forEach(a=>a.play("cheer"))}else{atk.forEach((a,q)=>a.play(q?"fall":"run",!!q,.1));defs.forEach(d=>d&&d.play("cheer"))}
  await fwait(1300);anim.splice(anim.indexOf(camF),1)}
 if(o.win){// bandera nueva que sube por el mástil
  const g=new THREE.Group();g.position.copy(fp).addScaledVector(P.d,-1.2);scene.add(g);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,6,6),std("#3b2a1a"));pole.position.y=3;g.add(pole);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.3),std(PCOL[o.atk],{side:THREE.DoubleSide,emissive:C(PCOL[o.atk]),emissiveIntensity:.5}));fl.position.set(1.1,.8,0);g.add(fl);
  cineTo(g.position.clone().addScaledVector(perp,9).addScaledVector(P.d,4).add(new THREE.Vector3(0,4,0)),g.position.clone().setY(g.position.y+3.2));
  atk.forEach((a,q)=>{a.play(q===0?"lift_heavy":"cheer");faceTo(a.m,a.m.position,g.position)});sndHit("cheer");
  await tween(1800,(t,dt,kk)=>{fl.position.y=.8+ease(kk)*4.6;fl.rotation.y=Math.sin(t*4)*.25;fl.scale.x=1+Math.sin(t*7)*.05});atk[0].play("cheer");sndHit("chest");await fwait(1200);scene.remove(g)}
 else await fwait(900);
 atk.forEach(a=>a.dispose());defs.forEach(d=>d&&d.dispose());scene.remove(boat)}

// ---------- ASALTO a un territorio ----------
async function fxAssault(e){sndMusic("combate");try{await fxAssault0(e)}finally{sndMusic("navegar")}}
async function fxAssault0(e){const c=cellOf(e.at);const isl=new THREE.Vector3(c.x,0,c.z);const me_=myShip.position.clone();const def=e.def;
 const shipP=def&&e.who!==undefined&&SHIPS[e.who].visible?SHIPS[e.who].position.clone():def?isl.clone().add(new THREE.Vector3(30,0,10)):me_;
 const camP=shipP.clone().lerp(isl,.5).add(new THREE.Vector3(0,38,0));const off=new THREE.Vector3(isl.z-shipP.z,0,shipP.x-isl.x).normalize().multiplyScalar(85);camP.add(off);cineTo(camP,shipP.clone().lerp(isl,.6).setY(4));
 rcard(def?"¡TE ASALTAN!":"¡AL ASALTO!",def?"Defiende tu isla":"Tu territorio");sndHit("drum");await fwait(1400);
 const top=islandTop(key(c),0,0);
 for(let k=0;k<7;k++){const from=shipP.clone().add(new THREE.Vector3((Math.random()-.5)*6,2.2,(Math.random()-.5)*6));const to=top.clone().add(new THREE.Vector3((Math.random()-.5)*10,Math.random()*2,(Math.random()-.5)*10));
  cannonShot(from,to,true);sndHit("cannon");await fwait(330);if(e.fort&&k%2){cannonShot(top.clone().add(new THREE.Vector3(0,3,0)),from.clone().add(new THREE.Vector3((Math.random()-.5)*8,0,(Math.random()-.5)*8)),Math.random()<.5);sndHit("cannon")}}
 await fwait(900);
 // desembarco
 const atkI=def?e.who:myIdx;const T=(GS.terr||{})[key(c)]||[];const owner=def?myIdx:T.find(o=>o>=0&&o!==myIdx);
 if(atkI!==undefined)try{await fxLanding({at:e.at,atk:atkI,def:owner===undefined?0:owner,win:def?!e.win:e.win,n:3})}catch(err){console.warn(err)}
 cineOff()}

// ---------- SUCESOS DEL MAR ----------
// partículas que caen (lluvia o ceniza) alrededor de la cámara
function fallFx(col,n,speed,len,dur){const g=new THREE.BufferGeometry();const P=new Float32Array(n*6);const base=[];for(let i=0;i<n;i++)base.push([(Math.random()-.5)*120,Math.random()*60,(Math.random()-.5)*120]);g.setAttribute("position",new THREE.BufferAttribute(P,3));
 const ls=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:C(col),transparent:true,opacity:.8,fog:false}));scene.add(ls);let t=0;
 const f=(tt,dt)=>{dt=dt||.016;t+=dt;const cp=camera.position;for(let i=0;i<n;i++){const b=base[i];b[1]-=speed*dt;if(b[1]<-5)b[1]+=60;const x=cp.x+b[0],y=cp.y-15+b[1],z=cp.z+b[2];P[i*6]=x;P[i*6+1]=y;P[i*6+2]=z;P[i*6+3]=x+len*.15;P[i*6+4]=y+len;P[i*6+5]=z}g.attributes.position.needsUpdate=true;
  ls.material.opacity=.8*Math.min(1,t/1,(dur-t)/1);if(t>=dur){scene.remove(ls);g.dispose();anim.splice(anim.indexOf(f),1)}};anim.push(f)}
function fogPulse(col,dens,dur){const fc=scene.fog.color.clone(),tc=C(col),f0=fogT;fogT=dens;let t=0;const f=(tt,dt)=>{t+=dt||.016;const k=Math.min(1,t/1.2,Math.max(0,(dur-t)/1.5));scene.fog.color.copy(fc).lerp(tc,k);if(t>=dur){scene.fog.color.copy(fc);fogT=f0;anim.splice(anim.indexOf(f),1)}};anim.push(f)}
function floatModels(name,n,rad,dur,scale){const g=new THREE.Group();scene.add(g);const c=myShip.position;get(name,m=>{if(!m)return;for(let i=0;i<n;i++){const o=m.clone();const bb=new THREE.Box3().setFromObject(o);const w=Math.max(bb.max.x-bb.min.x,bb.max.y-bb.min.y)||1;o.scale.setScalar(scale/w);const a=i/n*6.28+Math.random(),r=rad*(.6+Math.random()*.6);o.userData.a=a;o.userData.r=r;o.position.set(c.x+Math.cos(a)*r,-.3,c.z+Math.sin(a)*r);g.add(o)}});
 let t=0;const f=(tt,dt)=>{t+=dt||.016;g.children.forEach((o,i)=>{o.position.y=-.3+Math.sin(tt*1.4+i)*.25-(t>dur-1.5?(t-dur+1.5)*2:0);o.rotation.y+=.003;o.rotation.z=Math.sin(tt+i)*.15});if(t>=dur){scene.remove(g);anim.splice(anim.indexOf(f),1)}};anim.push(f)}
function overview(dist,hgt){const p=myShip.position;const h=myShip.userData.heading+yaw;cineTo(new THREE.Vector3(p.x-Math.cos(h)*dist,hgt,p.z+Math.sin(h)*dist),p.clone().setY(3))}
async function fxKraken(i){const s=SHIPS[i];if(!s.visible&&i!==myIdx)return;const u=s.userData;const p=s.position.clone();const h=u.heading;const side=new THREE.Vector3(Math.sin(h),0,Math.cos(h));
 const fwd=new THREE.Vector3(Math.cos(h),0,-Math.sin(h));cineTo(p.clone().addScaledVector(side,-34).addScaledVector(fwd,-14).add(new THREE.Vector3(0,14,0)),p.clone().addScaledVector(side,7).setY(7),true);screenFlash("#000",1,600);sndHit("erupt");await wait(800);
 const g=new THREE.Group();g.position.copy(p).addScaledVector(side,13);g.position.y=-30;scene.add(g);
 if(GL)get("kraken",m=>{if(!m)return;const o=m.clone();const bb=new THREE.Box3().setFromObject(o);o.scale.setScalar(26/((bb.max.y-bb.min.y)||1));g.add(o)});
 else{for(let k=0;k<6;k++){const t=new THREE.Mesh(new THREE.ConeGeometry(1,16,6),std("#4a2a4a"));t.position.set(Math.cos(k)*4,8,Math.sin(k)*4);t.rotation.z=(k-2.5)*.15;g.add(t)}}
 let t=0;const f=(tt,dt)=>{t+=dt||.016;g.position.y=t<1.6?-30+30*(t/1.6):t<4.6?-1+Math.sin(t*3)*.6:-1-(t-4.6)*20;g.rotation.y=Math.sin(t*1.5)*.3;u.shk=t<4.6&&t>1?1:0;if(t>1.2&&t<4.5&&Math.random()<.2){const q=p.clone().add(new THREE.Vector3((Math.random()-.5)*14,0,(Math.random()-.5)*14));puff(q.x,.5,q.z,"#e6f2f4",4,1)}
  if(t>6.2){scene.remove(g);u.shk=0;anim.splice(anim.indexOf(f),1)}};anim.push(f);cine.shake=.8;screenFlash("#000",.4,1200);await wait(6200);cineOff()}
async function fxWhirl(i){const s=SHIPS[i];if(!s.visible&&i!==myIdx)return;const u=s.userData;const p=s.position.clone();
 const cv=document.createElement("canvas");cv.width=cv.height=256;const x=cv.getContext("2d");x.translate(128,128);for(let k=0;k<7;k++){x.strokeStyle=`rgba(230,245,248,${.5-k*.05})`;x.lineWidth=7-k*.6;x.beginPath();for(let a=0;a<12;a+=.1){const r=4+a*9.6;x.lineTo(Math.cos(a+k*.9)*r,Math.sin(a+k*.9)*r)}x.stroke()}
 const tex=new THREE.CanvasTexture(cv);const d=new THREE.Mesh(new THREE.CircleGeometry(26,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:0}));d.position.copy(p).setY(.35);scene.add(d);
 cineTo(p.clone().add(new THREE.Vector3(26,30,26)),p.clone());let t=0;const f=(tt,dt)=>{dt=dt||.016;t+=dt;d.rotation.y-=dt*(1.5+t*.6);d.material.opacity=Math.min(.9,t*.6,Math.max(0,(5.8-t)*.8));u.spin=(u.spin||0)+dt*Math.min(3,t*.8);u.dip=Math.min(6,Math.max(0,t-2)*2.2);
  if(t>6){scene.remove(d);tex.dispose();u.spin=0;u.dip=0;anim.splice(anim.indexOf(f),1)}};anim.push(f);await wait(6000);cineOff()}
async function fxErupt(){sndMusic("tormenta");try{await fxErupt0()}finally{sndMusic("navegar")}}
async function fxErupt0(){const p=myShip.position.clone();const v=new THREE.Vector3(VOL.x,0,VOL.z);const dir=p.clone().sub(v).setY(0).normalize();
 cineTo(v.clone().addScaledVector(dir,170).setY(40),v.clone().setY(45));sndHit("erupt");await wait(1200);eruptFx();cine.shake=1.2;screenFlash("#ff7a30",.35,900);
 const topY=(window.VOLG?window.VOLG.position.y:0)+11.5*K;
 for(let k=0;k<22;k++){const to=v.clone().add(new THREE.Vector3((Math.random()-.5)*140,0,(Math.random()-.5)*140));const from=v.clone().setY(topY);
  const b=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,color:C("#ff7a20"),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false}));b.scale.set(6,6,1);scene.add(b);
  const mid=from.clone().lerp(to,.5);mid.y+=40+Math.random()*40;let t=0;const dur=1.6+Math.random();const f=(tt,dt)=>{t+=dt||.016;const q=Math.min(1,t/dur);const a=from.clone().lerp(mid,q),c=mid.clone().lerp(to,q);b.position.copy(a.lerp(c,q));if(Math.random()<.6)puff(b.position.x,b.position.y,b.position.z,"#4a3a36",5,1.4);
   if(q>=1){scene.remove(b);puff(to.x,1,to.z,"#e6f2f4",8,1.2);anim.splice(anim.indexOf(f),1)}};anim.push(f);if(k%4===0)sndHit("cannon");await wait(140)}
 await wait(2400);cineOff()}
async function fxSea(e){if([0,2,4,5,6,7].includes(e.kind))sndMusic("tormenta");try{await fxSea0(e)}finally{sndMusic("navegar")}}
async function fxSea0(e){const k=e.kind;
 if(k===5){overview(62,22);{const g=new THREE.Group();scene.add(g);const cp=myShip.position;get("tormenta",m=>{if(!m)return;for(let n=0;n<4;n++){const o=m.clone();o.scale.setScalar(70+n*10);const a=n*1.6+yaw;o.position.set(cp.x+Math.cos(a)*(60+n*25),30+n*6,cp.z+Math.sin(a)*(60+n*25));o.rotation.y=a;g.add(o)}});setTimeout(()=>scene.remove(g),7200)}fogPulse("#0b0f14",.05,7);fallFx("#d4dee6",LOW?700:2600,80,3,7);for(let n=0;n<4;n++){setTimeout(()=>{screenFlash("#e8f0ff",.75,500);flash.position.copy(camera.position).add(new THREE.Vector3(0,40,0));flash.intensity=40;sndHit("cannon")},800+n*1500)}SHIPS.forEach(s=>s.userData.shk=.6);await wait(6800);SHIPS.forEach(s=>s.userData.shk=0);cineOff();return}
 if(k===2){overview(40,16);fogPulse("#3a2418",.045,6.5);fallFx("#5a524e",LOW?400:1100,14,.5,6.5);await wait(6300);cineOff();return}
 if(k===0){overview(36,12);fogPulse("#26302e",.04,6);fallFx("#cfd8da",LOW?200:600,8,.3,6);SHIPS.forEach(s=>s.userData.shk=1);for(let n=0;n<30;n++)setTimeout(()=>{const q=camera.position;puff(q.x+(Math.random()-.5)*60,2+Math.random()*10,q.z+(Math.random()-.5)*60,"#e6f2f4",5,1.2)},n*180);await wait(6000);SHIPS.forEach(s=>s.userData.shk=0);cineOff();return}
 if(k===4&&e.who!==undefined){await fxKraken(e.who);return}
 if(k===7&&e.who!==undefined){await fxWhirl(e.who);return}
 if(k===1){overview(30,12);floatModels("barril-ron",9,18,6,2.2);await wait(5500);cineOff();return}
 if(k===3){overview(34,14);floatModels("barco-restos",2,22,6,14);floatModels("caja-madera",5,16,6,2.2);await wait(5500);cineOff();return}
 if(k===6){overview(18,8);cine.shake=.5;screenFlash("#8a1010",.35,800);setTimeout(()=>screenFlash("#8a1010",.3,800),1200);myShip.userData.shk=1;await wait(3200);myShip.userData.shk=0;cineOff();return}}

// ---------- FLOTAS: escoltas que siguen a cada barco ----------
const ESCDEF={bergantin:{f:"barco-bergantin",w:15},goleta:{f:"barco-goleta",w:13},mercante:{f:"barco-mercante",w:12},brulote:{f:"barco-brulote",w:10}};
const ESCSLOT=[[-3,15],[-3,-15],[-15,26]];
const fleets=GS.players.map(()=>[]);
function escortMesh(t,i){const g=new THREE.Group();const D=ESCDEF[t]||ESCDEF.goleta;
 const put=(m,ry)=>{const c=m.clone();const bb=new THREE.Box3().setFromObject(c);const w=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)||1;const sc=D.w/w;c.scale.setScalar(sc);
  // orientar la eslora a lo largo de +X local
  c.rotation.y=ry;c.position.y=-bb.min.y*sc-1.6;g.add(c);g.userData.hull=c};
 if(GL)get(D.f,m=>{if(m)put(m,Math.PI/2);else get("barco-balandra",m2=>{if(!m2)return;put(m2,-Math.PI/2);const tint={bergantin:"#2a1c18",goleta:"#e8dcc0",mercante:"#a07a4a",brulote:"#3a2a20"}[t];g.userData.hull.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.lerp(C(tint),.35)}});g.userData.hull.scale.multiplyScalar({bergantin:1.05,goleta:.9,mercante:1,brulote:.8}[t]||1)})});
 else{const h=new THREE.Mesh(new THREE.BoxGeometry(D.w*.8,1.6,D.w*.25),std("#5a3a22"));h.position.y=.4;g.add(h);const m=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,D.w*.6,5),std("#3b2a1a"));m.position.y=D.w*.3;g.add(m)}
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1),std(PCOL[i],{side:THREE.DoubleSide,emissive:C(PCOL[i]),emissiveIntensity:.35}));fl.position.set(-.6,D.w*.72,0);g.add(fl);g.userData.flag=fl;
 if(t==="brulote"){const sm=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,color:C("#3a3430"),transparent:true,opacity:.55,depthWrite:false}));sm.scale.set(4,4,1);sm.position.y=5;g.add(sm);g.userData.smoke=sm}
 return g}
const _ev=new THREE.Vector3();
function slotPos(i,n,out){const s=SHIPS[i],h=s.userData.heading+(s.userData.spin||0);const [lx,lz]=ESCSLOT[n%3];const c=Math.cos(h),sn=Math.sin(h);
 return out.set(s.position.x+lx*c+lz*sn,0,s.position.z-lx*sn+lz*c)}
function syncFleets(dt){GS.players.forEach((p,i)=>{const want=FL(p),have=fleets[i];
 // barcos que ya no están: se hunden
 for(let n=have.length-1;n>=0;n--){const e=have[n];if(e.dead)continue;const idx=want.filter(t=>t===e.t).length;const cnt=have.filter(x=>!x.dead&&x.t===e.t).length;if(cnt>idx){e.dead=true;e.dt=0}}
 want.forEach(t=>{const cur=have.filter(x=>!x.dead&&x.t===t).length,need=want.filter(x=>x===t).length;if(cur<need){const g=escortMesh(t,i);scene.add(g);const e={t,g,slot:0,h:SHIPS[i].userData.heading};slotPos(i,have.length,g.position);g.position.y=-6;have.push(e)}});
 let slot=0;have.forEach(e=>{const g=e.g;if(e.dead){e.dt+=dt;g.position.y-=dt*1.6;g.rotation.z+=dt*.25;if(e.dt>.2&&Math.random()<.3)puff(g.position.x,.5,g.position.z,"#e9f3f5",3,1);if(e.dt>4){scene.remove(g);have.splice(have.indexOf(e),1)}return}
  if(e.burning)return;slotPos(i,slot++,_ev);const k=Math.min(1,dt*1.5);g.position.x+=(_ev.x-g.position.x)*k;g.position.z+=(_ev.z-g.position.z)*k;g.position.y+=((Math.sin(T*.8+slot)*.18)-g.position.y)*Math.min(1,dt*1.2);
  let dh=SHIPS[i].userData.heading-e.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));e.h+=dh*Math.min(1,dt*1.2);g.rotation.set(Math.sin(T*.6+slot)*.03,e.h,Math.sin(T*.75+slot)*.04);
  g.visible=SHIPS[i].visible;if(g.userData.flag)g.userData.flag.rotation.y=Math.sin(T*3+slot)*.3;if(g.userData.smoke&&Math.random()<.05)puff(g.position.x,6,g.position.z,"#4a4440",3,2)})})}
anim.push((t,dt)=>syncFleets(dt||.016));
// el brulote se lanza en llamas contra el barco enemigo
async function fxBrulote(i,target){const e=fleets[i].find(x=>!x.dead&&x.t==="brulote");if(!e)return;e.burning=true;const g=e.g;const a=g.position.clone(),b=SHIPS[target].position.clone();b.y=0;
 await tween(1800,(t,dt,k)=>{g.position.copy(a).lerp(b,ease(k)*.85);g.rotation.y=Math.atan2(-(b.z-a.z),b.x-a.x);if(Math.random()<.6){puff(g.position.x+(Math.random()-.5)*3,2+Math.random()*4,g.position.z+(Math.random()-.5)*3,"#ff8a30",3,.6);puff(g.position.x,6,g.position.z,"#2a2420",4,1.5)}});
 screenFlash("#ffb060",.6,600);for(let q=0;q<14;q++)puff(g.position.x+(Math.random()-.5)*8,1+Math.random()*8,g.position.z+(Math.random()-.5)*8,q%2?"#ffa040":"#3a302a",5+Math.random()*5,1.2);debris(g.position.clone().setY(2));sndHit("cannon");sndHit("erupt");cine.shake=.8;
 g.visible=false;e.burning=false;e.dead=true;e.dt=3.9}
