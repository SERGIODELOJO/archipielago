// ================= ARCHIPIÉLAGO · mundo (se carga al zarpar) =================
controls.enabled=false;
if(LOW){renderer.setPixelRatio(1);renderer.shadowMap.enabled=false}else renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
seed=GS.seed;
const NP=GS.np;
const HS=22, K=HS/3.2;
const wx=(q,r)=>HS*Math.sqrt(3)*(q+r/2), wz=(q,r)=>HS*1.5*r;
const RAD={1:4,2:5,3:6,4:6,5:7,6:7}[NP];
const cdist=(a,b)=>(Math.abs(a.q-b.q)+Math.abs(a.r-b.r)+Math.abs((a.q+a.r)-(b.q+b.r)))/2;
const key=c=>c.q+","+c.r;
const CELLS=[],CM={};for(let q=-RAD;q<=RAD;q++)for(let r=-RAD;r<=RAD;r++){if(Math.abs(q+r)<=RAD){const c={q,r,x:wx(q,r),z:wz(q,r),d:cdist({q,r},{q:0,r:0})};CELLS.push(c);CM[key(c)]=c}}
const NB=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const neighbors=c=>NB.map(([a,b])=>CM[(c.q+a)+","+(c.r+b)]).filter(Boolean);
const PCOL=GS.players.map(p=>CAPS[p.cap||0].c);
const used=new Set();
const HOMES=[];for(let k=0;k<NP;k++){const a=-Math.PI/2+k*2*Math.PI/NP+rnd()*.3;const W=RAD*HS*Math.sqrt(3);let best=null,bd=1e9;CELLS.filter(c=>c.d===RAD&&!used.has(key(c))).forEach(c=>{const d=(c.x-Math.cos(a)*W)**2+(c.z-Math.sin(a)*W)**2;if(d<bd){bd=d;best=c}});HOMES.push(best);used.add(key(best))}
let VOL=null;{const cs=CELLS.filter(c=>c.d<=RAD-2).map(c=>({c,m:Math.min(...HOMES.map(h=>cdist(h,c)))})).filter(o=>o.m>=Math.max(3,RAD-1));VOL=(cs.length?cs:CELLS.filter(c=>c.d<=1).map(c=>({c})))[Math.floor(rnd()*Math.max(1,cs.length))].c;used.add(key(VOL));neighbors(VOL).forEach(n=>used.add(key(n)))}
const TYPEBAG=["selva","lino","hierro","ron","perlas"];
const ISL=HOMES.map((h,i)=>({c:h,t:i%2?"ron":"selva",s:1.05,home:i}));
{const cand=CELLS.filter(c=>!used.has(key(c))&&!HOMES.some(h=>cdist(h,c)===1));for(let i=cand.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[cand[i],cand[j]]=[cand[j],cand[i]]}
 let ti=0;const target=Math.round(CELLS.length*.25);for(const c of cand){if(ISL.length>=target)break;if(neighbors(c).some(n=>ISL.some(o=>o.c===n))&&rnd()<.8)continue;const t=TYPEBAG[ti++%5];ISL.push({c,t,s:t==="perlas"?.6+rnd()*.2:.75+rnd()*.35})}}
const ISLMAP={};ISL.forEach(o=>ISLMAP[key(o.c)]=o);
const sailable=c=>c&&!ISLMAP[key(c)]&&c!==VOL;
const START=HOMES.map(h=>neighbors(h).filter(sailable).sort((a,b)=>a.d-b.d)[0]);
// el anfitrión fija las casillas de salida
if(Net.isHost&&H.G&&!H.G.players[0].cell){H.G.players.forEach((p,i)=>{p.cell=[START[i].q,START[i].r];p.home=[START[i].q,START[i].r]})}
GS.players.forEach((p,i)=>{if(!p.cell){p.cell=[START[i].q,START[i].r];p.home=[START[i].q,START[i].r]}});
const cellOf=a=>CM[a[0]+","+a[1]];
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
 if(o.home!==undefined){const c=colony(PCOL[o.home]);const R=g.userData.R;c.position.set(R*.15,g.userData.hAt(R*.15,0),0);c.scale.setScalar(1.2);g.add(c)}
 G.scale.setScalar(K);G.position.set(o.c.x,0,o.c.z);G.rotation.y=rnd()*6.28;scene.add(G);islandMeshes[key(o.c)]=G});

