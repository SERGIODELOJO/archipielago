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
 Net.host(code,()=>{H.players=[{id:"h",name}];renderHostLobby()},e=>{$("lErr").textContent=e})};
$("lJoin").onclick=()=>{const name=myName();const code=$("lCode").value.trim().toUpperCase();if(code.length!==4){$("lErr").textContent="El código tiene 4 letras.";return}$("lErr").textContent="Conectando…";
 Net.join(code,()=>{Net.toHost({t:"join",name,id:Net.myId});lobbyWait(`<h1>Archipiélago</h1><div class="sub">Sala ${esc(code)}</div><div class="pl" id="lPl"></div><div class="small">Esperando a que el anfitrión zarpe…</div>`)},e=>{$("lErr").textContent=e})};
function renderPlayers(list){const el=$("lPl");if(!el)return;el.innerHTML=list.map((p,i)=>`<div><span class="dot" style="background:${CAPS[i].c}"></span><span>${esc(p.name)}</span><span class="small" style="margin-left:auto">${CAPS[i].n}</span></div>`).join("")}
function renderHostLobby(){const url=location.origin+location.pathname+"?sala="+Net.code+(LOCAL?"&local":"");
 lobbyWait(`<h1>Archipiélago</h1><div class="sub">Pasa este código a tus amigos</div><div class="code">${Net.code}</div><div class="small">o este enlace: <span style="user-select:all;word-break:break-all">${esc(url)}</span></div><div class="pl" id="lPl"></div><button class="pri" id="lStart">Zarpar</button><div class="small" id="lHint"></div>`);
 renderPlayers(H.players);$("lStart").disabled=H.players.length<2&&!QS.has("solo");$("lHint").textContent=H.players.length<2?"Hacen falta al menos 2 piratas.":H.players.length+" piratas. El mapa se ajusta a vosotros.";
 $("lStart").onclick=()=>hostStart()}

// ---------- lógica del anfitrión ----------
const H={players:[],orders:{},G:null};
function hostRecv(from,m){
 if(m.t==="join"){if(H.G){const nm=String(m.name).slice(0,14).toLowerCase();const p=H.G.players.find(p=>p.gone&&p.name.toLowerCase()===nm)||H.G.players.find(p=>p.name.toLowerCase()===nm);
   if(p){p.id=from;p.gone=false;p.ready=false;delete H.orders[p.i];Net.toOne(from,{t:"start",G:H.G});Net.toAll({t:"ready",ready:H.G.players.map(p=>p.ready),gone:H.G.players.map(p=>p.gone)});banner(p.name+" ha vuelto a la partida.")}
   else Net.toOne(from,{t:"full"});return}if(H.players.length>=6||H.players.some(p=>p.id===from))return;H.players.push({id:from,name:String(m.name).slice(0,14)});Net.toAll({t:"lobby",players:H.players});renderHostLobby();return}
 if(m.t==="orders"&&H.G&&H.G.phase==="orders"){const i=H.G.players.findIndex(p=>p.id===from);if(i<0)return;H.orders[i]=m.o;H.G.players[i].ready=true;Net.toAll({t:"ready",ready:H.G.players.map(p=>p.ready)});hostMaybeResolve();return}
}
function hostLeft(id){if(!H.G){H.players=H.players.filter(p=>p.id!==id);Net.toAll({t:"lobby",players:H.players});renderHostLobby();return}
 const p=H.G.players.find(p=>p.id===id);if(p){p.gone=true;p.ready=true;Net.toAll({t:"ready",ready:H.G.players.map(p=>p.ready),gone:H.G.players.map(p=>p.gone)});banner(p.name+" se ha desconectado. Si vuelve a entrar con el mismo nombre, recupera su barco.");hostMaybeResolve()}}
function hostMaybeResolve(){if(H.G.players.every(p=>p.ready||p.gone))setTimeout(()=>{if(H.G.phase==="orders")hostResolve()},400)}
function hostStart(){if(H.G)return;const np=H.players.length;const deck=[];CARD_LIST.forEach(c=>{for(let i=0;i<c[3];i++)deck.push(c[0])});shuffle(deck);
 H.G={seed:1000+Math.floor(Math.random()*90000),np,round:1,phase:"orders",target:np<=2?8:np<=4?10:12,treasures:Math.max(1,np-1),
  players:H.players.map((p,i)=>({id:p.id,name:p.name,i,fame:0,rum:3,cannons:2,hand:[deck.pop(),deck.pop(),deck.pop()].slice(0,3),cell:null,home:null,ready:false,looted:[],hideFrom:{},got:false,faroles:false,gone:false})),deck,winner:-1};
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
