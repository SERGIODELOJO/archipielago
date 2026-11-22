// ================= ARCHIPIÉLAGO · sala y red =================
const QS=new URLSearchParams(location.search);
const params=QS;
const LOCAL=QS.has("local");
const LOW=QS.has("low")||(!QS.has("high")&&(matchMedia("(pointer:coarse)").matches||Math.min(innerWidth,innerHeight)<600));
const CAPS=[{n:"Brasa",c:"#c0392b"},{n:"Bruno",c:"#2e86c1"},{n:"Nadia",c:"#d4ac0d"},{n:"Salitre",c:"#7d3c98"},{n:"Lupe",c:"#1e8449"},{n:"Kai",c:"#e67e22"}];
// habilidad de cada capitán (mismo orden que CAPS)
// habilidad que elige cada jugador al escoger capitán (se puede repetir)
const HAB=[{n:"Fuego",i:"🔥",x:"+2 de fuerza cuando asaltas un territorio."},{n:"Carpintero",i:"🪚",x:"Todo lo que cuesta madera te cuesta 1 madera menos."},{n:"Ojo de halcón",i:"👁",x:"Ves los barcos 1 casilla más lejos y oyes un rumor más cada ronda."},
 {n:"Contrabandista",i:"🗝",x:"Cambias 2 por 1 en cualquier sitio y robas 1 material más al ganar un abordaje."},{n:"Colono",i:"⚑",x:"Colonizar no te cuesta ron y tus territorios defienden con +1."},{n:"Viento en popa",i:"💨",x:"Navegas 1 casilla más cada ronda."},
 {n:"Artillero",i:"💣",x:"Empiezas con 1 cañón más y fundir cañones te cuesta 1 hierro en vez de 2."},{n:"Tahúr",i:"🃏",x:"Empiezas con 1 carta más y las cartas te cuestan 1 ron menos."}];
