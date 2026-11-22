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
