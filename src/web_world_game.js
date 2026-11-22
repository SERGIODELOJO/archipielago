function cardEl(id,big){const c=CBY[id];const e=document.createElement("div");e.className="fc"+(big?" big":"");e.dataset.t=c.t;e.tabIndex=0;
 e.innerHTML=(c.t==="respuesta"?"":`<div class="cost">${costTxt(CARDCOST(id))}</div>`)+`<div class="art">${c.n.replace("¡","")[0]}<img alt="" src="cartas/arte/${c.id}.jpg" onerror="this.remove()"></div><div class="bot"><div class="tp">${TLABEL[c.t]}</div><div class="nm">${c.n}</div><div class="tx">${c.x}</div></div>`;return e}
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
function zoomCard(id){const c=CBY[id];const big=cardEl(id,true);big.classList.add("flip");const cost=CARDCOST(id),afford=canAfford(cost);const can=GS.phase==="orders"&&!me().ready&&c.t!=="respuesta"&&!prepared&&afford;
 const btns=[];if(can)btns.push(["Jugar esta ronda",()=>{if(NEEDS_TARGET.has(id)){pickTarget(id);return}prepared={id,target:null};hideCov();renderOrders();note(`Preparada en secreto: ${c.n}. Se revelará al zarpar.`,5)},true]);
 btns.push(["Guardar",hideCov]);showCov([big],c.t==="respuesta"?"Esta carta se juega sola cuando alguien te sabotea. Es gratis.":(prepared?"Ya tienes una carta preparada esta ronda.":!afford?`Jugarla cuesta ${costTxt(cost)} y ahora no te llega.`:`Jugarla cuesta ${costTxt(cost)}.`),btns)}
function pickTarget(id){const opts=GS.players.filter(p=>p.i!==myIdx&&!p.gone).map(p=>[p.name,()=>{prepared={id,target:p.i};hideCov();renderOrders();note(`Preparada en secreto: ${CBY[id].n} contra ${p.name}.`,5)}]);
 opts.push(["Cancelar",hideCov]);showCov([cardEl(id,true)],"¿Contra quién?",opts)}

// ---------- botón del anfitrión para no esperar eternamente ----------
if(Net.isHost){const b=document.createElement("button");b.id="bForce";b.textContent="Forzar ronda";b.title="Resuelve la ronda aunque falte alguien";$("bMap").parentElement.appendChild(b);let arm=0;
 b.onclick=()=>{if(GS.phase!=="orders")return;if(Date.now()-arm>3000){arm=Date.now();note("Pulsa otra vez para resolver la ronda sin esperar a los que faltan.",3);return}hostResolve()}}

