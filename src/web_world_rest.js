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
