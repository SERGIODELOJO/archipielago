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
.actp button.ab{display:flex;gap:10px;align-items:center;max-width:360px;padding:6px 10px 6px 6px}.actp button.ab img{width:70px;height:70px;border-radius:8px;object-fit:cover;flex:none;border:1px solid rgba(224,180,90,.4)}.actp button.ab b{font-weight:400;font-size:15px}.actp button.ab em{display:block;font-size:12.5px;line-height:1.25;color:#d9ccb0;margin:2px 0}
.actp .it img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:7px;margin-bottom:6px}
.actp .how{background:rgba(224,180,90,.08);border:1px solid rgba(224,180,90,.3);border-radius:10px;padding:8px 12px;margin:8px 0}.actp .how summary{cursor:pointer;font:400 17px "IM Fell English SC",Georgia,serif;color:#e0b45a}.actp .how ol{margin:8px 0 2px;padding-left:22px;font-size:14px;line-height:1.4}.actp .how li{margin:5px 0}.actp .how b{color:#f3e6c8}
.actp .isum{font-size:14px;color:#e8d4a0;margin-top:10px}.actp .isum b{color:#7fd1a5;font-weight:400}
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
const clockTxt=()=>{if(!GS.dur||!GS.t0)return"";const el=(Date.now()-GS.t0)/60000,left=Math.max(0,Math.ceil(GS.dur-el)),open=el>=GS.dur*.6;return ` · ⏳ ${left} MIN`+(open?"":` · SE PUEDE GANAR EN EL MIN ${Math.ceil(GS.dur*.6)}`)};
setInterval(()=>{try{if(GS&&GS.phase==="orders"&&!document.body.classList.contains("sailing"))$("hRound").textContent=`RONDA ${GS.round} · FAMA PARA GANAR: ${GS.target}`+clockTxt()}catch(e){}},20000);
function renderScore(){$("hRound").textContent=`RONDA ${GS.round} · FAMA PARA GANAR: ${GS.target}`+clockTxt();
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
function renderActs(){const p=me(),box=$("aBox");const B=(label,cost,a,why)=>{cost=costFor(p,cost,a.a);const ok=!why&&canAfford(cost);const A0=ACTS[a.a]||{};return `<button class="ab" data-a='${JSON.stringify(a)}' ${ok?"":"disabled"} title="${why||(!canAfford(cost)?"No tienes material suficiente":"")}">${ARTK[a.a]?`<img alt="" src="cartas/arte/c-${ARTK[a.a]}.jpg" onerror="this.remove()">`:""}<span><b>${label}</b>${A0.x?`<em>${A0.x}</em>`:""}<small>${why||(a.a==="patrulla"?"gasta 1 escolta":"Cuesta: "+costTxt(cost))}</small></span></button>`};
 let h=`<h3>Acciones de esta ronda</h3><div class="hint">Se hacen antes de zarpar, donde está anclado tu barco ahora. Después navegas con la ruta del mapa.</div>`;
 h+=`<details class="how" ${GS.round<=2?"open":""}><summary>¿Cómo funcionan las islas?</summary><ol>
<li><b>Llega a una isla.</b> Traza la ruta en el mapa hasta una casilla de mar pegada a la isla. Las acciones se hacen al empezar la ronda siguiente, con el barco ya anclado allí.</li>
<li><b>Coloniza.</b> Cada isla tiene 1 a 3 territorios (las banderitas del mapa). Uno libre cuesta 1 🪵 1 🧵 1 🍾 y te da <b>+1 de fama</b> mientras sea tuyo y <b>1 material de esa isla cada ronda</b>. Si la isla entera es tuya, +1 de fama extra.</li>
<li><b>Mejora tu isla.</b> Donde ya tengas territorio puedes levantar un <b>fuerte</b> (+3 de defensa), un <b>almacén</b> (produce 1 más), un <b>muelle</b> (sirve de puerto), una <b>torre vigía</b> (ves barcos cerca) o dejar una <b>patrulla</b>.</li>
<li><b>Quita territorios.</b> Si el territorio es de otro, puedes <b>asaltarlo</b> (1 🍾). Tu fuerza (cañones, tripulantes, escoltas y el ron que apuestes) contra su defensa: 2, +3 con fuerte, + su barco si está al lado. Si ganas, pasa a ser tuyo y él pierde esa fama.</li>
<li><b>Todo es secreto.</b> Nadie ve lo que eliges hasta que todos confirman órdenes.</li></ol></details>`;
 h+=`<div class="row hint">★ <b>${HAB[capOf(p)].n}</b>: ${HAB[capOf(p)].x} &nbsp; ${p.mis?`🗝 <b>Misión secreta: ${MIS[p.mis].n}</b>: ${MIS[p.mis].x}${p.misOk?" ✓ cumplida":" (+2 de fama)"}`:""}</div>`;
 if(GS.auction){const A=AUC[GS.auction.it];h+=`<h4>🔨 Subasta en la taberna: ${A.n}</h4><div class="legslot" data-it="${GS.auction.it}"></div><div class="hint">Puja en secreto: gana quien más ron ponga y solo paga el ganador. Si empatáis, gana quien tenga menos fama.</div><div class="row"><button id="bidM">−</button><b>Tu puja: ${bid} ron</b><button id="bidP">+</button></div>`}
 if(GS.council){h+=`<h4>🏛 Consejo pirata</h4><div class="hint">La ley ganadora manda hasta el próximo consejo. Tienes 1 voto y cada ron que pagues es 1 voto más.</div><div class="row">${GS.council.o.map((k,q)=>`<button data-vote="${q}" class="${vote===q?"on":""}">${LAWS[k].n}<small>${LAWS[k].x}</small></button>`).join("")}</div><div class="row"><span>Votos comprados</span><button id="vbM">−</button><b>${vbuy}</b><button id="vbP">+</button></div>`}
 if(GS.law)h+=`<div class="hint">📜 Ley vigente: <b>${LAWS[GS.law].n}</b>. ${LAWS[GS.law].x}</div>`;
 {const hs=GS.hostages||[];const mh=hs.filter(x=>x.of===myIdx),held=hs.filter(x=>x.by===myIdx);if(mh.length||held.length){h+=`<h4>⛓ Rehenes</h4><div class="row">`;mh.forEach(x=>h+=`<button data-ransom="${x.id}" ${p.rum>=3?"":"disabled"}>Pagar rescate a ${esc(GS.players[x.by].name)}<small>3 🍾 · al momento</small></button>`);held.forEach(x=>h+=`<button data-recruit="${x.id}" ${p.rum>=1&&(p.crew||0)<4?"":"disabled"}>Reclutar al rehén de ${esc(GS.players[x.of].name)}<small>1 🍾 · +1 tripulante</small></button>`);h+=`</div><div class="hint">Si en 2 rondas nadie paga el rescate, el rehén se une a quien lo tiene.</div>`}}
 h+=`<div class="row res">${MATS.map(([m,n,e])=>`<span title="${n}">${e} ${left(m)}</span>`).join("")}<span class="st">⚔ fuerza ${strengthOf(p,bet)}</span></div>`;
 h+=`<div class="row">${acts.length?acts.map((a,j)=>`<span class="q">${actLabel(a)}<button data-rm="${j}" aria-label="Quitar">✕</button></span>`).join(""):'<span class="hint">Aún no has elegido ninguna acción.</span>'}</div>`;
 const isl=neighbors(cellOf(p.cell)).map(n=>ISLMAP[key(n)]).filter(o=>o&&o.port===undefined);
 h+=`<h4>Islas junto a tu barco</h4>`;
 if(!isl.length)h+=`<div class="hint">No hay ninguna isla junto a tu barco. Navega hasta una para colonizarla o asaltarla.</div>`;
 isl.forEach(o=>{const k=key(o.c),T=GS.terr[k]||[],F=GS.fort[k]||[];const m=TMAT[o.t];
  {const nf=T.filter(x=>x<0).length,nm=T.filter(x=>x===myIdx).length,no=T.length-nf-nm;h+=`<div class="isum">${INAME[o.t]}: ${T.length} territorio${T.length>1?"s":""} · ${nf?`<b>${nf} libre${nf>1?"s":""}</b> (colonízalo)`:"ninguno libre"}${nm?` · ${nm} tuyo${nm>1?"s":""}`:""}${no?` · ${no} de rivales (puedes asaltarlo)`:""}</div>`}
  h+=`<div class="row"><b>${INAME[o.t]}</b><span class="hint">da ${MATS.find(x=>x[0]===m)[2]} ${MATS.find(x=>x[0]===m)[1].toLowerCase()}</span>${Object.keys(myB(k)).map(t=>`<span title="${ACTS[t].n}">${ACTS[t].i}</span>`).join("")}${T.map((ow,si)=>`<span class="slot"><i style="background:${ow<0?"transparent;border:1px dashed #cdbd98":PCOL[ow]}"></i>${ow<0?"libre":ow===myIdx?"tuyo":esc(GS.players[ow].name)}${F[si]?" 🏰":""}</span>`).join("")}</div><div class="row">`;
  const free=T.filter(x=>x<0).length-acts.filter(a=>a.a==="colonizar"&&a.k===k).length;
  if(free>0)h+=B("Colonizar territorio",ACTS.colonizar.c,{a:"colonizar",k,s:T.indexOf(-1)});
  T.forEach((ow,si)=>{if(ow===myIdx&&!F[si]&&!acts.some(a=>a.a==="fuerte"&&a.k===k&&a.s===si))h+=B("Levantar fuerte",ACTS.fuerte.c,{a:"fuerte",k,s:si});
   if(ow>=0&&ow!==myIdx&&!acts.some(a=>a.a==="asalto"&&a.k===k&&a.s===si)){const d=2+(F[si]?3:0);h+=B(`Asaltar a ${esc(GS.players[ow].name)}${F[si]?" (fuerte)":""}`,ACTS.asalto.c,{a:"asalto",k,s:si})+`<span class="hint">defensa ${d}${SHIPS[ow].visible?" + su barco si está al lado":""} · tu fuerza ${strengthOf(p,bet)}</span>`}});
  if(T.includes(myIdx)||acts.some(a=>a.a==="colonizar"&&a.k===k))["almacen","muelle","torre","patrulla"].forEach(t=>{h+=B(`${ACTS[t].n}`,ACTS[t].c,{a:t,k},myB(k)[t]||acts.some(a=>a.a===t&&a.k===k)?"Ya lo tienes":t==="patrulla"&&FL(p).filter(x=>x!=="brulote").length-acts.filter(a=>a.a==="patrulla").length<=0?"Necesitas una escolta (no brulote)":"")});
  h+=`</div>`});
 const home=atHomeC(),qn=id=>acts.filter(a=>a.a===id).length;
 h+=`<h4>Tu barco y tu puerto</h4><div class="row">`;
 h+=B(`Emboscada`,ACTS.emboscada.c,{a:"emboscada"},qn("emboscada")?"Ya la has preparado":!neighbors(cellOf(p.cell)).some(c=>ISLMAP[key(c)])?"Tienes que estar junto a una isla":"");
 h+=B(`Reclutar tripulante (${(p.crew||0)+qn("tripulante")}/4)`,ACTS.tripulante.c,{a:"tripulante"},(p.crew||0)+qn("tripulante")>=4?"Ya tienes 4":"");
 h+=B(`Fundir cañón (${p.cannons+qn("canon")}/6)`,ACTS.canon.c,{a:"canon"},!home?"Solo en tu puerto":p.cannons+qn("canon")>=6?"Ya tienes 6":"");
 h+=`</div><h4>Tu flota (${FL(p).length+1} barco${FL(p).length?"s":""}): ${["Tu "+(p.ship==="galeon"?"galeón":"balandra")].concat(FL(p).map(t=>ACTS[t].i+" "+ACTS[t].n)).join(" · ")}</h4><div class="row">`;
 {const nf=FL(p).length+FLS.reduce((a,t)=>a+qn(t),0);FLS.forEach(t=>{h+=B(`${ACTS[t].n}`,ACTS[t].c,{a:t},!home?"Solo en tu puerto":nf>=FLMAX?`Flota completa (${FLMAX} escoltas)`:"")});}
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
 h+=`<details class="cat"><summary>Catálogo: todo lo que se puede hacer</summary><div class="grid">${Object.entries(ACTS).filter(([id])=>id!=="comercio").map(([id,A])=>`<div class="it ${canAfford(costFor(p,A.c,id))?"ok":"no"}">${ARTK[id]?`<img alt="" src="cartas/arte/c-${ARTK[id]}.jpg" onerror="this.remove()">`:""}<div class="t">${A.n}</div><div class="w">${A.w||""}</div><div class="c">${A.fleet?"gasta 1 escolta":costTxt(costFor(p,A.c,id))}${canAfford(costFor(p,A.c,id))?"":" · te falta material"}</div><div class="x">${A.x}</div></div>`).join("")}</div></details>`;
 h+=`<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="pri" id="aDone">Listo</button></div>`;
 const st=box.scrollTop;box.innerHTML=h;box.scrollTop=st;
 box.querySelectorAll("button[data-vote]").forEach(b=>b.onclick=()=>{vote=+b.dataset.vote;renderActs()});
 document.querySelectorAll(".legslot").forEach(sl=>{if(!sl.firstChild&&typeof legendEl==="function")sl.appendChild(legendEl(sl.dataset.it))});
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
 CELLS.forEach(c=>{if(!seen.has(key(c)))return;const o=ISLMAP[key(c)];if(o)drawIsland(x,o,c);if(c===VOL&&!PL)drawVolcano(x,c)});
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
 x.font="italic 19px 'IM Fell English',Georgia,serif";x.fillText(GS.phase==="orders"&&!me().ready?`Toca casillas contiguas para trazar tu ruta (hasta ${maxRoute()}). ✕ = cofre sin abrir.`:(PL?"Elige con cuidado: el volcán sigue oculto en la niebla.":`${seen.size} de ${CELLS.length} casillas exploradas`),36,44)}
let mapOpen=false,prevPitch=0,mapTimer=0;function toggleMap(v){const want=v===undefined?!mapOpen:v;if(want===mapOpen)return;mapOpen=want;clearTimeout(mapTimer);
 if(mapOpen){setSpy(false);prevPitch=pitchT;pitchT=-.75;sizeMap();drawMap();mapTimer=setTimeout(()=>$("mapw").classList.add("on"),240)}else{$("mapw").classList.remove("on");pitchT=prevPitch}}
$("bMap").onclick=()=>toggleMap(true);$("bClose").onclick=()=>{toggleMap(false);renderOrders()};$("bClr").onclick=()=>{route=[];drawMap();renderOrders()};
mapc.addEventListener("click",e=>{const r=mapc.getBoundingClientRect();const X=(e.clientX-r.left)*1100/r.width,Y=(e.clientY-r.top)*860/r.height;
 if(GS.phase==="place"){let best=null,bd=MS*MS*1.2;placeOpts().forEach(o=>{const [px,py]=mP(o.c);const d=(px-X)**2+(py-Y)**2;if(d<bd){bd=d;best=o}});if(best){Net.toHost({t:"place",k:key(best.c)});note("Enviado…",2)}return}
 let best=null,bd=MS*MS;routeOpts().forEach(c=>{const [px,py]=mP(c);const d=(px-X)**2+(py-Y)**2;if(d<bd){bd=d;best=c}});if(best){route.push(best);drawMap();renderOrders()}});

// ---------- cartas ----------
const CBY={};CARD_LIST.forEach(([id,n,t,k,x])=>CBY[id]={id,n,t,k,x});
const TLABEL={ventaja:"Ventaja",sabotaje:"Sabotaje",sigilo:"Sigilo",respuesta:"Respuesta"};