// ================= RESOLUCIÓN (solo anfitrión) =================
function hostResolve(){const G=H.G;if(G.phase!=="orders")return;G.phase="resolving";const P=G.players,ev=[];const E=(to,o)=>ev.push(Object.assign({to},o));
 const draw=()=>{if(!G.deck.length){G.deck=shuffle(G.discard||[]);G.discard=[]}return G.deck.pop()};G.discard=G.discard||[];
 const O=P.map((p,i)=>{const o=(!p.gone&&H.orders[i])||{route:[],card:null,bet:0,faroles:p.faroles};return o});
 P.forEach((p,i)=>{p.fx=Object.assign({},p.fx&&p.fx.wet?{wet:p.fx.wet}:{});p.faroles=!!O[i].faroles;p.maxR=G.galerna?2:(p.ship==="galeon"?4:3);p.stop=false;p.mat=p.mat||{};p.crew=p.crew||0;p.ship=p.ship||"balandra"});G.galerna=0;G.colonies=G.colonies||{};
 // ayudas
 const steal=(from,to,n)=>{const got=[];for(let k=0;k<n;k++){const have=MATS.map(m=>m[0]).filter(m=>stock(from,m)>0);if(!have.length)break;const m=have[Math.floor(Math.random()*have.length)];addStock(from,m,-1);if(to)addStock(to,m,1);got.push(m)}return got};
 const mname=ms=>ms.length?ms.map(m=>MATS.find(x=>x[0]===m)[1].toLowerCase()).join(" y "):"nada";
 const mn=m=>MATS.find(x=>x[0]===m)[1].toLowerCase();
 const pay=(p,c)=>{if(!canPay(p,c))return false;Object.entries(c).forEach(([m,n])=>addStock(p,m,-n));return true};
 const adjK=(p,k)=>neighbors(cellOf(p.cell)).some(n=>key(n)===k);
 G.bld=G.bld||{};const B=(k,i)=>G.bld[k+"|"+i]||{};
 const atHome=p=>(p.cell[0]===p.home[0]&&p.cell[1]===p.home[1])||Object.keys(G.terr).some(k=>B(k,p.i).muelle&&G.terr[k].includes(p.i)&&adjK(p,k));
 const iat=k=>{const o=ISLMAP[k];return [o.c.q,o.c.r]};
 // el ron de la tripulación se gasta siempre, haya pelea o no
 P.forEach((p,i)=>{p.bet=p.gone?0:Math.max(0,Math.min(p.rum,O[i].bet|0));p.rum-=p.bet});
 // ACCIONES en la isla donde estás anclado (antes de zarpar)
 const AO=P.map((p,i)=>p.gone?[]:(O[i].acts||[]).slice(0,10));const ord=shuffle(P.map((p,i)=>i));
 const each=(t,f)=>ord.forEach(i=>AO[i].filter(a=>a&&a.a===t).forEach(a=>f(P[i],i,a)));
 each("comercio",(p,i,a)=>{const r=atHome(p)?2:3;if(!a.give||!a.get||a.give===a.get||!MATS.some(m=>m[0]===a.get)||stock(p,a.give)<r)return;addStock(p,a.give,-r);addStock(p,a.get,1);E(i,{k:"note",txt:`Cambias ${r} de ${mn(a.give)} por 1 de ${mn(a.get)}.`})});
 each("asalto",(p,i,a)=>{const T=G.terr[a.k];if(!T||!adjK(p,a.k))return;const ow=T[a.s];if(ow===undefined||ow<0||ow===i||!pay(p,ACTS.asalto.c))return;
  const Q=P[ow],fort=G.fort[a.k][a.s],near=!Q.gone&&adjK(Q,a.k);const atk=strengthOf(p,p.bet),def=2+(fort?3:0)+(B(a.k,ow).patrulla?2:0)+(near?strengthOf(Q,Q.bet):0);
  if(atk>def){T[a.s]=i;G.fort[a.k][a.s]=0;if(!T.includes(ow))delete G.bld[a.k+"|"+ow];E(i,{k:"assault",win:true,at:iat(a.k),fort,txt:`¡Asalto victorioso! Tu fuerza ${atk} contra su defensa ${def}: el territorio de ${Q.name} ya es tuyo${fort?" y su fuerte queda en ruinas":""}.`});
   E(ow,{k:"assault",win:false,def:true,at:iat(a.k),fort,who:i,txt:`¡${p.name} ha asaltado uno de tus territorios (fuerza ${atk} contra ${def}) y te lo ha quitado! Su barco está junto a esa isla.`});E(-1,{k:"note",txt:`${p.name} ha conquistado un territorio de ${Q.name}.`})}
  else{if(p.cannons>1)p.cannons--;E(i,{k:"assault",win:false,at:iat(a.k),fort,txt:`El asalto fracasa: tu fuerza ${atk} contra su defensa ${def}${fort?" (tenía fuerte)":""}. Pierdes 1 cañón en la retirada.`});
   E(ow,{k:"assault",win:true,def:true,at:iat(a.k),fort,who:i,txt:`¡Tus defensas han rechazado un asalto de ${p.name} (${def} contra ${atk})! Su barco está junto a tu isla.`})}});
 each("colonizar",(p,i,a)=>{const T=G.terr[a.k];if(!T||!adjK(p,a.k))return;const s=T[a.s]===-1?a.s:T.indexOf(-1);
  if(s<0){E(i,{k:"note",txt:"Alguien se te ha adelantado: ya no quedaba territorio libre en esa isla. No has gastado nada."});return}if(!pay(p,ACTS.colonizar.c))return;T[s]=i;const m=TMAT[ISLMAP[a.k].t];
  E(i,{k:"build",b:"colonizar",at:iat(a.k),txt:`Plantas tu bandera en un territorio de la isla de ${mn(m)}: +1 de fama mientras sea tuyo y 1 de ${mn(m)} cada ronda.`+(T.length>1&&T.every(o=>o===i)?" ¡La isla entera es tuya: +1 de fama extra!":"")});E(-1,{k:"note",txt:`${p.name} ha colonizado un territorio.`})});
 each("fuerte",(p,i,a)=>{const T=G.terr[a.k];if(!T||!adjK(p,a.k)||T[a.s]!==i||G.fort[a.k][a.s]||!pay(p,ACTS.fuerte.c))return;G.fort[a.k][a.s]=1;E(i,{k:"build",b:"fuerte",at:iat(a.k),txt:"Levantas un fuerte de piedra: ese territorio defiende con 3 más."})});
 ["almacen","muelle","torre","patrulla"].forEach(t=>each(t,(p,i,a)=>{const T=G.terr[a.k];if(!T||!adjK(p,a.k)||!T.includes(i))return;const bk=a.k+"|"+i;if((G.bld[bk]||{})[t]||!pay(p,ACTS[t].c))return;G.bld[bk]=G.bld[bk]||{};G.bld[bk][t]=1;
  E(i,{k:"build",b:t,at:iat(a.k),txt:`${ACTS[t].n} terminado. ${ACTS[t].x}`});if(t==="patrulla")E(-1,{k:"note",txt:`${p.name} ha dejado una patrulla vigilando una de sus islas.`})}));
 each("tripulante",(p,i)=>{if(p.crew>=4||!pay(p,ACTS.tripulante.c))return;p.crew++;E(i,{k:"build",b:"tripulante",txt:`Se une un tripulante: ahora tienes ${p.crew}. +1 de fuerza.`})});
 each("canon",(p,i)=>{if(!atHome(p)||p.cannons>=6||!pay(p,ACTS.canon.c))return;p.cannons++;E(i,{k:"build",b:"canon",txt:`Fundes un cañón nuevo en tu puerto: ahora tienes ${p.cannons}.`})});
 each("galeon",(p,i)=>{if(!atHome(p)||p.ship==="galeon"||!pay(p,ACTS.galeon.c))return;p.ship="galeon";p.maxR=G.galerna?2:4;E(i,{k:"build",b:"galeon",txt:"¡Tu balandra ya es un galeón! Navegas 4 casillas por ronda y tienes +1 de fuerza."});E(-1,{k:"note",txt:`${p.name} ha botado un galeón.`})});
 // cartas
 const played=[];P.forEach((p,i)=>{const c=O[i].card;if(!c||!CBY[c.id]||CBY[c.id].t==="respuesta")return;const k=p.hand.indexOf(c.id);if(k<0)return;if(!pay(p,CARDCOST(c.id))){E(i,{k:"note",txt:"No te llegaba para pagar la carta: vuelve a tu mano."});return}p.hand.splice(k,1);G.discard.push(c.id);played.push({i,id:c.id,t:c.target})});
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
 const R=P.map((p,i)=>{const out=[];if(p.gone||p.sent)return out;let cur=cellOf(p.cell);for(const a of (O[i].route||[]).slice(0,p.maxR)){const c=cellOf(a);if(!c||!sailable(c)||cdist(c,cur)!==1)break;out.push(c);cur=c}return out});
 const pos=P.map(p=>cellOf(p.cell));const paths=P.map(p=>[p.cell.slice()]);const L=Math.max(0,...R.map(r=>r.length));const fought=new Set();
 const str=p=>strengthOf(p,p.bet);
 for(let s=1;s<=L;s++){const prev=pos.slice();P.forEach((p,i)=>{if(!p.stop&&R[i][s-1])pos[i]=R[i][s-1];paths[i].push([pos[i].q,pos[i].r])});
  // cruces: dos barcos que se intercambian casilla se encuentran a medio camino
  const groups={};P.forEach((p,i)=>{if(p.gone)return;const k=key(pos[i]);(groups[k]=groups[k]||[]).push(i)});
  for(let a=0;a<P.length;a++)for(let b=a+1;b<P.length;b++){if(P[a].gone||P[b].gone)continue;if(pos[a]===prev[b]&&pos[b]===prev[a]&&pos[a]!==pos[b]){pos[b]=pos[a];paths[b][s]=[pos[a].q,pos[a].r];const k=key(pos[a]);groups[k]=groups[k]||[];if(!groups[k].includes(b))groups[k].push(b);if(!groups[k].includes(a))groups[k].push(a)}}
  Object.values(groups).forEach(g=>{if(g.length<2)return;g.forEach(i=>P[i].stop=true);
   const sc=g.map(i=>({i,v:str(P[i])})).sort((x,y)=>y.v-x.v);g.forEach(i=>fought.add(i));
   const cell=pos[g[0]];
   if(sc[0].v===sc[1].v){g.forEach(i=>E(i,{k:"battle",step:s,at:[cell.q,cell.r],with:g.filter(j=>j!==i),txt:`Abordaje igualado contra ${g.filter(j=>j!==i).map(j=>P[j].name).join(" y ")}: nadie gana y cada uno sigue en su sitio.`}));return}
   const w=sc[0].i,W=P[w];const losers=g.filter(i=>i!==w);
   const loot=[];losers.forEach(l=>{const Lp=P[l];const got=steal(Lp,W,2);loot.push(...got);Lp.cell=Lp.home.slice();Lp.sent=true;pos[l]=cellOf(Lp.home);
    E(l,{k:"battle",step:s,at:[cell.q,cell.r],with:[w],lost:true,txt:`¡Abordaje! ${W.fx.flag?"Un barco con bandera falsa":W.name} te ha vencido (fuerza ${sc.find(o=>o.i===w).v} contra ${sc.find(o=>o.i===l).v}). Te roba ${mname(got)} y vuelves a puerto.`})});
   E(w,{k:"battle",step:s,at:[cell.q,cell.r],with:losers,txt:`¡Abordaje ganado contra ${losers.map(l=>P[l].name).join(" y ")}! Te llevas ${mname(loot)} y los mandas a su puerto.`});
   E(-1,{k:"note",txt:W.fx.flag?`Un barco sin bandera ha hundido el orgullo de ${losers.map(l=>P[l].name).join(" y ")}.`:`${W.name} ha ganado un abordaje a ${losers.map(l=>P[l].name).join(" y ")}.`})})}
 // final de movimiento: cofres y volcán
 P.forEach((p,i)=>{if(p.gone)return;if(!p.sent)p.cell=[pos[i].q,pos[i].r];const c=cellOf(p.cell);
  if(!p.sent){const adj=neighbors(c).map(n=>ISLMAP[key(n)]).filter(o=>o&&o.home===undefined);
   const fresh=adj.find(o=>!p.looted.includes(key(o.c)));
   if(fresh){p.looted.push(key(fresh.c));const m=TMAT[fresh.t];addStock(p,m,2);const r=Math.random();let txt=`Exploráis la isla y encontráis un cofre: +2 de ${mn(m)}`;
    if(r<.3){const x=MATS[Math.floor(Math.random()*5)][0];addStock(p,x,1);txt+=` y 1 de ${mn(x)} más.`}else if(r<.5){const d=draw();if(d&&p.hand.length<3){p.hand.push(d);txt+=` y una Carta de Fortuna: ${CBY[d].n}.`}else txt+="."}else if(r<.6){p.rum=Math.max(0,p.rum-1);txt+=", pero una serpiente asusta a la tripulación y se rompe un barril de ron."}else txt+=".";
    E(i,{k:"chest",at:[fresh.c.q,fresh.c.r],txt})}
   else{const free=adj.find(o=>G.terr[key(o.c)]&&G.terr[key(o.c)].some(x=>x===-1||x===i));if(free){addStock(p,TMAT[free.t],1);E(i,{k:"gather",txt:`Tu tripulación recoge 1 de ${mn(TMAT[free.t])} en una isla cercana.`})}}
   const riv=adj.find(o=>(G.terr[key(o.c)]||[]).some(x=>x>=0&&x!==i&&!P[x].gone));
   if(riv){const rk=key(riv.c),T=G.terr[rk];const ow=T.find(x=>x>=0&&x!==i&&!P[x].gone),Q=P[ow];const m=TMAT[riv.t];let got;
    if(B(rk,ow).patrulla||B(rk,ow).almacen){if(B(rk,ow).patrulla){E(i,{k:"plunder",txt:`La patrulla de ${Q.name} os espanta antes de que podáis saquear nada.`});E(ow,{k:"plunder",at:p.cell,who:i,txt:`Tu patrulla ha espantado a ${p.name}, que rondaba tu isla. Su barco está allí ahora mismo.`})}}else{if(stock(Q,m)>0){addStock(Q,m,-1);addStock(p,m,1);got=[m]}else got=steal(Q,p,1);
    if(got.length){E(i,{k:"plunder",txt:`Saqueas los almacenes de ${Q.name} en esa isla: te llevas ${mname(got)}.`});E(ow,{k:"plunder",at:p.cell,who:i,txt:`¡${p.name} está saqueando tu isla! Se ha llevado ${mname(got)}. Su barco está junto a ella ahora mismo.`})}}}
   if(cdist(c,VOL)===1&&G.treasures>0){p.got=true;G.treasures=0;p.bonus=(p.bonus||0)+3;E(i,{k:"treasure",txt:"¡EL TESORO DEL VOLCÁN! +3 de fama para siempre. Eres el único que lo tendrá. Ahora sal de aquí antes de que entre en erupción."});E(-1,{k:"note",txt:`${p.name} ha saqueado el tesoro del volcán. Ya no queda nada.`})}}});
 const nearV=P.filter(p=>!p.gone&&!p.sent&&cdist(cellOf(p.cell),VOL)===1);if(nearV.length&&Math.random()<.2){nearV.forEach(p=>{p.rum=Math.max(0,p.rum-1);p.cell=p.home.slice();p.sent=true;E(p.i,{k:"erupt",txt:"¡ERUPCIÓN! Llueve fuego: pierdes 1 barril y tu barco vuelve a puerto."})});E(-1,{k:"note",txt:"¡El volcán ha entrado en erupción!"})}
 // fin de ronda
 // producción: el puerto da 1 ron y cada colonia 1 material de su isla
 P.forEach(p=>{if(p.gone)return;p.rum+=1;const made={ron:1};Object.entries(G.terr).forEach(([k,T])=>{const m=ISLMAP[k]&&TMAT[ISLMAP[k].t];if(!m)return;const n=T.filter(o=>o===p.i).length+(T.includes(p.i)&&B(k,p.i).almacen?1:0);if(n){addStock(p,m,n);made[m]=(made[m]||0)+n}});
  E(p.i,{k:"prod",txt:"Producción: "+Object.entries(made).map(([m,n])=>`+${n} ${MATS.find(x=>x[0]===m)[1].toLowerCase()}`).join(", ")})});
 // rumores: cada capitán oye por dónde anda otro barco
 {const live=P.filter(p=>!p.gone);const DIRS=["este","noreste","norte","noroeste","oeste","suroeste","sur","sureste"];
  live.forEach(p=>{const others=live.filter(q=>q.i!==p.i);if(!others.length)return;const q=others[Math.floor(Math.random()*others.length)];const a=cellOf(p.cell),b=cellOf(q.cell);
   const ang=Math.atan2(-(b.z-a.z),b.x-a.x);const d=DIRS[(Math.round(ang/(Math.PI/4))+8)%8];const n=cdist(a,b);
   E(p.i,{k:"rumor",who:q.i,at:q.cell.slice(),txt:n===0?`Rumor: el barco de ${q.name} está pegado al tuyo.`:`Rumor: unos pescadores han visto el barco de ${q.name} al ${d}, a unas ${n} casillas.`})})}
 P.forEach(p=>{Object.keys(p.hideFrom||{}).forEach(k=>{if(--p.hideFrom[k]<=0)delete p.hideFrom[k]});if(p.fx.wet&&--p.fx.wet<=0)delete p.fx.wet;p.ready=false;delete p.stop});
 P.forEach((p,i)=>p.fame=famOf(G,i));const top=P.filter(p=>!p.gone).sort((a,b)=>b.fame-a.fame||b.rum-a.rum);if(top.length&&top[0].fame>=G.target){G.winner=top[0].i;G.phase="over"}
 else{// sucesos del mar que afectan a todos
  if(G.round>=(QS.has("ev")?1:2)&&Math.random()<(QS.has("ev")?1:.17)){const live=P.filter(p=>!p.gone);const k=QS.get("evk")!=null?+QS.get("evk"):Math.floor(Math.random()*8);let n,txt,lead_i,vic_i;
   if(k===4){const lead=live.slice().sort((a,b)=>b.fame-a.fame)[0];lead_i=lead.i;const lost=steal(lead,null,2);lead.cell=lead.home.slice();n="El kraken despierta";txt=`Un kraken hambriento ataca al barco con más fama: ${lead.name} pierde ${mname(lost)} y vuelve a puerto.`}
   if(k===5){live.forEach(p=>p.rum=Math.max(0,p.rum-1));n="Tormenta";txt="Una tormenta barre el archipiélago: todos perdéis 1 barril de ron."}
   if(k===6){live.forEach(p=>{if(p.hand.length){const j=Math.floor(Math.random()*p.hand.length);G.discard.push(p.hand.splice(j,1)[0])}});n="Motín general";txt="Las tripulaciones se amotinan: cada uno pierde una carta al azar."}
   if(k===7){const v=live[Math.floor(Math.random()*live.length)];vic_i=v.i;v.cell=v.home.slice();n="Remolino";txt=`Un remolino se traga el barco de ${v.name} y lo escupe en su puerto.`}
   if(k===0){G.galerna=1;n="Galerna";txt="Se levanta una galerna: la próxima ronda nadie podrá navegar más de 2 casillas."}
   if(k===1){live.forEach(p=>p.rum+=1);n="Marea de ron";txt="La marea arrastra barriles de un barco hundido: todos ganáis 1 barril de ron."}
   if(k===2){const hit=live.filter(p=>cdist(cellOf(p.cell),VOL)<=2);hit.forEach(p=>p.rum=Math.max(0,p.rum-1));n="Lluvia de ceniza";txt="El volcán escupe ceniza ardiente. "+(hit.length?hit.map(p=>p.name).join(", ")+" pierde"+(hit.length>1?"n":"")+" 1 barril por estar cerca.":"Esta vez nadie estaba lo bastante cerca.")}
   if(k===3){live.forEach(p=>{if(p.hand.length<3){const d=draw();if(d)p.hand.push(d)}});n="Restos de un naufragio";txt="Flotan restos de un naufragio: todos los que tengan sitio en la mano roban una Carta de Fortuna."}
   E(-1,{k:"sea",n,txt,kind:k,who:k===4?lead_i:k===7?vic_i:undefined})}
  G.round++;G.phase="orders";P.forEach(p=>{if(p.gone)return;if(p.hand.length<3){const d=draw();if(d){p.hand.push(d);E(p.i,{k:"drew",card:d})}}})}
 const sent=P.map(p=>!!p.sent);P.forEach(p=>delete p.sent);H.orders={};
 Net.toAll({t:"resolve",G,paths,sent,ev});hostArmTimer(60)}

