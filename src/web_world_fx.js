
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

// ---------- capitanes animados ----------
const animCache={};
function animCap(capIdx,cb){animModel(CAPS[capIdx||0].n.toLowerCase()+"-animada",CAPH,cb)}
function animModel(n,H,cb){if(!GL||!THREE.SkeletonUtils){cb(null);return}
 if(!animCache[n])animCache[n]=new Promise(res=>GL.load("modelos/"+n+".glb",g=>{g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false}});res(g)},undefined,()=>res(null)));
 animCache[n].then(g=>{if(!g){cb(null);return}const m=THREE.SkeletonUtils.clone(g.scene);const bb=new THREE.Box3().setFromObject(m);const h=(bb.max.y-bb.min.y)||1;m.scale.setScalar(H/h);
  const mx=new THREE.AnimationMixer(m);mixers.push(mx);const clips={};g.animations.forEach(c=>clips[c.name]=c);
  const play=(name,once)=>{const c=clips[name]||clips.idle;if(!c)return;mx.stopAllAction();const a=mx.clipAction(c);a.reset();if(once){a.setLoop(THREE.LoopOnce);a.clampWhenFinished=true}a.play()};
  cb({m,play,dispose:()=>{mx.stopAllAction();mixers.splice(mixers.indexOf(mx),1);m.parent&&m.parent.remove(m)}})})}
// precarga del capitán propio y de los rivales para que el abordaje no espere
setTimeout(()=>{GS.players.forEach(p=>animCap(p.cap,()=>{}));animModel("tripulante-artillero-animada",1,()=>{})},4000);

// ---------- ABORDAJE ----------
async function fxBattle(e){const others=(e.with||[]).filter(j=>j!==myIdx);const j=others[0];if(j===undefined)return;
 const A=myShip,Bs=SHIPS[j],ua=A.userData,ub=Bs.userData;const keep={off:ub.off.clone(),hb:ub.heading,vis:Bs.visible};
 // los barcos se ponen costado con costado
 const h=ua.heading;const side=new THREE.Vector3(Math.sin(h),0,Math.cos(h));ub.off.copy(side).multiplyScalar(11.5);ub.heading=h+Math.PI;Bs.visible=true;ub.from=null;ub.pos.copy(ua.pos);
 const mid=A.position.clone().addScaledVector(side,5.75);mid.y=0;
 const camP=mid.clone().addScaledVector(new THREE.Vector3(Math.cos(h),0,-Math.sin(h)),34);camP.y=13;screenFlash("#000",1,700);cineTo(camP,mid.clone().setY(3),true);
 rcard("¡ABORDAJE!",GS.players[j].name);sndHit("drum");await wait(1600);
 // andanadas
 for(let k=0;k<8;k++){const fromA=k%2===0;const S=fromA?A:Bs,O=fromA?Bs:A;const x=-5+Math.random()*10;const f=hullPoint(S,x,1);const to=hullPoint(O,-5+Math.random()*10,1);to.y=1.5+Math.random()*2;
  const hit=Math.random()<.75;if(!hit)to.addScaledVector(side,fromA?6:-6);cannonShot(f,to,hit);sndHit("cannon");await wait(380+Math.random()*250)}
 await wait(900);
 // duelo de capitanes sobre una plancha
 const deck=(deckLow!==null?deckLow:CAPY)+.2;const plank=new THREE.Mesh(new THREE.BoxGeometry(1.4,.25,7.5),std("#6b4a2a"));plank.position.copy(mid).setY(deck+.6);plank.rotation.y=h;scene.add(plank);
 const camP2=mid.clone().addScaledVector(new THREE.Vector3(Math.cos(h),0,-Math.sin(h)),12);camP2.y=deck+5;cineTo(camP2,mid.clone().setY(deck+2.2));
 const caps=await Promise.all([GS.players[myIdx].cap,GS.players[j].cap].map(c=>new Promise(r=>animCap(c,r))));
 const statics=[ua.cap,ub.cap].filter(Boolean);statics.forEach(o=>o.visible=false);
 const won=!e.lost&&!e.txt.startsWith("Abordaje igualado"),tie=e.txt.startsWith("Abordaje igualado");
 if(caps[0]&&caps[1]){const [ca,cb2]=caps;[ca,cb2].forEach((c,n)=>{scene.add(c.m);c.m.position.copy(mid).addScaledVector(side,n?1.2:-1.2).setY(deck+.75);c.m.rotation.y=Math.atan2(n?-side.x:side.x,n?-side.z:side.z);c.play("slash")});
  const crew=await Promise.all([0,1,2,3].map(()=>new Promise(r=>animModel("tripulante-artillero-animada",CAPH*.95,r))));
  crew.forEach((c,n)=>{if(!c)return;const S=n<2?A:Bs;const lp=new THREE.Vector3(n%2?-3.5:3.5,0,n<2?1.2:1.2);S.updateMatrixWorld();const wp=S.localToWorld(lp);c.m.position.copy(wp).setY(deck+.1);const d=n<2?side:side.clone().negate();c.m.rotation.y=Math.atan2(d.x,d.z);scene.add(c.m);c.play(n%2?"slash":"cheer")});
  for(let k=0;k<6;k++){await wait(520);const sp=mid.clone().setY(deck+2.4);puff(sp.x,sp.y,sp.z,"#ffe080",1.4,.25);flash.position.copy(sp);flash.intensity=3;sndHit("clang")}
  if(tie){ca.play("idle");cb2.play("idle")}else{(won?ca:cb2).play("cheer");(won?cb2:ca).play("fall",true)}
  crew.forEach((c,n)=>{if(c)c.play(tie?"idle":((n<2)===won?"cheer":"fall"),!tie&&(n<2)!==won)});
  await wait(2200);caps.forEach(c=>c.dispose());crew.forEach(c=>c&&c.dispose())}
 else{for(let k=0;k<5;k++){await wait(400);const sp=mid.clone().setY(deck+2.4);puff(sp.x,sp.y,sp.z,"#ffe080",1.6,.25);sndHit("clang")}await wait(800)}
 statics.forEach(o=>o.visible=true);scene.remove(plank);
 ub.off.copy(keep.off);ub.heading=keep.hb;Bs.visible=keep.vis;cineOff()}