const capOf=p=>p.hab||0;
// misiones secretas: cada jugador recibe una al empezar; cumplirla da +2 de fama para siempre
const MIS={hierro:{n:"Señor del hierro",x:"Ten territorios en 2 islas de hierro a la vez."},perlas:{n:"Cazador de perlas",x:"Ten territorios en 2 islas de perlas a la vez."},isla:{n:"Rey de una isla",x:"Controla entera una isla de 3 territorios."},
 fuertes:{n:"Fortaleza",x:"Ten 3 fuertes a la vez."},edif:{n:"Constructor",x:"Ten 3 edificios a la vez (almacén, muelle, torre o patrulla)."},almirante:{n:"Almirante",x:"Ten 2 escoltas a la vez."},
 abordajes:{n:"Terror de los mares",x:"Gana 2 abordajes."},asaltos:{n:"Conquistador",x:"Conquista 2 territorios de otros jugadores."},cofres:{n:"Explorador",x:"Abre 6 cofres."}};
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
.habs{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px;margin:6px 0 10px}.habs .sub{grid-column:1/-1}
.habs button{display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:6px 8px;font-size:13px;line-height:1.25}.habs button small{font-size:11.5px;opacity:.8;margin-top:2px}.habs button.on{border-color:#e0b45a;background:rgba(224,180,90,.18)}
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
<li>Acciones: <b>colonizar</b> un territorio libre, levantar un <b>fuerte</b>, un <b>almacén</b>, un <b>muelle</b>, una <b>torre vigía</b> o destacar una escolta como <b>patrulla</b> de tus islas, <b>asaltar</b> el territorio de otro, <b>reclutar</b> tripulantes, y en tu puerto fundir <b>cañones</b>, botar el <b>galeón</b>, botar <b>escoltas</b> o cambiar materiales. Lo que no puedes pagar sale bloqueado.</li>
<li><b>Materiales</b>: madera, lona, hierro, ron y perlas. Al terminar tu ruta junto a una isla por primera vez abres su cofre (+2). Cada ronda tu puerto da 1 ron y cada territorio da 1 material de su isla.</li>
<li>El <b>ron</b> que das a la tripulación se gasta siempre, y suma fuerza en abordajes, asaltos y para defender tus territorios si estás al lado.</li>
<li>Si dos barcos acaban en la misma casilla o se cruzan, hay <b>abordaje</b>: la partida se para y cada uno reparte en secreto su fuerza (cañones + tripulantes + galeón + escoltas) y el ron que quiera gastar entre <b>proa, centro y popa</b>. En cada zona gana quien pone más, y quien gana 2 de las 3 gana el abordaje. Los demás pueden hacer una <b>apuesta de taberna</b> de 1 ron sobre quién gana (si aciertan, cobran 2). Roba 2 materiales y el perdedor vuelve a puerto, o pierde una escolta si la tiene.</li>
<li><b>Flota</b>: en tu puerto puedes botar hasta 3 <b>escoltas</b> que te siguen: <b>bergantín</b> (+3 fuerza), <b>goleta</b> (+1 fuerza y +1 casilla), <b>mercante</b> (+1 material por ronda y cambio 2 por 1 en cualquier sitio) o <b>brulote</b> (+4 en un combate y se quema). Si pierdes un abordaje con escolta, se hunde una en vez de volver tú a puerto. Puedes dejar una vigilando una isla tuya como patrulla.</li>
<li>Cada ronda llegan <b>rumores</b> de por dónde anda otro barco.</li>
<li>El <b>tesoro del volcán</b> da +3 de fama, pero <b>solo al primero</b> que llega. Nadie más se entera: quien llegue después lo encontrará vacío.</li>
<li>Las <b>Cartas de Fortuna</b> cuestan ron o perlas al jugarlas. ¡Sabotaje descubierto! te protege sola y es gratis.</li>
<li>Con los faroles apagados os ven peor. El catalejo (C) ve más lejos entre la niebla.</li>
<li><b>Tratos</b>: con otro barco al lado puedes proponerle un cambio de materiales o un <b>pacto</b> de no agresión de 3 rondas. Si asaltas a quien tienes pactado, rompes el pacto y pierdes 1 de fama.</li>
<li><b>Se busca</b>: quien va primero en fama lleva recompensa. Si le ganas un abordaje o le quitas un territorio, +1 de fama.</li>
<li>Una <b>tormenta</b> recorre el mapa y avisa de por dónde pasará. Si entras en ella te para, pierdes 1 material y la ronda siguiente navegas 1 menos.</li>
<li>Algunos cofres esconden un <b>mapa del tesoro</b>: solo tú ves la isla marcada. Termina tu ruta junto a ella para desenterrarlo (+1 de fama y 3 materiales).</li>
<li><b>Fama de pirata o mercader</b>: ganar abordajes, asaltar, saquear o traicionar te hace <b>pirata temido</b> (+1 de fuerza, pero cambias peor). Hacer tratos, pactos y cambios te hace <b>mercader honrado</b> (cambias 2 por 1 en todas partes y +1 ron por ronda).</li>
<li><b>Colocación</b>: antes de la primera ronda, por turnos en serpiente (1 minuto cada uno), cada jugador elige su <b>puerto</b> entre varios libres y después su <b>primer territorio</b> a 2 casillas o menos, que le da 1 de cada material de esa zona. El volcán sigue oculto.</li>
<li>Al elegir capitán eliges también una <b>habilidad</b>, y cada jugador recibe una <b>misión secreta</b>: cumplirla da +2 de fama.</li>
<li><b>Mercado cambiante</b>: cada ronda se busca un material (darlo cuesta 1 menos) y otro sobra (cuesta 1 más). Lo que más se venda en una ronda pasa a sobrar en la siguiente.</li>
<li><b>Emboscada</b> (1 ron, junto a una isla): te quedas quieto y escondido; el primero que pase a tu lado sufre un abordaje por sorpresa y tú sumas +2 de fuerza.</li>
<li><b>Rehenes</b>: quien gana un abordaje se lleva un tripulante del perdedor. El perdedor puede pagar 3 de ron de rescate en cualquier momento (en Acciones); quien lo tiene puede reclutarlo por 1 ron. Si en 2 rondas nadie hace nada, se une al captor.</li>
<li><b>Subasta en la taberna</b> (cada 3 rondas): sale un objeto único y se puja ron en secreto. Gana la puja más alta y solo paga el ganador; si hay empate, gana quien menos fama tenga.</li>
<li><b>Consejo pirata</b> (cada 4 rondas): se vota entre dos leyes (puertos cerrados, ron para todos, tregua de los fuertes, botín doble, diezmo del líder). Cada uno tiene 1 voto y puede comprar más a 1 ron cada uno. La ley dura hasta el siguiente consejo.</li>
<li><b>Música</b>: "A Sailor's Chant" (Thimras), "Pirate Ship Theme" (beardalaxy), "Pirate Indenture" y "Pirates Incoming" (Eldritch Grim), todas CC0; "Pirates" de Eric Matyas (soundimage.org) y "Pirate Tavern Loop" de Emma_MA, CC-BY 4.0. Vía OpenGameArt.org.</li>
<li><b>Bitácora</b>: al final de cada ronda tu cuaderno resume lo que has vivido y visto (botón Bitácora para releerlo). Al acabar la partida se reparten <b>títulos</b>: Terror de los mares, Rey del ron, Traidor de la Cofradía...</li>
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
 g.querySelectorAll("button.cap").forEach(b=>b.onclick=()=>Net.toHost({t:"cap",c:+b.dataset.k}));
 const mp=list.find(p=>p.id===Net.myId);let hb=$("lHab");if(!hb){hb=document.createElement("div");hb.id="lHab";hb.className="habs";g.after(hb)}
 hb.innerHTML=`<div class="sub" style="margin:2px 0">Elige tu habilidad</div>`+HAB.map((h,k)=>`<button data-h="${k}" class="${mp&&(mp.hab||0)===k?"on":""}" title="${h.x}"><b>${h.i} ${h.n}</b><small>${h.x}</small></button>`).join("");
 hb.querySelectorAll("button[data-h]").forEach(b=>b.onclick=()=>Net.toHost({t:"hab",h:+b.dataset.h}))}
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
 if(m.t==="hab"&&!H.G){const p=H.players.find(p=>p.id===from);const h=m.h|0;if(p&&h>=0&&h<HAB.length){p.hab=h;Net.toAll({t:"lobby",players:H.players});renderHostLobby()}return}
 if(m.t==="cap"&&!H.G){const p=H.players.find(p=>p.id===from);const c=m.c|0;if(p&&c>=0&&c<6&&!H.players.some(q=>q.cap===c&&q!==p)){p.cap=c;Net.toAll({t:"lobby",players:H.players});renderHostLobby()}return}
 // tratos entre jugadores: propuestas de cambio de materiales o pactos de no agresión
 if(m.t==="offer"&&H.G&&H.G.phase==="orders"){const P=H.G.players,i=P.findIndex(p=>p.id===from),j=m.to|0;if(i<0||!P[j]||P[j].gone||i===j)return;if(cdist(cellOf(P[i].cell),cellOf(P[j].cell))>1)return;
  const cl=o=>{const r={};Object.entries(o||{}).forEach(([k,n])=>{if(MATS.some(x=>x[0]===k)&&n>0)r[k]=Math.min(9,n|0)});return r};
  const o={id:Math.random().toString(36).slice(2,8),from:i,to:j,kind:m.kind==="pact"?"pact":"trade",give:cl(m.give),get:cl(m.get)};if(o.kind==="trade"&&(!Object.keys(o.give).length||!Object.keys(o.get).length))return;
  H.offers=H.offers||{};H.offers[o.id]=o;Net.toOne(P[j].id,{t:"offer",o});Net.toOne(P[i].id,{t:"offerSent",o});return}
 if((m.t==="ransom"||m.t==="recruit")&&H.G){const G=H.G,P=G.players,i=P.findIndex(p=>p.id===from);const h=(G.hostages||[]).find(x=>x.id===m.h);if(i<0||!h)return;const Hb=P[h.by],Ho=P[h.of];
  if(m.t==="ransom"){if(h.of!==i||Ho.rum<3)return;Ho.rum-=3;Hb.rum+=3;Ho.crew=Math.min(4,(Ho.crew||0)+1);G.hostages=G.hostages.filter(x=>x!==h);Net.toAll({t:"state",G});Net.toAll({t:"msg",txt:`${Ho.name} paga 3 de ron de rescate a ${Hb.name} y recupera a su tripulante.`});return}
  if(h.by!==i||Hb.rum<1||(Hb.crew||0)>=4)return;Hb.rum-=1;Hb.crew=(Hb.crew||0)+1;ST(Hb,"reh");G.hostages=G.hostages.filter(x=>x!==h);Net.toAll({t:"state",G});Net.toAll({t:"msg",txt:`${Hb.name} pone a trabajar en su barco al rehén de ${Ho.name}.`});return}
 if(m.t==="offerAns"&&H.G){const P=H.G.players,o=(H.offers||{})[m.id];if(!o||P[o.to].id!==from)return;delete H.offers[m.id];const A=P[o.from],B=P[o.to];let ok=!!m.ok,why="";
  if(ok&&o.kind==="trade"){if(!canPay(A,o.give)||!canPay(B,o.get)){ok=false;why="A alguien ya no le llegaba el material."}else{Object.entries(o.give).forEach(([k,n])=>{addStock(A,k,-n);addStock(B,k,n)});Object.entries(o.get).forEach(([k,n])=>{addStock(B,k,-n);addStock(A,k,n)})}}
  if(ok&&o.kind==="pact"){H.G.pacts=(H.G.pacts||[]).filter(x=>!((x.a===o.from&&x.b===o.to)||(x.a===o.to&&x.b===o.from))).concat({a:o.from,b:o.to,until:H.G.round+2})}
  if(ok){A.mer=(A.mer||0)+1;B.mer=(B.mer||0)+1;Net.toAll({t:"state",G:H.G})}[A,B].forEach(p=>Net.toOne(p.id,{t:"offerRes",o,ok,why}));return}
 if(m.t==="duelBet"&&H.G){const i=H.G.players.findIndex(p=>p.id===from);if(i>=0&&typeof hostDuelBet==="function")hostDuelBet(i,m);return}
 if(m.t==="duelAns"&&H.G){const i=H.G.players.findIndex(p=>p.id===from);if(i>=0&&typeof hostDuelAns==="function")hostDuelAns(i,m);return}
 if(m.t==="place"&&H.G){const i=H.G.players.findIndex(p=>p.id===from);if(i>=0&&typeof hostPlace==="function")hostPlace(i,m);return}
 if(m.t==="orders"&&H.G&&H.G.phase==="orders"){const i=H.G.players.findIndex(p=>p.id===from);if(i<0)return;H.orders[i]=m.o;H.G.players[i].ready=true;Net.toAll({t:"ready",ready:H.G.players.map(p=>p.ready)});hostMaybeResolve();return}
}
function hostLeft(id){if(!H.G){H.players=H.players.filter(p=>p.id!==id);Net.toAll({t:"lobby",players:H.players});renderHostLobby();return}
 const p=H.G.players.find(p=>p.id===id);if(p){p.gone=true;p.ready=true;Net.toAll({t:"ready",ready:H.G.players.map(p=>p.ready),gone:H.G.players.map(p=>p.gone)});banner(p.name+" se ha desconectado. Si vuelve a entrar con el mismo nombre, recupera su barco.");hostMaybeResolve()}}
