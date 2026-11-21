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