// ---------- ASALTO a un territorio ----------
async function fxAssault(e){const c=cellOf(e.at);const isl=new THREE.Vector3(c.x,0,c.z);const me_=myShip.position.clone();const def=e.def;
 const shipP=def&&e.who!==undefined&&SHIPS[e.who].visible?SHIPS[e.who].position.clone():def?isl.clone().add(new THREE.Vector3(30,0,10)):me_;
 const camP=shipP.clone().lerp(isl,.5).add(new THREE.Vector3(0,38,0));const off=new THREE.Vector3(isl.z-shipP.z,0,shipP.x-isl.x).normalize().multiplyScalar(85);camP.add(off);cineTo(camP,shipP.clone().lerp(isl,.6).setY(4));
 rcard(def?"¡TE ASALTAN!":"¡AL ASALTO!",def?"Defiende tu isla":"Tu territorio");sndHit("drum");await wait(1400);
 const top=islandTop(key(c),0,0);
 for(let k=0;k<7;k++){const from=shipP.clone().add(new THREE.Vector3((Math.random()-.5)*6,2.2,(Math.random()-.5)*6));const to=top.clone().add(new THREE.Vector3((Math.random()-.5)*10,Math.random()*2,(Math.random()-.5)*10));
  cannonShot(from,to,true);sndHit("cannon");await wait(330);if(e.fort&&k%2){cannonShot(top.clone().add(new THREE.Vector3(0,3,0)),from.clone().add(new THREE.Vector3((Math.random()-.5)*8,0,(Math.random()-.5)*8)),Math.random()<.5);sndHit("cannon")}}
 await wait(1300);cineOff()}

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
async function fxErupt(){const p=myShip.position.clone();const v=new THREE.Vector3(VOL.x,0,VOL.z);const dir=p.clone().sub(v).setY(0).normalize();
 cineTo(v.clone().addScaledVector(dir,170).setY(40),v.clone().setY(45));sndHit("erupt");await wait(1200);eruptFx();cine.shake=1.2;screenFlash("#ff7a30",.35,900);
 const topY=(window.VOLG?window.VOLG.position.y:0)+11.5*K;
 for(let k=0;k<22;k++){const to=v.clone().add(new THREE.Vector3((Math.random()-.5)*140,0,(Math.random()-.5)*140));const from=v.clone().setY(topY);
  const b=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,color:C("#ff7a20"),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false}));b.scale.set(6,6,1);scene.add(b);
  const mid=from.clone().lerp(to,.5);mid.y+=40+Math.random()*40;let t=0;const dur=1.6+Math.random();const f=(tt,dt)=>{t+=dt||.016;const q=Math.min(1,t/dur);const a=from.clone().lerp(mid,q),c=mid.clone().lerp(to,q);b.position.copy(a.lerp(c,q));if(Math.random()<.6)puff(b.position.x,b.position.y,b.position.z,"#4a3a36",5,1.4);
   if(q>=1){scene.remove(b);puff(to.x,1,to.z,"#e6f2f4",8,1.2);anim.splice(anim.indexOf(f),1)}};anim.push(f);if(k%4===0)sndHit("cannon");await wait(140)}
 await wait(2400);cineOff()}
