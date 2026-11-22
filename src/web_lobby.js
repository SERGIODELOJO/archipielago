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
.lobby .lens button,.lobby .tims button{font-size:15px;padding:9px 10px}.lobby .tims button.sel,.lobby .lens button.sel{background:rgba(224,180,90,.4);border-color:#e0b45a}
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
<li><b>El objetivo es dominar el archipiélago.</b> Cada isla tiene 1, 2 o 3 <b>territorios</b>. Cada territorio tuyo vale 1 de fama, y si tienes una isla entera sumas 1 más. La fama sube y baja: si te quitan un territorio, la pierdes.</li>
<li>Cada ronda todos dais órdenes <b>en secreto</b> a la vez: <b>acciones</b> en la isla donde estás anclado, la <b>ruta</b> (mapa, tecla M), una <b>carta</b> y el <b>ron</b> que repartes a la tripulación. Hay tiempo límite por ronda.</li>
<li>Acciones: <b>colonizar</b> un territorio libre, levantar un <b>fuerte</b>, un <b>almacén</b>, un <b>muelle</b>, una <b>torre vigía</b> o dejar una <b>patrulla</b> en tus islas, <b>asaltar</b> el territorio de otro, <b>reclutar</b> tripulantes, y en tu puerto fundir <b>cañones</b>, botar el <b>galeón</b> o cambiar materiales. Lo que no puedes pagar sale bloqueado.</li>
<li><b>Materiales</b>: madera, lona, hierro, ron y perlas. Al parar por primera vez junto a una isla abres su cofre (+2). Cada ronda tu puerto da 1 ron y cada territorio da 1 material de su isla.</li>
<li>El <b>ron</b> que das a la tripulación se gasta siempre, y suma fuerza en abordajes, asaltos y para defender tus territorios si estás al lado.</li>
<li>Si dos barcos acaban en la misma casilla o se cruzan, hay <b>abordaje</b>: gana el más fuerte (cañones + tripulantes + galeón + ron). Roba 2 materiales y el perdedor vuelve a puerto.</li>
<li>Cada ronda llegan <b>rumores</b> de por dónde anda otro barco.</li>
<li>El <b>tesoro del volcán</b> da +3 de fama, pero <b>solo al primero</b> que llega. Después queda vacío.</li>
<li>Las <b>Cartas de Fortuna</b> cuestan ron o perlas al jugarlas. ¡Sabotaje descubierto! te protege sola y es gratis.</li>
<li>Con los faroles apagados os ven peor. El catalejo (C) ve más lejos entre la niebla.</li>
<li>Gana el primero en llegar a la fama que marca arriba. El anfitrión elige la duración.</ul></details></div>`;
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
 lobbyWait(`<h1>Archipiélago</h1><div class="sub">Pasa este código a tus amigos</div><div class="code">${Net.code}</div><div class="small">o este enlace: <span style="user-select:all;word-break:break-all">${esc(url)}</span></div><div class="sub" style="margin:4px 0 -4px">Elige tu capitán</div><div class="caps" id="lCaps"></div><div class="row lens"><button data-l="0">Corta · ~25 min</button><button data-l="1">Normal · ~45 min</button><button data-l="2">Larga · ~1 h 15</button></div><div class="row tims"><button data-t="2">2 min por ronda</button><button data-t="3">3 min</button><button data-t="4">4 min</button><button data-t="0">Sin límite</button></div><button class="pri" id="lStart">Zarpar</button><div class="small" id="lHint"></div>`);$("lin").classList.add("wide");
 renderPlayers(H.players);$("lStart").disabled=H.players.length<2&&!QS.has("solo");$("lHint").textContent=H.players.length<2?"Hacen falta al menos 2 piratas.":H.players.length+" piratas. El mapa se ajusta a vosotros.";
 $("lStart").onclick=()=>hostStart();document.querySelectorAll(".lens button").forEach(b=>{b.classList.toggle("sel",+b.dataset.l===H.len);b.onclick=()=>{H.len=+b.dataset.l;renderHostLobby()}});document.querySelectorAll(".tims button").forEach(b=>{b.classList.toggle("sel",+b.dataset.t===H.timer);b.onclick=()=>{H.timer=+b.dataset.t;renderHostLobby()}})}

// ---------- lógica del anfitrión ----------
const H={players:[],orders:{},G:null,len:1,timer:3,tid:0};
// temporizador de ronda: si se acaba, la ronda se resuelve sola
function hostArmTimer(extra){clearTimeout(H.tid);if(!H.G||!H.G.timer)return;H.tid=setTimeout(()=>{if(H.G&&H.G.phase==="orders"&&typeof hostResolve==="function")hostResolve()},(H.G.timer*60+(extra||0))*1000)}
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
 H.G={seed:1000+Math.floor(Math.random()*90000),np,round:1,phase:"orders",target:[6,9,12][H.len]+(np<=2?-1:np>=5?1:0),treasures:1,
  timer:H.timer,terr:null,fort:{},bld:{},players:H.players.map((p,i)=>({id:p.id,name:p.name,i,cap:p.cap,fame:0,bonus:0,rum:3,mat:{madera:1,lona:1,hierro:0,perlas:0},crew:0,ship:"balandra",cannons:2,hand:[deck.pop(),deck.pop(),deck.pop()].slice(0,3),cell:null,home:null,ready:false,looted:[],hideFrom:{},got:false,faroles:false,gone:false})),deck,winner:-1};
 H.orders={};Net.toAll({t:"start",G:H.G});hostArmTimer(12)}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const CARD_LIST=[["viento-a-favor","Viento a favor","ventaja",3,"Este turno navegas hasta 5 casillas."],
 ["vigia-de-aguila","Vigía de águila","ventaja",2,"Esta ronda ves todos los barcos a 4 casillas o menos."],
 ["remiendo-rapido","Cañón de bronce","ventaja",2,"Tu barco gana 1 cañón para siempre."],
 ["contrabando","Contrabando","ventaja",2,"Ganas 3 barriles de ron."],
 ["botin-escondido","Botín escondido","ventaja",2,"Desentierras 3 materiales al azar."],
 ["carta-del-cartografo","Carta del cartógrafo","ventaja",1,"Descubres en tu mapa una zona camino del volcán."],
 ["motin","Motín","sabotaje",2,"El barco de un rival no se mueve este turno."],
 ["rata-en-la-bodega","Rata en la bodega","sabotaje",2,"Un rival pierde 2 barriles de ron."],
 ["kraken-a-sueldo","Kraken a sueldo","sabotaje",1,"El kraken ataca a un rival: pierde 2 materiales y vuelve a su puerto."],
 ["desvio-de-la-tormenta","Desvío de la tormenta","sabotaje",2,"La tormenta frena a un rival: solo avanza 1 casilla."],
 ["bandera-falsa","Bandera falsa","sabotaje",2,"Si hay abordaje esta ronda, nadie sabrá que fuiste tú."],
 ["mapa-robado","Mapa robado","sabotaje",2,"Copias en tu mapa la zona de un rival."],
 ["polvora-mojada","Pólvora mojada","sabotaje",2,"Esta ronda, un rival lucha con 2 cañones menos."],
 ["sobornar-al-vigia","Sobornar al vigía","sigilo",2,"Un rival no puede verte durante 2 rondas."],
 ["bruma-espesa","Bruma espesa","sigilo",2,"Esta ronda nadie puede ver tu barco."],
 ["sabotaje-descubierto","¡Sabotaje descubierto!","respuesta",3,"Si te juegan un sabotaje, se anula solo y sabes quién fue."]];
// materiales y construcciones (los usan el anfitrión y los clientes)
const MATS=[["madera","Madera","🪵"],["lona","Lona","🧵"],["hierro","Hierro","⛓️"],["ron","Ron","🍾"],["perlas","Perlas","🦪"]];
const TMAT={selva:"madera",lino:"lona",hierro:"hierro",ron:"ron",perlas:"perlas"};
// acciones de la ronda (el anfitrión y los clientes usan lo mismo)
const ACTS={colonizar:{n:"Colonizar territorio",i:"⚑",w:"Isla junto a tu barco",c:{madera:1,lona:1,ron:1},x:"Planta tu bandera en un territorio libre de esta isla: +1 de fama mientras sea tuyo y 1 material de la isla cada ronda."},
 fuerte:{n:"Levantar fuerte",i:"🏰",w:"Tu territorio",c:{madera:1,hierro:2},x:"Fortifica uno de tus territorios: +3 de defensa contra asaltos."},
 asalto:{n:"Asaltar territorio",i:"⚔",w:"Territorio rival junto a tu barco",c:{ron:1},x:"Atacas el territorio de un rival con tu fuerza. Defiende con 2, +3 si tiene fuerte y + la fuerza de su dueño si está al lado. Si ganas, es tuyo; si pierdes, pierdes 1 cañón."},
 tripulante:{n:"Reclutar tripulante",i:"👥",w:"En cualquier sitio",c:{ron:1,perlas:1},x:"+1 de fuerza para siempre. Máximo 4.",max:4},
 canon:{n:"Fundir cañón",i:"💣",w:"Puerto o muelle",c:{hierro:2},port:1,x:"+1 cañón para siempre. En tu puerto o en un muelle tuyo. Máximo 6.",max:6},
 galeon:{n:"Botar galeón",i:"🚢",w:"Puerto o muelle",c:{madera:3,lona:2,hierro:1},port:1,x:"Tu balandra pasa a galeón: 4 casillas por ronda y +1 de fuerza. En tu puerto o en un muelle tuyo."},
 almacen:{n:"Almacén",col:1,w:"Isla donde tengas territorio",i:"📦",c:{madera:2,lona:1},x:"Esa isla te produce 1 más cada ronda y nadie puede saquearte allí."},
 muelle:{n:"Muelle",col:1,w:"Isla donde tengas territorio",i:"⚓",c:{madera:2,hierro:1,ron:1},x:"Funciona como tu puerto: fundir cañones, botar el galeón y cambiar 2 por 1 sin volver a casa."},
 torre:{n:"Torre vigía",col:1,w:"Isla donde tengas territorio",i:"🗼",c:{madera:1,hierro:1,perlas:1},x:"Ves siempre los barcos a 2 casillas de esa isla, aunque haya niebla."},
 patrulla:{n:"Patrulla",col:1,w:"Isla donde tengas territorio",i:"⛵",c:{madera:1,lona:1,ron:1,perlas:1},x:"Una lancha con tripulantes rodea la isla: +2 de defensa en tus territorios de allí, y espanta a quien intente saquearte (y te avisa)."},
 comercio:{n:"Cambiar materiales",x:"Das 3 iguales y recibes 1 del que quieras (2 por 1 en tu puerto)."}};
const CARDCOST=id=>{const t=(CARD_LIST.find(c=>c[0]===id)||[])[2];return id==="kraken-a-sueldo"?{ron:2,perlas:1}:t==="sabotaje"?{ron:1,perlas:1}:t==="sigilo"?{perlas:1}:t==="ventaja"?{ron:1}:{}};
const costTxt=c=>Object.entries(c||{}).filter(([,n])=>n).map(([m,n])=>n+" "+MATS.find(x=>x[0]===m)[2]).join(" ")||"gratis";
const addCost=(a,c)=>{Object.entries(c||{}).forEach(([m,n])=>a[m]=(a[m]||0)+n);return a};
// territorios: G.terr[clave de isla] = [dueño o -1, ...]; G.fort igual con 0/1
const slotsOf=o=>o.t==="perlas"?1:(o.s>.95?3:2);
const famOf=(G,i)=>{let f=G.players[i].bonus||0;Object.values(G.terr||{}).forEach(a=>{const n=a.filter(o=>o===i).length;f+=n;if(n===a.length&&n>1)f++});return f};
const terrCount=(G,i)=>Object.values(G.terr||{}).reduce((s,a)=>s+a.filter(o=>o===i).length,0);
const stock=(p,m)=>m==="ron"?p.rum:(p.mat&&p.mat[m])||0;
const addStock=(p,m,n)=>{if(m==="ron")p.rum=Math.max(0,p.rum+n);else{p.mat=p.mat||{};p.mat[m]=Math.max(0,(p.mat[m]||0)+n)}};
const canPay=(p,c,extra)=>Object.entries(c).every(([m,n])=>stock(p,m)-((extra&&extra[m])||0)>=n);
const strengthOf=(p,bet)=>p.cannons+(p.crew||0)+(p.ship==="galeon"?1:0)-(p.fx&&p.fx.wet?2:0)+(bet||0);
const NEEDS_TARGET=new Set(["motin","rata-en-la-bodega","kraken-a-sueldo","desvio-de-la-tormenta","mapa-robado","polvora-mojada","sobornar-al-vigia"]);

// ---------- mensajes al cliente ----------
function clientRecv(m){
 if(m.t==="lobby"){renderPlayers(m.players);return}
 if(m.t==="full"){$("lErr")&&($("lErr").textContent="");banner("La partida ya ha empezado. Entra con el mismo nombre que tenías para recuperar tu barco.");return}
 if(m.t==="start"){GS=m.G;myIdx=GS.players.findIndex(p=>p.id===Net.myId);if(myIdx<0){banner("La partida ya ha empezado sin ti.");return}if(worldReady)return;lob.hidden=true;loadWorld();return}
 if(!worldReady){pendingMsgs.push(m);return}
 worldMsg(m)}
function loadWorld(){const s=document.createElement("script");s.src="world.js?v="+(window.BUILD||"1");s.onload=()=>{worldReady=true;pendingMsgs.splice(0).forEach(worldMsg)};document.body.appendChild(s)}