function hostMaybeResolve(){if(H.G.players.every(p=>p.ready||p.gone))setTimeout(()=>{if(H.G.phase==="orders")hostResolve()},400)}
function hostStart(){if(H.G)return;const np=H.players.length;const deck=[];CARD_LIST.forEach(c=>{for(let i=0;i<c[3];i++)deck.push(c[0])});shuffle(deck);
 H.G={seed:1000+Math.floor(Math.random()*90000),np,round:1,phase:"orders",target:[6,9,12][H.len]+(np<=2?-1:np>=5?1:0),treasures:1,volBy:-1,
  timer:H.timer,terr:null,fort:{},bld:{},players:H.players.map((p,i)=>({id:p.id,name:p.name,i,cap:p.cap,hab:p.hab||0,pir:0,mer:0,fame:0,bonus:0,rum:3,mat:{madera:1,lona:1,hierro:0,perlas:0},crew:0,fl:[],ship:"balandra",cannons:2,hand:[deck.pop(),deck.pop(),deck.pop()].slice(0,3),cell:null,home:null,ready:false,looted:[],hideFrom:{},got:false,faroles:false,gone:false})),deck,winner:-1};
 {const NPORT=np+(np<=4?2:3);H.G.portOwner=Array(NPORT).fill(-1);if(QS.has("noplace")){H.G.players.forEach((p,i)=>{H.G.portOwner[i]=i;p.placed=2})}else{H.G.phase="place";const o=shuffle(H.G.players.map(p=>p.i));H.G.draft={step:0,order:o.concat(o.slice().reverse())}}}
 {const ms=shuffle(Object.keys(MIS));H.G.mkt=rollMkt(null);H.G.sold={};H.G.players.forEach((p,i)=>{if(p.hab===6)p.cannons++;if(p.hab===7&&deck.length)p.hand.push(deck.pop());p.mis=ms[i%ms.length];p.misOk=false;p.st={bw:0,aw:0}})}H.G.pacts=[];
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
 emboscada:{n:"Emboscada",i:"🗡",w:"Junto a una isla",c:{ron:1},x:"Fondeas escondido y no te mueves. El primer rival que pase a tu lado sufre un abordaje por sorpresa y tú sumas +2 de fuerza."},
 tripulante:{n:"Reclutar tripulante",i:"👥",w:"En cualquier sitio",c:{ron:1,perlas:1},x:"+1 de fuerza para siempre. Máximo 4.",max:4},
 canon:{n:"Fundir cañón",i:"💣",w:"Puerto o muelle",c:{hierro:2},port:1,x:"+1 cañón para siempre. En tu puerto o en un muelle tuyo. Máximo 6.",max:6},
 galeon:{n:"Botar galeón",i:"🚢",w:"Puerto o muelle",c:{madera:3,lona:2,hierro:1},port:1,x:"Tu balandra pasa a galeón: 4 casillas por ronda y +1 de fuerza. En tu puerto o en un muelle tuyo."},
 almacen:{n:"Almacén",col:1,w:"Isla donde tengas territorio",i:"📦",c:{madera:2,lona:1},x:"Esa isla te produce 1 más cada ronda y nadie puede saquearte allí."},
 muelle:{n:"Muelle",col:1,w:"Isla donde tengas territorio",i:"⚓",c:{madera:2,hierro:1,ron:1},x:"Funciona como tu puerto: fundir cañones, botar el galeón y cambiar 2 por 1 sin volver a casa."},
 torre:{n:"Torre vigía",col:1,w:"Isla donde tengas territorio",i:"🗼",c:{madera:1,hierro:1,perlas:1},x:"Ves siempre los barcos a 2 casillas de esa isla, aunque haya niebla."},
 bergantin:{n:"Bergantín de guerra",fl:1,i:"⚔",w:"Puerto o muelle",c:{madera:2,lona:1,hierro:2},port:1,str:3,x:"Escolta armada hasta los dientes: +3 de fuerza en abordajes y asaltos."},
 goleta:{n:"Goleta rápida",fl:1,i:"💨",w:"Puerto o muelle",c:{madera:2,lona:2},port:1,str:1,x:"Escolta ligera: +1 de fuerza y toda tu flota navega 1 casilla más por ronda."},
 mercante:{n:"Mercante",fl:1,i:"⚖",w:"Puerto o muelle",c:{madera:2,lona:1,ron:1},port:1,str:0,x:"Escolta de carga: 1 material más cada ronda y cambias 2 por 1 en cualquier sitio."},
 brulote:{n:"Brulote",fl:1,i:"🔥",w:"Puerto o muelle",c:{madera:1,ron:2},port:1,str:4,x:"Barco viejo cargado de pólvora: +4 de fuerza en tu siguiente abordaje o asalto, y después arde y se hunde."},
 patrulla:{n:"Destacar patrulla",col:1,w:"Isla donde tengas territorio",i:"🛡",c:{},fleet:1,x:"Una de tus escoltas (no el brulote) se queda rodeando la isla: +2 de defensa en tus territorios de allí, y espanta a quien intente saquearte (y te avisa). Gasta una escolta."},
 comercio:{n:"Cambiar materiales",x:"Das 3 iguales y recibes 1 del que quieras (2 por 1 en tu puerto)."}};