async function fxSea(e){const k=e.kind;
 if(k===5){overview(62,22);{const g=new THREE.Group();scene.add(g);const cp=myShip.position;get("tormenta",m=>{if(!m)return;for(let n=0;n<4;n++){const o=m.clone();o.scale.setScalar(70+n*10);const a=n*1.6+yaw;o.position.set(cp.x+Math.cos(a)*(60+n*25),30+n*6,cp.z+Math.sin(a)*(60+n*25));o.rotation.y=a;g.add(o)}});setTimeout(()=>scene.remove(g),7200)}fogPulse("#0b0f14",.05,7);fallFx("#d4dee6",LOW?700:2600,80,3,7);for(let n=0;n<4;n++){setTimeout(()=>{screenFlash("#e8f0ff",.75,500);flash.position.copy(camera.position).add(new THREE.Vector3(0,40,0));flash.intensity=40;sndHit("cannon")},800+n*1500)}SHIPS.forEach(s=>s.userData.shk=.6);await wait(6800);SHIPS.forEach(s=>s.userData.shk=0);cineOff();return}
 if(k===2){overview(40,16);fogPulse("#3a2418",.045,6.5);fallFx("#5a524e",LOW?400:1100,14,.5,6.5);await wait(6300);cineOff();return}
 if(k===0){overview(36,12);fogPulse("#26302e",.04,6);fallFx("#cfd8da",LOW?200:600,8,.3,6);SHIPS.forEach(s=>s.userData.shk=1);for(let n=0;n<30;n++)setTimeout(()=>{const q=camera.position;puff(q.x+(Math.random()-.5)*60,2+Math.random()*10,q.z+(Math.random()-.5)*60,"#e6f2f4",5,1.2)},n*180);await wait(6000);SHIPS.forEach(s=>s.userData.shk=0);cineOff();return}
 if(k===4&&e.who!==undefined){await fxKraken(e.who);return}
 if(k===7&&e.who!==undefined){await fxWhirl(e.who);return}
 if(k===1){overview(30,12);floatModels("barril-ron",9,18,6,2.2);await wait(5500);cineOff();return}
 if(k===3){overview(34,14);floatModels("barco-restos",2,22,6,14);floatModels("caja-madera",5,16,6,2.2);await wait(5500);cineOff();return}
 if(k===6){overview(18,8);cine.shake=.5;screenFlash("#8a1010",.35,800);setTimeout(()=>screenFlash("#8a1010",.3,800),1200);myShip.userData.shk=1;await wait(3200);myShip.userData.shk=0;cineOff();return}}
