
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