const CARDCOST=(id,p)=>{const c=CARDCOST0(id);if(p&&capOf(p)===7&&c.ron)c.ron--;return c};
const CARDCOST0=id=>{const t=(CARD_LIST.find(c=>c[0]===id)||[])[2];return id==="kraken-a-sueldo"?{ron:2,perlas:1}:t==="sabotaje"?{ron:1,perlas:1}:t==="sigilo"?{perlas:1}:t==="ventaja"?{ron:1}:{}};
const costTxt=c=>Object.entries(c||{}).filter(([,n])=>n).map(([m,n])=>n+" "+MATS.find(x=>x[0]===m)[2]).join(" ")||"gratis";
const addCost=(a,c)=>{Object.entries(c||{}).forEach(([m,n])=>a[m]=(a[m]||0)+n);return a};
// territorios: G.terr[clave de isla] = [dueño o -1, ...]; G.fort igual con 0/1
const slotsOf=o=>o.t==="perlas"?1:(o.s>.95?3:2);
const famOf=(G,i)=>{let f=G.players[i].bonus||0;Object.values(G.terr||{}).forEach(a=>{const n=a.filter(o=>o===i).length;f+=n;if(n===a.length&&n>1)f++});return f};
const terrCount=(G,i)=>Object.values(G.terr||{}).reduce((s,a)=>s+a.filter(o=>o===i).length,0);
const stock=(p,m)=>m==="ron"?p.rum:(p.mat&&p.mat[m])||0;
const addStock=(p,m,n)=>{if(m==="ron")p.rum=Math.max(0,p.rum+n);else{p.mat=p.mat||{};p.mat[m]=Math.max(0,(p.mat[m]||0)+n)}};
const canPay=(p,c,extra)=>Object.entries(c).every(([m,n])=>stock(p,m)-((extra&&extra[m])||0)>=n);
const FLMAX=3,FL=p=>p.fl||[],FLS=["bergantin","goleta","mercante","brulote"];
const costFor=(p,c,act)=>{c=Object.assign({},c||{});const k=capOf(p);if(k===1&&c.madera)c.madera--;if(k===6&&act==="canon"&&c.hierro)c.hierro--;if(k===4&&act==="colonizar"&&c.ron)c.ron--;return c};
// fama de pirata o de mercader: según cómo juegues
const repOf=p=>{const a=p.pir||0,b=p.mer||0;return a>=3&&a>b?"pirata":b>=3&&b>a?"mercader":""};
const REPN={pirata:"☠ Pirata temido",mercader:"⚖ Mercader honrado"};
const tradeR=(p,home,give,mk)=>{let r=(home||FL(p).includes("mercante")||capOf(p)===3||repOf(p)==="mercader")?2:3;if(repOf(p)==="pirata")r++;if(mk&&give){if(give===mk.want)r--;if(give===mk.glut)r++}return Math.max(1,r)};
const AUC={canon:{n:"Cañón legendario",x:"+2 cañones para siempre.",f:p=>{p.cannons+=2}},
 mapa:{n:"Mapa del volcán",x:"Se dibuja en tu mapa dónde está el volcán.",f:(p,E)=>E(p.i,{k:"card",card:"mapa",txt:"El mapa de la subasta revela el escondite del volcán.",reveal:[[[VOL.q,VOL.r],1]]})},
 fantasma:{n:"Bergantín fantasma",x:"Un bergantín se une gratis a tu flota (+3 de fuerza).",f:p=>{if(FL(p).length<FLMAX)p.fl=FL(p).concat(["bergantin"]);else p.cannons+=2}},
 patente:{n:"Patente de corso",x:"+1 de fama para siempre.",f:p=>{p.bonus=(p.bonus||0)+1}},
 bodega:{n:"Bodega repleta",x:"+2 de madera, lona, hierro y perlas.",f:p=>{["madera","lona","hierro","perlas"].forEach(m=>addStock(p,m,2))}},
 baraja:{n:"Baraja marcada",x:"Robas 2 Cartas de Fortuna.",f:(p,E,G)=>{for(let k=0;k<2;k++){if(!G.deck.length){G.deck=shuffle(G.discard||[]);G.discard=[]}const d=G.deck.pop();if(d){p.hand.push(d);E(p.i,{k:"drew",card:d})}}}}};
