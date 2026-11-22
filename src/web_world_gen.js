// ================= ARCHIPIÉLAGO · mundo (se carga al zarpar) =================
controls.enabled=false;
if(LOW){renderer.setPixelRatio(1);renderer.shadowMap.enabled=false}else renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
seed=GS.seed;
const NP=GS.np;
const HS=22, K=HS/3.2;
const wx=(q,r)=>HS*Math.sqrt(3)*(q+r/2), wz=(q,r)=>HS*1.5*r;
const RAD={1:4,2:4,3:5,4:5,5:6,6:6}[NP];
const cdist=(a,b)=>(Math.abs(a.q-b.q)+Math.abs(a.r-b.r)+Math.abs((a.q+a.r)-(b.q+b.r)))/2;
const key=c=>c.q+","+c.r;
const CELLS=[],CM={};for(let q=-RAD;q<=RAD;q++)for(let r=-RAD;r<=RAD;r++){if(Math.abs(q+r)<=RAD){const c={q,r,x:wx(q,r),z:wz(q,r),d:cdist({q,r},{q:0,r:0})};CELLS.push(c);CM[key(c)]=c}}
const NB=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const neighbors=c=>NB.map(([a,b])=>CM[(c.q+a)+","+(c.r+b)]).filter(Boolean);
const PCOL=GS.players.map(p=>CAPS[p.cap||0].c);
const used=new Set();
const NPORT=NP+(NP<=4?2:3);const HOMES=[];for(let k=0;k<NPORT;k++){const a=-Math.PI/2+k*2*Math.PI/NPORT+rnd()*.3;const W=RAD*HS*Math.sqrt(3);let best=null,bd=1e9;CELLS.filter(c=>c.d===RAD&&!used.has(key(c))).forEach(c=>{const d=(c.x-Math.cos(a)*W)**2+(c.z-Math.sin(a)*W)**2;if(d<bd){bd=d;best=c}});HOMES.push(best);used.add(key(best))}
let VOL=null;{const cs=CELLS.filter(c=>c.d<=RAD-2).map(c=>({c,m:Math.min(...HOMES.map(h=>cdist(h,c)))})).filter(o=>o.m>=Math.max(3,RAD-1));VOL=(cs.length?cs:CELLS.filter(c=>c.d<=1).map(c=>({c})))[Math.floor(rnd()*Math.max(1,cs.length))].c;used.add(key(VOL));neighbors(VOL).forEach(n=>used.add(key(n)))}
const TYPEBAG=["selva","lino","hierro","ron","perlas"];
const ISL=HOMES.map((h,i)=>({c:h,t:i%2?"ron":"selva",s:1.05,port:i}));
{const cand=CELLS.filter(c=>!used.has(key(c))&&!HOMES.some(h=>cdist(h,c)===1));for(let i=cand.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[cand[i],cand[j]]=[cand[j],cand[i]]}
 let ti=0;const target=Math.round(CELLS.length*.25);for(const c of cand){if(ISL.length>=target)break;if(neighbors(c).some(n=>ISL.some(o=>o.c===n))&&rnd()<.8)continue;const t=TYPEBAG[ti++%5];ISL.push({c,t,s:t==="perlas"?.6+rnd()*.2:.75+rnd()*.35})}}
const ISLMAP={};ISL.forEach(o=>ISLMAP[key(o.c)]=o);
const sailable=c=>c&&!ISLMAP[key(c)]&&c!==VOL;
const START=HOMES.map(h=>neighbors(h).filter(sailable).sort((a,b)=>a.d-b.d)[0]);
// puertos: se reparten en la fase de colocación (G.portOwner[puerto] = jugador o -1)
const PORTS=ISL.filter(o=>o.port!==undefined);
function applyPorts(G){PORTS.forEach(o=>{const ow=((G&&G.portOwner)||[])[o.port];o.home=ow>=0?ow:undefined})}
// casilla de salida: junto al puerto elegido (o una provisional, oculta, mientras se elige)
const setCells=G=>G&&G.players.forEach((p,i)=>{if(!p.cell){const j=(G.portOwner||[]).indexOf(i);const s=START[j>=0?j:i%NPORT];p.cell=[s.q,s.r];p.home=p.cell.slice()}});
setCells(GS);if(Net.isHost&&H.G){setCells(H.G);if(H.G.phase==="place")setTimeout(()=>hostDraftArm(),H.G.draft&&H.G.draft.dice?13000:3000)}
applyPorts(GS);
const cellOf=a=>CM[a[0]+","+a[1]];
{const mk=G=>{if(G&&!G.terr){G.terr={};G.fort={};G.bld=G.bld||{};ISL.forEach(o=>{if(o.port===undefined){G.terr[key(o.c)]=Array(slotsOf(o)).fill(-1);G.fort[key(o.c)]=Array(slotsOf(o)).fill(0)}})}};if(Net.isHost&&H.G)mk(H.G);mk(GS)}