// ================= CLIENTE: mensajes del anfitrión =================
let busy=false;const queue=[];
function worldMsg(m){if(m.t==="ready"){m.ready.forEach((r,i)=>GS.players[i].ready=r);if(m.gone)m.gone.forEach((g,i)=>GS.players[i].gone=g);if(GS.phase==="orders")renderScore();return}
 if(m.t==="lobby")return;
 if(m.t==="state"){GS=m.G;snapShips();SHIPS.forEach((s,i)=>setShipModel(i));placeColonies();renderOrders();return}
 if(m.t==="resolve"){m.rt=Date.now();queue.push(m);if(!busy)nextResolve()}}
function nextResolve(){const m=queue.shift();if(!m){busy=false;return}busy=true;playResolve(m,()=>nextResolve())}
function snapShips(){SHIPS.forEach((s,i)=>{const c=cellOf(GS.players[i].cell);s.userData.pos.set(c.x,0,c.z);s.userData.from=null});reveal(cellOf(me().cell),2);Object.keys(GS.terr||{}).forEach(k=>{if(myB(k).torre&&GS.terr[k].includes(myIdx))reveal(CM[k],2)});updateVisibility()}
const seq=(fns,done)=>{let k=0;const go=()=>{if(k>=fns.length){done&&done();return}fns[k++](go)};go()};
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
 const blds=mine.filter(e=>e.k==="build");if(blds.length)fns.push(nx=>{const B={colonizar:["⚑","Nuevo territorio"],fuerte:["🏰","Fuerte"],tripulante:["👥","Tripulación"],canon:["💣","Cañón"],galeon:["🚢","Galeón"],almacen:["📦","Almacén"],muelle:["⚓","Muelle"],torre:["🗼","Torre vigía"],patrulla:["⛵","Patrulla"]};
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
 mine.filter(e=>["chest","treasure","erupt","sea"].includes(e.k)).forEach(e=>fns.push(async nx=>{if(e.k==="sea")await fxSea(e).catch(()=>{});if(e.k==="erupt")await fxErupt().catch(()=>{});sndHit(e.k);if(e.k==="treasure")rcard("TESORO","+3 de fama");if(e.k==="sea")rcard("SUCESO DEL MAR",e.n);
  const t=document.createElement("div");t.className="fc big";t.dataset.t=e.k==="sea"?"sigilo":e.k==="chest"?"ventaja":e.k==="treasure"?"ventaja":"sabotaje";t.innerHTML=`<div class="art">${e.k==="sea"?"≋":e.k==="erupt"?"🌋":e.k==="treasure"?"✦":"⚿"}</div><div class="bot"><div class="tp">${e.k==="sea"?"Suceso del mar":e.k==="chest"?"Cofre":e.k==="treasure"?"Tesoro":"Volcán"}</div><div class="nm">${e.k==="sea"?e.n:e.k==="chest"?"Exploración":e.k==="treasure"?"El tesoro del volcán":"¡Erupción!"}</div><div class="tx">${e.txt}</div></div>`;
  t.classList.add("flip");showCov([t],"",[["Seguir",()=>{hideCov();setTimeout(nx,300)},true]],7000)}));
 mine.filter(e=>e.k==="rumor").forEach(e=>rumors[e.who]={at:e.at,round:m.G.round});
 const pub=mine.filter(e=>["note","plunder","gather","prod","rumor"].includes(e.k));if(pub.length)fns.push(nx=>{note(pub.map(e=>e.txt).join(" "),14);setTimeout(nx,400)});
 fns.push(nx=>{GS=m.G;snapShips();SHIPS.forEach((s,i)=>setShipModel(i));placeColonies();sndTension(0);document.body.classList.remove("sailing");route=[];prepared=null;bet=0;acts=[];armDeadline(GS.timer?GS.timer*60+60-(Date.now()-m.rt)/1000:0);
  if(GS.phase==="over"){gameOver();nx();return}
  rcard("ÓRDENES SECRETAS","Ronda "+GS.round);renderOrders();
  const d=mine.find(e=>e.k==="drew");setTimeout(()=>{if(d){const b=cardEl(d.card,true);b.classList.add("flip");showCov([b],"Robas una Carta de Fortuna.",[["A la mano",()=>{hideCov();arrivalNote()},true]],8000)}else arrivalNote();nx()},2400)});
 seq(fns,done)}
function arrivalNote(){const c=cellOf(me().cell);const vis=GS.players.filter((p,i)=>i!==myIdx&&SHIPS[i].visible);
 if(vis.length)note(`Velas a la vista: ${vis.map(p=>p.name).join(", ")}. Si acabáis en la misma casilla habrá abordaje.`,9);
 else if(cdist(c,VOL)<=1)note("El volcán ruge a vuestro lado. El tesoro está cerca, y el peligro también.",8);
 
 else note("Abre Acciones para colonizar o construir, y el mapa (M) para trazar la ruta.",7)}
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
 if(kind==="cannon")boom(0,95+Math.random()*30,.8);
 if(kind==="clang"){[1800,2400,3100].forEach(f=>{const o=ctx.createOscillator();o.type="square";o.frequency.value=f*(.9+Math.random()*.2);const g=ctx.createGain();g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.connect(g).connect(SND.master);o.start(t);o.stop(t+.3)})}
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
if(introK<1){document.body.classList.add("intro-on","sailing");const c=CAPDESC[me().cap||0];introEl.innerHTML=`<div class="k">RONDA ${GS.round} · ${GS.np} PIRATAS</div><div class="t">Archipiélago</div><div class="s">${esc(c)} leva anclas y se adentra en la niebla. Las islas del archipiélago no tienen dueño… todavía. Y no eres el único que las quiere.</div>`;document.body.appendChild(introEl)}
function introDone(){document.body.classList.remove("intro-on","sailing");introEl.remove();rcard("ÓRDENES SECRETAS","Ronda "+GS.round);setTimeout(()=>note(`Eres ${me().name}: ${CAPDESC[me().cap||0]}. Arrastra para mirar alrededor. Cada ronda: elige acciones, traza la ruta en el mapa (M) y confirma tus órdenes antes de que acabe el tiempo.`,12),900)}
// ---------- bucle ----------
let sailT=0,sailDone=null;const SAILDUR=3.6;
const fadeMats=[];scene.traverse(o=>{if(o.material&&o.material.uniforms&&o.material.uniforms.uFD)fadeMats.push(o.material)});
const clock=new THREE.Clock();let T=0,frames=0,fpsAcc=0,fpsN=0,lowAuto=false;const tmp=new THREE.Vector3();
function placeShips(dt){SHIPS.forEach((s,i)=>{const u=s.userData;if(u.from){u.t=Math.min(1,u.t+dt/SAILDUR);const k=u.t<.5?2*u.t*u.t:1-Math.pow(-2*u.t+2,2)/2;
  const a=new THREE.Vector3(u.from.x,0,u.from.z),b=new THREE.Vector3(u.to.x,0,u.to.z);u.pos.copy(a).lerp(b,k);const d=b.clone().sub(a);if(d.lengthSq()>1){const want=Math.atan2(-d.z,d.x);let dh=want-u.heading;dh=Math.atan2(Math.sin(dh),Math.cos(dh));u.heading+=dh*Math.min(1,dt*2);if(i===myIdx)u.wheel.rotation.x=dh*2}
  if(u.t>=1)u.from=null}
  s.position.set(u.pos.x+(i===myIdx?0:u.off.x),Math.sin(T*.9+i)*.18-(u.dip||0),u.pos.z+(i===myIdx?0:u.off.z));const sk=u.shk||0;s.rotation.set(Math.sin(T*.55+i)*.025+sk*Math.sin(T*9+i)*.07,u.heading+(u.spin||0),Math.sin(T*.7+i)*.035+sk*Math.sin(T*7.3+i)*.09)});
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
 ISL.forEach(o=>{const name=o.home!==undefined?"isla-ron":IMAP[o.t];get(name,m=>{if(!m)return;const G=islandMeshes[key(o.c)];const g=G.children[0];const R=g.userData.R;
  const c=m.clone();const sc=2.6*R/.98;c.scale.setScalar(sc);c.position.y=-(SINK[name]||.04)*HGT[name]*sc;G.add(c);g.visible=false;G.userData.glb=c;placeColonies()})})}
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
snapShips();renderOrders();requestAnimationFrame(frame);
if(introK>=1)introDone();
if(0)setTimeout(()=>note(`Eres ${me().name}: ${CAPDESC[me().cap||0]}. Al fondo, el humo del volcán: allí está el tesoro. Abre el mapa (M) para trazar tu ruta y confirma tus órdenes.`,12),1200);
window.restartWorld=()=>location.reload();
if(QS.has("shot"))window.__G=()=>({GS,myIdx,seen:seen.size});