const LAWS={puertos:{n:"Puertos cerrados",x:"Solo se puede cambiar materiales en tu puerto o en un muelle."},
 ron:{n:"Ron para todos",x:"Cada ronda todos ganáis 1 barril de ron."},
 tregua:{n:"Tregua de los fuertes",x:"Prohibido asaltar territorios con fuerte."},
 botin:{n:"Botín doble",x:"Quien gana un abordaje roba 1 material más."},
 diezmo:{n:"Diezmo del líder",x:"Cada ronda, el que va primero paga 1 ron al que va último."}};
const ST=(p,k,n)=>{if(!p)return;p.st=p.st||{};p.st[k]=(p.st[k]||0)+(n===undefined?1:n)};
function rollMkt(sold){const ks=MATS.map(m=>m[0]);let glut=null;if(sold){const mx=Math.max(0,...ks.map(k=>sold[k]||0));if(mx>0){const c=ks.filter(k=>(sold[k]||0)===mx);glut=c[Math.random()*c.length|0]}}if(!glut)glut=ks[Math.random()*ks.length|0];const o=ks.filter(k=>k!==glut);return {want:o[Math.random()*o.length|0],glut}}
const mktTxt=mk=>mk?`se busca ${MATS.find(m=>m[0]===mk.want)[2]} ${MATS.find(m=>m[0]===mk.want)[1].toLowerCase()} (cuesta 1 menos darla) · sobra ${MATS.find(m=>m[0]===mk.glut)[2]} ${MATS.find(m=>m[0]===mk.glut)[1].toLowerCase()} (1 más)`:"";
const trade2=(p,home)=>tradeR(p,home)<=2;
const strengthOf=(p,bet)=>(repOf(p)==="pirata"?1:0)+p.cannons+(p.crew||0)+FL(p).reduce((a,t)=>a+((ACTS[t]||{}).str||0),0)+(p.ship==="galeon"?1:0)-(p.fx&&p.fx.wet?2:0)+(p.ambush?2:0)+(bet||0);
const NEEDS_TARGET=new Set(["motin","rata-en-la-bodega","kraken-a-sueldo","desvio-de-la-tormenta","mapa-robado","polvora-mojada","sobornar-al-vigia"]);

// ---------- mensajes al cliente ----------
function clientRecv(m){
 if(m.t==="lobby"){renderPlayers(m.players);return}
 if(m.t==="full"){$("lErr")&&($("lErr").textContent="");banner("La partida ya ha empezado. Entra con el mismo nombre que tenías para recuperar tu barco.");return}
 if(m.t==="start"){GS=m.G;myIdx=GS.players.findIndex(p=>p.id===Net.myId);if(myIdx<0){banner("La partida ya ha empezado sin ti.");return}if(worldReady)return;lob.hidden=true;loadWorld();return}
 if(!worldReady){pendingMsgs.push(m);return}
 worldMsg(m)}
function loadWorld(){const s=document.createElement("script");s.src="world.js?v="+(window.BUILD||"1");s.onload=()=>{worldReady=true;pendingMsgs.splice(0).forEach(worldMsg)};document.body.appendChild(s)}