// ---------- volcán con columna de humo visible desde lejos ----------
(function(){const vg=new THREE.Group();const N=60,M=96,pos=[],col=[],idx=[];const Rv=3.6,PK=6.5;
 const ash=C("#2a2220"),rk=C("#4a3a33"),grn=C("#3c5a2c"),snd=C("#a98d6a"),hot=C("#8a2208"),tc=new THREE.Color();
 for(let i=0;i<=N;i++)for(let j=0;j<M;j++){const k=i/N,th=j/M*6.283;const co=1+.16*(fbm(Math.cos(th)*1.5+3,Math.sin(th)*1.5)-.5)*2;const r=k*Rv*co;const X=Math.cos(th)*r,Z=Math.sin(th)*r;
  let h=k<.16?PK-1.8*(1-k/.16)*(1-k/.16):k<.92?PK*Math.pow(1-(k-.16)/.76,1.35)+.15:.15-.6*(k-.92)/.08;h+=.4*(fbm(X*.9,Z*.9)-.5)*(1-k);
  const gul=Math.pow(Math.max(0,Math.cos(th*5+fbm(X*.5,Z*.5)*3)),18);h-=gul*.25*(1-k);
  pos.push(X,h,Z);if(h<.25)tc.copy(snd);else if(k>.7)tc.copy(grn).lerp(rk,fbm(X,Z));else tc.copy(rk).lerp(ash,(1-k));if(k<.6&&gul>.5)tc.lerp(hot,.9*(gul-.5)*2*(1-k/.6));if(k<.17)tc.copy(hot).lerp(ash,.4);col.push(tc.r,tc.g,tc.b)}
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*M+j,b=i*M+(j+1)%M,c=(i+1)*M+j,d=(i+1)*M+(j+1)%M;idx.push(a,b,c,b,d,c)}
 const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));geo.setAttribute("color",new THREE.Float32BufferAttribute(col,3));geo.setIndex(idx);geo.computeVertexNormals();
 vg.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95})));
 const lavaT=loader.load("tex/lavatile.jpg");lavaT.wrapS=lavaT.wrapT=THREE.RepeatWrapping;lavaT.encoding=THREE.sRGBEncoding;
 const lava=new THREE.Mesh(new THREE.CircleGeometry(Rv*.17,40).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:lavaT,emissiveMap:lavaT,emissive:C("#ff6a1a"),emissiveIntensity:2.4,color:C("#401005"),fog:false}));lava.position.y=PK-1.6;vg.add(lava);
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
const vistaOf=p=>3+(p.fx&&p.fx.vista?1:0);
const sigiloOf=p=>(p.faroles?0:1)+(p.fx&&p.fx.bruma?9:0);
function sees(a,b,ca,cb){if(a.i===b.i)return true;if(b.hideFrom&&b.hideFrom[a.i]>0)return false;return cdist(ca,cb)<=vistaOf(a)-sigiloOf(b)}
const curCell=i=>{const s=SHIPS[i];return cellAt(s.userData.pos.x,s.userData.pos.z)||cellOf(GS.players[i].cell)};
function cellAt(x,z){const r=z/(HS*1.5),q=x/(HS*Math.sqrt(3))-r/2;let rq=Math.round(q),rr=Math.round(r),rs=Math.round(-q-r);const dq=Math.abs(rq-q),dr=Math.abs(rr-r),ds=Math.abs(rs+q+r);if(dq>dr&&dq>ds)rq=-rr-rs;else if(dr>ds)rr=-rq-rs;return CM[rq+","+rr]}
function updateVisibility(){const m=me(),mc=curCell(myIdx);SHIPS.forEach((s,i)=>{if(i===myIdx)return;const p=GS.players[i];s.visible=!p.gone&&sees(m,p,mc,curCell(i));s.userData.setLamp(p.faroles!==false)})}

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
@media (max-width:760px){.orders{max-width:calc(100% - 32px);bottom:170px}.tr{max-width:60vw}.tr button,.orders button{font-size:13px;padding:7px 11px}.compass{display:none}}
@media (prefers-reduced-motion:reduce){.mapw,.mapw .box,.spy,.lb{transition:none!important}.rcard.show{animation:none}}`;document.head.appendChild(css);
const hud=document.createElement("div");hud.innerHTML=`
<div class="hud tl"><div class="r" id="hRound"></div><div class="score" id="score"></div></div>
<div class="hud compass"><div class="strip" id="strip"></div><div class="tick"></div></div>
<div class="hud tr"><button id="bMap">Mapa</button><button id="bSpy">Catalejo</button><button id="bLamp">Faroles</button></div>
<div class="hud note" id="note"></div>
<div class="orders" id="orders"><span class="lbl" id="oRoute"></span><span class="lbl" id="oCard"></span><button id="oRumM" aria-label="Menos ron">−</button><span class="lbl" id="oRum"></span><button id="oRumP" aria-label="Más ron">+</button><button class="go" id="oGo">Confirmar órdenes</button></div>
<div class="spy" id="spy"></div><div class="lb t"></div><div class="lb b"></div>
<div class="rcard" id="rcard"><div class="a" id="rcA"></div><div class="b" id="rcB"></div></div>
<div class="fps" id="fps"></div>
<div class="mapw" id="mapw"><div class="box"><canvas id="mapc" width="1100" height="860"></canvas></div><div class="bar2"><button id="bClr">Borrar ruta</button><button id="bClose">Listo</button></div></div>`;
document.body.appendChild(hud);
let noteT=0;function note(t,dur=7){$("note").textContent=t;$("note").classList.add("show");noteT=dur}
function rcard(a,b){$("rcA").textContent=a;$("rcB").textContent=b;const c=$("rcard");c.classList.remove("show");void c.offsetWidth;c.classList.add("show")}
function renderScore(){$("hRound").textContent=`RONDA ${GS.round} · FAMA PARA GANAR: ${GS.target}`;
 $("score").innerHTML=GS.players.map((p,i)=>`<div class="${i===myIdx?"me":""} ${p.gone?"gone":""}"><span class="dot" style="background:${PCOL[i]}"></span><span>${esc(p.name)}</span><span>· fama ${p.fame}</span>${i===myIdx?`<span>· ron ${p.rum} · cañones ${p.cannons}</span>`:""}${GS.phase==="orders"&&p.ready?'<span class="ok">listo</span>':""}</div>`).join("")}
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
let route=[],bet=0,prepared=null;const maxRoute=()=>(GS.galerna?2:3)+(prepared&&prepared.id==="viento-a-favor"?2:0);
function renderOrders(){const p=me(),locked=GS.phase!=="orders"||p.ready;
 $("oRoute").textContent=route.length?`Ruta: ${route.length} casilla${route.length>1?"s":""}`:"Sin ruta: te quedas quieto";
 $("oCard").textContent=prepared?"Carta: "+CBY[prepared.id].n+(prepared.target!=null?" → "+GS.players[prepared.target].name:""):"";
 bet=Math.min(bet,p.rum);$("oRum").textContent=`Ron para abordajes: ${bet}`;
 ["oRumM","oRumP","oGo"].forEach(id=>$(id).disabled=locked);
 $("oGo").textContent=p.ready?"Esperando a los demás…":"Confirmar órdenes";renderScore();renderHand()}
$("oRumM").onclick=()=>{bet=Math.max(0,bet-1);renderOrders()};$("oRumP").onclick=()=>{bet=Math.min(me().rum,bet+1);renderOrders()};
$("oGo").onclick=()=>{if(GS.phase!=="orders"||me().ready)return;toggleMap(false);setSpy(false);
 Net.toHost({t:"orders",o:{route:route.map(c=>[c.q,c.r]),card:prepared,bet,faroles}});me().ready=true;renderOrders();note("Órdenes enviadas en secreto. Esperando a los demás capitanes…",6)};

// ---------- mapa personal ----------
const mapc=$("mapc"),mx=mapc.getContext("2d");
const MS=Math.max(34,Math.min(1100/(Math.sqrt(3)*(2*RAD+1)+2),860/(1.5*(2*RAD)+4)));let MC={q:0,r:0};
const mP=c=>[550+MS*Math.sqrt(3)*((c.q-MC.q)+(c.r-MC.r)/2),430+MS*1.5*(c.r-MC.r)];
const parchBase=(()=>{const cv=document.createElement("canvas");cv.width=1100;cv.height=860;const x=cv.getContext("2d");const g=x.createRadialGradient(550,430,100,550,430,700);g.addColorStop(0,"#ead6a6");g.addColorStop(.75,"#d5b780");g.addColorStop(1,"#9c7442");x.fillStyle=g;x.fillRect(0,0,1100,860);
 for(let i=0;i<180;i++){const cx=rnd()*1100,cy=rnd()*860,r=15+rnd()*90;const sg=x.createRadialGradient(cx,cy,0,cx,cy,r);sg.addColorStop(0,`rgba(120,80,30,${.03+rnd()*.05})`);sg.addColorStop(1,"rgba(120,80,30,0)");x.fillStyle=sg;x.fillRect(cx-r,cy-r,2*r,2*r)}
 x.strokeStyle="rgba(70,48,25,.22)";x.lineWidth=2;for(let i=0;i<120;i++){const px=rnd()*1100,py=rnd()*860;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+9,py-7,px+18,py);x.quadraticCurveTo(px+27,py-7,px+36,py);x.stroke()}
 x.font="italic 30px 'IM Fell English',Georgia,serif";x.fillStyle="rgba(70,45,22,.4)";x.textAlign="center";x.fillText("Terra incognita",760,560);x.fillText("Hic sunt dracones",330,700);return cv})();
function hexPath(x,c,sc=1){const [px,py]=mP(c);x.beginPath();for(let i=0;i<=6;i++){const a=Math.PI/6+i*Math.PI/3;const X=px+MS*sc*Math.cos(a),Y=py+MS*sc*Math.sin(a);i?x.lineTo(X,Y):x.moveTo(X,Y)}}
const routeOpts=()=>{if(GS.phase!=="orders"||me().ready||route.length>=maxRoute())return[];const last=route.length?route[route.length-1]:cellOf(me().cell);return neighbors(last).filter(c=>sailable(c)&&!route.includes(c))};
function drawMap(){const x=mx;x.drawImage(parchBase,0,0);const mc=cellOf(me().cell);MC=mc;
 CELLS.forEach(c=>{if(!seen.has(key(c)))return;hexPath(x,c);x.fillStyle="rgba(240,225,190,.5)";x.fill();x.strokeStyle="rgba(80,50,20,.45)";x.lineWidth=1.3;x.stroke();
  const o=ISLMAP[key(c)];if(o){const [px,py]=mP(c);const R=MS*.62*o.s;x.beginPath();for(let j=0;j<=40;j++){const th=j/40*6.283;const k=R*(1+.2*(fbm(Math.cos(th)*1.6+c.q,Math.sin(th)*1.6+c.r)-.5)*2);j?x.lineTo(px+Math.cos(th)*k,py+Math.sin(th)*k):x.moveTo(px+Math.cos(th)*k,py+Math.sin(th)*k)}
   x.fillStyle={selva:"rgba(96,128,60,.6)",lino:"rgba(170,160,80,.55)",hierro:"rgba(110,95,85,.6)",ron:"rgba(130,150,70,.55)",perlas:"rgba(200,170,120,.5)"}[o.t];x.fill();x.strokeStyle="rgba(45,28,12,.9)";x.lineWidth=2;x.stroke();
   if(o.home!==undefined){x.fillStyle=PCOL[o.home];x.fillRect(px-4,py-12,3,14);x.beginPath();x.moveTo(px-1,py-12);x.lineTo(px+10,py-8);x.lineTo(px-1,py-4);x.fill()}
   else if(!me().looted.includes(key(c))){x.fillStyle="rgba(150,30,25,.85)";x.font="bold 16px Georgia";x.textAlign="center";x.fillText("✕",px,py+6)}}
  if(c===VOL){const [px,py]=mP(c);x.fillStyle="rgba(60,30,20,.85)";x.beginPath();x.moveTo(px-14,py+10);x.lineTo(px,py-14);x.lineTo(px+14,py+10);x.fill();x.font="italic 16px Georgia";x.textAlign="center";x.fillText(GS.treasures>0?"tesoro":"saqueado",px,py+28)}});
 if(!seen.has(key(VOL))){const [sx,sy]=mP(mc),[vx,vy]=mP(VOL);const a=Math.atan2(vy-sy,vx-sx);x.save();x.translate(sx,sy);x.rotate(a);x.strokeStyle="rgba(120,30,20,.75)";x.setLineDash([8,7]);x.lineWidth=2.5;x.beginPath();x.moveTo(MS*1.2,0);x.lineTo(MS*4.2,0);x.stroke();x.setLineDash([]);x.fillStyle="rgba(120,30,20,.85)";x.beginPath();x.moveTo(MS*4.6,0);x.lineTo(MS*4,-7);x.lineTo(MS*4,7);x.fill();x.restore();
  x.font="italic 20px 'IM Fell English',Georgia,serif";x.fillStyle="rgba(110,30,20,.9)";x.textAlign="center";x.fillText("humo del volcán",sx+Math.cos(a)*MS*3,sy+Math.sin(a)*MS*3-12)}
 GS.players.forEach((p,i)=>{if(i===myIdx||!SHIPS[i].visible)return;const [px,py]=mP(cellOf(p.cell));x.fillStyle=PCOL[i];x.beginPath();x.arc(px,py,9,0,6.28);x.fill();x.strokeStyle="#2a1a0a";x.lineWidth=2;x.stroke()});
 if(route.length){x.strokeStyle="rgba(150,30,25,.9)";x.lineWidth=4;x.setLineDash([10,7]);x.beginPath();const [a,b]=mP(mc);x.moveTo(a,b);route.forEach(c=>{const [px,py]=mP(c);x.lineTo(px,py)});x.stroke();x.setLineDash([]);route.forEach((c,i)=>{const [px,py]=mP(c);x.fillStyle="rgba(150,30,25,.95)";x.beginPath();x.arc(px,py,5,0,6.28);x.fill()})}
 routeOpts().forEach(c=>{hexPath(x,c,.86);x.strokeStyle="rgba(150,30,25,.6)";x.lineWidth=2.5;x.setLineDash([5,5]);x.stroke();x.setLineDash([])});
 const [sx,sy]=mP(mc);x.save();x.translate(sx,sy);x.rotate(-myShip.userData.heading);x.fillStyle=PCOL[myIdx];x.strokeStyle="#1a0f05";x.lineWidth=2;x.beginPath();x.moveTo(15,0);x.lineTo(-9,-8);x.lineTo(-5,0);x.lineTo(-9,8);x.closePath();x.fill();x.stroke();x.restore();
 x.save();x.translate(1010,770);x.strokeStyle="rgba(50,30,14,.8)";x.lineWidth=1.5;x.beginPath();x.arc(0,0,48,0,6.28);x.stroke();for(let i=0;i<8;i++){const a=i/8*6.283-Math.PI/2,l=i%2?34:58;x.fillStyle=i%2?"rgba(160,40,30,.7)":"rgba(50,30,14,.85)";x.beginPath();x.moveTo(Math.cos(a)*l,Math.sin(a)*l);x.lineTo(Math.cos(a+.25)*9,Math.sin(a+.25)*9);x.lineTo(Math.cos(a-.25)*9,Math.sin(a-.25)*9);x.fill()}x.font="22px 'IM Fell English SC',Georgia,serif";x.fillStyle="rgba(50,30,14,.9)";x.textAlign="center";x.fillText("N",0,-64);x.restore();
 x.font="34px 'IM Fell English SC',Georgia,serif";x.fillStyle="rgba(45,25,10,.85)";x.textAlign="left";x.fillText("Carta de "+me().name,36,826);
 x.font="italic 19px 'IM Fell English',Georgia,serif";x.fillText(GS.phase==="orders"&&!me().ready?`Toca casillas contiguas para trazar tu ruta (hasta ${maxRoute()}). Las ✕ son islas sin explorar.`:`${seen.size} de ${CELLS.length} casillas exploradas`,36,44)}
let mapOpen=false,prevPitch=0,mapTimer=0;function toggleMap(v){const want=v===undefined?!mapOpen:v;if(want===mapOpen)return;mapOpen=want;clearTimeout(mapTimer);
 if(mapOpen){setSpy(false);prevPitch=pitchT;pitchT=-.75;drawMap();mapTimer=setTimeout(()=>$("mapw").classList.add("on"),240)}else{$("mapw").classList.remove("on");pitchT=prevPitch}}
$("bMap").onclick=()=>toggleMap(true);$("bClose").onclick=()=>{toggleMap(false);renderOrders()};$("bClr").onclick=()=>{route=[];drawMap();renderOrders()};
mapc.addEventListener("click",e=>{const r=mapc.getBoundingClientRect();const X=(e.clientX-r.left)*1100/r.width,Y=(e.clientY-r.top)*860/r.height;
 let best=null,bd=MS*MS;routeOpts().forEach(c=>{const [px,py]=mP(c);const d=(px-X)**2+(py-Y)**2;if(d<bd){bd=d;best=c}});if(best){route.push(best);drawMap();renderOrders()}});

// ---------- cartas ----------
const CBY={};CARD_LIST.forEach(([id,n,t,k,x])=>CBY[id]={id,n,t,k,x});
const TLABEL={ventaja:"Ventaja",sabotaje:"Sabotaje",sigilo:"Sigilo",respuesta:"Respuesta"};
function cardEl(id,big){const c=CBY[id];const e=document.createElement("div");e.className="fc"+(big?" big":"");e.dataset.t=c.t;e.tabIndex=0;
 e.innerHTML=`<div class="art">${c.n.replace("¡","")[0]}<img alt="" src="cartas/arte/${c.id}.jpg" onerror="this.remove()"></div><div class="bot"><div class="tp">${TLABEL[c.t]}</div><div class="nm">${c.n}</div><div class="tx">${c.x}</div></div>`;return e}
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
function zoomCard(id){const c=CBY[id];const big=cardEl(id,true);big.classList.add("flip");const can=GS.phase==="orders"&&!me().ready&&c.t!=="respuesta"&&!prepared;
 const btns=[];if(can)btns.push(["Jugar esta ronda",()=>{if(NEEDS_TARGET.has(id)){pickTarget(id);return}prepared={id,target:null};hideCov();renderOrders();note(`Preparada en secreto: ${c.n}. Se revelará al zarpar.`,5)},true]);
 btns.push(["Guardar",hideCov]);showCov([big],c.t==="respuesta"?"Esta carta se juega sola cuando alguien te sabotea.":(prepared?"Ya tienes una carta preparada esta ronda.":""),btns)}
function pickTarget(id){const opts=GS.players.filter(p=>p.i!==myIdx&&!p.gone).map(p=>[p.name,()=>{prepared={id,target:p.i};hideCov();renderOrders();note(`Preparada en secreto: ${CBY[id].n} contra ${p.name}.`,5)}]);
 opts.push(["Cancelar",hideCov]);showCov([cardEl(id,true)],"¿Contra quién?",opts)}

// ---------- botón del anfitrión para no esperar eternamente ----------
if(Net.isHost){const b=document.createElement("button");b.id="bForce";b.textContent="Forzar ronda";b.title="Resuelve la ronda aunque falte alguien";$("bMap").parentElement.appendChild(b);let arm=0;
 b.onclick=()=>{if(GS.phase!=="orders")return;if(Date.now()-arm>3000){arm=Date.now();note("Pulsa otra vez para resolver la ronda sin esperar a los que faltan.",3);return}hostResolve()}}

// ================= RESOLUCIÓN (solo anfitrión) =================
function hostResolve(){const G=H.G;if(G.phase!=="orders")return;G.phase="resolving";const P=G.players,ev=[];const E=(to,o)=>ev.push(Object.assign({to},o));
 const draw=()=>{if(!G.deck.length){G.deck=shuffle(G.discard||[]);G.discard=[]}return G.deck.pop()};G.discard=G.discard||[];
 const O=P.map((p,i)=>{const o=(!p.gone&&H.orders[i])||{route:[],card:null,bet:0,faroles:p.faroles};return o});
 P.forEach((p,i)=>{p.fx=Object.assign({},p.fx&&p.fx.wet?{wet:p.fx.wet}:{});p.faroles=!!O[i].faroles;p.bet=Math.max(0,Math.min(p.rum,O[i].bet|0));p.maxR=G.galerna?2:3;p.stop=false});G.galerna=0;
 // cartas
 const played=[];P.forEach((p,i)=>{const c=O[i].card;if(!c||!CBY[c.id]||CBY[c.id].t==="respuesta")return;const k=p.hand.indexOf(c.id);if(k<0)return;p.hand.splice(k,1);G.discard.push(c.id);played.push({i,id:c.id,t:c.target})});
 played.forEach(({i,id,t})=>{const p=P[i],c=CBY[id];
  if(NEEDS_TARGET.has(id)){const q=P[t];if(!q||q.gone||t===i)return;
   if(c.t==="sabotaje"){const k=q.hand.indexOf("sabotaje-descubierto");if(k>=0){q.hand.splice(k,1);G.discard.push("sabotaje-descubierto");
     E(t,{k:"card",card:id,txt:`${p.name} te ha jugado «${c.n}», pero le has pillado con ¡Sabotaje descubierto! No tiene efecto.`});E(i,{k:"card",card:"sabotaje-descubierto",txt:`${q.name} te ha pillado: tu «${c.n}» no tiene efecto y sabe que fuiste tú.`});
     E(-1,{k:"note",txt:`¡${q.name} ha descubierto un sabotaje de ${p.name}!`});return}}
   if(id==="motin"){O[t].route=[];E(t,{k:"card",card:id,txt:"¡Motín a bordo! Alguien ha comprado a tu tripulación: este turno no te mueves."})}
   if(id==="rata-en-la-bodega"){q.rum=Math.max(0,q.rum-2);q.bet=Math.min(q.bet,q.rum);E(t,{k:"card",card:id,txt:"Las ratas se han comido 2 barriles de tu ron. No sabes quién ha sido."})}
   if(id==="kraken-a-sueldo"){q.fame=Math.max(0,q.fame-1);O[t].route=[];q.cell=q.home.slice();q.sent=true;E(t,{k:"card",card:id,txt:"¡El kraken! Pierdes 1 de fama y tu barco vuelve a puerto a reparar."});E(-1,{k:"note",txt:`El kraken ha atacado a ${q.name}.`})}
   if(id==="desvio-de-la-tormenta"){q.maxR=1;E(t,{k:"card",card:id,txt:"Una tormenta te cierra el paso: este turno solo avanzas 1 casilla."})}
   if(id==="mapa-robado"){E(i,{k:"card",card:id,txt:`Has copiado la carta de ${q.name}: su zona ya está en tu mapa.`,reveal:[[q.cell,3],[q.home,2]]})}
   if(id==="polvora-mojada"){q.fx.wet=1;E(t,{k:"card",card:id,txt:"Alguien ha mojado tu pólvora: esta ronda luchas con 2 cañones menos."})}
   if(id==="sobornar-al-vigia"){p.hideFrom=p.hideFrom||{};p.hideFrom[t]=2;E(i,{k:"card",card:id,txt:`El vigía de ${q.name} mirará hacia otro lado durante 2 rondas: no podrá verte.`})}
   if(c.t==="sabotaje"&&!["mapa-robado"].includes(id))E(i,{k:"card",card:id,txt:`Tu «${c.n}» ha caído sobre ${q.name}. No sabrá que fuiste tú.`});return}
  if(id==="viento-a-favor"){p.maxR+=2;E(i,{k:"card",card:id,txt:"El viento empuja tus velas: este turno llegas más lejos."})}
  if(id==="vigia-de-aguila"){p.fx.vista=1;E(i,{k:"card",card:id,txt:"Tu vigía no pierde detalle: esta ronda ves más lejos."})}
  if(id==="remiendo-rapido"){p.cannons++;E(i,{k:"card",card:id,txt:`Montas un cañón de bronce: ahora tienes ${p.cannons} cañones.`})}
  if(id==="contrabando"){p.rum+=2;E(i,{k:"card",card:id,txt:"Unos contrabandistas te dejan 2 barriles de ron."})}
  if(id==="botin-escondido"){p.fame++;E(i,{k:"card",card:id,txt:"Desentierras un botín: +1 de fama."})}
  if(id==="carta-del-cartografo"){const pc=cellOf(p.cell);const mid=CELLS.filter(c=>cdist(c,VOL)===2).sort((a,b)=>cdist(a,pc)-cdist(b,pc))[0];E(i,{k:"card",card:id,txt:"El viejo cartógrafo te dibuja una zona cerca del volcán.",reveal:[[[mid.q,mid.r],2]]})}
  if(id==="bandera-falsa"){p.fx.flag=1;E(i,{k:"card",card:id,txt:"Izas una bandera falsa: si abordas a alguien esta ronda, no sabrá que fuiste tú."})}
  if(id==="bruma-espesa"){p.fx.bruma=1;E(i,{k:"card",card:id,txt:"Una bruma espesa os envuelve: esta ronda nadie puede veros."})}});
 // rutas válidas
 const R=P.map((p,i)=>{const out=[];if(p.gone||p.sent)return out;let cur=cellOf(p.cell);for(const a of (O[i].route||[]).slice(0,p.maxR)){const c=cellOf(a);if(!c||!sailable(c)||cdist(c,cur)!==1)break;out.push(c);cur=c}return out});
 const pos=P.map(p=>cellOf(p.cell));const paths=P.map(p=>[p.cell.slice()]);const L=Math.max(0,...R.map(r=>r.length));const fought=new Set();
 const str=p=>p.cannons-(p.fx.wet?2:0)+p.bet;
 for(let s=1;s<=L;s++){const prev=pos.slice();P.forEach((p,i)=>{if(!p.stop&&R[i][s-1])pos[i]=R[i][s-1];paths[i].push([pos[i].q,pos[i].r])});
  // cruces: dos barcos que se intercambian casilla se encuentran a medio camino
  const groups={};P.forEach((p,i)=>{if(p.gone)return;const k=key(pos[i]);(groups[k]=groups[k]||[]).push(i)});
  for(let a=0;a<P.length;a++)for(let b=a+1;b<P.length;b++){if(P[a].gone||P[b].gone)continue;if(pos[a]===prev[b]&&pos[b]===prev[a]&&pos[a]!==pos[b]){pos[b]=pos[a];paths[b][s]=[pos[a].q,pos[a].r];const k=key(pos[a]);groups[k]=groups[k]||[];if(!groups[k].includes(b))groups[k].push(b);if(!groups[k].includes(a))groups[k].push(a)}}
  Object.values(groups).forEach(g=>{if(g.length<2)return;g.forEach(i=>P[i].stop=true);
   const sc=g.map(i=>({i,v:str(P[i])})).sort((x,y)=>y.v-x.v);g.forEach(i=>{if(!fought.has(i)){P[i].rum-=P[i].bet;fought.add(i)}});
   const cell=pos[g[0]];
   if(sc[0].v===sc[1].v){g.forEach(i=>E(i,{k:"battle",step:s,at:[cell.q,cell.r],with:g.filter(j=>j!==i),txt:`Abordaje igualado contra ${g.filter(j=>j!==i).map(j=>P[j].name).join(" y ")}: nadie gana y cada uno sigue en su sitio.`}));return}
   const w=sc[0].i,W=P[w];W.fame++;const losers=g.filter(i=>i!==w);
   losers.forEach(l=>{const Lp=P[l];if(Lp.rum>0){Lp.rum--;W.rum++}Lp.cell=Lp.home.slice();Lp.sent=true;pos[l]=cellOf(Lp.home);
    E(l,{k:"battle",step:s,at:[cell.q,cell.r],with:[w],lost:true,txt:`¡Abordaje! ${W.fx.flag?"Un barco con bandera falsa":W.name} te ha vencido (${sc.find(o=>o.i===w).v} contra ${sc.find(o=>o.i===l).v}). Te roba 1 barril y vuelves a puerto.`})});
   E(w,{k:"battle",step:s,at:[cell.q,cell.r],with:losers,txt:`¡Abordaje ganado contra ${losers.map(l=>P[l].name).join(" y ")}! +1 de fama y les robas ron.`});
   E(-1,{k:"note",txt:W.fx.flag?`Un barco sin bandera ha hundido el orgullo de ${losers.map(l=>P[l].name).join(" y ")}.`:`${W.name} ha ganado un abordaje a ${losers.map(l=>P[l].name).join(" y ")}.`})})}
 // final de movimiento: cofres y volcán
 P.forEach((p,i)=>{if(p.gone)return;if(!p.sent)p.cell=[pos[i].q,pos[i].r];const c=cellOf(p.cell);
  if(!p.sent){const isl=neighbors(c).map(n=>ISLMAP[key(n)]).find(o=>o&&o.home===undefined&&!p.looted.includes(key(o.c)));
   if(isl){p.looted.push(key(isl.c));const r=Math.random();let txt;
    if(r<.3){p.fame++;txt="Bajáis a la isla y encontráis un cofre con joyas: +1 de fama."}else if(r<.65){p.rum+=2;txt="El cofre está lleno de botellas: +2 barriles de ron."}else if(r<.88){const d=draw();if(d){if(p.hand.length<3)p.hand.push(d);txt=`Dentro del cofre hay una Carta de Fortuna: ${CBY[d].n}.`}else txt="El cofre estaba vacío."}else{p.rum=Math.max(0,p.rum-1);txt="¡Era una trampa! Una serpiente asusta a la tripulación y se rompe un barril."}
    E(i,{k:"chest",at:[isl.c.q,isl.c.r],txt})}
   if(cdist(c,VOL)===1&&!p.got&&G.treasures>0){p.got=true;G.treasures--;p.fame+=3;E(i,{k:"treasure",txt:"¡EL TESORO DEL VOLCÁN! +3 de fama. Ahora sal de aquí antes de que entre en erupción."});E(-1,{k:"note",txt:`${p.name} ha encontrado un tesoro en el volcán. Quedan ${G.treasures}.`})}}});
 const nearV=P.filter(p=>!p.gone&&!p.sent&&cdist(cellOf(p.cell),VOL)===1);if(nearV.length&&Math.random()<.2){nearV.forEach(p=>{p.rum=Math.max(0,p.rum-1);p.cell=p.home.slice();p.sent=true;E(p.i,{k:"erupt",txt:"¡ERUPCIÓN! Llueve fuego: pierdes 1 barril y tu barco vuelve a puerto."})});E(-1,{k:"note",txt:"¡El volcán ha entrado en erupción!"})}
 // fin de ronda
 P.forEach(p=>{p.rum=Math.min(9,p.rum+1);Object.keys(p.hideFrom||{}).forEach(k=>{if(--p.hideFrom[k]<=0)delete p.hideFrom[k]});if(p.fx.wet&&--p.fx.wet<=0)delete p.fx.wet;p.ready=false;delete p.stop});
 const top=P.filter(p=>!p.gone).sort((a,b)=>b.fame-a.fame||b.rum-a.rum);if(top.length&&top[0].fame>=G.target){G.winner=top[0].i;G.phase="over"}
 else{// sucesos del mar que afectan a todos
  if(G.round>=(QS.has("ev")?1:2)&&Math.random()<(QS.has("ev")?1:.33)){const live=P.filter(p=>!p.gone);const k=Math.floor(Math.random()*8);let n,txt;
   if(k===4){const lead=live.slice().sort((a,b)=>b.fame-a.fame)[0];lead.fame=Math.max(0,lead.fame-1);lead.cell=lead.home.slice();n="El kraken despierta";txt=`Un kraken hambriento ataca al barco con más fama: ${lead.name} pierde 1 de fama y vuelve a puerto.`}
   if(k===5){live.forEach(p=>p.rum=Math.max(0,p.rum-1));n="Tormenta";txt="Una tormenta barre el archipiélago: todos perdéis 1 barril de ron."}
   if(k===6){live.forEach(p=>{if(p.hand.length){const j=Math.floor(Math.random()*p.hand.length);G.discard.push(p.hand.splice(j,1)[0])}});n="Motín general";txt="Las tripulaciones se amotinan: cada uno pierde una carta al azar."}
   if(k===7){const v=live[Math.floor(Math.random()*live.length)];v.cell=v.home.slice();n="Remolino";txt=`Un remolino se traga el barco de ${v.name} y lo escupe en su puerto.`}
   if(k===0){G.galerna=1;n="Galerna";txt="Se levanta una galerna: la próxima ronda nadie podrá navegar más de 2 casillas."}
   if(k===1){live.forEach(p=>p.rum=Math.min(9,p.rum+1));n="Marea de ron";txt="La marea arrastra barriles de un barco hundido: todos ganáis 1 barril de ron."}
   if(k===2){const hit=live.filter(p=>cdist(cellOf(p.cell),VOL)<=2);hit.forEach(p=>p.rum=Math.max(0,p.rum-1));n="Lluvia de ceniza";txt="El volcán escupe ceniza ardiente. "+(hit.length?hit.map(p=>p.name).join(", ")+" pierde"+(hit.length>1?"n":"")+" 1 barril por estar cerca.":"Esta vez nadie estaba lo bastante cerca.")}
   if(k===3){live.forEach(p=>{if(p.hand.length<3){const d=draw();if(d)p.hand.push(d)}});n="Restos de un naufragio";txt="Flotan restos de un naufragio: todos los que tengan sitio en la mano roban una Carta de Fortuna."}
   E(-1,{k:"sea",n,txt})}
  G.round++;G.phase="orders";P.forEach(p=>{if(p.gone)return;if(p.hand.length<3){const d=draw();if(d){p.hand.push(d);E(p.i,{k:"drew",card:d})}}})}
 const sent=P.map(p=>!!p.sent);P.forEach(p=>delete p.sent);H.orders={};
 Net.toAll({t:"resolve",G,paths,sent,ev})}

// ================= CLIENTE: mensajes del anfitrión =================
let busy=false;const queue=[];
function worldMsg(m){if(m.t==="ready"){m.ready.forEach((r,i)=>GS.players[i].ready=r);if(m.gone)m.gone.forEach((g,i)=>GS.players[i].gone=g);if(GS.phase==="orders")renderScore();return}
 if(m.t==="lobby")return;
 if(m.t==="state"){GS=m.G;snapShips();renderOrders();return}
 if(m.t==="resolve"){queue.push(m);if(!busy)nextResolve()}}
function nextResolve(){const m=queue.shift();if(!m){busy=false;return}busy=true;playResolve(m,()=>nextResolve())}
function snapShips(){SHIPS.forEach((s,i)=>{const c=cellOf(GS.players[i].cell);s.userData.pos.set(c.x,0,c.z);s.userData.from=null});reveal(cellOf(me().cell),2);updateVisibility()}
const seq=(fns,done)=>{let k=0;const go=()=>{if(k>=fns.length){done&&done();return}fns[k++](go)};go()};
function playResolve(m,done){const mine=m.ev.filter(e=>e.to===-1||e.to===myIdx);const oldG=GS;
 // la ronda ya está cerrada: aplica faroles y efectos visibles de los demás
 GS.players.forEach((p,i)=>{p.faroles=m.G.players[i].faroles;p.fx=m.G.players[i].fx;p.hideFrom=m.G.players[i].hideFrom});
 toggleMap(false);setSpy(false);hideCov();document.body.classList.add("sailing");sndTension(1);sndHit("drum");$("hRound").textContent=`RONDA ${GS.round} · RESOLVIENDO`;
 const pre=mine.filter(e=>e.k==="card");
 const steps=Math.max(...m.paths.map(p=>p.length))-1;
 const fns=[];
 pre.forEach(e=>fns.push(nx=>{const b=cardEl(e.card,true);b.classList.add("flip");showCov([b],e.txt,[["Seguir",()=>{hideCov();if(e.reveal)e.reveal.forEach(([c,r])=>reveal(cellOf(c),r));setTimeout(nx,300)},true]],7000)}));
 fns.push(nx=>{rcard("¡LEVEN ANCLAS!","Ronda "+GS.round);setTimeout(nx,900)});
 for(let s=1;s<=steps;s++)fns.push(nx=>{SHIPS.forEach((sh,i)=>{const a=m.paths[i][s-1],b=m.paths[i][s];if(!b)return;sh.userData.from=cellOf(a);sh.userData.to=cellOf(b);sh.userData.t=0});
  const bat=mine.filter(e=>e.k==="battle"&&e.step===s);
  sailT=0;sailDone=()=>{sailDone=null;reveal(curCell(myIdx),2+(me().fx&&me().fx.vista?1:0));updateVisibility();
   if(bat.length){const e=bat[0];cannonFx(e.at);sndHit("battle");rcard(e.lost?"DERROTA":e.txt.startsWith("Abordaje igualado")?"EMPATE":"VICTORIA","Abordaje");
    setTimeout(()=>{note(e.txt,8);if(e.lost){const h=cellOf(GS.players[myIdx].home);fadeJump(myShip,cellOf(m.G.players[myIdx].home))}nx()},1800)}else nx()}});
 fns.push(nx=>{// barcos enviados a puerto vuelven allí
  m.sent.forEach((s,i)=>{if(s){const h=cellOf(m.G.players[i].home);fadeJump(SHIPS[i],h)}});setTimeout(nx,m.sent.some(Boolean)?900:10)});
 mine.filter(e=>["chest","treasure","erupt","sea"].includes(e.k)).forEach(e=>fns.push(nx=>{sndHit(e.k);if(e.k==="erupt")eruptFx();if(e.k==="treasure")rcard("TESORO","+3 de fama");
  const t=document.createElement("div");t.className="fc big";t.dataset.t=e.k==="sea"?"sigilo":e.k==="chest"?"ventaja":e.k==="treasure"?"ventaja":"sabotaje";t.innerHTML=`<div class="art">${e.k==="sea"?"≋":e.k==="erupt"?"🌋":e.k==="treasure"?"✦":"⚿"}</div><div class="bot"><div class="tp">${e.k==="sea"?"Suceso del mar":e.k==="chest"?"Cofre":e.k==="treasure"?"Tesoro":"Volcán"}</div><div class="nm">${e.k==="sea"?e.n:e.k==="chest"?"Exploración":e.k==="treasure"?"El tesoro del volcán":"¡Erupción!"}</div><div class="tx">${e.txt}</div></div>`;
  t.classList.add("flip");showCov([t],"",[["Seguir",()=>{hideCov();setTimeout(nx,300)},true]],7000)}));
 const pub=mine.filter(e=>e.k==="note");if(pub.length)fns.push(nx=>{note(pub.map(e=>e.txt).join(" "),9);setTimeout(nx,400)});
 fns.push(nx=>{GS=m.G;snapShips();sndTension(0);document.body.classList.remove("sailing");route=[];prepared=null;bet=0;
  if(GS.phase==="over"){gameOver();nx();return}
  rcard("ÓRDENES SECRETAS","Ronda "+GS.round);renderOrders();
  const d=mine.find(e=>e.k==="drew");setTimeout(()=>{if(d){const b=cardEl(d.card,true);b.classList.add("flip");showCov([b],"Robas una Carta de Fortuna.",[["A la mano",()=>{hideCov();arrivalNote()},true]],8000)}else arrivalNote();nx()},2400)});
 seq(fns,done)}
function arrivalNote(){const c=cellOf(me().cell);const vis=GS.players.filter((p,i)=>i!==myIdx&&SHIPS[i].visible);
 if(vis.length)note(`Velas a la vista: ${vis.map(p=>p.name).join(", ")}. Si acabáis en la misma casilla habrá abordaje.`,9);
 else if(cdist(c,VOL)<=1)note("El volcán ruge a vuestro lado. El tesoro está cerca, y el peligro también.",8);
 else if(cdist(c,VOL)<=3)note("El humo del volcán está muy cerca. Abre el mapa (M).",7);
 else note("Abre el mapa (M) para trazar la ruta. El humo del volcán te guía.",7)}
function gameOver(){const w=GS.players[GS.winner];const rows=GS.players.slice().sort((a,b)=>b.fame-a.fame).map(p=>`${p.name}: ${p.fame} de fama`).join(" · ");
 rcard(GS.winner===myIdx?"¡VICTORIA!":"FIN DE LA PARTIDA",w.name+" gana");
 const t=document.createElement("div");t.className="fc big";t.dataset.t="ventaja";t.innerHTML=`<div class="art">☠</div><div class="bot"><div class="tp">Fin de la partida</div><div class="nm">${esc(w.name)} es leyenda</div><div class="tx">${esc(rows)}</div></div>`;
 setTimeout(()=>showCov([t],GS.winner===myIdx?"Tu nombre se cantará en todas las tabernas del archipiélago.":`${w.name} ha llegado antes a ${GS.target} de fama.`,[["Nueva partida",()=>{location.href=location.pathname+(LOCAL?"?local":"")},true]]),2600)}

// ---------- efectos ----------
const fxs=[];function puff(x,y,z,col,sz,life){const m=new THREE.SpriteMaterial({map:cloudTex,color:C(col),transparent:true,opacity:.9,depthWrite:false});const s=new THREE.Sprite(m);s.position.set(x,y,z);s.scale.set(sz,sz,1);scene.add(s);fxs.push({s,t:0,life,sz})}
function cannonFx(at){const c=cellOf(at);for(let k=0;k<14;k++)setTimeout(()=>{puff(c.x+(Math.random()-.5)*24,3+Math.random()*4,c.z+(Math.random()-.5)*24,k%3?"#d8d0c8":"#ffb060",6+Math.random()*6,2.5);flash.intensity=8},k*110)}
function eruptFx(){for(let k=0;k<30;k++)setTimeout(()=>puff(VOL.x+(Math.random()-.5)*30,45+Math.random()*30,VOL.z+(Math.random()-.5)*30,k%2?"#ff5a20":"#3a2a26",20+Math.random()*30,4),k*60)}
const flash=new THREE.PointLight(C("#ffa050"),0,120,2);scene.add(flash);
function fadeJump(ship,c){ship.userData.from=null;ship.userData.pos.set(c.x,0,c.z)}

// ---------- cámara en tercera persona, detrás del capitán ----------
scene.add(camera);const camT=new THREE.Vector3(),camL=new THREE.Vector3();let introK=QS.has("nointro")?1:0;const CAMD=+(QS.get("camd")||6.5),CAMH=+(QS.get("camh")||2.7),CAMEL=+(QS.get("camel")||.3),CAMS=+(QS.get("cams")||2.2);
function thirdPerson(dt){if(introK<1){introK=Math.min(1,introK+dt/7);if(introK>=1)introDone()}const e=1-Math.pow(1-introK,3);
 myShip.updateMatrixWorld();if(deckLow!==null){CLIPL[1].constant=deckLow+.35;CLIP.forEach((p,k)=>p.copy(CLIPL[k]).applyMatrix4(myShip.matrixWorld))}camT.set(CAPX,(deckLow!==null?deckLow:CAPY)+CAMH,0);myShip.localToWorld(camT);
 const az=myShip.userData.heading+yaw+(1-e)*2.4;const el=THREE.MathUtils.lerp(1.05,Math.max(.06,Math.min(1.35,CAMEL-pitch*.9)),e);const D=THREE.MathUtils.lerp(260,CAMD+Math.abs(Math.sin(yaw))*12+(1-Math.cos(yaw))*3,e);const sx=Math.sin(az)*CAMS*e*Math.cos(yaw),sz=Math.cos(az)*CAMS*e*Math.cos(yaw);
 camera.position.set(camT.x-Math.cos(az)*Math.cos(el)*D+sx,camT.y+Math.sin(el)*D,camT.z+Math.sin(az)*Math.cos(el)*D+sz);if(camera.position.y<1.4)camera.position.y=1.4;
 const ahead=spy?80:8;camL.set(camT.x+Math.cos(az)*ahead+sx,camT.y+(spy?0:.4)-(1-e)*2,camT.z-Math.sin(az)*ahead+sz);camera.lookAt(camL)}

// ---------- sonido ambiente generado (por defecto solo en el anfitrión) ----------
const SND={on:false,ctx:null,master:null,tension:null};
function sndInit(){if(SND.ctx)return;const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const ctx=new A();SND.ctx=ctx;const M=ctx.createGain();M.gain.value=0;M.connect(ctx.destination);SND.master=M;
 const len=ctx.sampleRate*4,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);let b=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;b=(b+.02*w)/1.02;d[i]=b*3.5}
 const noise=()=>{const s=ctx.createBufferSource();s.buffer=buf;s.loop=true;s.start();return s};
 // olas: ruido marrón con vaivén lento
 const sea=noise(),seaF=ctx.createBiquadFilter();seaF.type="lowpass";seaF.frequency.value=500;const seaG=ctx.createGain();seaG.gain.value=.55;sea.connect(seaF).connect(seaG).connect(M);
 const lfo=ctx.createOscillator();lfo.frequency.value=.11;const lg=ctx.createGain();lg.gain.value=.35;lfo.connect(lg).connect(seaG.gain);lfo.start();
 // viento: ruido filtrado alto que silba
 const wind=noise(),wf=ctx.createBiquadFilter();wf.type="bandpass";wf.frequency.value=900;wf.Q.value=1.4;const wg=ctx.createGain();wg.gain.value=.05;wind.connect(wf).connect(wg).connect(M);
 const l2=ctx.createOscillator();l2.frequency.value=.07;const l2g=ctx.createGain();l2g.gain.value=500;l2.connect(l2g).connect(wf.frequency);l2.start();
 // fondo oscuro: dos tonos graves desafinados
 const dr=ctx.createGain();dr.gain.value=.05;dr.connect(M);[55,82.4,55.6].forEach(f=>{const o=ctx.createOscillator();o.type="sawtooth";o.frequency.value=f;const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=180;o.connect(lp).connect(dr);o.start()});
 // tensión: pulso grave que sube en la resolución
 const tg=ctx.createGain();tg.gain.value=0;tg.connect(M);const to=ctx.createOscillator();to.type="triangle";to.frequency.value=41;const tl=ctx.createOscillator();tl.frequency.value=1.6;const tlg=ctx.createGain();tlg.gain.value=.5;const tv=ctx.createGain();tv.gain.value=.5;tl.connect(tlg).connect(tv.gain);to.connect(tv).connect(tg);to.start();tl.start();SND.tension=tg}
function sndSet(on){SND.on=on;try{localStorage.setItem("archi-snd",on?"1":"0")}catch(e){}if(on){sndInit();if(!SND.ctx)return;SND.ctx.resume();SND.master.gain.setTargetAtTime(.8,SND.ctx.currentTime,.8)}else if(SND.ctx)SND.master.gain.setTargetAtTime(0,SND.ctx.currentTime,.3);$("bSnd").textContent=on?"Sonido: sí":"Sonido: no";$("bSnd").classList.toggle("on",on)}
function sndTension(v){if(SND.on&&SND.tension)SND.tension.gain.setTargetAtTime(v*.35,SND.ctx.currentTime,1.2)}
function sndHit(kind){if(!SND.on||!SND.ctx)return;const ctx=SND.ctx,t=ctx.currentTime;
 const boom=(at,f,g)=>{const o=ctx.createOscillator();o.type="sine";o.frequency.setValueAtTime(f,t+at);o.frequency.exponentialRampToValueAtTime(30,t+at+.5);const gg=ctx.createGain();gg.gain.setValueAtTime(g,t+at);gg.gain.exponentialRampToValueAtTime(.001,t+at+.8);o.connect(gg).connect(SND.master);o.start(t+at);o.stop(t+at+.9)};
 if(kind==="battle")for(let k=0;k<7;k++)boom(k*.28+Math.random()*.1,90+Math.random()*40,.9);
 if(kind==="drum")[0,.5,1,1.25,1.5].forEach(a=>boom(a,70,.6));
 if(kind==="erupt")for(let k=0;k<10;k++)boom(k*.2,45,.8);
 if(kind==="treasure"||kind==="chest"){[523,659,784,1046].forEach((f,k)=>{const o=ctx.createOscillator();o.type="triangle";o.frequency.value=f;const g=ctx.createGain();g.gain.setValueAtTime(.0001,t+k*.12);g.gain.exponentialRampToValueAtTime(.18,t+k*.12+.02);g.gain.exponentialRampToValueAtTime(.0001,t+k*.12+1.2);o.connect(g).connect(SND.master);o.start(t+k*.12);o.stop(t+k*.12+1.3)})}}
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
if(introK<1){document.body.classList.add("intro-on","sailing");const c=CAPDESC[me().cap||0];introEl.innerHTML=`<div class="k">RONDA ${GS.round} · ${GS.np} PIRATAS</div><div class="t">Archipiélago</div><div class="s">${esc(c)} leva anclas y se adentra en la niebla. En algún lugar, la columna de humo de un volcán guarda un tesoro… y no eres el único que lo busca.</div>`;document.body.appendChild(introEl)}
function introDone(){document.body.classList.remove("intro-on","sailing");introEl.remove();rcard("ÓRDENES SECRETAS","Ronda "+GS.round);setTimeout(()=>note(`Eres ${me().name}: ${CAPDESC[me().cap||0]}. Arrastra para mirar alrededor. Abre el mapa (M) para trazar tu ruta, elige carta y confirma tus órdenes.`,12),900)}
// ---------- bucle ----------
let sailT=0,sailDone=null;const SAILDUR=3.6;
const fadeMats=[];scene.traverse(o=>{if(o.material&&o.material.uniforms&&o.material.uniforms.uFD)fadeMats.push(o.material)});
const clock=new THREE.Clock();let T=0,frames=0,fpsAcc=0,fpsN=0,lowAuto=false;const tmp=new THREE.Vector3();
function placeShips(dt){SHIPS.forEach((s,i)=>{const u=s.userData;if(u.from){u.t=Math.min(1,u.t+dt/SAILDUR);const k=u.t<.5?2*u.t*u.t:1-Math.pow(-2*u.t+2,2)/2;
  const a=new THREE.Vector3(u.from.x,0,u.from.z),b=new THREE.Vector3(u.to.x,0,u.to.z);u.pos.copy(a).lerp(b,k);const d=b.clone().sub(a);if(d.lengthSq()>1){const want=Math.atan2(-d.z,d.x);let dh=want-u.heading;dh=Math.atan2(Math.sin(dh),Math.cos(dh));u.heading+=dh*Math.min(1,dt*2);if(i===myIdx)u.wheel.rotation.x=dh*2}
  if(u.t>=1)u.from=null}
  s.position.set(u.pos.x+(i===myIdx?0:u.off.x),Math.sin(T*.9+i)*.18,u.pos.z+(i===myIdx?0:u.off.z));s.rotation.set(Math.sin(T*.55+i)*.025,u.heading,Math.sin(T*.7+i)*.035)});
 if(sailDone){sailT+=dt;if(sailT>=SAILDUR+.1)sailDone()}}
function frame(){const dt=Math.min(clock.getDelta(),.05);T+=dt;anim.forEach(f=>f(T,dt));placeShips(dt);
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
 requestAnimationFrame(frame)}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});


// ---------- modelos 3D de Tripo (solo en ordenador) ----------
let deckY=null,deckLow=null;const CLIPL=[new THREE.Plane(new THREE.Vector3(1,0,0),5.6),new THREE.Plane(new THREE.Vector3(0,-1,0),0)],CLIP=[new THREE.Plane(),new THREE.Plane()];
const CAPH=+(QS.get('caph')||3.1),CAPX=+(QS.get('capx')||-7),CAPY=+(QS.get('capy')||1.5),SHIPY=+(QS.get('shipy')||-1.2),EYEX=+(QS.get('eyex')||-6.6),EYEY=+(QS.get('eyey')||3.4),EYEZ=+(QS.get('eyez')||0),OWNS=+(QS.get('owns')||16);
if(!LOW&&THREE.GLTFLoader&&!QS.has("noglb")){const GL=new THREE.GLTFLoader();const IMAP={selva:"isla-bosque",lino:"isla-lona",hierro:"isla-hierro",ron:"isla-ron",perlas:"isla-perlas"};
 const HGT={"isla-bosque":.77,"isla-lona":.46,"isla-hierro":.79,"isla-ron":.5,"isla-perlas":.7};const SINK={"isla-ron":.18,"isla-perlas":.28};
 const cache={};const get=(n,cb)=>{if(!cache[n])cache[n]=new Promise(res=>GL.load("modelos/"+n+".glb",g=>{g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material&&o.material.map)o.material.map.anisotropy=4}});res(g.scene)},undefined,()=>res(null)));cache[n].then(cb)};
 const deckAt=m=>{if(deckY!==null)return deckY;const g=new THREE.Group();const c=m.clone();c.scale.setScalar(16);c.rotation.y=Math.PI/2;c.position.y=SHIPY;g.add(c);g.updateMatrixWorld(true);
  const rc=new THREE.Raycaster(new THREE.Vector3(CAPX,40,0),new THREE.Vector3(0,-1,0));const hs=rc.intersectObject(g,true).map(h=>h.point.y).filter(y=>y<CAPY+3.5);deckY=hs.length?Math.max(...hs):CAPY;const lo=hs.filter(y=>y<deckY-.6);deckLow=lo.length?Math.max(...lo):deckY;return deckY};
 get("barco-galeon",m=>{if(!m)return;SHIPS.forEach((s,i)=>{
  s.children.forEach(c=>{if(c===eye)return;if(!(c.isPointLight||c.isSprite))c.visible=false});
  const c=m.clone();const own=i===myIdx;c.scale.setScalar(own?OWNS:16);c.rotation.y=Math.PI/2;c.position.y=own?SHIPY*OWNS/16:SHIPY;s.add(c);
  if(i===myIdx){s.children.forEach(o=>{if(o.isPointLight||o.isSprite||(o.material&&o.material.isMeshBasicMaterial))o.position.set(-7.4,3.6,0)});
   deckAt(m);renderer.localClippingEnabled=true;c.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.clippingPlanes=CLIP;o.material.clipIntersection=true;o.material.clipShadows=true}});
   get(CAPS[GS.players[i].cap||0].n.toLowerCase(),cm=>{if(!cm)return;const cp=cm.clone();cp.scale.setScalar(CAPH);cp.position.set(CAPX,deckLow+.03,0);cp.rotation.y=Math.PI/2;s.add(cp);s.userData.cap=cp});return}
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.5,6,2),std(PCOL[i],{side:THREE.DoubleSide,emissive:C(PCOL[i]),emissiveIntensity:.25}));fl.position.set(-1,13.2,0);s.add(fl);
  anim.push(t=>{const fp=fl.geometry.attributes.position;for(let k=0;k<fp.count;k++){const xx=fp.getX(k)+1.3;fp.setZ(k,Math.sin(t*6-xx*3+i)*.15*xx)}fp.needsUpdate=true});
   get(CAPS[GS.players[i].cap||0].n.toLowerCase(),cm=>{if(!cm)return;const cp=cm.clone();cp.scale.setScalar(CAPH);cp.position.set(CAPX,deckAt(m)+.03,0);cp.rotation.y=Math.PI/2;s.add(cp);s.userData.cap=cp})})});
 ISL.forEach(o=>{const name=o.home!==undefined?"isla-ron":IMAP[o.t];get(name,m=>{if(!m)return;const G=islandMeshes[key(o.c)];const g=G.children[0];const R=g.userData.R;
  const c=m.clone();const sc=2.6*R/.98;c.scale.setScalar(sc);c.position.y=-(SINK[name]||.04)*HGT[name]*sc;G.add(c);g.visible=false})})}

// ---------- arranque ----------
{const c=cellOf(me().cell);yawT=yaw=Math.atan2(-(VOL.z-c.z),VOL.x-c.x)-myShip.userData.heading;pitchT=pitch=.02}
snapShips();renderOrders();requestAnimationFrame(frame);
if(introK>=1)introDone();
if(0)setTimeout(()=>note(`Eres ${me().name}: ${CAPDESC[me().cap||0]}. Al fondo, el humo del volcán: allí está el tesoro. Abre el mapa (M) para trazar tu ruta y confirma tus órdenes.`,12),1200);
window.restartWorld=()=>location.reload();
if(QS.has("shot"))window.__G=()=>({GS,myIdx,seen:seen.size});
